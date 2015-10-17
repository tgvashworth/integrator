import { fromJS, OrderedSet, List } from 'immutable';
import Typd from 'typd';

import utils from './utils';
import runnerUtils from './runner-utils';
import assert from './assert';
import {
    walkActionsPath,
    buildFixtures,
    buildActionPath,
    minimalActionPaths,
    mergeRunners
} from './integrator-actions';


/**
 * Typd definitions
 */
const TypdImmutable = v => {
    if (!('__toJS' in v)) {
        throw new Error('Value is not Immutable Object');
    }
};

const TypdImmutableListOf = check => list => {
    TypdImmutable(list);
    if (list.constructor !== List) {
        throw new Error('Value is not Immutable List');
    }
    list.forEach(v => check(v));
};

const TypdAction = v => {
    TypdImmutable(v);
    if (!(v.has('name') && v.has('deps') && v.has('spec'))) {
        throw new Error('Value is not an Action');
    }
};

const TypdDeps = Typd.ArrayOf(Typd.oneOf(Typd.string, TypdAction));

/**
 * Phases are run in order, with the 'forward' phases run on the way to the target actions, and the
 * 'reverse' phases run as the runner moves back to reset itself.
 *
 * Forward phases:
 *     `setup`    : perform actions on the test subject, and to mirror these changes in the model.
 *     `assert`   : run tests against the subject, throwing if anything is wrong.
 *
 * Reverse phases:
 *     `teardown` : perform actions to undo `setup`, and reflect this in the model.
 *     `done`     : run tests to check that the subject tore down correctly.
 *
 * All phases are optional, but it's recommended that you at least supply setup and teardown phase
 * functions.
 *
 * Phase functions are passed the model (an Map) and should return it with any changes. If
 * your phase function does not need to return any data you can wrap it in `utils.effect` from this
 * file, but the returned value will be ignored.
 */
const forwardPhaseNames = ['setup', 'assert'];
const reversePhaseNames = ['teardown', 'teardown-assert'];

/**
 * exported Suite
 * Wrapper around a Suite representation for use in a Runner.
 */
const Suite = Typd(
    ['actions', TypdImmutableListOf(TypdAction)],
    ['model', TypdImmutable],
    ['opts', Typd.optionalOf(Typd.Object)],
    (actions, model, opts={}) =>
        fromJS({ actions, model, opts })
);

/**
 * exported Runner
 * Create a runner function for the given `suite` (of `actions` and initial `model`).
 *
 * This build the 'fixtures' the tests will run in, and will detect data conflicts.
 */
const Runner = (suite, targetName) => {
    let [ actions, model ] = [ suite.get('actions'), suite.get('model') ];
    let actionPath = buildActionPath(actions, targetName).map(utils.findByName(actions));

    return fromJS({
        targetName,
        target: utils.findByName(actions)(targetName),
        model,
        actionPath,
        fixtures: buildFixtures(actionPath),
        ran: List()
    });
};

/**
 * exported go
 * Run the tests from the `runner`.
 *
 * Builds and walks the tree, creating a sequence of actions to be run and kicks things off.
 *
 * Returns a Promise for the result of the actions.
 */
const go = (runner, previousRunner) => {
    runnerUtils.info(`\nRunning "${runner.get('targetName')}"`);

    // Find the minimal set of actions to take give the current context
    let [ reverseActionPath, forwardActionPath ] = minimalActionPaths(runner, previousRunner);

    let teardownPhases = reverseActionPath.map(utils.pluck('name')).join(' -> ');
    let setupPhases = forwardActionPath.map(utils.pluck('name')).join(' -> ');

    if (teardownPhases) {
        runnerUtils.info('  (teardown) -> ', teardownPhases);
    }
    // runnerUtils.info('  Fixtures :\n  ', runner.get('fixtures').toJS());
    if (setupPhases) {
        runnerUtils.info('  (setup)    -> ', setupPhases);
    }

    let pInput = Promise.resolve(mergeRunners(runner, previousRunner));
    return walkActionsPath(
        forwardPhaseNames,
        forwardActionPath,
        walkActionsPath(
            reversePhaseNames,
            reverseActionPath,
            pInput
        )
    );
};

/**
 * exported Action
 *
 * Usage:
 *
 *     Action('login', ['open the app'], { ...phases })
 *
 * Returns an Map.
 */
const Action = Typd(
    ['name', Typd.string],
    ['deps', Typd.optionalOf(TypdDeps)],
    ['spec', Typd.optionalOf(Typd.Object)],
    (name, deps, spec) =>
        fromJS({
            name,
            deps: OrderedSet(deps),
            spec
        })
);

/**
 * exported randomWalk
 */
const randomWalk = (runners, previousRunner) => {
    let runner = utils.randomFrom(
        runners.filter(runner => {
            if (!runner.getIn(['target', 'deps']).size) {
                return false;
            }
            if (!previousRunner) {
                return true;
            }
            return runner.get('targetName') !== previousRunner.get('targetName');
        })
    );

    if (!runner) {
        return Promise.resolve(previousRunner);
    }

    return go(runner, previousRunner)
        .then(utils.makeEffect(utils.timeoutPromise(500))) // Wait just a moment before going on
        .then(finishedRunner => randomWalk(runners, finishedRunner));
};

/**
 * exported makeRunners
 */
const makeRunners = suite =>
    suite.get('actions')
        .map(action => Runner(suite, action.get('name')));

export { Action, Suite, Runner, go, randomWalk, makeRunners, utils, assert };

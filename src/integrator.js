import Immutable from 'immutable';
import _ from 'fnkit';

const { Map, fromJS, OrderedSet, List } = Immutable;

import utils from './utils';

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
const reversePhaseNames = ['teardown', 'done'];

/**
 * Wrap an action's phase function to capture errors, save changes to the model and store that the
 * phase was run successfully.
 *
 * If an error is caught, it adds to the Error's data to make a more useful error message while
 * maintaing the Error's stack.
 *
 * Takes an `action` (Map) and a `phaseName` to be wrapped.
 *
 * Usage:
 *
 *      wrapPhase(loginAction, 'setup')
 *
 * Returns a function that takes the full RunnerData object and return a Promise for a new version
 * with changes made by the action, or a fails with an error to be caught futher on.
 */
const wrapPhase = (action, phaseName) => data =>
    Promise.resolve(data.get('model'))
        .then(model => {
            let fn = action.getIn(['spec', phaseName], _.identity);
            return fn(model, data.get('fixtures'));
        })
        .then(updatedModel => data.set('model', updatedModel))
        .then(updatedData =>
            updatedData.update('ran', ran => ran.concat({ action, phaseName, data, updatedData }))
        ).catch(why => {
            let e = new Error(`${ action.get('name') } (${phaseName}): ${why.message}`);
            e.data = data;
            e.stack = utils.fakeStack(e, why);
            throw e;
        });

/**
 * Add the phases, specified by `orderedPhaseNames`, from the supplied action as callbacks to the
 * `pPreviousData` promise, wrapping as we go.
 *
 * Returns a Promise for the result of these phases.
 */
const attachActions = orderedPhaseNames => (pPreviousData, action) =>
    orderedPhaseNames.reduce(
        (pPrev, phaseName) => pPrev.then(wrapPhase(action, phaseName)),
        pPreviousData
    );

/**
 * Walk the `actionsPath` (any Immutable.Iterable) forward, attaching actions to the
 * `pInput` promise supplied.
 *
 * Returns a Promise for the result of these actions.
 */
const walkActionsPathForward = (actionsPath, pInput) =>
    actionsPath.reduce(attachActions(forwardPhaseNames), pInput);

/**
 * Walk the `actionsPath` (any Immutable.Iterable) backward, attaching actions to the
 * `pInput` promise supplied.
 *
 * Returns a Promise for the result of these actions.
 */
const walkActionsPathReverse = (actionsPath, pInput) =>
    actionsPath.reverse().reduce(attachActions(reversePhaseNames), pInput);

/**
 * Build an OrderedSet of action names should be run to execute and teardown the action
 * specified by `targetName`.
 *
 * Recurses into the dependency tree of each dependency, left-to-right, to produce the ordered set
 * of action required to run the target action.
 *
 * It relies on the `deps` property of each action being an OrderedSet so that `flatMap` and `add`
 * remove duplicates.
 *
 * Returns an OrderedSet of action names to be run.
 */
const buildActionPath = (actions, targetName) =>
    utils.findByName(actions)(targetName)
        .get('deps')
        .flatMap(dependencyName => buildActionPath(actions, dependencyName))
        .add(targetName);

/**
 * Build the fixtures for the tests to run with. Walks the action path backwards to build up a
 * Map that will stay constant for the duration of the test running, and throws if it finds any
 * conflicts on the way.
 *
 * Takes a List of Actions, returns a Map.
 */
const buildFixtures = actionPath => {
    const initialFixtureData = fromJS({ fixtures: {}, fixturesSources: {} });
    return actionPath.reverse()
        // Creates [action, k, v] triples for every k/v pair in the action's fixtures spec
        .flatMap(action =>
            action
                .getIn(['spec', 'fixtures'], Map())
                .entrySeq()
                .map(([k, v]) => [action, k, v]))
        // Builds up fixturesData from initialFixtureData, growing the fixtures object and remembering the source
        // of the fixtures's data so that helpful error messages can be generated.
        .reduce((fixturesData, [action, k, v]) => {
            let keyPath = ['fixtures', k];
            // v can be a function, in which case we use it update the fixtures value — otherwise
            // we just use it as the value directly
            var newFixturesData = fixturesData.updateIn(
                keyPath,
                (utils.is('function', v) ? v : () => v)
            );
            // Throw if this is not new data and two actions require different data
            if (!utils.is('undefined', fixturesData.getIn(keyPath)) &&
                newFixturesData.getIn(keyPath) !== fixturesData.getIn(keyPath)) {
                throw new Error(
                    `The required "${k}" fixtures for action "${action.get('name')}"` +
                    `conflicts with action "${fixturesData.getIn('fixturesSources', k)}"`
                );
            }
            // Remember that this action 'owns' this piece of the fixtures
            return newFixturesData.setIn(['fixturesSources', k], action.get('name'));
        }, initialFixtureData)
        .get('fixtures');
};

/**
 * Find and return the common prefix of two Iterables as a List.
 *
 *     A = List(1, 2, 3);
 *     B = List(1, 2, 4);
 *     commonPrefix(A, B) === List(1, 2);
 *
 * Takes two Interables, returns a List.
 */
const commonPrefix = (A, B) =>
    A.toList().zip(B.toList())
        .takeWhile(([left, right]) => left.equals(right))
        .map(([left]) => left);

/**
 * Extracts actions with fixtures data that is relevant to them from a runner.
 *
 * Returns a List of Maps in the form Map { action: action, fixtures: filteredFixtures }
 */
const actionPathWithRelevantFixtures = runner =>
    runner.get('actionPath')
        .map(action => {
            let relevantFixturesKeys = action.getIn(['spec', 'fixtures'], Map()).keySeq();
            let filteredFixtures = runner.get('fixtures')
                .filter((v, k) => relevantFixturesKeys.contains(k));
            return fromJS({ action, fixtures: filteredFixtures });
        });

/**
 * Generate an array for actions to take to run target action of `runner`, in an optional context
 * of `previousRunner`. If there is a previous runner, we find the minimal set of action required
 * to get from one t'other.
 *
 * Takes some RunnerData that represents the target, and optionally a previous runner that
 * identifies where we 'are' in the tree of actions.
 *
 * Retuns a tuple (ok, Array) containing two Iterable<Action> representing the reverse and forward
 * actions.
 */
const minimalActionPaths = (runner, previousRunner) => {
    // No previous runner so we can just run forward through the actions
    if (!previousRunner) {
        return [ List(), runner.get('actionPath') ];
    }

    // If there was a previous runner, figure out the minimal set of actions required to run the
    // current runner

    // Find the actions common to both tests
    let prefix = commonPrefix(
        // The fixtures of each action is relevant to whether or not it needs to be torn-down,
        // so we have to tease out the fixtures data relevant to the action for comparison
        actionPathWithRelevantFixtures(runner),
        actionPathWithRelevantFixtures(previousRunner)
    );

    return [
        // Reverse out the actions not present in the new path
        previousRunner.get('actionPath').subtract(prefix.map(utils.pluck('action'))),
        // And run forward to the current target
        runner.get('actionPath').subtract(prefix.map(utils.pluck('action')))
    ];
};

/**
 * Merges two runners by copying the previous runner's final model over
 */
const mergeRunners = (runner, previousRunner) => {
    if (!previousRunner) {
        return runner;
    }

    return runner
        .set('model', previousRunner.get('model'))
        .set('ran', previousRunner.get('ran'));
};

/**
 * Exported.
 * Wrapper around a Suite representation for use in a Runner.
 */
const Suite = (actions, model) => fromJS({ actions, model }); // eslint-disable-line no-unused-vars

/**
 * Exported.
 * Create a runner function for the given `suite` (of `actions` and initial `model`).
 *
 * This build the 'fixtures' the tests will run in, and will detect data conflicts.
 */
const Runner = (suite, targetName) => { // eslint-disable-line no-unused-vars
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
 * Exported.
 * Run the tests from the `runner`.
 *
 * Builds and walks the tree, creating a sequence of actions to be run and kicks things off.
 *
 * Returns a Promise for the result of the actions.
 */
const go = (runner, previousRunner) => { // eslint-disable-line no-unused-vars
    console.log('== GO ========================');
    console.log(`Running "${runner.get('targetName')}"`);

    // Find the minimal set of actions to take give the current context
    let [ reverseActionPath, forwardActionPath ] = minimalActionPaths(runner, previousRunner);

    console.log(
        '  Teardown : ' + reverseActionPath.reverse().map(utils.pluck('name')).join(' -> ')
    );
    console.log(
        '  Fixtures :', runner.get('fixtures').toJS()
    );
    console.log(
        '  Setup    : ' + forwardActionPath.map(utils.pluck('name')).join(' -> ')
    );

    let pInput = Promise.resolve(mergeRunners(runner, previousRunner));
    return walkActionsPathForward(
        forwardActionPath,
        walkActionsPathReverse(reverseActionPath, pInput)
    );
};

/**
 * Exported.
 *
 * Usage:
 *
 *     Action('login', ['open the app'], { ...phases })
 *
 * Returns an Map.
 */
const Action = (name, deps, spec) => // eslint-disable-line no-unused-vars
    fromJS({
        name,
        deps: OrderedSet(deps),
        spec
    });

export { Action, Suite, Runner, go };

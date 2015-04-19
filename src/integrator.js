import Immutable from 'immutable';
const { fromJS, OrderedSet, List } = Immutable;

import utils from './utils';
import {
    walkActionsPathForward,
    walkActionsPathReverse,
    buildFixtures,
    buildActionPath,
    minimalActionPaths,
    mergeRunners
} from './integrator-actions';

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

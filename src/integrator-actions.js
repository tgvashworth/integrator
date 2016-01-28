import Immutable, { Map, fromJS, List } from 'immutable';
import utils from './utils';

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
export const wrapPhase = (action, phaseName) => data =>
    Promise.resolve(data.get('model'))
        .then(model => {
            let fn = action.getIn(['spec', phaseName], utils.identity);
            return fn(model, data.get('fixtures'));
        })
        .then(utils.makeEffect(result => {
            if (!result) {
                throw new Error(`Phase "${phaseName}" did not return anything. ` +
                                `Perhaps you need to wrap it in 'utils.effect'?`);
            }
        }))
        .then(updatedModel => data.set('model', updatedModel))
        .then(updatedData =>
            updatedData.update('ran', ran => ran.concat({ action, phaseName, data, updatedData }))
        )
        .catch(why => {
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
export const attachActions = orderedPhaseNames => (pPreviousData, action) =>
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
export const walkActionsPath = (phaseNames, actionsPath, pInput) =>
    actionsPath.reduce(attachActions(phaseNames), pInput);

/**
 * Build an OrderedSet of action names that should be run to execute and teardown the action
 * specified by `actionName`.
 *
 * Recurses into the dependency tree of each dependency, left-to-right, to produce the ordered set
 * of action required to run the target action.
 *
 * It relies on the `deps` property of each action being an OrderedSet so that `flatMap` and `add`
 * remove duplicates.
 *
 * Returns an OrderedSet of action names to be run.
 */
export const buildActionPath = (actions, actionName) =>
    utils.findByName(actions)(actionName)
        .get('deps')
        .map(dependency => utils.is('string', dependency) ? dependency : dependency.get('name'))
        .flatMap(dependencyName => buildActionPath(actions, dependencyName))
        .add(actionName);

/**
 * Build the fixtures for the tests to run with. Walks the action path backwards to build up a
 * Map that will stay constant for the duration of the test running, and throws if it finds any
 * conflicts on the way.
 *
 * Takes a List of Actions, returns a Map.
 */
export const buildFixtures = actionPath => {
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
                    `The required "${k}" fixtures for action "${action.get('name')}" ` +
                    `conflicts with action "${fixturesData.getIn('fixturesSources', k)}"`
                );
            }
            // Remember that this action 'owns' this piece of the fixtures
            return newFixturesData.setIn(['fixturesSources', k], action.get('name'));
        }, initialFixtureData)
        .get('fixtures');
};

/**
 * Extracts actions with fixtures data that is relevant to them from a runner.
 *
 * Returns a List of Maps in the form Map { action: action, fixtures: filteredFixtures }
 */
export const actionPathWithRelevantFixtures = runner =>
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
export const minimalActionPaths = (runner, previousRunner) => {
    // No previous runner so we can just run forward through the actions
    if (!previousRunner) {
        return [ List(), runner.get('actionPath') ];
    }

    // If there was a previous runner, figure out the minimal set of actions required to run the
    // current runner

    // Find the actions common to both tests
    let prefix = utils.commonPrefix(
        // The fixtures of each action is relevant to whether or not it needs to be torn-down,
        // so we have to tease out the fixtures data relevant to the action for comparison
        actionPathWithRelevantFixtures(runner),
        actionPathWithRelevantFixtures(previousRunner)
    );

    return [
        // Reverse out the actions not present in the new path
        previousRunner.get('actionPath').subtract(prefix.map(utils.pluck('action'))).reverse(),
        // And run forward to the current target
        runner.get('actionPath').subtract(prefix.map(utils.pluck('action')))
    ];
};

/**
 * Merges two runners by copying the previous runner's final model over
 */
export const mergeRunners = (runner, previousRunner) => {
    if (!previousRunner) {
        return runner;
    }

    return runner
        .set('model', previousRunner.get('model'))
        .set('ran', previousRunner.get('ran'));
};

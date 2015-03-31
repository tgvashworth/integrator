import Immutable from 'immutable';
import _ from 'fnkit';

const { Map, fromJS, OrderedSet, List } = Immutable;

import { pluck, findByKey } from './immutable-kit';

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
 *     `finally`  : run tests to check that the subject tore down correctly.
 *
 * All phases are optional, but it's recommended that you at least supply setup and teardown phase
 * functions.
 *
 * Phase functions are passed the model (an Map) and should return it with any changes. If
 * your phase function does not need to return any data you can wrap it in `utils.effect` from this
 * file, but the returned value will be ignored.
 */
const forwardPhaseNames = ['setup', 'assert'];
const reversePhaseNames = ['teardown', 'finally'];

const utils = {
    /**
     * Combine the stacks from Error objects `e` and `f` to produce a stack with the message from
     * `e` but the trace from `f`. Useful if you want to rewrite an error message.
     *
     * Usage:
     *
     *      fakeStack(
     *          Error('Hello'),
     *          Error('World')
     *      ) -> "Error: Hello\n...stack from World..."
     *
     * Returns a string.
     */
    fakeStack: (e, f) =>
        e.stack
            // Just the first line
            .split('\n').slice(0, 1)
            .concat(
                // All but the first line
                f.stack.split('\n').slice(1)
            )
            .join('\n'),

    /**
     * Find keyed value in Immutable iterable by key 'name'.
     *
     * Usage:
     *
     *     findByName(users)('tom')
     *
     * Return a matching element, or undefined.
     */
    findByName: findByKey('name'),

    is: (type, x) => (typeof x === type)
};

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
            return fn(model, data.get('env'));
        })
        .then(model => data.set('model', model))
        .then(data =>
            data.update('ran', ran =>
                ran.concat({ action, phaseName, data })
            )
        ).catch(why => {
            let e = new Error(`${phaseName} "${ action.get('name') }": ${why.message}`);
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
 * Build an 'environment' for the tests to run in. Walks the action path backwards to build up a
 * Map that will stay constant for the duration of the test running, and throws if it finds any
 * conflicts on the way.
 *
 * Takes a List of Actions, returns a Map.
 */
const buildEnv = actionPath => {
    const initialEnvData = fromJS({ env: {}, envSources: {} });
    return actionPath.reverse()
        // Creates [action, k, v] triples for every k/v pair in the action's env spec
        .flatMap(action =>
            action
                .getIn(['spec', 'env'], Map())
                .entrySeq()
                .map(([k, v]) => [action, k, v]))
        // Builds up envData from initialEnvData, growing the env object and remembering the source
        // of the env's data so that helpful error messages can be generated.
        .reduce((envData, [action, k, v]) => {
            let keyPath = ['env', k];
            // v can be a function, in which case we use it update the env value — otherwise
            // we just use it as the value directly
            var newEnvData = envData.updateIn(
                keyPath,
                (utils.is('function', v) ? v : () => v)
            );
            // Throw if this is not new data and two actions require different data
            if (envData.getIn(keyPath) &&
                newEnvData.getIn(keyPath) !== envData.getIn(keyPath)) {
                throw new Error(
                    `The required "${k}" env for action "${action.get('name')}"` +
                    `conflicts with action "${envData.getIn('envSources', k)}"`
                );
            }
            // Remember that this action 'owns' this piece of the env
            return newEnvData.setIn(['envSources', k], action.get('name'));
        }, initialEnvData)
        .get('env');
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
 * This build the 'environment' the tests will run in, and will detect data conflicts.
 */
const Runner = (suite, targetName) => { // eslint-disable-line no-unused-vars
    let [ actions, model ] = [ suite.get('actions'), suite.get('model') ];
    let actionPath = buildActionPath(actions, targetName).map(utils.findByName(actions));

    return fromJS({
        targetName,
        model,
        actionPath,
        env: buildEnv(actionPath),
        ran: List()
    });
};

const commonPrefix = (A, B) =>
    A.toList().zip(B.toList()).takeWhile(([left, right]) => left === right).map(([left]) => left);

/**
 * Exported.
 * Run the tests from the `runner`.
 *
 * Builds and walks the tree, creating a sequence of actions to be run and kicks things off.
 *
 * Returns a Promise for the result of the actions.
 */
const go = (runner, { previousRunner }={}) => { // eslint-disable-line no-unused-vars
    console.log('== GO ========================');
    console.log(`Running "${runner.get('targetName')}"`);

    let forwardActionPath = runner.get('actionPath');
    let reverseActionPath = List();

    // If there was a previous runner, figure out the minimal set of actions required to run the
    // current target
    if (previousRunner) {
        // Find the actions common to both tests
        let prefix = commonPrefix(forwardActionPath, previousRunner.get('actionPath'));
        // Reverse out the actions not present in the new path
        reverseActionPath = previousRunner.get('actionPath').subtract(prefix);
        // And run forward to the current target
        forwardActionPath = forwardActionPath.subtract(prefix);
    }

    let pInput = Promise.resolve(runner);
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

export { Suite, Runner, Action, go };

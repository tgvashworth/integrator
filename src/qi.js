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
 * Exported.
 * Create an action. Passedd `deps` are converted to an OrderedSet because you don't want
 * duplicate dependencies.
 *
 * Usage:
 *
 *     Action('login', ['open the app'], { ... })
 *
 * Returns an Map.
 */
const Action = (name, deps, spec) => // eslint-disable-line no-unused-vars
    fromJS({
        name,
        deps: OrderedSet(deps),
        spec
    });

/**
 * Create data blob for storing test information. Takes a `targetName` to run, a `model` that
 * represents the test's reference state.
 *
 * Usage:
 *
 *      RunnerData('login', { user: {} })
 *
 * Returns an Immtuable.Map.
 */
const RunnerData = (targetName, model, env) =>
    fromJS({
        targetName,
        model,
        env,
        ran: List()
    });


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
                ran.concat({ action, phaseName })
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
 * Walk the `actionsPath` (any Immutable.Iterable) forward and backward, attaching actions to the
 * `pInput` promise supplied.
 *
 * TODO: it's likely that this won't work long-term as we need to pause and rewind execution
 *
 * Returns a Promise for the result of these actions.
 */
const walkActionsPath = (actionsPath, pInput) =>
    // 2: After the forward actions have been added, add the actions that reverse back out
    actionsPath.reverse().reduce(
        attachActions(reversePhaseNames),
        // 1: Attach the actions that play when walking forward through the tree
        actionsPath.reduce(attachActions(forwardPhaseNames), pInput)
    );

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
 * Exported.
 * Create a runner function for the given `actions` and initial `model`.
 *
 * The runner builds and walks the tree, creating a sequence of actions to be run and instantly
 * kicks things off.
 *
 * TODO: this should actually hang the promise to allow execution later
 *
 * Returns a Promise for the result of the actions.
 */
const Runner = (actions, model) => targetName => { // eslint-disable-line no-unused-vars
    let actionPath = buildActionPath(actions, targetName).map(utils.findByName(actions));

    const envData = fromJS({ env: {}, envSources: {} });
    const env = actionPath.reverse()
        .reduce((envData, action) => {
            return action
                .getIn(['spec', 'env'], Map())
                .entrySeq()
                .reduce((envData, [k, v]) => {
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
                            `The required "${k}" context for action "${action.get('name')}"` +
                            `conflicts with action "${envData.getIn('envSources', k)}"`
                        );
                    }
                    // Remember that this action 'owns' this piece of the env
                    return newEnvData.setIn(['envSources', k], action.get('name'));
                }, envData);
        }, envData)
        .get('env');

    return walkActionsPath(
        actionPath,
        Promise.resolve(RunnerData(targetName, model, env))
    );
};

export { Runner, Action };

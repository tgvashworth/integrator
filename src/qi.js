import Immutable from 'immutable';
import _ from 'fnkit';

import { pluck, findByKey } from './immutable-kit';

const orderedPhaseNames = ['setup', 'run', 'assert'];

const utils = {
    /**
     * Combine the stacks from Error objects `e` and `f` to produce a stack with the message from
     * `e` but the trace from `f`. Useful if you want to rewrite an error message.
     */
    fakeStack: ((e, f) =>
        e.stack
            // Just the first line
            .split('\n').slice(0,1)
            .concat(
                // All but the first line
                f.stack.split('\n').slice(1)
            )
            .join('\n')
    ),

    noop: (x => x),

    rememberRanAction: action => data => data.update('ran', ran => ran.concat([action])),

    findByName: findByKey('name')
};

const Action = (name, deps, spec) =>
    Immutable.fromJS({ name, deps, spec });

const InitialData = (target, model) =>
    Immutable.Map({
        target,
        model,
        ran: Immutable.List()
    });

const walkUp = (actions, actionName) =>
    utils.findByName(actions)(actionName)
        .get('deps')
        .flatMap(_.partial(walkUp, actions))
        .concat([actionName]);

const wrapPhase = (action, phase) => data => {
    try {
        let result = action.getIn(['spec', phase], utils.noop)(data.get('model'));
        return data.set('model', result);
    } catch (why) {
        var e = Error(`${action.get('name')}, ${phase}: ${why.message}`);
        e.data = data;
        e.stack = utils.fakeStack(e, why);
        throw e;
    }
}


const runAction = (pPreviousData, action) =>
    // TODO add teardown on the way back out
    orderedPhaseNames.reduce(
        (pPrev, phaseName) => pPrev.then(wrapPhase(action, phaseName)),
        pPreviousData.then(utils.rememberRanAction(action))
    );


const Runner = (actions, model) => target =>
    walkUp(actions, target)
        .map(utils.findByName(actions))
        .reduce(runAction, Promise.resolve(InitialData(target, model)));

export { Runner, Action };

import { Map } from 'immutable';
import { run } from 'action-graph';
import runnerUtils from './runner-utils';

const filterForArgs = (args, name) => {
    if (args.only && args.only !== name) {
        return false;
    }
    return true;
};

const getActionsForArgs = (args, suite) =>
    Object.keys(suite.actions)
        .filter(name => filterForArgs(args, name))
        .map(name => suite.actions[name]);

export default function dispatch(params = {}) {
    const {
        suite = {},
        args = {},
        session,
        target = Map()
    } = params;

    return Promise.resolve().then(() => {
        return getActionsForArgs(args, suite).reduce(
            (pPrev, action) => {
                return pPrev.then(() => {
                    if (target.has('envName')) {
                        runnerUtils.success(
                            `\nRunning: ${action.getDescription()}`,
                            `\n  on ${target.get('envName')}`,
                            `\n  in ${target.get('targetName')}`
                        );
                    }
                    return run(action, {
                        session: session
                    }, suite.initialState);
                });
            },
            Promise.resolve()
        );
    })
    .catch(runnerUtils.makeTestsFailedError);
};

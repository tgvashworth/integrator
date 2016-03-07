import { Map } from 'immutable';
import { run } from 'action-graph';
import runnerUtils from './runner-utils';
import utils from './utils';

const defaultSession = {
    quit: () => {}
};

const runner = ({ action, suite, target, session }) => {
    const context = {
        session: session
    };
    return run(action, context, suite.initialState)
        .catch(runnerUtils.makeTestsFailedError)
        // We have to recover failures to collect and report on the results
        .then(runnerUtils.Pass, runnerUtils.Fail)
        .then(utils.makeEffect(() => (typeof session.quit === 'function') && session.quit()));
};

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
        getSession = () => Promise.resolve(defaultSession),
        target = Map()
    } = params;

    return Promise.resolve().then(() => {
        return getActionsForArgs(args, suite).reduce(
            (pPrev, action) => {
                return pPrev.then(() => {
                    if (target.get('envName')) {
                        runnerUtils.success(
                            `\nRunning: ${action.getDescription()}`,
                            `\n  on ${target.get('envName')}`,
                            `\n  in ${target.get('targetName')}`
                        );
                    }
                    const config = target.mergeDeepIn(['capabilities'], Map({
                        name: action.getDescription()
                    }));
                    return Promise.resolve(getSession(config))
                        .then(session => runner({ suite, session, action, args, target }));
                });
            },
            Promise.resolve()
        );
    });
};

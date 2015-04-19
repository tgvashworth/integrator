import Server from 'leadfoot/Server';
import parseArgs from 'minimist';
import { fromJS } from 'immutable';
import utils from './utils';
import { Executor, go } from './integrator';

const args = parseArgs(process.argv);

if (typeof args.suite !== 'string') {
    throw new Error('No suite supplied');
}

const dispatch = (args, { suite }) => {
    const runners = utils.makeRunners(suite);

    if (utils.is('string', args.action)) {
        let runner = utils.findByKey('targetName')(runners)(args.action);
        if (utils.is('undefined', runner)) {
            throw new Error(`No such action "${args.action}"`);
        }
        return go(runner);
    }

    return utils.randomWalk(runners);
};

const dispatcher = args => executor => {
    if (utils.is('boolean', args.graph) && args.graph) {
        return utils.actionGraph(executor.suite);
    }

    return dispatch(args, executor)
        .then(utils.effect(utils.handleSuccess(args)), utils.handleFailure(args));
};

const start = args => initSuite => {
    (new Server(args.hub))
        .createSession({ browserName: args.browser || 'chrome' })
        .then(session => {
            // Quit the session when the process is killed
            process.on('SIGINT', utils.quit(session));
            // set up the suite, then go
            return Promise.resolve(initSuite(session, args))
                .then(suite => ({ session, suite }));
        })
        .then(utils.effect(dispatcher(args)))
        .then(executor => utils.quit(executor.session)());
};

System.import(args.suite)
    .then(res => res.default)
    .then(start(args));

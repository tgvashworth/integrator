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
        utils.actionGraph(executor.suite);
        return Promise.resolve(executor);
    }

    return dispatch(args, executor)
        .then(utils.effect(utils.handleSuccess), utils.handleFailure)
        .then(utils.always(executor));
};

const start = args => initSuite => {
    (new Server(args.hub))
        .createSession({ browserName: args.browser || 'chrome' })
        .then(session => {
            // set up the suite, then go
            return Promise.resolve(initSuite(session, args))
                .then(suite => ({ session, suite }));
        })
        .then(utils.effect(({ session }) => {
            // Quit the session when the process is killed
            process.on('SIGINT', utils.quit(session));
        }))
        .then(utils.effect(dispatcher(args)))
        .catch(why => {
            console.error(why.stack);
        })
        .then(executor => {
            if (!args.pause) {
                return utils.quit(executor.session)();
            }
        });
};

System.import(args.suite)
    .then(res => res.default)
    .then(start(args));

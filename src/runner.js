import Server from 'leadfoot/Server';
import parseArgs from 'minimist';
import utils from './utils';
import { go } from './integrator';

const args = parseArgs(process.argv);

const dispatch = (args, session, suite) => {
    const runners = utils.makeRunners(suite);

    if (utils.is('boolean', args.graph) && args.graph) {
        utils.actionGraph(suite);
        return session.quit()
            .then(process.exit); // eslint-disable-line no-process-exit
    }

    if (utils.is('string', args.action)) {
        let runner = utils.findByKey('targetName')(runners)(args.action);
        if (utils.is('undefined', runner)) {
            throw new Error(`No such action "${args.action}"`);
        }
        return go(runner);
    }

    return utils.randomWalk(runners);
};

const runner = initSuite => {
    (new Server(args.hub))
        .createSession({ browserName: args.browser || 'chrome' })
        .then(session => {
            // set up the suite, then go
            return Promise.all([ session, initSuite(session, args) ]);
        })
        .then(([session, suite]) => {
            // Quit the session when the process is killed
            process.on('SIGINT', utils.quit(session));
            process.on('exit', utils.quit(session));

            return dispatch(args, session, suite)
                .then(utils.effect(utils.handleSuccess), utils.handleFailure)
                .then(() => session);
        })
        .catch(why => {
            console.error(why.stack);
        })
        .then(session => utils.quit(session)());
};

if (typeof args.suite !== 'string') {
    throw new Error('No suite supplied');
}

System.import(args.suite)
    .then(res => res.default)
    .then(runner);

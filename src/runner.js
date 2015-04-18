import Server from 'leadfoot/Server';
import parseArgs from 'minimist';
import utils from './utils';

const args = parseArgs(process.argv);

const runner = initSuite => {
    (new Server(args.hub))
        .createSession({ browserName: args.browser || 'chrome' })
        .then(session => {
            // set up the suite, then go
            return Promise.all([ session, initSuite(session, args) ]);
        })
        .then(([session, suite]) => {
            if (args.graph) {
                utils.actionGraph(suite);
                return session.quit()
                    .then(() => {
                        process.exit(); // eslint-disable-line no-process-exit
                    });
            }

            process.on('SIGINT', function() {
                session.quit();
            });

            const runners = utils.makeRunners(suite);

            return utils.randomWalk(runners)
                .then(utils.effect(utils.handleSuccess), utils.handleFailure)
                .then(() => session);
        })
        .catch(why => {
            console.error(why.stack);
        })
        .then(session => session.quit());
};

if (typeof args.suite !== 'string') {
    throw new Error('No suite supplied');
}

System.import(args.suite)
    .then(res => res.default)
    .then(runner);

import Server from 'leadfoot/Server';
import parseArgs from 'minimist';
import { fromJS } from 'immutable';
import utils from './utils';
import { go } from './integrator';

const args = parseArgs(process.argv);

if (typeof args.suite !== 'string') {
    throw new Error('No suite supplied');
}

const dispatchActions = ({ args, suite }) => {
    const runners = utils.makeRunners(suite);

    // --critical-paths
    // Run the suite's set of critical paths
    if (utils.is('boolean', args['critical-paths']) && args['critical-paths']) {
        if (!suite.getIn(['opts', 'criticalPaths'])) {
            throw new Error('Suite has no critical paths defined');
        }

        return suite.getIn(['opts', 'criticalPaths']).reduce((pPrev, actionName) => {
            let runner = utils.findByKey('targetName')(runners)(actionName);
            if (utils.is('undefined', runner)) {
                throw new Error(`No such action "${actionName}"`);
            }
            return pPrev.then(utils.effect(() => go(runner)));
        }, Promise.resolve());
    }

    // --action
    // Run a specific action
    if (utils.is('string', args.action)) {
        let runner = utils.findByKey('targetName')(runners)(args.action);
        if (utils.is('undefined', runner)) {
            throw new Error(`No such action "${args.action}"`);
        }
        return go(runner);
    }

    // Otherwise, random walk
    return utils.randomWalk(runners);
};

/**
 * Create a function that, when called, figures out what to do with the command line input and the
 * suite.
 *
 * Functionality that does not include running any actions should go here — otherwise hand off to
 * the dispatchActions function.
 */
const dispatch = params => {
    let { args, suite } = params;

    // --graph
    // Output graphviz that can be used to graph the dependency tree
    if (utils.is('boolean', args.graph) && args.graph) {
        return utils.actionGraph(args, suite);
    }

    // Run actions and respond to the result
    return dispatchActions(params)
        .then(utils.effect(utils.handleSuccess(args)), utils.handleFailure(args));
};

/**
 * Initialise the Selenium WebDriver session using Leadfoot, then setup the user's test suite and
 * start running it.
 *
 * The URL of the Selenium server to connect to will have been passed on the command line with the
 * --hub flag.
 */
const start = args => initSuite => {
    (new Server(args.hub))
        .createSession({ browserName: args.browser || 'chrome' })
        .then(session => {
            // Quit the session when the process is killed
            process.on('SIGINT', utils.quit(session));
            // set up the suite, then go
            return Promise.resolve(initSuite(session, args))
                .then(suite => ({ args, session, suite }));
        })
        .then(utils.effect(dispatch))
        .then(({ session }) => utils.quit(session)())
        .catch(why => {
            console.error(why.stack);
        });
};

System.import(args.suite)
    .then(res => res.default)
    .then(start(args));

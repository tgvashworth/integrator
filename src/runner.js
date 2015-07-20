import path from 'path';

import Server from 'leadfoot/Server';
import parseArgs from 'minimist';
import { fromJS } from 'immutable';

import { go, utils, randomWalk, makeRunners } from './integrator';
import runnerUtils from './runner-utils'

const args = parseArgs(process.argv);

if (typeof args.suite !== 'string') {
    runnerUtils.gameOver('No suite supplied.', '\nUse --suite path/to/suite.js');
}

if (typeof args.hub !== 'string') {
    runnerUtils.warning(
        'No hub supplied.',
        '\n  Use --hub <url>',
        '\n  Defaulting to http://localhost:4444/wd/hub'
    );
    args.hub = 'http://localhost:4444/wd/hub';
}

if (typeof args.browser !== 'string') {
    runnerUtils.warning(
        'No browser supplied.',
        '\n  Use --browser chrome|firefox|...',
        '\n  Defaulting to chrome'
    );
    args.browser = 'chrome';
}

const dispatchActions = ({ args, suite }) => {
    const runners = makeRunners(suite);

    // --critical-paths
    // Run the suite's set of critical paths
    if (utils.is('boolean', args['critical-paths']) && args['critical-paths']) {
        if (!suite.getIn(['opts', 'criticalPaths'])) {
            runnerUtils.gameOver(
                'Suite has no critical paths defined.',
                '\n  You can supply these with the `criticalPaths` key of your suite\'s options'
            );
        }

        runnerUtils.info('\nCritical paths.');

        return suite.getIn(['opts', 'criticalPaths']).reduce((pPrev, actionName) => {
            let runner = utils.findByKey('targetName')(runners)(actionName);
            if (utils.is('undefined', runner)) {
                runnerUtils.gameOver(`No such action "${actionName}"`);
            }
            return pPrev.then(utils.makeEffect(() => go(runner)));
        }, Promise.resolve());
    }

    // --action
    // Run a specific action
    if (utils.is('string', args.action)) {
        let runner = utils.findByKey('targetName')(runners)(args.action);
        if (utils.is('undefined', runner)) {
            runnerUtils.gameOver(`No such action "${args.action}"`);
        }
        runnerUtils.info('\nAction: %s', args.action);
        return go(runner);
    }

    runnerUtils.info('\nMode: random walk.');

    // Otherwise, random walk
    return randomWalk(runners);
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
        return runnerUtils.actionGraph(args, suite);
    }

    // Run actions and respond to the result
    return dispatchActions(params)
        .catch(runnerUtils.handleFailure(args));
};

/**
 * Initialise the Selenium WebDriver session using Leadfoot, then setup the user's test suite and
 * start running it.
 *
 * The URL of the Selenium server to connect to will have been passed on the command line with the
 * --hub flag.
 */
const start = (args, initSuite) => {
    runnerUtils.info(
        '\nSetting up server and session.',
        '\n  Hub     : ', args.hub,
        '\n  Browser : ', args.browser
    );
    new Server(args.hub)
        .createSession({ browserName: args.browser })
        .then(session => {
            // Quit the session when the process is killed
            process.on('SIGINT', runnerUtils.makeQuit(session, {
                message: 'Process killed with SIGINT.',
                code: 1
            }));
            // set up the suite, then go
            return Promise.resolve(initSuite(session, args))
                .then(suite => ({ args, session, suite }))
                .then(dispatch)
                .then(
                    utils.compose(
                        utils.always(0),
                        utils.makeCall(runnerUtils, 'success', '\nPassed.')
                    ),
                    utils.compose(
                        utils.always(1),
                        why => {
                            let testsFailed = (why instanceof runnerUtils.TestsFailedError);
                            runnerUtils.error(
                                (testsFailed ? '\nFailed.' : 'There was an error.'),
                                `\n${why.stack}`
                            );
                        }
                    )
                )
                .then(utils.makeEffect(args['stay-open'] ? () => {} : utils.makeCall(session, 'quit')))
                .then(utils.makeEffect(utils.makeCallPartial(runnerUtils, 'info', 'code')))
                .then(utils.makeCallPartial(process, 'exit'));
        })
        .catch(why => {
            runnerUtils.gameOver(
                'Creating server and session failed.',
                '\n',
                why.stack,
                runnerUtils.suggestFix(args, why)
            );
        });
};

try {
    start(args, require(path.resolve(process.cwd(), args.suite)));
} catch (e) {
    runnerUtils.gameOver(
        'Failed to start integrator',
        '\n',
        e.stack
    );
}

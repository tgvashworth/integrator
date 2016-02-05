import { inspect } from 'util';

import chalk from 'chalk';
import { fromJS } from 'immutable';

import utils from './utils';

// Errors

class TestsFailedError {
    constructor({ message, action, stack }) {
        this.message = message;
        this.action = action;
        this.stack = stack;
    }
}

const runnerUtils = {
    // Logging
    // TODO multicast this to remember what was logged, for JSON output later
    gameOver: (...msgs) => {
        runnerUtils.error(...msgs);
        process.exit(1);
    },

    error: (msg, ...msgs) => {
        console.error(chalk.red(msg), ...msgs);
    },

    warning: (msg, ...msgs) => {
        console.error(chalk.yellow(msg), ...msgs);
    },

    info: (...msgs) => {
        console.log(...msgs);
    },

    section: (msg, ...msgs) => {
        console.log(chalk.blue(msg), ...msgs);
    },

    success: (msg, ...msgs) => {
        console.log(chalk.green(msg), ...msgs);
    },

    // Actions
    actionGraph: (args, suite) => {
        const nodeNodeNames = suite.get('actions').map(action => ({
            action,
            name: action.get('name'),
            nodeName: action.get('name')
                .replace(/[^a-z0-9]/ig, '_')
                .replace(/\_{2,}/g, '_')
                .replace(/\_$/g, ''),
            deps: action.get('deps').map(dep => dep.replace(/\s/g, '_'))
        }));

        return [].concat(
            ['digraph G {'],
            nodeNodeNames.flatMap(({name, nodeName}) =>
                [ `  node [] ${nodeName} {`
                , `    label = "${name}"`
                , `  }`
                ]
            ),
            nodeNodeNames.flatMap(({nodeName, deps}) =>
                deps.map(dep =>
                    `  ${dep} -> ${nodeName} [];`
                )
            ),
            ['}']
        );
    },

    // Running actions
    handleSuccess: (/* args */) => () => {
        runnerUtils.success('\nPassed.');
    },

    TestsFailedError: TestsFailedError,

    makeTestsFailedError: why => {
        throw new TestsFailedError(why);
    },

    logRan: data => {
        runnerUtils.info('\nRan:');
        data.get('ran')
            .map(({action, phaseName, data, updatedData}) => {
                runnerUtils.info(`  ${action.get('name')} (${phaseName})`);
                runnerUtils.info('    | model    :', data.get('model'));
                runnerUtils.info('    |   before :', data.get('model'));
                runnerUtils.info('    |   after  :', updatedData.get('model'));
                runnerUtils.info('    | fixtures :', data.get('fixtures'));
            });
        // TODO: allow depth to be supplied in args
        runnerUtils.info('\nFinally:');
        runnerUtils.info('  Model:');
        runnerUtils.info(inspect(data.get('model').toJS(), { depth: 10, colors: true }));
        runnerUtils.info('  Fixtures:');
        runnerUtils.info(inspect(data.get('fixtures').toJS(), { depth: 10, colors: true }));
    },

    makeQuit: (session, { message, code }) => () => {
        try {
            if (message) {
                runnerUtils.info('\nQuit:', message);
            }
            return session.quit()
                .then(function () {
                    process.exit(code);
                });
        } catch (e) {}
    },

    generateTargetName: (config) => {
        return [
            config.getIn(['capabilities', 'platform']),
            config.getIn(['capabilities', 'os']),
            config.getIn(['capabilities', 'os_version']),
            config.getIn(['capabilities', 'browserName']),
            config.getIn(['capabilities', 'browser']),
            config.getIn(['capabilities', 'browser_version']),
            config.getIn(['capabilities', 'resolution']),
            (config.getIn(['capabilities', 'browserstack.debug']) ? '(debug)' : ''),
            (config.getIn(['capabilities', 'browserstack.local']) ? '(local)' : '')
        ].filter(Boolean).join(' ');
    },

    // Results
    Pass: v => fromJS({
        type: 'pass',
        value: v
    }),

    Fail: why => fromJS({
        type: 'fail',
        value: why
    })

};

export default runnerUtils;

import { inspect } from 'util';

import chalk from 'chalk';
import { fromJS } from 'immutable';

import utils from './utils';
import { logger } from './logging';

// Errors

function TestsFailedError(message) {
    Error.call(this);
    this.message = message;
    const e = new Error();
    this.stack = `Error: ${message}\n${e.stack.split('\n').slice(2).join('\n')}`;
}

TestsFailedError.prototype = Error.prototype;

const runnerUtils = {
    // Logging
    // TODO multicast this to remember what was logged, for JSON output later #29 #39
    gameOver: (...msgs) => {
        runnerUtils.error(...msgs);
        process.exit(1);
    },

    error: (msg, ...msgs) => {
        logger.error(chalk.red(msg), ...msgs);
    },

    warning: (msg, ...msgs) => {
        logger.error(chalk.yellow(msg), ...msgs);
    },

    info: (...msgs) => {
        logger.log(...msgs);
    },

    success: (msg, ...msgs) => {
        logger.log(chalk.green(msg), ...msgs);
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

    makeTestsFailedError: why => {
        let e = new TestsFailedError(why.message);
        e.stack = utils.fakeStack(e, why);
        e.data = why.data;
        throw e;
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

    // UX
    suggestFix: (args, config, why) => {
        if (why.message.match(/ECONNREFUSED/i)) {
            return [
                '\n',
                `Is the hub running at ${config.hub}?`,
                'You can supply a different hub using --hub <url>'
            ].join('\n');
        }
        return '';
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

runnerUtils.TestsFailedError = TestsFailedError;

export default runnerUtils;

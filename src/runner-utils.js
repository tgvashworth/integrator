import { inspect } from 'util';

import chalk from 'chalk';

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

        console.log('digraph G {');

        nodeNodeNames
            .map(({name, nodeName}) => {
                console.log('  node [] ', nodeName, ' {');
                console.log('    label = "' + name + '"');
                console.log('  }');
            });

        console.log();

        nodeNodeNames
            .map(({nodeName, deps}) => {
                deps.map(dep => {
                    console.log('  ', dep, '->', nodeName, '[];');
                });
            });

        console.log('}');
    },

    // Running actions
    handleSuccess: (/* args */) => () => {
        runnerUtils.success('\nPassed.');
    },

    handleFailure: args => why => {
        runnerUtils.warning('\nFailed.\n', why.stack);
        if (args.verbose && why.data) {
            runnerUtils.logRan(why.data, args);
        }
        throw new runnerUtils.TestsFailedError(why.message);
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

    quit: (session, msg) => () => {
        try {
            if (msg) {
                runnerUtils.info('\nQuitting:', msg);
            }
            return session.quit()
                .then(function () {
                    process.exit();
                });
        } catch (e) {}
    },

    // UX
    suggestFix: (args, why) => {
        if (why.message.match(/ECONNREFUSED/i)) {
            return [
                '\n',
                `Is the hub running at ${args.hub}?`,
                'You can supply a different hub using --hub <url>'
            ].join('\n');
        }
    },

    // Errors
    TestsFailedError: function TestsFailedError(message) {
        this.message = message;
    }
};

export default runnerUtils;

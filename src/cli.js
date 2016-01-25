/**
 * CLI converts Integrator command line input into actual runs, using the mutiRunner.
 */

import path from 'path';

import parseArgs from 'minimist';
import { fromJS, Map, List } from 'immutable';

import multiRunner from './multi-runner';
import runnerUtils from './runner-utils';
import utils from './utils';

// TODO fromJS this
const args = parseArgs(process.argv);

const configFileArg = args._[2];

// Load config
if (!utils.is('string', configFileArg)) {
    runnerUtils.gameOver(
        'No configuration file supplied.',
        '\nUse: integrator path/to/configuration.js'
    );
}

const configPath = path.resolve(process.cwd(), configFileArg);

// Get the raw configuration data
try {
    var rawConfigurationFile = require(configPath);
} catch (why) {
    runnerUtils.gameOver(
        `Failed to load configuration file at ${configPath}`,
        `\n${why.stack}`
    );
}

// Produce a config for the given arguments
const integratorConfig = fromJS(rawConfigurationFile)
    // Choose some configuration targets
    .update('environments', Map(), environments => {
        if (!utils.is('string', args.environment)) {
            return environments;
        }
        // Only use configurations with the supplied name
        return environments.filter((_, name) => name === args.environment);
    })
    .update('environments', Map(), environments => {
        // Save the environment's name for easy access later
        return environments
            .map((environment, name) => {
                return environment.set('envName', name);
            })
            .valueSeq();
    });

// The path to the suite should be supplied in the config file.
if (!integratorConfig.has('suite')) {
    runnerUtils.gameOver(
        `No suite specified.`,
        `\nAdd the key 'suite' and a path to ${configFileArg}`
    );
}

const suitePath = path.resolve(path.dirname(configPath), integratorConfig.get('suite'));

// Grab the suite
try {
    var initSuite = require(suitePath);
} catch (why) {
    runnerUtils.gameOver(
        `Failed to load suite at ${suitePath}`,
        `\n${why.stack}`
    );
}

if (!utils.is('function', initSuite)) {
    runnerUtils.gameOver(
        `The exported value from ${suitePath} must be a function`
    );
}

multiRunner(initSuite, args, integratorConfig)
    .catch(e => {
        runnerUtils.gameOver(
            'Failed to start integrator',
            `\n${e.stack}`
        );
    });

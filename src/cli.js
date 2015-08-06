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

// --suite
if (!utils.is('string', args.suite)) {
    runnerUtils.gameOver(
        'No suite supplied.',
        '\nUse: --suite path/to/suite.js'
    );
}

// Grab the suite
try {
    var suite = require(path.resolve(process.cwd(), args.suite));
} catch (why) {
    runnerUtils.gameOver(
        `Failed to load suite at ${args.suite}`,
        `\n${why.stack}`
    );
}

// --configuration-file
if (!utils.is('string', args['configuration-file'])) {
    runnerUtils.gameOver(
        'No configuration file supplied.',
        '\nUse: --configuration-file path/to/configuration.json'
    );
}

// Get the raw configuration data
try {
    var rawConfigurationFile = require(path.resolve(process.cwd(), args['configuration-file']));
} catch (why) {
    runnerUtils.gameOver(
        `Failed to load configuration file at ${args['configuration-file']}`,
        `\n${why.stack}`
    );
}

// Produce a config for the given arguments
const integratorConfig = fromJS(rawConfigurationFile)
    // Choose some configuration targets
    .update('configurations', Map(), configurations => {
        if (!utils.is('string', args['configuration-target'])) {
            return configurations;
        }
        // Only use configurations with the supplied name
        return configurations.filter((configuration, name) => {
            return (name === args['configuration-target']);
        });
    })
    .update('configurations', Map(), configurations => {
        // Add the configuration key to the configuration as its name, and convert it to a Seq
        return configurations
            .map((configuration, name) => {
                return configuration.set('name', name);
            })
            .valueSeq();
    })
    ;

multiRunner(suite, args, integratorConfig)
    .catch(e => {
        runnerUtils.gameOver(
            'Failed to start integrator',
            '\n',
            e.stack
        );
    });

/**
 * Multi-runner takes a configuration file and explodes it out it to multiple runers, merging
 * configuration as it goes.
 */

import { List, Map, fromJS } from 'immutable';

import utils from './utils';
import runnerUtils from './runner-utils';
import runner from './runner';

const defaultConfiguration = fromJS({
    hub: 'http://localhost:4444/wd/hub'
});

const runConfigurationTargets = (suite, args, configuration) => {
    return configuration
        .get('targets', List())
        .map(target => {
            const targetConfiguration =
                defaultConfiguration
                    .mergeDeep(configuration.get('common', Map()))
                    .mergeDeep(target);
            runnerUtils.info(
                `   `,
                runnerUtils.generateConfigurationName(targetConfiguration)
            );
            return runner(suite, args, targetConfiguration)
                .then(runResult => fromJS({
                    runResult,
                    targetConfiguration,
                    configuration
                }));
        });
};

const logResult = result => {
    const runResult = result.get('runResult');
    const type = runResult.get('type');
    const value = runResult.get('value');
    const name = result.getIn(['configuration', 'name']);
    if (type === 'fail') {
        runnerUtils.error(
            `\nFailed: ${name}`,
            `\n${value.stack}`
        );
    } else {
        runnerUtils.success(
            `\nPassed: ${name}`
        );
    }
};

const handleFinished = results => {
    return fromJS(results)
        .map(utils.makeEffect(logResult));
};

const multiRunner = (suite, args, integratorConfig) => {
    var pRunners =
        integratorConfig
            .get('configurations', List())
            .flatMap(configuration => {
                runnerUtils.info(
                    `Running: ${configuration.get('name')}`,
                    `\n  in ${configuration.get('targets', List()).count()} configurations:`
                );
                return runConfigurationTargets(suite, args, configuration);
            })
            .toJS();
    return Promise.all(pRunners)
        .then(handleFinished)
        .catch((why) => {
            runnerUtils.gameOver(
                'Something went wrong.',
                `\n${why.stack}`
            );
        });
};

export default multiRunner;

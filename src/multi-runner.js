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

const runEnvironmentTargets = (initSuite, args, environment) => {
    return environment
        .get('targets', List())
        .map(targetConfiguration => {
            const target =
                defaultConfiguration
                    .mergeDeep(environment.get('common', Map()))
                    .mergeDeep(targetConfiguration);
            return target.merge(fromJS({
                envName: environment.get('envName'),
                targetName: runnerUtils.generateTargetName(target)
            }));
        })
        .map(target => {
            runnerUtils.info(
                `    ${target.get('targetName')}`
            );
            return runner(initSuite, args, target)
                .then(runResult => fromJS({
                    runResult,
                    target,
                    environment
                }));
        });
};

const logResult = result => {
    const runResult = result.get('runResult');
    const type = runResult.get('type');
    const value = runResult.get('value');
    const envName = result.getIn(['target', 'envName']);
    const prettyName = result.getIn(['target', 'targetName']);
    if (type === 'fail') {
        runnerUtils.error(
            `\nFailed:`,
            `\n  on ${envName}`,
            `\n  in ${prettyName}`,
            `\n${value.stack}`
        );
    } else {
        runnerUtils.success(
            `\nPassed:`,
            `\n  on ${envName}`,
            `\n  in ${prettyName}`
        );
    }
};

const handleFinished = results => {
    return fromJS(results)
        .map(utils.makeEffect(logResult));
};

const makeRunPlugins = (phase, integratorConfig) => () => {
    var pPlugins = integratorConfig
        .get('environments', List())
        .flatMap(environment => environment.get('plugins', List()))
        .map(plugin => {
            if (plugin.hasOwnProperty(phase) && !utils.is('function', plugin[phase])) {
                runnerUtils.gameOver(
                    `Plugin ${plugin.constructor.name} '${phase}' ` +
                        `property is not a function`
                );
            }
            return plugin[phase](integratorConfig);
        });

    return Promise.all(pPlugins)
        .catch(why => {
            runnerUtils.gameOver(
                `Plugins failed to run successfully`,
                `\n${why ? why.stack : ''}`
            );
        });
};

const makeRunTargets = (initSuite, args, integratorConfig) => () => {
    var pTargets = integratorConfig
        .get('environments', List())
        .flatMap(environment => {
            runnerUtils.info(
                `Running: ${environment.get('envName')}`,
                `\n  in ${environment.get('targets', List()).count()} configurations:`
            );
            return runEnvironmentTargets(initSuite, args, environment);
        })
        .toJS()
    return Promise.all(pTargets);
};

const multiRunner = (initSuite, args, integratorConfig) => {
    return Promise.resolve()
        .then(utils.makeEffect(makeRunPlugins('before', integratorConfig)))
        .then(makeRunTargets(initSuite, args, integratorConfig))
        .then(utils.makeEffect(makeRunPlugins('after', integratorConfig)))
        .then(handleFinished)
        .catch((why) => {
            runnerUtils.gameOver(
                '\nSomething went wrong.',
                `\n${why.stack}`
            );
        });
};

export default multiRunner;

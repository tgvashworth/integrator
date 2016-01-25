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
            `\n  in ${prettyName}`
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

const multiRunner = (initSuite, args, integratorConfig) => {
    var pRunners =
        integratorConfig
            .get('environments', List())
            .flatMap(environment => {
                runnerUtils.info(
                    `Running: ${environment.get('envName')}`,
                    `\n  in ${environment.get('targets', List()).count()} configurations:`
                );
                return runEnvironmentTargets(initSuite, args, environment);
            })
            .toJS();
    return Promise.all(pRunners)
        .then(handleFinished)
        .catch((why) => {
            runnerUtils.gameOver(
                '\nSomething went wrong.',
                `\n${why.stack}`
            );
        });
};

export default multiRunner;

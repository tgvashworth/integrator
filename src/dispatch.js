import { go, utils, randomWalk, makeRunners } from './integrator';
import runnerUtils from './runner-utils'

const dispatchActions = (params) => {
    const { suite, args, targetConfiguration } = params;
    const runners = makeRunners(params);

    // TODO support pulling what to run from configuration

    // --critical-paths
    // Run the suite's set of critical paths
    if (utils.is('boolean', args['critical-paths']) && args['critical-paths']) {
        if (!suite.getIn(['opts', 'criticalPaths'])) {
            runnerUtils.gameOver(
                'Suite has no critical paths defined.',
                '\n  You can supply these with the `criticalPaths` key of your suite\'s config.',
                '\n  It should be an array of action names.'
            );
        }

        runnerUtils.info(
            '\nMode: critical paths',
            `\n  on ${targetConfiguration.get('configurationName')}`,
            `\n  in ${targetConfiguration.get('targetName')}`
        );

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
        runnerUtils.info(
            `\nMode: action`,
            `\n  on ${targetConfiguration.get('configurationName')}`,
            `\n  in ${targetConfiguration.get('targetName')}`
        );
        return go(runner);
    }

    if (utils.is('boolean', args['random-walk']) && args['random-walk']) {
        runnerUtils.info('\nMode: random walk.');
        return randomWalk(runners);
    }

    runnerUtils.info('\nMode: none selected, doing nothing.');

    return Promise.resolve(true);
};

/**
 * Figure out what to do with the command line input and the suite.
 *
 * Functionality that does not include running any actions should go here — otherwise hand off to
 * the dispatchActions function.
 */
const dispatch = params => {
    // Run actions and respond to the result
    return dispatchActions(params)
        .catch(runnerUtils.makeTestsFailedError);
};

export default dispatch;

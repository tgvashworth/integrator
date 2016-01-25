/**
 * runner
 *
 * Sets up one session with a particular config, passes it to a suite and sends it off to the
 * dispatcher for execution.
 */

import utils from './utils';
import runnerUtils from './runner-utils';
import makeLeadfootSession from './leadfoot-session';
import dispatch from './dispatch';

const runner = (initSuite, args, target) => {
    return makeLeadfootSession(target)
        .then(session => {
            // Quit the session when the process is killed
            process.on('SIGINT', utils.makeCall(session, 'quit'));
            // Set up the suite, then go
            return Promise.resolve(initSuite(session, args, target))
                .then(suite => ({ suite, session, args, target }))
                .then(dispatch)
                // We have to recover failures to collect and report on the results
                .then(runnerUtils.Pass, runnerUtils.Fail)
                .then(utils.makeEffect(utils.makeCall(session, 'quit')));
        });
};

export default runner;

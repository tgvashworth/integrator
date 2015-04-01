import Immutable from 'immutable';
import { Suite, Runner, Action, go } from '../src/integrator';
import Server from 'leadfoot/Server';

// UTILS

const util = {
    inherit: x => x,
    fallback: (f, v) => x => f(x) || v,
    always: x => () => x,
    log: console.log.bind(console),
    handleSuccess: data => util.logRan(data),
    handleFailure: why => {
        console.log('== FAILED ========================');
        console.error(why.stack);
        util.logRan(why.data);
    },

    logRan: (data) => {
        console.log('== PASSED ========================');
        // console.log('Data:', data.toJS());
        console.log(
            'Ran:',
            data.get('ran')
                .map(({action, phaseName}) => `${action.get('name')} (${phaseName})`)
                .toJS()
        );
    },

    /**
     * Create side-effect function that acts as identity of its argument, unless the argument is
     * mutable.
     *
     * Usage:
     *
     *      fn = effect(() => mutateAllTheThings())
     *      fn(a) // -> a (mutateAllTheThings will have been called)
     *
     * Returns a function that calls the passed `fn` and returns its argument.
     */
    effect: fn => x => Promise.resolve(fn(x)).then(() => x)
};

/**
 * Temporary and stupid assertion lib.
 *
 * TODO: remove
 */
const assert = {
    // Throw with `msg` if `v` isn't truthy
    ok: (v, msg) => {
        if (!v) {
            throw new Error(msg);
        }
    }
};

Promise.timeout = t => new Promise(resolve => setTimeout(resolve, t));

// ACTIONS

let session; // YUK YUK YUK

const model = Immutable.fromJS({});

let actions = Immutable.List([
    Action('open app', [], {
        setup: util.effect(() => session.get('https://google.com')),

        assert: util.effect(() => {
            return session
                .getPageTitle()
                .then(title => {
                    console.log('title', title);
                    assert.ok(
                        title.trim() === 'Google',
                        'Title is wrong'
                    );
                });
        })
    })
]);

const suite = Suite(actions, model);
const runnersByName = actions.reduce(
    (rBN, action) => rBN.set(
        action.get('name'),
        Runner(suite, action.get('name'))
    ),
    Immutable.Map()
);

// RUN

var server = new Server('http://127.0.0.1:4444/wd/hub');
server.createSession({ browserName: 'firefox' })
    .then(function (_session) {
        session = _session;
        go(runnersByName.get('open app'))
            .then(util.handleSuccess, util.handleFailure)
            .then(() => session.quit());
    });



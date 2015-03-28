/**
 * TODO
 *
 * - [x] Add teardown phase
 * - [x] Can you return a promise from a phase fn?
 * - [ ] How does data dependency work?
 * - [ ] Run back through minimal actions to move to a different phase
 * - [ ] "Warning: X requires a user, but has no default"
 * - [ ] fallback(inherit, x) is unreadable
 */

import Immutable from 'immutable';
import { Suite, Runner, Action, go } from './qi';
import { pluck, findByKey } from './immutable-kit';

// UTILS

const logRan = (data) => {
    console.log('Data:', data.toJS());
    console.log(
        'Ran:',
        data.get('ran')
            .map(({action, phaseName}) => `${action.get('name')} (${phaseName})`)
            .toJS()
    );
};

const handleFailure = why => {
    console.error(why.stack);
    logRan(why.data);
};

const handleSuccess = data => logRan(data);

let inherit = x => x;
let fallback = (f, v) => x => f(x) || v;
// let always = x => () => x;

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

Promise.timeout = t =>
    new Promise(resolve => window.setTimeout(resolve, t));

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
const effect = fn => x => Promise.resolve(fn(x)).then(() => x);

// APP

// Note: mutable, side-effecty, eww... just like the real world.
var appState = {
    open: false,
    todos: [],
    todoText: '',
    loginFormData: {}
};

var app = {
    open() {
        appState.open = true;
    },
    close() {
        appState.open = false;
    },

    fillInLoginForm(username, password) {
        appState.loginFormData = { username, password };
    },
    clickLogin() {
        return Promise.timeout(1000)
            .then(() => {
                appState.loggedIn = true;
            });
    }
};

const users = Immutable.fromJS({
    wally: { screenName: 'wally', password: '12345' },
    tom: { screenName: 'tom', password: '12345', twoFactor: true }
});

// ACTIONS

const model = Immutable.fromJS({
    open: false,
    todos: [],
    todoText: ''
});

let actions = Immutable.List([
    Action('open app', [], {
        setup: model =>
            // Arbitrary timeout to test it
            Promise.timeout(500)
                .then(() => {
                    app.open();
                    return model.set('open', true);
                }),
        assert: effect(model => {
            assert.ok(
                model.get('open') === appState.open,
                'App did not open'
            );
        }),
        teardown: model => {
            app.close();
            return model.set('open', false);
        },
        finally: effect(model =>
            assert.ok(
                model.get('open') === appState.open,
                'App did not close'
            ))
    }),

    Action('fill in login form', ['open app'], {
        env: {
            user: fallback(inherit, users.get('wally'))
        },

        setup: (model, env) => {
            app.fillInLoginForm(
                env.getIn(['user', 'screenName']),
                env.getIn(['user', 'password'])
            );
            return model.set('user', env.get('user'));
        },

        assert: effect(model => {
            assert.ok(
                model.getIn(['user', 'screenName']) === appState.loginFormData.username,
                'Username was not set correctly'
            );
        })
    }),

    Action('login', ['fill in login form'], {
        env: {
            user: fallback(inherit, users.get('wally'))
        },

        setup: effect(() => {
            return app.clickLogin();
        }),

        assert: effect(() => {
            assert.ok(
                appState.loggedIn,
                'Failed to login'
            );
        })
    }),

    Action('2FA login', ['fill in login form'], {
        env: {
            user: users.get('tom')
        },

        setup: effect(() => {
            return app.clickLogin();
        }),

        assert: effect(() => {
            assert.ok(
                appState.loggedIn,
                'Failed to login'
            );
        })
    }),

    Action('conflict with 2FA login', ['2FA login'], {
        env: {
            user: users.get('wally')
        }
    })
]);

const suite = Suite(actions, model);
const runner = Runner(suite, '2FA login');
go(runner).then(handleSuccess, handleFailure);

/**
 * TODO
 *
 * - [x] Add teardown phase
 * - [x] Can you return a promise from a phase fn?
 * - [ ] How does data dependency work?
 * - [ ] Run back through minimal actions to move to a different phase
 * - [ ] "Warning: X requires a user, but has no default"
 */

import Immutable from 'immutable';
import { Runner, Action } from './qi';
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
 *      effect(_ => mutateAllTheThings())(a) -> a
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
    tom: { screenName: 'tom', password: '12345' }
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
    })
]);

var run = Runner(actions, model);

run('login').then(handleSuccess, handleFailure);

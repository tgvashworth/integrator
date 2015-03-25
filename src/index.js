/**
 * TODO
 *
 * - [x] Add teardown phase
 * - [ ] Can you return a promise from a phase fn?
 * - [ ] How does data dependency work?
 * - [ ] Run back through minimal actions to move to a different phase
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
const effect = fn => data => { fn(data); return data; };

// APP

// Note: mutable, side-effecty, eww... just like the real world.
var appState = {
    open: false,
    todos: [],
    todoText: ''
};

var app = {
    open() {
        appState.open = true;
    },
    close() {
        appState.open = false;
    }
};

// ACTIONS

const model = Immutable.fromJS({
    open: false,
    todos: [],
    todoText: ''
});

/*

      A
     / \
    B   C
   / \   \
  D   E — G
 /       / \
F ————— H   I

*/

let actions = Immutable.List([
    Action('open app', [], {
        setup: data => {
            app.open();
            return data.set('open', true);
        },
        assert: effect(data => {
            assert.ok(
                data.get('open') === appState.open,
                'App did not open'
            );
        }),
        teardown: data => {
            app.close();
            return data.set('open', false);
        },
        finally: effect(data => {
            assert.ok(
                data.get('open') === appState.open,
                'App did not close'
            );
        })
    }),
    Action('B', ['open app'], {}),
    Action('C', ['open app'], {}),
    Action('D', ['B'], {}),
    Action('E', ['B'], {}),
    Action('F', ['D'], {}),
    Action('G', ['E', 'C'], {}),
    Action('H', ['F', 'G'], {}),
    Action('I', ['G'], {})
]);

var run = Runner(actions, model);

run('H').then(handleSuccess, handleFailure);

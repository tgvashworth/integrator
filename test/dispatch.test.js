import test from 'ava';
import { createClass } from 'action-graph';

import runnerUtils from '../src/runner-utils';
import dispatch from '../src/dispatch';

test('importable', t => {
    t.ok(dispatch);
});

test('by default, runs all tests', t => {
    t.plan(2);
    const Example = createClass({
        run() {
            t.pass();
        }
    });
    const suite = {
        'example test': new Example(),
        'another example test': new Example()
    };
    return dispatch({ suite });
});

test('passes session in context', t => {
    t.plan(1);
    const session = {};
    const Example = createClass({
        run(context = {}) {
            t.same(context.session, session);
        }
    });
    const suite = {
        'example test': new Example()
    };
    return dispatch({ suite, session });
});

test('runs only the selected action if one is passed', t => {
    t.plan(1);
    const session = {};
    const Example1 = createClass({
        run() {
            t.pass();
        }
    });
    const Example2 = createClass({
        run() {
            t.fail();
        }
    });
    const suite = {
        'example test': new Example1(),
        'another example test': new Example2()
    };
    const args = {
        only: 'example test'
    };
    return dispatch({ suite, session, args });
});

test('converts throws into TestsFailedErrors', t => {
    t.plan(2);
    const Example = createClass({
        run() {
            throw new Error('Nope.');
        }
    });
    const suite = {
        example: new Example()
    };
    return dispatch({ suite })
        .then(
            () => t.fail(),
            (err) => {
                t.same(err.constructor, runnerUtils.TestsFailedError);
                t.same(err.message, 'Nope.');
            }
        );
});

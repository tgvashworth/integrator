import test from 'ava';
import { fromJS } from 'immutable';
import { createClass } from 'action-graph';

import runnerUtils from '../src/runner-utils';
import dispatch from '../src/dispatch';

test('importable', t => {
    t.ok(dispatch);
});

test('by default, runs all tests', t => {
    t.plan(2);
    const Example = createClass({
        run(state) {
            t.pass();
            return state;
        }
    });
    const suite = {
        actions: {
            'example test': new Example(),
            'another example test': new Example()
        }
    };
    return dispatch({ suite })
        .catch(err => {
            console.log(err);
            throw err;
        });
});

test('passes session in context', t => {
    t.plan(1);
    const session = {};
    const Example = createClass({
        run(state) {
            const { context } = this;
            t.same(context.session, session);
            return state;
        }
    });
    const suite = {
        actions: {
            'example test': new Example()
        }
    };
    return dispatch({ suite, getSession: () => session });
});

test('passes initialState', t => {
    t.plan(1);
    const initialState = fromJS({});
    const Example = createClass({
        run(state) {
            t.same(state, initialState);
            return state;
        }
    });
    const suite = {
        actions: {
            'example test': new Example()
        },
        initialState: initialState
    };
    return dispatch({ suite });
});

test('runs only the selected action if one is passed', t => {
    t.plan(1);
    const session = {};
    const Example1 = createClass({
        run(state) {
            t.pass();
            return state;
        }
    });
    const Example2 = createClass({
        run() {
            t.fail();
        }
    });
    const suite = {
        actions: {
            'example test': new Example1(),
            'another example test': new Example2()
        }
    };
    const args = {
        only: 'example test'
    };
    return dispatch({ suite, getSession: () => session, args });
});

test('converts throws into TestsFailedErrors and bundles in Fail object', t => {
    t.plan(4);
    const Example = createClass({
        displayName: 'thrower example',
        run() {
            throw new Error('Nope.');
        }
    });
    const suite = {
        actions: {
            example: new Example()
        }
    };
    return dispatch({ suite })
        .then(
            (res) => {
                const err = res.get('value');
                t.same(res.get('type'), 'fail');
                t.same(err.action, suite.actions.example);
                t.same(err.constructor, runnerUtils.TestsFailedError);
                t.same(err.message, 'Nope.');
            }
        );
});

test('propagates action-graph run path errors', t => {
    t.plan(4);
    const Dep = createClass({ displayName: 'dep' });
    const Example = createClass({
        displayName: 'example',
        getDependencies() {
            return [ Dep ];
        }
    });
    const suite = {
        actions: {
            example: new Example()
        }
    };
    return dispatch({ suite })
        .then(
            (res) => {
                const err = res.get('value');
                t.same(res.get('type'), 'fail');
                t.same(err.action, suite.actions.example);
                t.same(err.constructor, runnerUtils.TestsFailedError);
                t.same(err.message, 'Action "example" depends on "dep" but matching instances are missing');
            }
        );
});

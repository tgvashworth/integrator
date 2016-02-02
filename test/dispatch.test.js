import test from 'ava';
import { createClass } from 'action-graph';

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

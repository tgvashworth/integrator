import Immutable from 'immutable';
import { Suite, Runner, Action, go } from '../src/integrator';
import Server from 'leadfoot/Server';

// UTILS

const util = {
    inherit: x => x,
    fallback: (f, v) => x => f(x) || v,
    always: x => () => x,
    log: console.log.bind(console),

    handleSuccess: data => {
        console.log('== PASSED ========================');
        util.logRan(data);
    },
    handleFailure: why => {
        console.log('== FAILED ========================');
        console.error(why.stack);
        util.logRan(why.data);
    },

    logRan: (data) => {
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

const model = Immutable.fromJS({
    createText: '',
    list: []
});

let actions = Immutable.List([
    Action('open app', [], {
        setup: util.effect(() => session.get(process.argv[4] + '/examples/pages/list-app.html')),

        assert: util.effect(() => {
            return session
                .getPageTitle()
                .then(title => {
                    assert.ok(
                        title.trim() === 'List App',
                        'Title is wrong'
                    );
                });
        })
    }),

    Action('write a new list item', ['open app'], {
        env: {
            text: 'Hello, world!'
        },

        setup: (model, env) => {
            return session
                .findByName('Create-text')
                .then(elem => elem.type(env.get('text')))
                .then(() => model.set('createText', env.get('text')));
        },

        assert: util.effect(model => {
            return session
                .findByName('Create-text')
                .then(elem => elem.getProperty('value'))
                .then(value => {
                    assert.ok(
                        value === model.get('createText'),
                        'Create text is wrong'
                    );
                });
        })
    }),

    Action('add new list item', ['write a new list item'], {
        setup: model => {
            return session
                .findByCssSelector('.Create-submit')
                .then(elem => elem.click())
                .then(() =>
                    model
                        .update('list', list => list.concat(model.get('createText')))
                        .set('createText', '')
                );
        },

        assert: util.effect(model => {
            return session
                .findByCssSelector('.List-list')
                .then(elem => elem.getVisibleText())
                .then(text => {
                    assert.ok(
                        text === model.get('list').join(''),
                        'Text was not added to the list'
                    );
                })
                .then(() => session.findByName('Create-text'))
                .then(elem => elem.getProperty('value'))
                .then(value => {
                    assert.ok(
                        value === model.get('createText'),
                        'Create text was not cleared wrong'
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

var server = new Server(process.argv[3]);
server.createSession({ browserName: 'firefox' })
    .then(_session => {
        session = _session;
        go(runnersByName.get('add new list item'))
            .then(util.handleSuccess, util.handleFailure)
            .then(() => session.quit());
    }, why => {
        console.error(why.stack);
    });



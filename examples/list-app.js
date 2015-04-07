import Immutable from 'immutable';
import { Suite, Runner, Action, go } from '../src/integrator';
import Server from 'leadfoot/Server';

// UTILS

const utils = {
    inherit: x => x,
    fallback: (f, v) => x => {
        let fv = f(x);
        return (utils.is('undefined', fv) ? v : fv);
    },
    always: x => () => x,
    is: (type, x) => (typeof x === type),
    log: console.log.bind(console),

    handleSuccess: data => {
        console.log('== PASSED ========================');
        utils.logRan(data);
    },
    handleFailure: why => {
        console.log('== FAILED ========================');
        console.error(why.stack);
        utils.logRan(why.data);
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
        setup: utils.effect(() => session.get(process.argv[4] + '/examples/pages/list-app.html')),

        assert: utils.effect(() => {
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
            text: utils.fallback(utils.inherit, 'Hello, world!')
        },

        setup: (model, env) => {
            return session
                .findByName('Create-text')
                .then(elem => elem.type(env.get('text')))
                .then(() => model.set('createText', env.get('text')));
        },

        assert: utils.effect(model => {
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
                        .update('list', list => {
                            console.log('createText', model.get('createText'));
                            if (!model.get('createText')) {
                                return list;
                            }
                            return list.concat(model.get('createText'));
                        })
                        .set('createText', '')
                );
        },

        assert: utils.effect(model => {
            return session
                .findByCssSelector('.List-list')
                .then(elem => elem.getVisibleText())
                .then(text => {
                    assert.ok(
                        text === model.get('list').join(''),
                        'Model list does not match reality'
                    );
                })
                .then(() => session.findByName('Create-text'))
                .then(elem => elem.getProperty('value'))
                .then(value => {
                    assert.ok(
                        value === model.get('createText'),
                        'Create text was not cleared'
                    );
                });
        })
    }),

    Action('prevent adding empty item', ['add new list item'], {
        env: {
            text: ''
        },

        assert: utils.effect(model => {
            return session
                .findByCssSelector('.List-list')
                .then(elem => elem.findAllByCssSelector('li'))
                .then(items => {
                    console.log('items.length', items.length);
                    console.log('list', model.get('list').toJS());
                    assert.ok(
                        items.length === model.get('list').count(),
                        'Rendered list items does not match model'
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
server.createSession({ browserName: 'chrome' })
    .then(_session => {
        session = _session;
        go(runnersByName.get('add new list item'))
            .then(utils.effect(utils.handleSuccess), utils.handleFailure)
            .then(data => go(runnersByName.get('prevent adding empty item'), data))
            .then(utils.effect(utils.handleSuccess), utils.handleFailure)
            .then(() => session.quit());
    }, why => {
        console.error(why.stack);
    });



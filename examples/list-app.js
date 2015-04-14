import Immutable from 'immutable';
import { Suite, Runner, Action, go } from '../src/integrator';
import utils from './example-utils';
import assert from './example-assert';
import Server from 'leadfoot/Server';

// ACTIONS

let session; // YUK YUK YUK

const testUtils = {
    compareList: utils.effect(model => {
        return session
            .findByCssSelector('.List-list')
            .then(elem => elem.findAllByCssSelector('li span'))
            .then(elems => Promise.all(elems.map(elem => elem.getVisibleText())))
            .then(items => {
                assert.ok(
                    items.length === model.get('list').count(),
                    'Rendered list items does not match model'
                );
            });
    }),

    compareCreateText: utils.effect(model => {
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
};

const model = Immutable.fromJS({
    createText: '',
    list: Immutable.List()
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

        assert: testUtils.compareCreateText,

        teardown: model => {
            return session
                .findByName('Create-text')
                .then(elem => elem.clearValue())
                .then(() => model.set('createText', ''));
        },

        finally: testUtils.compareCreateText
    }),

    Action('add new list item', ['write a new list item'], {
        setup: model => {
            return session
                .findByCssSelector('.Create-submit')
                .then(elem => elem.click())
                .then(() =>
                    model
                        .update('list', list => {
                            if (!model.get('createText')) {
                                return list;
                            }
                            return list.concat(model.get('createText'));
                        })
                        .set('createText', '')
                );
        },

        assert: testUtils.compareCreateText
    }),

    Action('try adding empty item', ['add new list item'], {
        env: {
            text: ''
        },

        assert: testUtils.compareList
    }),

    Action('remove the last list item', ['add new list item'], {
        env: {
            text: 'Will be removed!'
        },

        setup: model => {
            return session
                .findAllByCssSelector('.List-list .List-item-remove')
                .then(elems => Immutable.List(elems).last())
                .then(elem => elem.click())
                .then(() => model.update('list', list => list.pop()));
        },

        assert: testUtils.compareList
    })
]);

const suite = Suite(actions, model);
const runners = utils.makeRunners(suite);

// RUN

var server = new Server(process.argv[3]);
server.createSession({ browserName: process.argv[5] })
    .then(_session => {
        session = _session;
        return utils.randomWalk(runners)
            .then(utils.effect(utils.handleSuccess), utils.handleFailure);
    })
    .catch(why => {
        console.error(why.stack);
    })
    .then(() => session.quit());

process.on('SIGINT', function() {
    session.quit();
});

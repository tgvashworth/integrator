import Immutable from 'immutable';
import { Suite, Action, go } from '../src/integrator';
import utils from '../src/utils';
import assert from '../src/assert';

const { fromJS } = Immutable;

// ACTIONS

let session; // YUK YUK YUK
let config; // YUK YUK YUK

const fixtures = fromJS({
    badUser: {
        username: 'nope',
        password: 'nope'
    },
    goodUser: {
        username: 'insert_good_user_here',
        password: 'insert_good_password_here'
    }
});

const model = fromJS({
    user: {}
});

let actions = fromJS([
    Action('open TweetDeck', [], {
        setup: utils.effect(() => {
            return session.get(config.base)
                .then(utils.findWithTimeout(session, () => session.findByName('username'), 1000));
        }),

        assert: utils.effect(() => {
            return session
                .getPageTitle()
                .then(title => {
                    assert.ok(
                        title.trim() === 'TweetDeck',
                        'Title is wrong'
                    );
                });
        })
    }),

    // Action('switch to TweetDeck login', ['open TweetDeck'], {

    // }),

    Action('enter Twitter username and password', ['open TweetDeck'], {
        fixtures: {
            user: utils.defaultTo(fixtures.get('badUser'))
        },

        setup: (model, fixtures) => {
            return session
                .findByName('username')
                .then(elem => elem.type(fixtures.getIn(['user', 'username'])))
                .then(() => session.findByName('password'))
                .then(elem => elem.type(fixtures.getIn(['user', 'password'])))
                .then(() => model.set('user', fixtures.get('user')));
        },

        assert: utils.effect(model => {
            return session.findByName('username')
                .then(elem => elem.getProperty('value'))
                .then(value => {
                    assert.ok(
                        value === model.getIn(['user', 'username']),
                        'Typed username is wrong'
                    );
                })
                .then(() => session.findByName('password'))
                .then(elem => elem.getProperty('value'))
                .then(value => {
                    assert.ok(
                        value === model.getIn(['user', 'password']),
                        'Typed password is wrong'
                    );
                });
        })
    }),

    Action('click login', ['enter Twitter username and password'], {
        fixtures: {
            user: utils.defaultTo(fixtures.get('badUser'))
        },

        setup: utils.effect(() => {
            return session.findByClassName('btn-login')
                .then(elem => elem.click());
        })
    }),

    Action('successful login', ['click login'], {
        fixtures: {
            user: utils.defaultTo(fixtures.get('goodUser'))
        },

        setup: model => {
            return Promise.resolve()
                .then(utils.findWithTimeout(session, () => session.findByClassName('js-column'), 10000))
                .then(() => model.set('loggedIn', true));
        }
    })
]);

const initSuite = (_session, _config) => {
    session = _session;
    config = _config;
    return Suite(actions, model);
};

export default initSuite;

import Immutable from 'immutable';
import { Suite, Action, go } from '../src/integrator';
import utils from '../src/utils';
import assert from './example-assert';

// ACTIONS

let session; // YUK YUK YUK
let config; // YUK YUK YUK

const model = Immutable.fromJS({});

let actions = Immutable.List([
    Action('open TweetDeck', [], {
        setup: utils.effect(() => {
            return session
                .get(config.base)
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
            username: utils.fallback(utils.inherit, 'total'),
            password: utils.fallback(utils.inherit, 'numpty')
        },

        setup: (model, env) => {
            return session
                .findByName('username')
                .then(elem => elem.type(env.get('username')))
                .then(() => session.findByName('password'))
                .then(elem => elem.type(env.get('password')))
                .then(() => model.set('loginUsername', env.get('username')));
        }
    })
]);

const initSuite = (_session, _config) => {
    session = _session;
    config = _config;
    return Suite(actions, model);
};

export default initSuite;

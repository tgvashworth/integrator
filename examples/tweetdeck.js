
/* WARNING: THIS WON'T WORK — it hasn't been updated for recent changes*/

import Immutable from 'immutable';
import { Suite, Runner, Action, go } from '../src/integrator';
import utils from './example-utils';
import assert from './example-assert';
import Server from 'leadfoot/Server';

// ACTIONS

let session; // YUK YUK YUK
process.on('SIGINT', function() {
    session.quit();
});

const model = Immutable.fromJS({});

let actions = Immutable.List([
    Action('open TweetDeck', [], {
        setup: utils.effect(() => session.get(process.argv[4])),

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

const suite = Suite(actions, model);
const runners = utils.makeRunners(suite);

// RUNs

var server = new Server(process.argv[3]);
server.createSession({ browserName: process.argv[5] })
    .then(_session => {
        session = _session;
        // return utils.randomWalk(runners)
        return go(runners.get(1))
            .then(utils.effect(utils.handleSuccess), utils.handleFailure);
    })
    .catch(why => {
        console.error(why.stack);
    })
    .then(() => session.quit());

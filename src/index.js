/**
 * TODO
 *
 * - [x] Add teardown phase
 * - [ ] Run back through minimal actions to move to a different phase
 */

import Immutable from 'immutable';
import { Runner, Action } from './qi';
import { pluck, findByKey } from './immutable-kit';

let identity = (x => x);

let actions = Immutable.List([
    Action('open tweetdeck', [], {
        setup: data => data.set('open', true),
        run: identity,
        assert: identity,
        teardown: identity
    }),

    Action('login', ['open tweetdeck'], {
        setup: data => data.set('user', Immutable.fromJS({ screenName: 'tom' })),
        run: identity,
        assert: identity,
        teardown: identity
    }),

    Action('send tweet', ['login'], {
        setup: identity,
        run: data => {
            // return data;
            return data.updateIn(['sent'], function (a) { return (a || 0) + 1; });
        },
        assert: data => {
            if (data.getIn(['sent']) !== 1) {
                throw Error('Tweets sent is not correct');
            }
            return data;
        },
        teardown: identity
    }),

    Action('read sent tweet', ['send tweet'], {
        setup: identity,
        run: data => data.updateIn(['read'], function (a) { return (a || 0) + 1; }),
        assert: data => {
            if (data.getIn(['read']) !== data.getIn(['sent'])) {
              throw Error('Read fewer Tweets than were sent');
            }
            return data;
        },
        teardown: identity
    }),

    Action('retweet', ['login'], {
        setup: identity,
        run: identity,
        assert: identity,
        teardown: identity
    })
]);

const handleFailure = why => {
    console.error(why.stack);
    console.log(
        'Ran:',
        why.data
            .get('ran')
            .map(pluck('name'))
            .toJS()
            .join(', ')
    );
    console.log('Data:', why.data.get('model').toJS());
}

var run = Runner(actions, Immutable.fromJS({
    open: false,
    user: [],
    sent: 0,
    read: 0
}));
run('read sent tweet').then(console.log.bind(console, 'Done:'), handleFailure);

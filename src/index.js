import Immutable from 'immutable';
import { Runner, Action } from './qi';
import { pluck, findByKey } from './immutable-kit';

let noop = (x => x);

let actions = Immutable.List([
    Action('open tweetdeck', [], {
        setup: data => data.set('open', true),
        run: noop,
        assert: noop,
        teardown: noop
    }),

    Action('login', ['open tweetdeck'], {
        setup: data => data.set('user', Immutable.fromJS({ screenName: 'tom' })),
        run: noop,
        assert: noop,
        teardown: noop
    }),

    Action('send tweet', ['login'], {
        setup: noop,
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
        teardown: noop
    }),

    Action('read sent tweet', ['send tweet'], {
        setup: noop,
        run: data => data.updateIn(['read'], function (a) { return (a || 0) + 1; }),
        assert: data => {
            if (data.getIn(['read']) !== data.getIn(['sent'])) {
              throw Error('Read fewer Tweets than were sent');
            }
            return data;
        },
        teardown: noop
    }),

    Action('retweet', ['login'], {
        setup: noop,
        run: noop,
        assert: noop,
        teardown: noop
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

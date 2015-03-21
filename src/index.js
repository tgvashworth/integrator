import Immutable from 'immutable';
import { Runner, Action } from './qi';
import { pluck, findByKey } from './immutable-kit';

function noop(x) { return x; }

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
            return data.update('tweetsSent', function (a) { return (a || 0) + 1; });
        },
        assert: data => {
            if (data.get('tweetsSent') !== 1) {
                throw Error('Tweets sent is not correct');
            }
            return data;
        },
        teardown: noop
    }),

    Action('read sent tweet', ['send tweet'], {
        setup: noop,
        run: data => data.update('tweetsRead', function (a) { return (a || 0) + 1; }),
        assert: data => {
            if (data.get('tweetsRead') !== data.get('tweetsSent')) {
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

Runner(actions, Immutable.Map())('read sent tweet')
    .then(console.log.bind(console, 'Done:'), handleFailure);

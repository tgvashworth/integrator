/* jshint esnext:true */
function noop(x) { return x; }
function pluck(k) { return o => o[k]; }

var actions = {};

function makeAction(name, deps, spec) {
    actions[name] = { name, deps, spec };
}

makeAction('open tweetdeck', [], {
    setup: data => data.set('open', true),
    run: noop,
    assert: noop,
    teardown: noop
});

makeAction('login', ['open tweetdeck'], {
    setup: data => data.set('user', Immutable.fromJS({ screenName: 'tom' })),
    run: noop,
    assert: noop,
    teardown: noop
});

makeAction('send tweet', ['login'], {
    setup: noop,
    run: data => {
        if (data.getIn(['user', 'token'])) {
            return data.update('tweetsSent', function (a) { return (a || 0) + 1; });
        }
        return data;
    },
    assert: data => {
        if (data.get('tweetsSent') !== 1) {
            throw Error('Tweets sent is not correct');
        }
        return data;
    },
    teardown: noop
});

makeAction('read sent tweet', ['send tweet'], {
    setup: noop,
    run: data => data.update('tweetsRead', function (a) { return (a || 0) + 1; }),
    assert: data => {
        if (data.get('tweetsRead') !== data.get('tweetsSent')) {
          throw Error('Read fewer Tweets than were sent');
        }
        return data;
    },
    teardown: noop
});

makeAction('retweet', ['login'], {
    setup: noop,
    run: noop,
    assert: noop,
    teardown: noop
});

function getAction(name) {
    return actions[name];
}

function walkUp(actionName) {
    var action = actions[actionName];
    return [].concat.apply([], action.deps.map(walkUp)).concat([action.name]);
}

function wrap(action, phase) {
  return function (data) {
    try {
        return action.spec[phase](data);
    } catch (why) {
        var e = Error(`${action.name} ${phase}: ${why.message}`);
        e.data = data;
        // FIXME: e.stack = why.stack;
        throw e;
    }
  };
}

function go(actionName) {
    console.log('Action:', actionName);

    var action = getAction(actionName);
    var initialData = Promise.resolve(Immutable.fromJS({
        action: action,
        ran: []
    }));

    walkUp(actionName)
        .map(getAction)
        .reduce((previous, action) => {
            var logged = previous.then(data => data.update('ran', ran => ran.concat(action)));

            return ['setup','run','assert','teardown'].reduce(
                (previous, phase) => previous.then(wrap(action, phase)),
                logged
            );
        }, initialData)
        .then(result => {
            console.log('Done!');
            console.log(result.toJS());
        }, why => {
            console.error(why.stack);
            console.log('Ran:', why.data.get('ran').toJS().map(pluck('name')).join(', '));
        });
}

function randomAction() {
    var names = Object.keys(actions);
    return names[~~(Math.random() * names.length)];
}

go('read sent tweet');

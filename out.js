"use strict";

function noop(x) {
    return x;
}
function pluck(k) {
    return function (o) {
        return o[k];
    };
}

var actions = {};

function makeAction(name, deps, spec) {
    actions[name] = { name: name, deps: deps, spec: spec };
}

makeAction("open tweetdeck", [], {
    setup: function (data) {
        return data.set("open", true);
    },
    run: noop,
    assert: noop,
    teardown: noop
});

makeAction("login", ["open tweetdeck"], {
    setup: function (data) {
        return data.set("user", Immutable.fromJS({ screenName: "tom" }));
    },
    run: noop,
    assert: noop,
    teardown: noop
});

makeAction("send tweet", ["login"], {
    setup: noop,
    run: function (data) {
        if (data.getIn(["user", "token"])) {
            return data.update("tweetsSent", function (a) {
                return (a || 0) + 1;
            });
        }
        return data;
    },
    assert: function (data) {
        if (data.get("tweetsSent") !== 1) {
            var e = Error("Tweets sent is not correct");
            e.data = data;
            throw e;
        }
        return data;
    },
    teardown: noop
});

makeAction("read sent tweet", ["send tweet"], {
    setup: noop,
    run: function (data) {
        return data.update("tweetsRead", function (a) {
            return (a || 0) + 1;
        });
    },
    assert: function (data) {
        if (data.get("tweetsRead") !== data.get("tweetsSent")) {
            var e = Error("Read fewer Tweets than were sent");
            e.data = data;
            throw e;
        }
        return data;
    },
    teardown: noop
});

makeAction("retweet", ["login"], {
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

function go(actionName) {
    console.log("Action:", actionName);
    var action = getAction(actionName);
    var initialData = Promise.resolve(Immutable.fromJS({
        action: action,
        ran: []
    }));
    walkUp(actionName).map(getAction).reduce(function (previous, action) {
        return previous
        // Remember what we ran
        .then(function (data) {
            return data.update("ran", function (ran) {
                return ran.concat(action);
            });
        }).then(action.spec.setup).then(action.spec.run).then(action.spec.assert).then(action.spec.teardown);
    }, initialData).then(function (result) {
        console.log("Done!");
        console.log(result.toJS());
    }, function (why) {
        console.error(why.stack);
        console.log("Ran:", why.data.get("ran").toJS().map(pluck("name")).join(", "));
    });
}

function randomAction() {
    var names = Object.keys(actions);
    return names[~ ~(Math.random() * names.length)];
}

go("read sent tweet");

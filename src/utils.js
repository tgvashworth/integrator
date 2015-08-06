import Immutable from 'immutable';

const utils = {
    identity: x => x,
    fallback: (f, v) => x => {
        let fv = f(x);
        return (utils.is('undefined', fv) ? v : fv);
    },
    always: x => () => x,
    is: (type, x) => (typeof x === type),
    not: f => (...args) => !f.call(this, ...args),
    compose: (f, g) => (...args) => f(g(...args)),

    allByKeyPromise: o => {
        var keys = Object.keys(o);
        return Promise.all(keys.map(k => o[k]))
            .then(all =>
                all.reduce((res, v, i) => {
                    res[keys[i]] = v;
                    return res;
                }, {})
            );
    },

    timeoutPromise: t => () => new Promise(resolve => setTimeout(resolve, t)),

    /*
     * Makes a function that pauses the session for some amount of time.
     *
     * Takes a session and a time in milliseconds.
     *
     * It does this by ticking every second, then interacting with the session to keep it from
     * timing out. It recurses, so you might get a stack overflow here if you set the pause time
     * high enough.
     *
     * Returns a (effect) function.
     */
    makePause: (session, t) => {
        if (typeof t !== 'number') {
            throw new Error('pause utility takes a session and a timeout in milliseconds');
        }
        const time = Math.min(1000, t);
        return utils.makeEffect(() =>
            Promise.resolve()
                .then(utils.timeoutPromise(time))
                .then(utils.makeCall(session, 'getPageTitle'))
                .then(() => {
                    if (t - time > 0) {
                        throw new Error(); // Use an error to cause recursion
                    }
                })
                .catch(utils.makePause(session, t - time)));
    },

    /**
     * Create side-makeEffect function that acts as identity of its argument, unless the argument is
     * mutable.
     *
     * Usage:
     *
     *      fn = makeEffect(() => mutateAllTheThings())
     *      fn(a) // -> Promise(a) (mutateAllTheThings will have been called)
     *
     * Returns a function that calls the passed `fn` and returns a Promise for its argument.
     */
    makeEffect: fn => (x, ...args) => Promise.resolve(fn(x, ...args)).then(() => x),

    randomBetween: (min, max) => ~~(min + Math.random() * max),

    randomFrom: iterable => iterable.get(utils.randomBetween(0, iterable.size)),

    /**
     * Combine the stacks from Error objects `e` and `f` to produce a stack with the message from
     * `e` but the trace from `f`. Useful if you want to rewrite an error message.
     *
     * Usage:
     *
     *      fakeStack(
     *          Error('Hello'),
     *          Error('World')
     *      ) -> "Error: Hello\n...stack from World..."
     *
     * Returns a string.
     */
    fakeStack: (e, f) =>
        e.stack
            // Just the first line
            .split('\n').slice(0, 1)
            .concat(
                // All but the first line
                f.stack.split('\n').slice(1)
            )
            .join('\n'),

    /**
     * Pull value from key of object.
     *
     * Usage:
     *
     *      pluck('name')(Immutable.fromJS({ name: 'Tom' }))
     *
     * Returns value at key.
     */
    pluck: (k, d) => o => o.get(k, d),

    /**
     * Find keyed value in Immutable.List by key.
     *
     * Usage:
     *
     *     findByKey('name')(users)('tom')
     *
     * Return a matching element, or undefined.
     */
    findByKey: k => xs => v => xs.find(x => x.get(k) === v),

    makeFindWithTimeout: (session, fn, newTimeout) => () => {
        var originalTimeout = 0;
        return session.getFindTimeout()
            .then(t => {
                originalTimeout = t;
            })
            .then(() => session.setFindTimeout(newTimeout))
            .then(fn)
            .then(utils.makeEffect(() => session.setFindTimeout(originalTimeout)));
    },

    makeRetryable: (n, fn) => () => {
        var ctx = this;
        var args = [].slice.call(arguments);
        return fn.apply(ctx, args)
            .catch(why => {
                if (n > 0) {
                    return utils.makeRetryable(n - 1, fn).apply(ctx, args);
                }
                throw why;
            });
    },

    makeCall: (o, method, ...args) => () =>
        o[method].apply(o, args),

    makeCallOnArg: (method, ...args) => (o) =>
        o[method].apply(o, args),

    makeCallPartial: (o, method, ...args) => (...innerArgs) =>
        o[method].apply(o, args.concat(innerArgs)),

    makeCallOnArgPartial: (method, ...args) => (o, ...innerArgs) =>
        o[method].apply(o, args.concat(innerArgs)),

    makeArity: (n, f) => (...args) => f.apply(this, args.slice(0, n)),

    /**
     * Find and return the common prefix of two Iterables as a List.
     *
     *     A = List(1, 2, 3);
     *     B = List(1, 2, 4);
     *     commonPrefix(A, B) === List(1, 2);
     *
     * Takes two Interables, returns a List.
     */
    commonPrefix: (A, B) =>
        A.toList().zip(B.toList())
            .takeWhile(([left, right]) => Immutable.is(left, right))
            .map(([left]) => left)
};

utils.defaultTo = utils.fallback.bind(null, utils.identity);
utils.noDefault = utils.identity;

/**
 * Find keyed value in Immutable iterable by key 'name'.
 *
 * Usage:
 *
 *     findByName(users)('tom')
 *
 * Return a matching element, or undefined.
 */
utils.findByName = utils.findByKey('name');

export default utils;

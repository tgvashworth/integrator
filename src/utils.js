import Immutable from 'immutable';
import { inspect } from 'util';
import runnerUtils from './runner-utils';

const utils = {
    inherit: x => x,
    fallback: (f, v) => x => {
        let fv = f(x);
        return (utils.is('undefined', fv) ? v : fv);
    },
    always: x => () => x,
    is: (type, x) => (typeof x === type),
    log: runnerUtils.info,
    not: f => (...args) => !f.call(this, ...args),

    handleSuccess: (/* args */) => () => {
        runnerUtils.success('\nPassed.');
    },
    handleFailure: args => why => {
        runnerUtils.warning('\nFailed.\n', why.stack);
        if (args.verbose && why.data) {
            utils.logRan(why.data, args);
        }
        throw new runnerUtils.TestsFailedError(why.message);
    },

    logRan: data => {
        runnerUtils.info('\nRan:');
        data.get('ran')
            .map(({action, phaseName, data, updatedData}) => {
                runnerUtils.info(`  ${action.get('name')} (${phaseName})`);
                runnerUtils.info('    | model    :', data.get('model'));
                runnerUtils.info('    |   before :', data.get('model'));
                runnerUtils.info('    |   after  :', updatedData.get('model'));
                runnerUtils.info('    | fixtures :', data.get('fixtures'));
            });
        // TODO: allow depth to be supplied in args
        runnerUtils.info('\nFinally:');
        runnerUtils.info('  Model:');
        runnerUtils.info(inspect(data.get('model').toJS(), { depth: 10, colors: true }));
        runnerUtils.info('  Fixtures:');
        runnerUtils.info(inspect(data.get('fixtures').toJS(), { depth: 10, colors: true }));
    },

    timeoutPromise: t => () => new Promise(resolve => setTimeout(resolve, t)),

    pause: (session, t) => {
        if (typeof t !== 'number') {
            throw new Error('pause utility takes a session and a timeout in milliseconds');
        }
        const time = Math.min(1000, t);
        return utils.effect(() =>
            Promise.resolve()
                .then(utils.timeoutPromise(time))
                .then(utils.call(session, 'getPageTitle'))
                .then(() => {
                    if (t - time > 0) {
                        throw new Error(); // Use an error to cause recursion
                    }
                })
                .catch(utils.pause(session, t - time)));
    },

    /**
     * Create side-effect function that acts as identity of its argument, unless the argument is
     * mutable.
     *
     * Usage:
     *
     *      fn = effect(() => mutateAllTheThings())
     *      fn(a) // -> Promise(a) (mutateAllTheThings will have been called)
     *
     * Returns a function that calls the passed `fn` and returns a Promise for its argument.
     */
    effect: fn => (x, ...args) => Promise.resolve(fn(x, ...args)).then(() => x),

    randomBetween: (min, max) => ~~(min + Math.random() * max),

    randomFrom: iterable => iterable.get(utils.randomBetween(0, iterable.size)),

    actionGraph: (args, suite) => {
        const nodeNodeNames = suite.get('actions').map(action => ({
            action,
            name: action.get('name'),
            nodeName: action.get('name').replace(/[\s-]/g, '_'),
            deps: action.get('deps').map(dep => dep.replace(/\s/g, '_'))
        }));

        console.log('digraph G {');

        nodeNodeNames
            .map(({name, nodeName}) => {
                console.log('  node [] ', nodeName, ' {');
                console.log('    label = "' + name + '"');
                console.log('  }');
            });

        console.log();

        nodeNodeNames
            .map(({nodeName, deps}) => {
                deps.map(dep => {
                    console.log('  ', dep, '->', nodeName, '[];');
                });
            });

        console.log('}');
    },

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

    quit: session => () => {
        try {
            return session.quit()
                .then(function () {
                    process.exit();
                });
        } catch (e) {}
    },

    makeFindWithTimeout: (session, fn, newTimeout) => () => {
        var originalTimeout = 0;
        return session.getFindTimeout()
            .then(utils.effect(t => {
                originalTimeout = t;
            }))
            .then(utils.effect(() => session.setFindTimeout(newTimeout)))
            .then(fn)
            .then(utils.effect(() => session.setFindTimeout(originalTimeout)));
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

    call: (o, method, ...args) => () =>
        o[method].apply(o, args.concat([].slice.call(arguments))),

    callOnArg: (method, ...args) => o =>
        o[method].apply(o, args.concat([].slice.call(arguments))),

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

utils.defaultTo = utils.fallback.bind(null, utils.inherit);
utils.noDefault = utils.inherit;

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

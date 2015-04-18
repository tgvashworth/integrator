import { Runner, go } from '../src/integrator';

const utils = {
    inherit: x => x,
    fallback: (f, v) => x => {
        let fv = f(x);
        return (utils.is('undefined', fv) ? v : fv);
    },
    always: x => () => x,
    is: (type, x) => (typeof x === type),
    log: console.log.bind(console),

    handleSuccess: () => {
        console.log('== PASSED ========================');
    },
    handleFailure: why => {
        console.log('== FAILED ========================');
        console.error(why.stack);
    },

    logRan: (data) => {
        data.get('ran')
            .map(({action, phaseName, data, updatedData}) => {
                console.log();
                console.log(`=== ${action.get('name')} (${phaseName}) ===`);
                console.log('before:', data.get('model'));
                console.log('after :', updatedData.get('model'));
                console.log('fixtures', data.get('fixtures'));
            });
        console.log();
        console.log('=== Finally');
        console.log('Model:', data.get('model').toJS());
        console.log('Env:', data.get('fixtures').toJS());
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
    effect: fn => x => Promise.resolve(fn(x)).then(() => x),

    randomBetween: (min, max) => ~~(min + Math.random() * max),

    randomFrom: iterable => iterable.get(utils.randomBetween(0, iterable.size)),

    randomWalk: (runners, previousRunner) => {
        let runner = utils.randomFrom(
            runners.filter(runner => {
                if (!runner.getIn(['target', 'deps']).size) {
                    return false;
                }
                if (!previousRunner) {
                    return true;
                }
                return runner.get('targetName') !== previousRunner.get('targetName');
            })
        );
        return go(runner, previousRunner)
            .then(utils.effect(() => utils.log()))
            .then(finishedRunner => utils.randomWalk(runners, finishedRunner));
    },

    makeRunners: suite => suite.get('actions').map(action => Runner(suite, action.get('name'))),

    actionGraph: suite => {
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
    pluck: k => o => o.get(k),

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
            session.quit();
        } catch (e) {}
    }
};

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

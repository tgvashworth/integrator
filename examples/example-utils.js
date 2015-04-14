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
                console.log('env', data.get('env'));
            });
        console.log();
        console.log('=== Finally');
        console.log('Model:', data.get('model').toJS());
        console.log('Env:', data.get('env').toJS());
    },

    /**
     * Create side-effect function that acts as identity of its argument, unless the argument is
     * mutable.
     *
     * Usage:
     *
     *      fn = effect(() => mutateAllTheThings())
     *      fn(a) // -> a (mutateAllTheThings will have been called)
     *
     * Returns a function that calls the passed `fn` and returns its argument.
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

    makeRunners: suite => suite.get('actions').map(action => Runner(suite, action.get('name')))
};

export default utils;

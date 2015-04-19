import { Action, Suite, Runner, go } from '../src/integrator';
import utils from '../src/utils';

const tests = [
    () => {
        throw new Error('There are no tests');
    }
];

const suite = args => {
    return tests.reduce(
        (pPrev, test) =>
            pPrev.then(utils.effect(test)),
        Promise.resolve(args)
    );
};

export default suite;

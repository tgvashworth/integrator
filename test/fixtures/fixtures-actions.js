import Immutable, { fromJS } from 'immutable';
import { Action } from '../../src/integrator';

var a = Action('A');
var b = Action('B', [a]);

const arbitraryComplexGraph = fromJS([
    a,
    b,
    Action('C', [a]),
    Action('D', [b]),
    Action('E', [b]),
    Action('F', ['E', 'C']),
    Action('G', ['F']),
    Action('H', ['E']),
    Action('I', ['D', 'H']),
    Action('J', ['H']),

    Action('K'),
    Action('L', ['K']),
    Action('M', ['K']),
    Action('N', ['L', 'M']),
    Action('O', ['J', 'G', 'N']),
]);

export { arbitraryComplexGraph };

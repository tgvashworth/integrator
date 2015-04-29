import Immutable from 'immutable';
const { fromJS } = Immutable;
import { Action } from '../../src/integrator';

const arbitraryComplexGraph = fromJS([
    Action('A'),
    Action('B', ['A']),
    Action('C', ['A']),
    Action('D', ['B']),
    Action('E', ['B']),
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

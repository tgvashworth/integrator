import Immutable from 'immutable';
const { fromJS, OrderedSet } = Immutable;
import utils from '../src/utils';
import assert from '../src/assert';

import { buildActionPath, commonPrefix } from '../src/integrator-actions';
import { arbitraryComplexGraph } from './fixtures/fixtures-actions';

/** ============================================================================= */

let commonPrefixData = [
    [ [1, 2, 3], [1, 2, 4], [1, 2] ],
    [ [2, 2, 3], [1, 2, 4], [] ],
    [ [], [], [] ],
    [ [ fromJS({ a: 10 }) ], [ fromJS({ a: 10 }) ], [ fromJS({ a: 10 }) ] ]
];
let commonPrefixTests = commonPrefixData
    .map(data => {
        let [ ia, ib, expected ] = data.map(x => fromJS(x));
        return {
            name: `${ia} & ${ib} => ${expected}`,
            test: () => {
                let result = commonPrefix(ia, ib);
                assert.ok(
                    Immutable.is(result, expected),
                    `Got ${result}`
                );
            }
        };
    });

/** ============================================================================= */

let buildActionPathData = [
    [ 'arbitraryComplexGraph', arbitraryComplexGraph,
        'A', OrderedSet([ 'A' ]) ],
    [ 'arbitraryComplexGraph', arbitraryComplexGraph,
        'B', OrderedSet([ 'A', 'B' ]) ],
    [ 'arbitraryComplexGraph', arbitraryComplexGraph,
        'C', OrderedSet([ 'A', 'C' ]) ],
    [ 'arbitraryComplexGraph', arbitraryComplexGraph,
        'D', OrderedSet([ 'A', 'B', 'D' ]) ],
    [ 'arbitraryComplexGraph', arbitraryComplexGraph,
        'E', OrderedSet([ 'A', 'B', 'E' ]) ],
    [ 'arbitraryComplexGraph', arbitraryComplexGraph,
        'F', OrderedSet([ 'A', 'B', 'E', 'C', 'F' ]) ],
    [ 'arbitraryComplexGraph', arbitraryComplexGraph,
        'G', OrderedSet([ 'A', 'B', 'E', 'C', 'F', 'G' ]) ],
    [ 'arbitraryComplexGraph', arbitraryComplexGraph,
        'H', OrderedSet([ 'A', 'B', 'E', 'H' ]) ],
    [ 'arbitraryComplexGraph', arbitraryComplexGraph,
        'I', OrderedSet([ 'A', 'B', 'D', 'E', 'H', 'I' ]) ],
    [ 'arbitraryComplexGraph', arbitraryComplexGraph,
        'J', OrderedSet([ 'A', 'B', 'E', 'H', 'J' ]) ],

    [ 'arbitraryComplexGraph', arbitraryComplexGraph,
        'K', OrderedSet([ 'K' ]) ],
    [ 'arbitraryComplexGraph', arbitraryComplexGraph,
        'L', OrderedSet([ 'K', 'L' ]) ],
    [ 'arbitraryComplexGraph', arbitraryComplexGraph,
        'M', OrderedSet([ 'K', 'M' ]) ],
    [ 'arbitraryComplexGraph', arbitraryComplexGraph,
        'N', OrderedSet([ 'K', 'L', 'M', 'N' ]) ],
    [ 'arbitraryComplexGraph', arbitraryComplexGraph,
        'O', OrderedSet([ 'A', 'B', 'E', 'H', 'J', 'C', 'F', 'G', 'K', 'L', 'M', 'N', 'O' ]) ],
];
let buildActionPathTests = buildActionPathData
    .map(data => {
        var [ name, actions, targetName, expected ] = data.map(x => fromJS(x));
        return {
            name: `${name} ${targetName} => ${expected}`,
            test: () => {
                let result = buildActionPath(actions, targetName);
                assert.ok(
                    Immutable.is(result, expected),
                    `Got ${result}`
                );
            }
        };
    });

/** ============================================================================= */

export default () => commonPrefixTests.concat(buildActionPathTests);

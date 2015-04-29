import Immutable from 'immutable';
const { fromJS, OrderedSet } = Immutable;
import utils from '../src/utils';
import assert from '../src/assert';

import { buildActionPath, commonPrefix } from '../src/integrator-actions';
import { arbitraryComplexTree } from './fixtures/fixtures-actions';

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

let buildActionPathData = [
    [ 'arbitraryComplexTree', arbitraryComplexTree, 'A', OrderedSet([ 'A' ])                          ],
    [ 'arbitraryComplexTree', arbitraryComplexTree, 'B', OrderedSet([ 'A', 'B' ])                     ],
    [ 'arbitraryComplexTree', arbitraryComplexTree, 'C', OrderedSet([ 'A', 'C' ])                     ],
    [ 'arbitraryComplexTree', arbitraryComplexTree, 'D', OrderedSet([ 'A', 'B', 'D' ])                ],
    [ 'arbitraryComplexTree', arbitraryComplexTree, 'E', OrderedSet([ 'A', 'B', 'E' ])                ],
    [ 'arbitraryComplexTree', arbitraryComplexTree, 'F', OrderedSet([ 'A', 'B', 'E', 'C', 'F' ])      ],
    [ 'arbitraryComplexTree', arbitraryComplexTree, 'G', OrderedSet([ 'A', 'B', 'E', 'C', 'F', 'G' ]) ],
    [ 'arbitraryComplexTree', arbitraryComplexTree, 'H', OrderedSet([ 'A', 'B', 'E', 'H' ])           ],
    [ 'arbitraryComplexTree', arbitraryComplexTree, 'I', OrderedSet([ 'A', 'B', 'D', 'E', 'H', 'I' ]) ],
    [ 'arbitraryComplexTree', arbitraryComplexTree, 'J', OrderedSet([ 'A', 'B', 'E', 'H', 'J' ])      ]
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

export default () => commonPrefixTests.concat(buildActionPathTests);

import Immutable from 'immutable';
const { fromJS, OrderedSet } = Immutable;
import utils from '../utils';
import assert from '../assert';

import { Suite, makeRunners } from '../integrator';
import { buildActionPath, commonPrefix, minimalActionPaths } from '../integrator-actions';
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
    [ arbitraryComplexGraph, 'A',
        OrderedSet([ 'A' ]) ],
    [ arbitraryComplexGraph, 'B',
        OrderedSet([ 'A', 'B' ]) ],
    [ arbitraryComplexGraph, 'C',
        OrderedSet([ 'A', 'C' ]) ],
    [ arbitraryComplexGraph, 'D',
        OrderedSet([ 'A', 'B', 'D' ]) ],
    [ arbitraryComplexGraph, 'E',
        OrderedSet([ 'A', 'B', 'E' ]) ],
    [ arbitraryComplexGraph, 'F',
        OrderedSet([ 'A', 'B', 'E', 'C', 'F' ]) ],
    [ arbitraryComplexGraph, 'G',
        OrderedSet([ 'A', 'B', 'E', 'C', 'F', 'G' ]) ],
    [ arbitraryComplexGraph, 'H',
        OrderedSet([ 'A', 'B', 'E', 'H' ]) ],
    [ arbitraryComplexGraph, 'I',
        OrderedSet([ 'A', 'B', 'D', 'E', 'H', 'I' ]) ],
    [ arbitraryComplexGraph, 'J',
        OrderedSet([ 'A', 'B', 'E', 'H', 'J' ]) ],

    [ arbitraryComplexGraph, 'K',
        OrderedSet([ 'K' ]) ],
    [ arbitraryComplexGraph, 'L',
        OrderedSet([ 'K', 'L' ]) ],
    [ arbitraryComplexGraph, 'M',
        OrderedSet([ 'K', 'M' ]) ],
    [ arbitraryComplexGraph, 'N',
        OrderedSet([ 'K', 'L', 'M', 'N' ]) ],
    [ arbitraryComplexGraph, 'O',
        OrderedSet([ 'A', 'B', 'E', 'H', 'J', 'C', 'F', 'G', 'K', 'L', 'M', 'N', 'O' ]) ],
];
let buildActionPathTests = buildActionPathData
    .map(data => {
        var [ actions, targetName, expected ] = data.map(x => fromJS(x));
        return {
            name: `${targetName} => ${expected}`,
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

let minimalActionPathsSuite = Suite(arbitraryComplexGraph, fromJS({}));
let minimalActionPathsRunners = makeRunners({
    suite: minimalActionPathsSuite,
    targetConfiguration: fromJS({})
});
let minimalActionPathsData = [
    [ minimalActionPathsRunners, 'A', /* from */ '',
        [ [], ['A'] ] ],
    [ minimalActionPathsRunners, 'B', /* from */ 'A',
        [ [], ['B'] ] ],
    [ minimalActionPathsRunners, 'D', /* from */ 'A',
        [ [], ['B', 'D'] ] ],
    [ minimalActionPathsRunners, 'E', /* from */ 'D',
        [ ['D'], ['E'] ] ],
    [ minimalActionPathsRunners, 'C', /* from */ 'D',
        [ ['D', 'B'], ['C'] ] ],
    [ minimalActionPathsRunners, 'C', /* from */ 'D',
        [ ['D', 'B'], ['C'] ] ],
    [ minimalActionPathsRunners, 'K', /* from */ 'O',
        [ ['O', 'N', 'M', 'L', 'K', 'G', 'F', 'C', 'J', 'H', 'E', 'B', 'A'], ['K'] ] ],
];
let minimalActionPathsTests = minimalActionPathsData
    .map(data => {
        var [ runners, targetName, previousTargetName, [ expectedReverse, expectedForward ] ] = data.map(x => fromJS(x));
        return {
            name: `${targetName} from ${previousTargetName || '{}'} => [ ${expectedReverse}, ${expectedForward} ]`,
            test: () => {
                let runner = utils.findByKey('targetName')(runners)(targetName);
                let previousRunner = utils.findByKey('targetName')(runners)(previousTargetName);
                let [ resultReverse, resultForward ] = minimalActionPaths(runner, previousRunner);
                let resultReverseNames = resultReverse.map(utils.pluck('name')).toList();
                let resultForwardNames = resultForward.map(utils.pluck('name')).toList();
                assert.ok(
                    Immutable.is(resultReverseNames, expectedReverse),
                    `Reverse got ${resultReverseNames}`
                );
                assert.ok(
                    Immutable.is(resultForwardNames, expectedForward),
                    `Forward got ${resultForwardNames}`
                );
            }
        };
    });


export default () => fromJS([]).concat(
    commonPrefixTests,
    buildActionPathTests,
    minimalActionPathsTests
);

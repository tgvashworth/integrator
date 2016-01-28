import test from 'ava';
import Immutable, { fromJS, OrderedSet } from 'immutable';

import utils from '../src/utils';
import { Suite, makeRunners } from '../src/integrator';
import { buildActionPath, minimalActionPaths } from '../src/integrator-actions';
import { arbitraryComplexGraph } from './fixtures/fixtures-actions';

/** ============================================================================= */

let commonPrefixData = [
    [ [1, 2, 3], [1, 2, 4], [1, 2] ],
    [ [2, 2, 3], [1, 2, 4], [] ],
    [ [], [], [] ],
    [ [ fromJS({ a: 10 }) ], [ fromJS({ a: 10 }) ], [ fromJS({ a: 10 }) ] ]
];
let commonPrefixTests = commonPrefixData
    .forEach(data => {
        let [ ia, ib, expected ] = data.map(x => fromJS(x));
        test(`${ia} & ${ib} => ${expected}`, (t) => {
            let result = utils.commonPrefix(ia, ib);
            t.ok(
                Immutable.is(result, expected),
                `Got ${result}`
            );
        });
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
    .forEach(data => {
        var [ actions, actionName, expected ] = data.map(x => fromJS(x));
        test(`${actionName} => ${expected}`, (t) => {
            let result = buildActionPath(actions, actionName);
            t.ok(
                Immutable.is(result, expected),
                `Got ${result}`
            );
        });
    });

/** ============================================================================= */

let minimalActionPathsSuite = Suite(arbitraryComplexGraph, fromJS({}));
let minimalActionPathsRunners = makeRunners({
    suite: minimalActionPathsSuite,
    target: fromJS({})
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
    .forEach(data => {
        var [ runners, actionName, previousActionName, [ expectedReverse, expectedForward ] ] = data.map(x => fromJS(x));
        test(`${actionName} from ${previousActionName || '{}'} => [ ${expectedReverse}, ${expectedForward} ]`, (t) => {
            let runner = utils.findByKey('actionName')(runners)(actionName);
            let previousRunner = utils.findByKey('actionName')(runners)(previousActionName);
            let [ resultReverse, resultForward ] = minimalActionPaths(runner, previousRunner);
            let resultReverseNames = resultReverse.map(utils.pluck('name')).toList();
            let resultForwardNames = resultForward.map(utils.pluck('name')).toList();
            t.ok(
                Immutable.is(resultReverseNames, expectedReverse),
                `Reverse got ${resultReverseNames}`
            );
            t.ok(
                Immutable.is(resultForwardNames, expectedForward),
                `Forward got ${resultForwardNames}`
            );
        })
    });

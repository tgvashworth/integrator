import Immutable from 'immutable';
const { fromJS } = Immutable;
import utils from '../src/utils';
import assert from '../src/assert';

import { commonPrefix } from '../src/integrator-actions';

let commonPrefixData = [
    [ [1, 2, 3], [1, 2, 4], [1, 2] ],
    [ [2, 2, 3], [1, 2, 4], [] ]
];
let commonPrefixTests = commonPrefixData
    .map(data => {
        let [ ia, ib, ires ] = data.map(x => fromJS(x));
        return {
            name: `${ia} & ${ib} => ${ires}`,
            test: () => {
                assert.ok(
                    Immutable.is(commonPrefix(ia, ib), ires),
                    `${ia} & ${ib} != ${ires}`
                );
            }
        };
    });

export default () => commonPrefixTests;

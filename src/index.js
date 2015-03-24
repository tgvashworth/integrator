/**
 * TODO
 *
 * - [x] Add teardown phase
 * - [ ] Run back through minimal actions to move to a different phase
 */

import Immutable from 'immutable';
import { Runner, Action } from './qi';
import { pluck, findByKey } from './immutable-kit';

let identity = (x => x);

/*

      A
     / \
    B   C
   / \   \
  D   E — G
 /       / \
F ————— H   I

 */

let actions = Immutable.List([
    Action('A', [], {}),
    Action('B', ['A'], {}),
    Action('C', ['A'], {}),
    Action('D', ['B'], {}),
    Action('E', ['B'], {}),
    Action('F', ['D'], {}),
    Action('G', ['E', 'C'], {}),
    Action('H', ['F', 'G'], {}),
    Action('I', ['G'], {})
]);

const handleFailure = why => {
    console.error(why.stack);
    console.log(
        'Ran:',
        why.data
            .get('ran')
            .map(pluck('name'))
            .toJS()
            .join(', ')
    );
    console.log('Data:', why.data.get('model').toJS());
}

const handleSuccess = data => {
    console.log('Data:', data.toJS());
}

var run = Runner(actions, Immutable.fromJS({
    open: false,
    user: [],
    sent: 0,
    read: 0
}));

run('H').then(handleSuccess, handleFailure);

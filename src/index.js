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

const logRan = (data) =>
    console.log(
        'Ran:\n',
        data.get('ran')
            .map(([action, phaseName]) => `${action.get('name')} (${phaseName})`)
            .toJS()
            .join('\n ')
    );

const handleFailure = why => {
    console.error(why.stack);
    logRan(why.data);
    console.log('Data:', why.data.get('model').toJS());
}

const handleSuccess = data => {
    console.log('Data:', data.toJS());
    logRan(data);
}

var run = Runner(actions, Immutable.fromJS({
    open: false,
    user: [],
    sent: 0,
    read: 0
}));

run('H').then(handleSuccess, handleFailure);

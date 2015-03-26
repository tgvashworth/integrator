/* eslint-disable */

/**
 * Data dependency sketch
 *
 * Questions:
 *     - How does an action specify the data it cares about?
 *     - How does an action specify when it needs specific data?
 *     - How are conflicts resolved?
 *     - Can the data at each stage be saved an rolled back?
 *     - Does the data live on the model or separate?
 *         - Model pros: one argument to phase fns, logically cohesive
 *         - Model cons: people will do crazy shit with the model
 *         - Separate pros: can't be mutated in the phase fn, acts like 'context'
 *         - Separate cons: people will inevitably want to combine model/data stuff
 *     - Too many things called 'data'?
 *     - why not Action('X', { deps: [], data: {}, setup: {}, ... })
 */

const users = Immutable.fromJS({
    wally: { screenName: 'wally', password: '12345' },
    tom: { screenName: 'tom', password: '12345' }
});

const compose = Immutable.fromJS({
    'empty DM': { mode: 'DM', text: '' }
});

let inherit = identity
let fallback = (f, v) => x => f(x) || v;

// Action specifies the data it's interested in with keys on a `data` Map
// It supplies a (non-async?) function that returns the data for that key
// This allows for:
//      - don't care
//      - don't care, but default to this (fallback)
//      - use this

Action('login', [], {
    data: {
        user: fallback(inherit, users.get('tom'))
    }
})

Action('send DM to mutually followed user', ['login'], {
    data: {
        user: always(users.get('wally'))
    }
})

// Ideas for Action definition:

Action('login', {
    data: {
        user: fallback(inherit, users.get('tom'))
    }
})

Action('send DM to mutually followed user', {
    needs: ['login', 'open compose', 'DM mode'],

    context: {
        compose: always(compose.get('empty DM'))
        user: always(users.get('wally'))
    }
})


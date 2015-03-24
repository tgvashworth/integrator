/**
 * Pull value from key of object.
 *
 * Usage:
 *
 *      pluck('name')(Immutable.fromJS({ name: 'Tom' }))
 *
 * Returns value at key.
 */
export const pluck = k => o => o.get(k);

/**
 * Find keyed value in Immutable.List by key.
 *
 * Usage:
 *
 *     findByKey('name')(users)('tom')
 *
 * Return a matching element, or undefined.
 */
export const findByKey = k => xs => v => xs.find(x => x.get(k) === v);

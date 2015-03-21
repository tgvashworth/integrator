export const pluck = k => o => o.get(k);
export const findByKey = k => xs => v => xs.find(x => x.get(k) === v);

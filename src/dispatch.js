import { run } from 'action-graph';

const filterForArgs = (args, name) => {
    if (args.only && args.only !== name) {
        return false;
    }
    return true;
};

const getActionsForArgs = (args, suite) =>
    Object.keys(suite)
        .filter(name => filterForArgs(args, name))
        .map(name => suite[name]);

export default function dispatch(params = {}) {
    const {
        suite = {},
        args = {},
        session
    } = params;

    return Promise.resolve().then(() => {
        return getActionsForArgs(args, suite).reduce(
            (pPrev, action) => {
                return pPrev.then(() => {
                    return run(action, {
                        session: session
                    });
                });
            },
            Promise.resolve()
        );
    });
};

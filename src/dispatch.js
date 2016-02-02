import { run } from 'action-graph';

export default function dispatch(args = {}) {
    const {
        suite = {},
        session
    } = args;

    return Promise.resolve()
        .then(() => {
            return Object.keys(suite)
                .reduce((pPrev, name) => {
                    const action = suite[name];
                    return run(action, {
                        session: session
                    });
                }, Promise.resolve());
        });
};

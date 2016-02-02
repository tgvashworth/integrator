import { run } from 'action-graph';

const filter = (args, name, action) => {
    if (args.only && args.only !== name) {
        return false;
    }
    return true;
};

export default function dispatch(params = {}) {
    const {
        suite = {},
        args = {},
        session
    } = params;

    return Promise.resolve()
        .then(() => {
            return Object.keys(suite)
                .reduce((pPrev, name) => {
                    const action = suite[name];
                    if (!filter(args, name, action)) {
                        return pPrev;
                    }
                    return pPrev.then(() => {
                        return run(action, {
                            session: session
                        });
                    });
                }, Promise.resolve());
        });
};

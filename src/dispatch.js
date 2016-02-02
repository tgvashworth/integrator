import { run } from 'action-graph';

export default function dispatch(params = {}) {
    const {
        suite = {},
        args = {},
        session
    } = params;

    const filter = (name, action) => {
        if (args.only && args.only !== name) {
            return false;
        }
        return true;
    };

    return Promise.resolve()
        .then(() => {
            return Object.keys(suite)
                .reduce((pPrev, name) => {
                    const action = suite[name];
                    if (!filter(name, action)) {
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

const assert = {
    // Throw with `msg` if `v` isn't truthy
    ok: (v, msg) => {
        if (!v) {
            throw new Error(msg);
        }
    }
};

export default assert;

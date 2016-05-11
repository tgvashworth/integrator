import test from "ava";
import getEnvironmentTargets, {
  IntegratorConfig,
  EnvironmentTarget
} from "./getEnvironmentTargets";

test("getEnvironmentTargets is importable", t => {
  t.truthy(getEnvironmentTargets);
});

test("getEnvironmentTargets gets targets for simple config", t => {
  const config: IntegratorConfig = {
    environments: {
      cloud: {
        targets: [ { browser: "chrome" } ]
      }
    }
  };
  t.deepEqual(
    getEnvironmentTargets(config, "cloud"),
    <EnvironmentTarget[]>[
      { browser: "chrome" }
    ]
  );
});

test("getEnvironmentTargets merges common config", t => {
  const config: IntegratorConfig = {
    environments: {
      cloud: {
        common: { version: "latest" },
        targets: [ { browser: "chrome" } ]
      }
    }
  };
  t.deepEqual(
    getEnvironmentTargets(config, "cloud"),
    <EnvironmentTarget[]>[
      { browser: "chrome", version: "latest" }
    ]
  );
});

test("getEnvironmentTargets deep merges common config", t => {
  const config: IntegratorConfig = {
    environments: {
      cloud: {
        common: { capabilities: { version: "latest" } },
        targets: [ { capabilities: { browser: "chrome" } } ]
      }
    }
  };
  t.deepEqual(
    getEnvironmentTargets(config, "cloud"),
    <EnvironmentTarget[]>[
      { capabilities: { browser: "chrome", version: "latest" } }
    ]
  );
});

test("getEnvironmentTargets merges common config for multiple targets", t => {
  const config: IntegratorConfig = {
    environments: {
      cloud: {
        common: { version: "latest" },
        targets: [ { browser: "chrome" }, { browser: "firefox" } ]
      }
    }
  };
  t.deepEqual(
    getEnvironmentTargets(config, "cloud"),
    <EnvironmentTarget[]>[
      { browser: "chrome", version: "latest" },
      { browser: "firefox", version: "latest" }
    ]
  );
});

test("getEnvironmentTargets handles missing environment", t => {
  const config: IntegratorConfig = {
    environments: {
      cloud: {
        targets: []
      }
    }
  };
  t.deepEqual(
    getEnvironmentTargets(config, "missing"),
    <EnvironmentTarget[]>[]
  );
});

test("getEnvironmentTargets handles bad targets", t => {
  const config: IntegratorConfig = {
    environments: {
      cloud: {
        targets: <EnvironmentTarget[]>{}
      }
    }
  };
  t.deepEqual(
    getEnvironmentTargets(config, "cloud"),
    <EnvironmentTarget[]>[]
  );
});

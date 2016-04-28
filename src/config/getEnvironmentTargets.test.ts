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

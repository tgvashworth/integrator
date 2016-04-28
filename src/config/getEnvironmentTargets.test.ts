import test from "ava";
import getEnvironmentTargets, {
  IntegratorConfig,
  EnvironmentTarget
} from "./getEnvironmentTargets";

test("getEnvironmentTargets is importable", t => {
  t.ok(getEnvironmentTargets);
});

test("getEnvironmentTargets gets targets for simple config", t => {
  const config: IntegratorConfig = {
    environments: {
      cloud: {
        targets: [ { browser: "chrome" } ]
      }
    }
  };
  t.same(
    getEnvironmentTargets(config, "cloud"),
    <EnvironmentTarget[]>[
      { browser: "chrome" }
    ]
  );
});

import test from "ava";
import { Args, EnvironmentConfig } from "./config";
import selectEnvironments from "./selectEnvironments";

test("selectEnvironments is importable", t => {
  t.truthy(selectEnvironments);
});

test("selectEnvironments will do nothing with no args", t => {
  const config: EnvironmentConfig = {
    cloud: {},
    local: {}
  };
  t.deepEqual(
    selectEnvironments({}, config),
    config
  );
});

test("selectEnvironments will select relevant environments", t => {
  const config: EnvironmentConfig = {
    cloud: {},
    local: {}
  };
  t.deepEqual<EnvironmentConfig>(
    selectEnvironments({ environment: "cloud" }, config),
    { cloud: {} }
  );
});

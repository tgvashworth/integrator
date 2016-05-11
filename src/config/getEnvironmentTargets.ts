import { merge } from "lodash";
import { Config, EnvironmentTarget } from "./config";

export default function getEnvironmentTargets(
  config: Config,
  environment: string
): EnvironmentTarget[] {
  const env = config.environments[environment];
  // Defend against undefined environment
  if (!env) {
    return [];
  }
  // Defend against no "common" config
  const common = (
    typeof env.common === "object" && env.common
      ? env.common
      : {}
  );
  // Defend against non-Array targets
  const targets = (
    Array.isArray(env.targets)
      ? env.targets
      : []
  );
  return <EnvironmentTarget[]>targets
    .map(target => merge({}, target, common));
}

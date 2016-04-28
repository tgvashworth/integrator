export type EnvironmentTarget = {
  [key: string]: string
}
// This is here until there's a better place for it!
export type IntegratorConfig = {
  environments: {
    [key: string]: {
      common?: EnvironmentTarget
      targets: EnvironmentTarget[]
    }
  }
}

export default function getEnvironmentTargets(
  config: IntegratorConfig,
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
    .map(target => Object.assign({}, target, common));
}

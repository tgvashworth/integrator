// This is here until there's a better place for it!
export type IntegratorConfig = {
  environments: {
    [key: string]: {
      targets: { [key: string]: string }[]
    }
  }
}
export type EnvironmentTarget = {
  [key: string]: string
}
export default function getEnvironmentTargets(
  config: IntegratorConfig,
  environment: string
): EnvironmentTarget[] {
  return <EnvironmentTarget[]>config.environments[environment].targets;
}

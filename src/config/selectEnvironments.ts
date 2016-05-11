import { Args, Config, EnvironmentConfig } from "./config";

export default function selectEnvinronments(
  args: Args,
  environments: EnvironmentConfig
): EnvironmentConfig {
  if (args.environment) {
    return Object.keys(environments)
      .filter(name => name === args.environment)
      .reduce<EnvironmentConfig>((o, name) => {
        o[name] = environments[name];
        return o;
      }, {});
  }
  return environments;
}

import { Args, Config, EnvironmentTarget } from "./config";
import { Test } from "../createTest";

export default function selectTests(
  args: Args,
  tests: Test[]
): Test[] {
  if (args.test) {
    return tests.filter(test => test.name === args.test);
  }
  return tests;
}

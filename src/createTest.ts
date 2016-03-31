import * as _ from "lodash";
import { Goal } from "./createGoal";

export class Test {
  public name: string;
  public goals: Goal<any>[];
  constructor(name: string, goals: Goal<any>[]) {
    this.name = name;
    this.goals = goals;
  }
}

/**
 * createTest is a factory for Tests.
 */
export default function createTest(
  name: string,
  goals: Goal<any>[]
): Test {
  return new Test(name, goals);
}

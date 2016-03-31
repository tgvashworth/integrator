import * as _ from "lodash";
import { Test } from "./createTest";
import { Goal, GoalClass } from "./createGoal";

/**
 * createTest ensures that all Goals within the Test can run correctly.
 */
export default function checkTest(test: Test): void {
  const goals = test.goals;
  const goalConstructors =
    <GoalClass<any>[]>test.goals.map(g => g.constructor);
  test.goals
    .forEach(goal => {
      goal.getDependencies()
        .forEach((dep: GoalClass<any>) => {
          if (!_.includes<GoalClass<any>>(goalConstructors, dep)) {
            throw new Error([
              `Test "${test.name}" does not satisfy the dependencies of Goal "${goal.getDescription()}".`,
              `An instance of required Goal "${dep.displayName}" is missing.`
            ].join(" "));
          }
        });
    });
}

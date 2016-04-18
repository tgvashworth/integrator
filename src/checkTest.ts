import * as _ from "lodash";
import { Test } from "./createTest";
import { Goal, GoalClass } from "./createGoal";

function getGoalsLeftOfGoal(
  goals: Goal<any>[],
  targetGoal: Goal<any>
): Goal<any>[] {
  return goals.slice(0, goals.indexOf(targetGoal));
}

function getGoalConstructors(goals: Goal<any>[]): GoalClass<any>[] {
  return <GoalClass<any>[]>goals.map(g => g.constructor);
}

/**
 * createTest ensures that all Goals within the Test can run correctly.
 */
export default function checkTest(test: Test): void {
  const goals = test.goals;

  // The GoalDepPairs represent each Goal and one of its dependencies, which
  // will be a Goal constructor.
  type GoalDepPair = [Goal<any>, GoalClass<any>];
  const goalDepPairs = <GoalDepPair[]>_.flatMap(
    test.goals,
    goal => goal.getDependencies().map(dep => [goal, dep])
  );

  // To check the Test, we have to make sure that every one of every Goal's
  // dependencies has an implemention to *before* it in the goalConstructors.
  goalDepPairs.forEach(([goal, dep]: GoalDepPair) => {
    const goalsToLeft = getGoalsLeftOfGoal(goals, goal);
    const goalConstructors = getGoalConstructors(goalsToLeft);
    if (!_.includes(goalConstructors, dep)) {
      throw new Error([
        `Test "${test.name}" does not satisfy the dependencies of Goal "${goal.getDescription()}".`,
        `An instance of required Goal "${dep.displayName}" is missing.`
      ].join(" "));
    }
  });
}

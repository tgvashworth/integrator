import { flatMap, reverse } from "lodash";
import { Test } from "../createTest";
import { Goal } from "../createGoal";
import explodeGoal, { ExplodedGoal, GoalPair } from "./explodeGoal";

export type TestPair = [ Test, GoalPair ];
export type ExplodedTest = TestPair[];

function getGoalPhase(
  phase: "setup" | "teardown",
  goals: ExplodedGoal[]
): GoalPair[] {
  return flatMap(goals, (goal: ExplodedGoal): TestPair[] => goal[phase]);
}

/**
 * explodeTest explodes each Goal in the Test into a data structure that can
 * be run.
 */
export default function explodeTest(
  test: Test
): ExplodedTest {
  const explodedGoals = <ExplodedGoal[]>test.goals.map(explodeGoal);
  return []
    .concat(getGoalPhase("setup", explodedGoals))
    .concat(getGoalPhase("teardown", reverse(explodedGoals)))
    .map((pair: GoalPair): TestPair => [ test, pair ]);
}

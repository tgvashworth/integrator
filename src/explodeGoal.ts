import { flatMap } from "lodash";
import { Goal } from "./createGoal";
import explodeAction, { ActionPair } from "./explodeAction";

export type GoalPair = [ Goal<any>, ActionPair ];
export type ExplodedGoal = { setup: GoalPair[], teardown: GoalPair[] };

/**
 * explodeGoal converts a goal into a { setup, teardown } object with every
 * Action that should be run for each of those phases.
 */
export default function explodeGoal(
  goal: Goal<any>
): ExplodedGoal {
  const setup: ActionPair[] = flatMap(goal.setup(), explodeAction);
  const teardown: ActionPair[] = flatMap(goal.teardown(), explodeAction);
  return {
    setup: setup.map((pair: ActionPair): GoalPair => [ goal, pair ]),
    teardown: teardown.map((pair: ActionPair): GoalPair => [ goal, pair ])
  };
}

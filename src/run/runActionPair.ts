import { flatMap } from "lodash";
import { Action, ActionRun } from "../createAction";
import { ActionPair } from "../explodeAction";

/**
 * runActionPair runs a single action from an ActionPair [ action, action.run ]
 */
export default function runActionPair(
  pair: ActionPair,
  state: any
): Promise<any> {
  const [ action, run ] = pair;
  return run.call(action, state)
    .then(resultState => (
      typeof resultState === "undefined"
        ? state
        : resultState
    ));
}

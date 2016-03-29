import { flatMap } from "lodash";
import { Action, ActionRun } from "./createAction";
import { ActionPair } from "./explodeAction";
import runActionPair from "./runActionPair";

/**
 * runActionPairs runs a list of ActionPairs [ action, action.run ]
 */
export default function runActionPairs(
  pairs: ActionPair[],
  initialState: any
): Promise<any> {
  return pairs.reduce(
    (pPrev, pair) => {
      return pPrev.then(state => runActionPair(pair, state));
    },
    Promise.resolve(initialState)
  );
}

import { flatMap } from "lodash";
import { Action, ActionRun } from "./createAction";

export type ActionPair = [ Action<any>, ActionRun ];

/**
 * explodeAction is an in-order depth-first tree traversal, producing an ordered
 * list of ActionPairs.
 */
export default function explodeAction(action: Action<any>): ActionPair[] {
  return []
    .concat(flatMap(action.before(), explodeAction))
    .concat([ [action, action.run] ])
    .concat(flatMap(action.after(), explodeAction));
}

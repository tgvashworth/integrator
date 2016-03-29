import { flatMap } from "lodash";
import { Action, ActionRun } from "./createAction";

export type ActionPair = [ Action<any>, ActionRun ];

export default function explodeAction(action: Action<any>): ActionPair[] {
  return []
    .concat(flatMap(action.before(), explodeAction))
    .concat([ [action, action.run] ])
    .concat(flatMap(action.after(), explodeAction));
}

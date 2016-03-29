import { Action, ActionRun } from "./createAction";

export type ActionPair = [ Action<any>, ActionRun ];

export default function explodeAction(action: Action<any>): ActionPair[] {
  return [
    [action, action.run]
  ];
}

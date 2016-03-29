import test from "ava";
import createAction, { Action } from "./createAction";
import explodeAction, { ActionPair } from "./explodeAction";

test("explodeAction is importable", t => {
  t.ok(explodeAction);
});

test("explodeAction should return a list of pairs [action, action.run]", t => {
  const A = createAction();
  const a = new A;
  t.same(
    explodeAction(a),
    <ActionPair[]>[ [a, a.run] ]
  );
});

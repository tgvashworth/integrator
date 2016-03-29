import test from "ava";
import createAction, { Action } from "./createAction";
import explodeAction from "./explodeAction";

test("explodeAction is importable", t => {
  t.ok(explodeAction);
});

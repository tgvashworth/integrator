import test from "ava";
import createAction from "./createAction";

test("createAction is importable", t => {
  t.ok(createAction);
});

test("createAction handles no spec", t => {
  t.ok(createAction());
});

test("createAction has default static displayName", t => {
  t.same(createAction().displayName, "unnamed action");
});

test("createAction has default instance displayName", t => {
  const Action = createAction();
  const i = new Action;
  t.same(i.displayName, "unnamed action");
});

test("createAction copies displayName to static property", t => {
  t.same(
    createAction({ displayName: "The Example" }).displayName,
    "The Example"
  );
});

test("createAction copies displayName to instance property", t => {
  const Action = createAction({ displayName: "The Example" });
  const i = new Action;
  t.same(
    i.displayName,
    "The Example"
  );
});

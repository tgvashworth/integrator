import test from "ava";
import Action from "./Action";

test("Action is importable", t => {
  t.ok(Action);
});

test("Action instances have empty props by default", t => {
  const action = new Action();
  t.same(
    action.getDependencies(),
    {}
  );
});

import test from "ava";
import createAction from "./createAction";

test("createAction is importable", t => {
  t.ok(createAction);
});

test("createAction handles no spec", t => {
  t.ok(createAction());
});

// displayName

test("createAction has default static displayName", t => {
  t.same(createAction().displayName, "unnamed action");
});

test("createAction has default instance displayName", t => {
  const Action = createAction<{}>();
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

// getDefaultProps

test("createAction has default getDefaultProps", t => {
  const Action = createAction();
  const action = new Action();
  t.same(
    action.getDefaultProps(),
    {}
  );
});

test("createAction can overwrite getDefaultProps", t => {
  interface Props { a: number; }
  const Action = createAction<Props>({
    getDefaultProps: () => ({ a: 1 })
  });
  const action = new Action();
  t.same(
    action.getDefaultProps(),
    <Props>{ a: 1 }
  );
});


test("Action instantiation merges input with default props", t => {
  interface Props { a: number; b?: any; }
  const Action = createAction<Props>({
    getDefaultProps: () => ({ a: 1 })
  });
  const action = new Action({ b: 2 });
  t.same(
    action.props,
    <Props>{ a: 1, b: 2 }
  );
});

// getDescription

test("createAction has default getDescription", t => {
  const Action = createAction();
  const action = new Action();
  t.same(
    action.getDescription(),
    action.displayName
  );
});

test("createAction can overwrite getDescription", t => {
  interface Props { a: number; }
  const Action = createAction<Props>({
    getDescription: () => "example!"
  });
  const action = new Action();
  t.same(
    action.getDescription(),
    "example!"
  );
});


test("Actions can use props in getDescription", t => {
  interface Props { a: number; }
  const Action = createAction<Props>({
    getDefaultProps: () => ({ a: 10 }),
    getDescription() {
      return `a is ${this.props.a}`;
    }
  });
  const action = new Action;
  t.same(
    action.getDescription(),
    "a is 10"
  );
});

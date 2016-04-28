import test from "ava";
import createAction, { Action } from "./createAction";

test("createAction is importable", t => {
  t.truthy(createAction);
});

test("createAction handles no spec", t => {
  t.truthy(createAction());
});

// displayName

test("createAction has default static displayName", t => {
  t.deepEqual(createAction().displayName, "unnamed action");
});

test("createAction has default instance displayName", t => {
  const Action = createAction<{}>();
  const i = new Action;
  t.deepEqual(i.displayName, "unnamed action");
});

test("createAction copies displayName to static property", t => {
  t.deepEqual(
    createAction({ displayName: "The Example" }).displayName,
    "The Example"
  );
});

test("createAction copies displayName to instance property", t => {
  const Action = createAction({ displayName: "The Example" });
  const i = new Action;
  t.deepEqual(
    i.displayName,
    "The Example"
  );
});

// getDefaultProps

test("createAction has default getDefaultProps", t => {
  const Action = createAction();
  const action = new Action();
  t.deepEqual(
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
  t.deepEqual(
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
  t.deepEqual(
    action.props,
    <Props>{ a: 1, b: 2 }
  );
});

// getDescription

test("createAction has default getDescription", t => {
  const Action = createAction();
  const action = new Action();
  t.deepEqual(
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
  t.deepEqual(
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
  t.deepEqual(
    action.getDescription(),
    "a is 10"
  );
});

// run

test("createAction has default run which passes arg", t => {
  const Action = createAction();
  const action = new Action();
  return action.run(1)
    .then(v => {
      t.deepEqual(v, 1);
    });
});

test("createAction can overwrite run but is still passed arg", t => {
  t.plan(2);
  const Action = createAction({
    run: v => {
      t.deepEqual(v, 1);
      return 2;
    }
  });
  const action = new Action();
  return action.run(1)
    .then(v => {
      t.deepEqual(v, 2);
    });
});

// before

test("createAction has default before with no actions", t => {
  const Action = createAction();
  const action = new Action();
  t.deepEqual(
    action.before(),
    []
  );
});

test("createAction can overwrite before", t => {
  const SubAction = createAction();
  const subAction = new SubAction;
  const Action = createAction({
    before() {
      return [
        subAction
      ];
    }
  });
  const action = new Action();
  t.deepEqual(
    action.before(),
    [ subAction ]
  );
});

// after

test("createAction has default after with no actions", t => {
  const Action = createAction();
  const action = new Action();
  t.deepEqual(
    action.after(),
    []
  );
});

test("createAction can overwrite after", t => {
  const SubAction = createAction();
  const subAction = new SubAction;
  const Action = createAction({
    after() {
      return [
        subAction
      ];
    }
  });
  const action = new Action();
  t.deepEqual(
    action.after(),
    [ subAction ]
  );
});

// General

test("createAction calls methods with correct context", t => {
  t.plan(5);
  const Action = createAction({
    getDefaultProps() {
      t.deepEqual(this.constructor, Action);
      return {};
    },

    getDescription() {
      t.deepEqual(this.constructor, Action);
      return "";
    },

    before() {
      t.deepEqual(this.constructor, Action);
      return [];
    },

    after() {
      t.deepEqual(this.constructor, Action);
      return [];
    },

    run() {
      t.deepEqual(this.constructor, Action);
    }
  });
  const action = new Action();
  action.getDescription();
  action.before();
  action.after();
  return action.run();
});

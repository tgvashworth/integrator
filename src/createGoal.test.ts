import test from "ava";
import createAction, { Action } from "./createAction";
import createGoal, { Goal } from "./createGoal";

test("createGoal is importable", t => {
  t.truthy(createGoal);
});

test("createGoal handles no spec", t => {
  t.truthy(createGoal());
});

// displayName

test("createGoal has default static displayName", t => {
  t.deepEqual(createGoal().displayName, "unnamed goal");
});

test("createGoal has default instance displayName", t => {
  const Goal = createGoal<{}>();
  const i = new Goal;
  t.deepEqual(i.displayName, "unnamed goal");
});

test("createGoal copies displayName to static property", t => {
  t.deepEqual(
    createGoal({ displayName: "The Example" }).displayName,
    "The Example"
  );
});

test("createGoal copies displayName to instance property", t => {
  const Goal = createGoal({ displayName: "The Example" });
  const i = new Goal;
  t.deepEqual(
    i.displayName,
    "The Example"
  );
});

// getDefaultProps

test("createGoal has default getDefaultProps", t => {
  const Goal = createGoal();
  const goal = new Goal();
  t.deepEqual(
    goal.getDefaultProps(),
    {}
  );
});

test("createGoal can overwrite getDefaultProps", t => {
  interface Props { a: number; }
  const Goal = createGoal<Props>({
    getDefaultProps: () => ({ a: 1 })
  });
  const goal = new Goal();
  t.deepEqual(
    goal.getDefaultProps(),
    <Props>{ a: 1 }
  );
});


test("Goal instantiation merges input with default props", t => {
  interface Props { a: number; b?: any; }
  const Goal = createGoal<Props>({
    getDefaultProps: () => ({ a: 1 })
  });
  const goal = new Goal({ b: 2 });
  t.deepEqual(
    goal.props,
    <Props>{ a: 1, b: 2 }
  );
});

// getDescription

test("createGoal has default getDescription", t => {
  const Goal = createGoal();
  const goal = new Goal();
  t.deepEqual(
    goal.getDescription(),
    goal.displayName
  );
});

test("createGoal can overwrite getDescription", t => {
  interface Props { a: number; }
  const Goal = createGoal<Props>({
    getDescription: () => "example!"
  });
  const goal = new Goal();
  t.deepEqual(
    goal.getDescription(),
    "example!"
  );
});


test("Goals can use props in getDescription", t => {
  interface Props { a: number; }
  const Goal = createGoal<Props>({
    getDefaultProps: () => ({ a: 10 }),
    getDescription() {
      return `a is ${this.props.a}`;
    }
  });
  const goal = new Goal;
  t.deepEqual(
    goal.getDescription(),
    "a is 10"
  );
});

// getDependencies

test("createGoal has default getDependencies with no Actions", t => {
  const Goal = createGoal();
  const goal = new Goal();
  t.deepEqual(
    goal.setup(),
    []
  );
});

test("createGoal can overwrite getDependencies", t => {
  const DependencyGoal = createGoal();
  const Goal = createGoal({
    getDependencies() {
      return [
        DependencyGoal
      ];
    }
  });
  const goal = new Goal();
  t.deepEqual(
    goal.getDependencies(),
    [ DependencyGoal ]
  );
});


// setup

test("createGoal has default setup with no goals", t => {
  const Goal = createGoal();
  const goal = new Goal();
  t.deepEqual(
    goal.setup(),
    []
  );
});

test("createGoal can overwrite setup", t => {
  const Action = createAction();
  const action = new Action;
  const Goal = createGoal({
    setup() {
      return [
        action
      ];
    }
  });
  const goal = new Goal();
  t.deepEqual(
    goal.setup(),
    [ action ]
  );
});

// teardown

test("createGoal has default teardown with no goals", t => {
  const Goal = createGoal();
  const goal = new Goal();
  t.deepEqual(
    goal.teardown(),
    []
  );
});

test("createGoal can overwrite teardown", t => {
  const Action = createAction();
  const action = new Action;
  const Goal = createGoal({
    teardown() {
      return [
        action
      ];
    }
  });
  const goal = new Goal();
  t.deepEqual(
    goal.teardown(),
    [ action ]
  );
});

// General

test("createGoal calls methods with correct context", t => {
  t.plan(5);
  const Goal = createGoal({
    getDefaultProps() {
      t.deepEqual(this.constructor, Goal);
      return {};
    },

    getDescription() {
      t.deepEqual(this.constructor, Goal);
      return "";
    },

    getDependencies() {
      t.deepEqual(this.constructor, Goal);
      return [];
    },

    setup() {
      t.deepEqual(this.constructor, Goal);
      return [];
    },

    teardown() {
      t.deepEqual(this.constructor, Goal);
      return [];
    }
  });
  const goal = new Goal();
  goal.getDescription();
  goal.getDependencies();
  goal.setup();
  goal.teardown();
});

import test from "ava";
import createAction, { Action } from "./createAction";
import createGoal, { Goal } from "./createGoal";
import createTest, { Test } from "./createTest";
import { GoalPair, ExplodedGoal } from "./explodeGoal";
import explodeTest, { TestPair, ExplodedTest } from "./explodeTest";

test("explodeTest is importable", t => {
  t.ok(explodeTest);
});

test("explodeTest should return an array of TestPairs", t => {
  const a = createTest("a", []);
  t.same(
    explodeTest(a),
    []
  );
});

test("explodeTest explodes Goal with setup Action", t => {
    const X = createAction();
    const x = new X;
    const A = createGoal({
      setup: () => [ x ]
    });
    const a = new A;
    const q = createTest("t", [
      a
    ]);
    const goalPair = <GoalPair>[ a, [ x, x.run ] ];
    t.same(
      explodeTest(q),
      [ <TestPair>[ q, goalPair ] ]
    );
});

test("explodeTest explodes Goal with setup and teardown Action", t => {
    const X = createAction();
    const x = new X;
    const Y = createAction();
    const y = new Y;
    const A = createGoal({
      setup: () => [ x ],
      teardown: () => [ y ]
    });
    const a = new A;
    const q = createTest("t", [ a ]);
    const setupGoalPair = <GoalPair>[ a, [ x, x.run ] ];
    const teardownGoalPair = <GoalPair>[ a, [ y, y.run ] ];
    t.same(
      explodeTest(q),
      [
        <TestPair>[ q, setupGoalPair ],
        <TestPair>[ q, teardownGoalPair ]
      ]
    );
});
test("explodeTest explodes Goals with setup and teardown Actions", t => {
    const X = createAction();
    const x = new X;
    const Y = createAction();
    const y = new Y;
    const A = createGoal({
      setup: () => [ x ],
      teardown: () => [ y ]
    });
    const a = new A;
    const B = createGoal({
      setup: () => [ x ],
      teardown: () => [ y ]
    });
    const b = new B;
    const q = createTest("t", [ a, b ]);
    const axGoalPair = <GoalPair>[ a, [ x, x.run ] ];
    const ayGoalPair = <GoalPair>[ a, [ y, y.run ] ];
    const bxGoalPair = <GoalPair>[ b, [ x, x.run ] ];
    const byGoalPair = <GoalPair>[ b, [ y, y.run ] ];
    t.same(
      explodeTest(q),
      [
        <TestPair>[ q, axGoalPair ],
        <TestPair>[ q, bxGoalPair ],
        <TestPair>[ q, byGoalPair ],
        <TestPair>[ q, ayGoalPair ]
      ]
    );
});

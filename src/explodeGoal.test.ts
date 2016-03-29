import test from "ava";
import createAction, { Action } from "./createAction";
import createGoal, { Goal } from "./createGoal";
import explodeGoal, { GoalPair, ExplodedGoal } from "./explodeGoal";

test("explodeGoal is importable", t => {
  t.ok(explodeGoal);
});

test("explodeGoal should return an object with lists of GoalPairs", t => {
  const A = createGoal();
  const a = new A;
  t.same(
    explodeGoal(a),
    { setup: [], teardown: [] }
  );
});

test("explodeGoal explodes setup action", t => {
  const X = createAction();
  const x = new X;
  const A = createGoal({
    setup: () => [ x ]
  });
  const a = new A;
  t.same(
    explodeGoal(a),
    <ExplodedGoal>{ setup: [ [a, [x, x.run]] ], teardown: [] }
  );
});

test("explodeGoal explodes teardown action", t => {
  const X = createAction();
  const x = new X;
  const A = createGoal({
    teardown: () => [ x ]
  });
  const a = new A;
  t.same(
    explodeGoal(a),
    <ExplodedGoal>{ setup: [], teardown: [ [a, [x, x.run]] ] }
  );
});

test("explodeGoal explodes setup and teardown action", t => {
  const X = createAction();
  const x = new X;
  const Y = createAction();
  const y = new Y;
  const A = createGoal({
    setup: () => [ x ],
    teardown: () => [ y ]
  });
  const a = new A;
  t.same(
    explodeGoal(a),
    <ExplodedGoal>{
      setup: [ [a, [x, x.run]] ],
      teardown: [ [a, [y, y.run]] ]
    }
  );
});

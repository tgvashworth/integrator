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

test("explodeGoal can handle a big action tree", t => {
  /*
         X
       /   \
      C     F
     / \   / \
    A   B D   E

    setup: a, c, b
    teardown: d, f, e
   */
  const A = createAction({ displayName: "A" });
  const a = new A;
  const B = createAction({ displayName: "B" });
  const b = new B;
  const C = createAction({
    displayName: "C",
    before: () => [ a ],
    after: () => [ b ]
  });
  const c = new C;

  const D = createAction({ displayName: "D" });
  const d = new D;
  const E = createAction({ displayName: "E" });
  const e = new E;
  const F = createAction({
    displayName: "F",
    before: () => [ d ],
    after: () => [ e ]
  });
  const f = new F;

  const X = createGoal({
    setup: () => [ c ],
    teardown: () => [ f ]
  });
  const x = new X;
  t.same(
    explodeGoal(x),
    <ExplodedGoal>{
      setup: [
        [x, [a, a.run] ],
        [x, [c, c.run] ],
        [x, [b, b.run] ]
      ],
      teardown: [
        [x, [d, d.run] ],
        [x, [f, f.run] ],
        [x, [e, e.run] ]
      ]
    }
  );
});

import test from "ava";
import createAction, { Action } from "./createAction";
import explodeAction, { ActionPair } from "./explodeAction";

test("explodeAction is importable", t => {
  t.truthy(explodeAction);
});

test("explodeAction should return a list of pairs [action, action.run]", t => {
  const A = createAction();
  const a = new A;
  t.deepEqual(
    explodeAction(a),
    <ActionPair[]>[ [a, a.run] ]
  );
});

test("explodeAction should recurse into Action#before", t => {
  const A = createAction({ displayName: "A" });
  const a = new A;
  const B = createAction({
    displayName: "B",
    before: () => [ a ]
  });
  const b = new B;
  t.deepEqual(
    explodeAction(b),
    <ActionPair[]>[ [a, a.run], [b, b.run] ]
  );
});

test("explodeAction should recurse into Action#after", t => {
  const A = createAction({ displayName: "A" });
  const a = new A;
  const B = createAction({
    displayName: "B",
    after: () => [ a ]
  });
  const b = new B;
  t.deepEqual(
    explodeAction(b),
    <ActionPair[]>[ [b, b.run], [a, a.run] ]
  );
});

test("explodeAction should recurse into Action#before and Action#after", t => {
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
  t.deepEqual(
    explodeAction(c),
    <ActionPair[]>[ [a, a.run], [c, c.run], [b, b.run] ]
  );
});


test(
  "explodeAction should doubly recurse into Action#before and Action#after",
  t => {
    /*
           G
         /   \
        C     F
       / \   / \
      A   B D   E

      result: a, c, b, g, d, f, e
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

    const G = createAction({
      displayName: "G",
      before: () => [ c ],
      after: () => [ f ]
    });
    const g = new G;

    t.deepEqual(
      explodeAction(g),
      <ActionPair[]>[
        [a, a.run],
        [c, c.run],
        [b, b.run],
        [g, g.run],
        [d, d.run],
        [f, f.run],
        [e, e.run]
      ]
    );
  }
);

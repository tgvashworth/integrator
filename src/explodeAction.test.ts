import test from "ava";
import createAction, { Action } from "./createAction";
import explodeAction, { ActionPair } from "./explodeAction";

test("explodeAction is importable", t => {
  t.ok(explodeAction);
});

test("explodeAction should return a list of pairs [action, action.run]", t => {
  const A = createAction();
  const a = new A;
  t.same(
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
  t.same(
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
  t.same(
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
  t.same(
    explodeAction(c),
    <ActionPair[]>[ [a, a.run], [c, c.run], [b, b.run] ]
  );
});

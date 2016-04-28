import test from "ava";
import createAction, { Action } from "./createAction";
import { ActionPair } from "./explodeAction";
import runActionPair from "./runActionPair";

test("runActionPair is importable", t => {
  t.truthy(runActionPair);
});

test("runActionPair runs an action", t => {
  t.plan(1);
  const A = createAction({
    run: () => {
      t.pass();
    }
  });
  const a = new A;
  return runActionPair([ a, a.run ], {});
});

test("runActionPair passes state to the action", t => {
  t.plan(1);
  const initialState = {};
  const A = createAction({
    run: state => {
      t.is(state, initialState);
    }
  });
  const a = new A;
  return runActionPair([ a, a.run ], initialState);
});

test("runActionPair propagates returned state", t => {
  t.plan(2);
  const initialState = {};
  const resultState = {};
  const A = createAction({
    run: state => {
      t.is(state, initialState);
      return resultState;
    }
  });
  const a = new A;
  return runActionPair([ a, a.run ], initialState)
    .then(state => {
      t.is(state, resultState);
    });
});

test("runActionPair propagates initial state if nothing returned", t => {
  t.plan(2);
  const initialState = {};
  const A = createAction({
    run: state => {
      t.is(state, initialState);
    }
  });
  const a = new A;
  return runActionPair([ a, a.run ], initialState)
    .then(state => {
      t.is(state, initialState);
    });
});

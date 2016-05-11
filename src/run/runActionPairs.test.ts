import test from "ava";
import createAction, { Action } from "../createAction";
import { ActionPair } from "../explode/explodeAction";
import runActionPairs from "./runActionPairs";

test("runActionPairs is importable", t => {
  t.truthy(runActionPairs);
});

test("runActionPairs runs an action", t => {
  t.plan(1);
  const A = createAction({
    run: () => {
      t.pass();
    }
  });
  const a = new A;
  return runActionPairs([ [ a, a.run ] ], {});
});


test("runActionPairs passes state to the action", t => {
  t.plan(1);
  const initialState = {};
  const A = createAction({
    run: state => {
      t.is(state, initialState);
    }
  });
  const a = new A;
  return runActionPairs([ [ a, a.run ] ], initialState);
});

test("runActionPairs propagates returned state", t => {
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
  return runActionPairs([ [ a, a.run ] ], initialState)
    .then(state => {
      t.is(state, resultState);
    });
});

test("runActionPairs propagates initial state if nothing returned", t => {
  t.plan(2);
  const initialState = {};
  const A = createAction({
    run: state => {
      t.is(state, initialState);
    }
  });
  const a = new A;
  return runActionPairs([ [ a, a.run ] ], initialState)
    .then(state => {
      t.is(state, initialState);
    });
});

test("runActionPairs propagates state change to next action", t => {
  t.plan(3);
  const initialState = {};
  const nextState = {};
  const resultState = {};
  const A = createAction({
    run: state => {
      t.is(state, initialState);
      return nextState;
    }
  });
  const a = new A;
  const B = createAction({
    run: state => {
      t.is(state, nextState);
      return resultState;
    }
  });
  const b = new B;
  return runActionPairs([ [ a, a.run ], [ b, b.run ] ], initialState)
    .then(state => {
      t.is(state, resultState);
    });
});

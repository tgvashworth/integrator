import test from "ava";
import { Args, Config, EnvironmentTarget } from "./config";
import createTest from "../createTest";
import selectTests from "./selectTests";

test("selectTests is importable", t => {
  t.truthy(selectTests);
});

test("selectTests will do nothing with no args", t => {
  const tests = [
    createTest("one"),
    createTest("two")
  ];
  t.deepEqual(
    selectTests({}, tests),
    tests
  );
});

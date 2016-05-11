import test from "ava";
import { Args } from "./config";
import createTest from "../createTest";
import selectTests from "./selectTests";

test("selectTests is importable", t => {
  t.truthy(selectTests);
});

test("selectTests will do nothing with no args", t => {
  const A = createTest("A");
  const B = createTest("B");
  t.deepEqual(
    selectTests({}, [A, B]),
    [A, B]
  );
});

test("selectTests will select relevant tests", t => {
  const A = createTest("A");
  const B = createTest("B");
  t.deepEqual(
    selectTests({ test: "A" }, [A, B]),
    [A]
  );
});

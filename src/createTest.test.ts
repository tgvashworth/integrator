import test from "ava";
import createGoal from "./createGoal";
import createTest, { Test } from "./createTest";

test("createTest is importable", t => {
  t.truthy(createTest);
});

test("createTest creates Tests", t => {
  t.deepEqual(
    createTest("name", []),
    new Test("name", [])
  );
});

test("createTest creates Tests with Goals", t => {
  const Goal = createGoal();
  const g = new Goal;
  t.deepEqual(
    createTest("name", [ g ]),
    new Test("name", [ g ])
  );
});

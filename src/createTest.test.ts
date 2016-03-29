import test from "ava";
import createGoal from "./createGoal";
import createTest, { Test } from "./createTest";

test("createTest is importable", t => {
  t.ok(createTest);
});

test("createTest creates Tests", t => {
  t.same(
    createTest("name", []),
    new Test("name", [])
  );
});

test("createTest creates Tests with Goals", t => {
  const Goal = createGoal();
  const g = new Goal;
  t.same(
    createTest("name", [ g ]),
    new Test("name", [ g ])
  );
});

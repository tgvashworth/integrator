import test from "ava";
import createGoal from "./createGoal";
import createTest, { Test } from "./createTest";
import checkTest from "./checkTest";

test("checkTest is importable", t => {
  t.ok(checkTest);
});

test("checkTest does not throw for valid Goal", t => {
  const A = createGoal();
  const B = createGoal({
    getDependencies: () => [ A ]
  });
  const test = createTest("example", [ new A, new B ]);
  t.notThrows(() => {
    checkTest(test);
  });
});

test("checkTest throws for invalid Goal", t => {
  const A = createGoal({
    displayName: "A"
  });
  const B = createGoal({
    displayName: "B",
    getDependencies: () => [ A ]
  });
  const test = createTest("example", [ new B ]);
  const desired = [
    `Test "example" does not satisfy the dependencies of Goal "B".`,
    `An instance of required Goal "A" is missing.`
  ].join(" ");
  t.throws(() => {
    checkTest(test);
  }, desired);
});

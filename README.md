# integrator

An action-oriented approach to integration testing, simulating users to comprehensively test your app.

Status: **Prototype**. TweetDeck uses it, but it's not ready for general use.

## Why does Integrator exist?

There are numerous problems with integration tests today:

- *They don't simulate users.* Only the user-flows that you thought to test are tested, and assertions are coupled to CSS selectors. That's is not how a user sees your application and it results in [change-detector][change-detector] tests.

- *They have implicit dependencies.* Current test frameworks encourage you to write tests that depend on the success of another, without an explicit notion of dependency. The result is that test order *might be* important, which is hard to debug and refactor.

- *Tests are hard to write and debug.* This leads to flaky tests, false negatives or (worse) false positives, and untested but critical user flows.

Fixing it requires taking some of the manual work out of creating and maintaining these tests, providing a framework that helps the test author to avoid writing bad tests.

What does that mean specifically?

- Explicit, reproducible setup & teardown
- Real user simulation in a chaotic testing
- Explicit dependencies where ordering is well-defined and deterministic

**Integrator** is a test runner and authoring framework that tries to help.

### License

MIT

[change-detector]: http://googletesting.blogspot.co.uk/2015/01/testing-on-toilet-change-detector-tests.html
[node]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[todomvc-actions]: https://github.com/phuu/todomvc/blob/integrator/tests/integrator/actions.js
[new-issue]: https://github.com/phuu/integrator/issues/new

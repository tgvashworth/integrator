# integrator

An experiment in fixing integration testing.

## Rationale

There are numerous problems with integration testing today:

- Repeated, manual setup & teardown
    - Only thought-of paths are tested
- Not simulating a user
    - Brittle CSS selectors
    - Linear flow – reset, setup, test, teardown
- Implicit dependency
    - Test order *might be* important

This leads to flaky tests, false negatives or, worse, false positives.

Fixing it requires taking some of the manual work out of creating and maintaining these tests, providing a framework that helps the test author to avoid writing bad tests.

What does that mean specifically?

- Write-once setup & teardown
- Simulate a real user
    - Test chaotically
    - No CSS selectors
- Explicit dependencies
    - Ordering is defined and deterministic

This project is a test runner and authoring framework tries to do the repeated, error-prone work (setup and teardown) for you. It's very much a *prototype*.

## Concepts

### Actions

Integrator is based around a *suite* of named *actions*. The suite is associated with a *model* that allows the tests to track the work they've done.

The model should reflect the state of the application being tested in a simple data structure, and tests should *compare the expected state from the model against the UI of the appliction*.

- Actions can specify that they are *dependent on other actions*
- Integrator runs actions in order, such that a particular action's *dependencies are always run first*
- Actions that depend on each other *form a graph* that Integrator uses determine what to run when
- It can randomly choose actions from the graph, and moves from action-to-action in way that optimises for the *least amount of work*

Actions have four phases: *setup*, *assert*, *teardown* and *finally*.

> "finally" will be renamed to "done"

Every phase function takes the current model (and more, to be documented) and must return a Promise for the (possibly updated) model.

A simple action that opens a page and check that the title is correct might look like this:

```js
Action(
    // Name
    'open Google',
    // Dependencies
    [],
    // Phases
    {
        setup: model =>
            session.get('https://google.com')
                .then(() => model.set('title', 'Google')),

        assert: utils.effect(model =>
            session.getPageTitle()
                .then(title => {
                    assert.ok(
                        title.trim() === model.get('title'),
                        'Title is wrong'
                    );
                }))
    }
);
```

> The `utils.effect` call that wraps the `assert` phase function means that the phase function has side-effects only, and does not modify the model. `effect` just passes the model back in a Promise.

### Model

As mentioned above, a test suite is the combination of an action graph and a model. The model should be modified by the actions phases to track their expected changes to the application state, but in a simplified way.

For example, in a todo application the model would contain a list of todo items that contain the text of the todo. In the assertion phases (`assert` and `finally`), the model list would be checked against the list in real page, as the user sees it. The [list-app example][examples/list-app.js] does this this.

Since the model will change and grow over time, the assertions should be generic and flexible. This means, for example, that the todo list tests should compare the length and text of the complete list every time, rather than checking that a specific item has been added in a specific place. This also aids the reusability of the assertions.

The model can be any `immutable-js` data structure.

## Requirements

- [node](https://nodejs.org/) (or [io.js](https://iojs.org), probably)
- [docker](https://www.docker.com/)
- [docker-compose](https://docs.docker.com/compose/)
- I've been using [docker-machine](https://docs.docker.com/machine/)

## Try it out

**Warning**: this is super experimental and basically not tested for anyone but me. It's probably broken.

```
$ make install
$ make grid
$ ./run --hub http://$(docker-machine ip):4444/wd/hub --browser chrome --suite examples/list-app --base http://target
```

### License

MIT

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

## Actions

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
        setup: utils.effect(() => session.get('https://google.com')),

        assert: utils.effect(() => {
            return session
                .getPageTitle()
                .then(title => {
                    assert.ok(
                        title.trim() === 'Google',
                        'Title is wrong'
                    );
                });
        })
    }
);
```

> The `utils.effect` call that wraps each phase function means that the phase function does not modify the model — the model is just passed back in a Promise.

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

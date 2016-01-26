# integrator

[![Build Status](https://travis-ci.org/phuu/integrator.svg?branch=master)](https://travis-ci.org/phuu/integrator)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)


An action-oriented approach to integration testing, simulating users to comprehensively test your app.

Key features:

- Actions to simulate atomic user tasks
- Real-user simulation in "random-walk" mode
- Reusable actions through fixtures

## Why does Integrator exist?

There are numerous problems with integration tests today:

- *They don't simulate users.* Only the user-flows that you thought to test are tested, and assertions are coupled to CSS selectors. That's is not how a user sees your application and it results in [change-detector][change-detector] tests.

- *They have implicit dependencies.* Current test frameworks encourage you to write tests that depend on the success of another, without an explicit notion of dependency. The result is that test order *might be* important, which is hard to debug and refactor.

- *Tests are hard to write and debug.* This leads to flaky tests, false negatives or (worse) false positives, and untested but critical user flows.

Fixing it requires taking some of the manual work out of creating and maintaining these tests, providing a framework that helps the test author to avoid writing bad tests.

What does that mean specifically?

- Explicit, reproducible setup & teardown
- Real user simulation in a chaotic testing ("random-walk") mode
- Explicit dependencies where ordering is well-defined and deterministic

**Integrator** is a test runner and authoring framework that tries to help.

## Concepts

### Actions

Integrator is based around a **suite** of named **actions**. The suite is associated with a **model** that the actions use to track the work they've done.

#### Phases

Actions have four **phases**: *setup*, *assert*, *teardown* and *teardown-assert*.

Each action should make some changes to the application (click buttons, type stuff, etc) and then assert that the changes were made successfully. They should be as *atomic as possible*, and all are *optional*.

While the phases can be used for anything, it will be better to use them consistently:

- *setup* should do the work of the action, changing the application and updating the model
- *assert* should check that *setup* work was carried out successfully, and throw if it wasn't. Assertions should generally be made with comparisons between the *state of the page* and the *model*
- *teardown* should undo any work done in setup that would otherwise prevent a user from carrying on their work (for example, closing a modal)
- *teardown-assert* should check that *teardown* was carried out successfully, and throw if it wasn't

Teardown should:

- undo anything that significantly changes the user's view of the application
- not undo changes to the application's *data* (instead, update the model and compare)

#### Dependencies

Actions can specify that they are *dependent on other actions*.

Integrator figures out what actions it needs to run by looking at each action's dependencies, running actions in order such that a particular action's dependencies are *always run first*.

Actions that depend on each other *form a graph* that Integrator uses determine what to run when.

In *random-walk* mode Integrator randomly choose actions from the graph, and moves from action-to-action in way that optimises for the *least amount of work*. It will not teardown anything that it doesn't need to.

#### Model

The model should reflect the state of the application being tested in a data structure. Actions should run assertions that *compare the expected state from the model against the UI of the application*.

Every phase function is passed current model and must return a Promise for the (possibly updated) model.

#### Example action

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

        assert: utils.makeEffect(model =>
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

> The `utils.makeEffect` call that wraps the `assert` phase function means that the phase function has side-effects only, and does not modify the model. The function returned from `makeEffect` returns a Promise for the model.

#### Dependency graph

The dependencies of the actions that make up your test suite form a graph. When a particular action is run, Integrator:

- walks the graph to find all the dependencies up to the root(s) of the graph
- figures out what actions it must run in what order
- resolves the actions' [fixtures](#fixtures)
- runs forward from the first dependency to the target action

In the dependency list, *order is important*. Dependencies should be listed left-to-right in order of priority.

For example, imagine this graph (which happens to have a single root):

```
     A
    / \
   B   C
  / \   \
 D   E - F
          \
           G
```

If we wanted to run `G`, the dependencies in order are `A, B, E, C, and F`. Action `F` would have dependencies `['E', 'C']`, so the `E` dependency path is more important (it comes first), and therefore is run before `C`.

### Model

As mentioned above, a test suite is the combination of an action graph and a model. The model should be modified by action phases to track their expected changes to the application state.

For example, in a todo application the model would contain a list of todo items. In the assertion phases (`assert` and `teardown-assert`), the model list would be checked against the list in real page, as the user sees it.

Since the model will change and grow over time, the assertions should be generic and flexible. This means, for example, that the todo list tests should compare the length and text of the complete list every time, rather than checking that a specific item has been added in a specific place. This also aids the reusability of the assertions.

The model can be any `immutable-js` data structure.

### Fixtures

Actions can specify *fixtures*. A fixture in integrator is a named piece of data that the action will use when running. For example, this could be the user that a 'login' action will use, or the todos it should add.

Here's an example, where we specify a search query for Google.

```js
Action('fill in the search box', ['open Google'], {
    fixtures: {
        query: 'integrator'
    },

    setup: (model, fixtures) =>
        session.findByName('q')
            // Type the query into the search box
            .then(elem => elem.type(fixtures.get('query')))
            // Remember what we expect the the entered query to be
            .then(() => model.set('query', fixtures.get('query')))
});
```

Fixtures can be values or functions that generate values.

```js
fixtures: {
    query: () => 'integrator'
}
```

When an action is run, its fixtures and all the fixtures of its dependencies are bundled first — starting with the action to be run, and working back through its chain of dependencies. The actions are then run in the reverse of this order with every action being run against the same set of fixtures.

For example, two actions that specify different fixtures:

```js
Action('first', [], {
    fixtures: {
        a: 10
    }
})

Action('second', ['first'], {
    fixtures: {
        b: 20
    }
})
```

When the `second` action runs, the fixtures will be an `immutable-js` Map containing `{ a: 10, b: 20 }`.

Aside: each action will only see the values for fixtures it has declared — 'first' will be parsed a map with key 'a', whereas 'second' will see only 'b'. This is to prevent implicit fixture dependencies.

#### Pass-through fixtures

If the fixture value is a function, the function will be passed any existing fixture value (from dependent actions), or undefined if there isn't a pre-existing value.

```
Action('third', ['second'], {
    fixtures: {
        a: existingA => existingA
    }
})
```

This means that, since actions can specify the same fixtures, it's possible to have an action that doesn't care what value it gets, so long as it gets one, and falls back to a default value if there's nothing present.

```js
Action('fill in the search box', ['open Google'], {
    fixtures: {
        query: query => (typeof query === 'undefined' ? 'integrator' : query)
    }
});
```

This pattern allows variations of a given action by *simply changing the fixtures*.

```js
Action('type nothing into the search box', ['fill in the search box'], {
    fixtures: {
        query: ''
    }
});

Action('type a really long query into the search box', ['fill in the search box'], {
    fixtures: {
        query: 'some really long string here!'
    }
});
```

#### Fixtures and teardown

Fixtures represent the data an action needs to carry out its work. Since the fixtures an action may receive can change (probably due to 'pass-through' usage), integrator considers the same action with different fixtures to effectively be a different action. During a random walk, if it needs to repeat an action (but with different fixtures), Integrator will run the action's `teardown` phases, then setup and assert, to make sure that actions run with the correct fixtures.

For example, imagine actions `A`, `B` and `C`:

- `A` doesn't have any fixtures
- `B` relies on fixture `x` with any value, defaulting to 1
- `C` relies on fixture `x` with value 2

During a random walk, if integrator picks `B`, it will run `A` then `B` with fixtures `{ x: 1 }`.

If it then picked `C`, having just run `B`, it will reverse-out (teardown) `B` and run forward (setup) `C` with fixtures `{ x: 2 }`.

## Requirements

- [node][node] and [npm][npm]

Optionally, you might use the dockerised Selenium grid. Whatever happens, you need a selenium server.

- [docker](https://www.docker.com/)
- [docker-compose](https://docs.docker.com/compose/)
- I've been using [docker-machine](https://docs.docker.com/machine/)

### License

MIT

[change-detector]: http://googletesting.blogspot.co.uk/2015/01/testing-on-toilet-change-detector-tests.html
[node]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[todomvc-actions]: https://github.com/phuu/todomvc/blob/integrator/tests/integrator/actions.js
[new-issue]: https://github.com/phuu/integrator/issues/new

# integrator

An action-oriented approach to integration testing, simulating users to comprehensively test your app.

- Reproducible setup & teardown for easy debugging
- Explicit dependencies
- Promotes code reuse

Status: **Prototype**. TweetDeck uses it, but it's not ready for general use.

## Install

```
npm install integrator
```

## Concepts

**Note**: this list is incomplete - it should match what is implemented.

### Actions

Actions are where you do the work of your test. They represent an the atomic units of behaviour, like clicking or typing.

Here's an example:

```js
import { createAction } from "integrator";

const Click = createAction({
  // The displayName is used to help the user of your action identify it.
  displayName: "Click",

  // Props are what make your Action configurable. This action has a
  // configurable selector that defines what to click on.
  getDefaultProps() {
    return {
      selector: undefined
    };
  },

  // Actions can specify human-readable descriptions which are used in logging
  // to help the user of your action figure out what is going on. This method
  // is able to use the Action's props to make a more useful description.
  getDescription() {
    return `click on ${this.props.on}`;
  },

  // Run is where the bulk of the Action's work happens. It will call out to
  // the test server to make changes to the app, and return a Promise for the
  // result of the changes.
  run() {
    return this.context.session
      .findByCssSelector(this.props.selector)
      .then(elem => elem.click());
  }
});
```

Actions can reuse other actions `before` and `after` their own `run` method. Something like this:

```js
const SelectListItem = createAction({
  getDefaultProps() {
    return {
      listSelector: undefined,
      itemText: undefined
    };
  },

  // The `before` method returns an array of Actions that represent work to do.
  before() {
    return [
      new Click({ on: this.props.listSelector })
    ];
  }

  run() {
    return this.context.session
      .findDisplayedByLinkText(this.props.itemText)
      .then(elem => elem.click());
  }

  // `after` has the same form as `before`
  after() {
    return [];
  }
});
```

Using `props` to generate sub-Actions can lead to some powerful actions:

```js
const FillInForm = createAction({
  getDefaultProps() {
    return {
      selector: undefined,
      fields: [], // { selector: string, text: string }
      autoSubmit: false
    };
  },

  before() {
    const { selector } = this.props;
    return this.props.fields.map(field => new Type({
      into: `${selector} ${field.selector}`,
      text: field.text
    }));
  },

  after() {
    return []
      .concat(
        this.props.autoSubmit
          ? [ new Click({ on: `${this.props.selector} button[type=submit]` }) ]
          : []
      );
  }
});
```

## Goals

Goals model user flows within your app, and are formed of collections of Actions. They may also depend on other Goals to make sure that, for example, to *send a message* the user has *opened the app* and *logged in*.

Like Actions, Goals are configurable using `props`.

Here's an example:

```js
import { createGoal } from "integrator";

const Login = createGoal({
  displayName: "Login",

  getDefaultProps() {
    return {
      user: undefined // { username: string, password: string }
    };
  }

  getDescription() {
    return `login as ${this.props.user.username}`;
  },

  // A Goal can specify another kind of Goal that must have run first.
  getDependencies() {
    return [ OpenTheApp ];
  },

  // Setup is where the Goal list the Actions that make it up. It's just an
  // array of actions, run in order.
  setup() {
    return [
      new FillInForm({
        selector: ".js-login-form",
        fields: [
          { selector: "username", text: this.props.user.username },
          { selector: "password", text: this.props.user.password }
        ],
        autoSubmit: true
      })
    ];
  }
});
```

Once a goal has `setup`, and there is no further work to do (more on that later), the Goal will `teardown`. This is another method that works just like `setup` - it's a list of Actions.

The `teardown` method should undo the significant UI or mode changes that `setup` introduced like logging-in or opening a modal.

```js
const Login = createGoal({
  setup() {
    return [
      new FillInForm({ ... })
    ];
  }

  teardown() {
    return [
      new ClearCookies({ ... }),
      new Refresh()
    ];
  }
});
```

### License

MIT

[change-detector]: http://googletesting.blogspot.co.uk/2015/01/testing-on-toilet-change-detector-tests.html
[node]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[todomvc-actions]: https://github.com/phuu/todomvc/blob/integrator/tests/integrator/actions.js
[new-issue]: https://github.com/phuu/integrator/issues/new

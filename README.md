# integrator

An action-oriented approach to integration testing, simulating users to comprehensively test your app.

Status: **Prototype**. TweetDeck uses it, but it's not ready for general use.

- Reproducible setup & teardown for easy debugging
- Explicit dependencies
- Promotes code reuse

## Install

```
npm install integrator
```

## Concepts

**Note**: this list is incomplete - it should match what is implemented.

### Actions

Actions are where you do the work of your test. They represent an the atomic units of behaviour, like clicking or typing. Here's an example:

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
  }

  // Actions can specify human-readable descriptions which are used in logging
  // to help the user of your action figure out what is going on. This method
  // is able to use the Action's props to make a more useful description.
  getDescription() {
    return `click on ${this.props.on}`;
  }

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

### License

MIT

[change-detector]: http://googletesting.blogspot.co.uk/2015/01/testing-on-toilet-change-detector-tests.html
[node]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[todomvc-actions]: https://github.com/phuu/todomvc/blob/integrator/tests/integrator/actions.js
[new-issue]: https://github.com/phuu/integrator/issues/new

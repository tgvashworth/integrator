# Design

Suites are built of `Test` objects:

```js
import createTest from "integrator";

export default [
  createTest("...", [ ... ]),
  createTest("...", [ ... ]),
  createTest("...", [ ... ])
]
```

Each test is run in the environments and targets defined by the config file:

```js
export default {
  suite: "./suite",
  environments: {
    cloud: {
      common: {
        hub: "...",
        capabilities: {
          "cloud.key": "..."
        }
      },
      targets: [
        {
          capabilities: {
            browser: 'Chrome',
            browser_version: '47',
            os: 'OS X',
            os_version: 'El Capitan'
          }
        },
        ...
      ]
    }
  }
}
```

The `common` object and `targets` are merged together to create a specific "environment target".

Plugins, specified for each for each environment, can:

- Take action before any tests have run
- Add data to a target configuration before it is used
- Build the `context` object available to every Action
- Output a description for a target

```js
export default {
  ...,
  environments: {
    cloud: {
      // Plugins are per environment
      plugins: [
        new cloud.TunnelPlugin({ key: "..." }),
        new cloud.SessionPlugin({ key: "..." })
      ],
      common: { ... },
      targets: [ ... ]
    }
  }
}
```

## CLI

To kick things off:

```
$ integrator path/to/config.js
```

You run in a single environment, or a choose test:

```
$ integrator path/to/config.js --environment cloud --test "..."
```

## Output

Integrator tells you what it's about to run, and what it's running as it does it (in verbose mode):

```
Running: cloud
Configurations:
  Chrome 47 OS X El Capitan

Test: "..." Chrome 47 OS X El Capitan
Goal: "..."
Actions:
  - "..."
  - "..."
  - "..."
```

And when something goes wrong:

```
Error: element could not be found [selector: '.beep-boop']

Test: "..." Chrome 47 OS X El Capitan
Goal: "..."
Action: "..."
```

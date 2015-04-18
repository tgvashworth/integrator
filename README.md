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

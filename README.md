# integrator

An experiment in fixing integration testing.

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

BIN = ./node_modules/.bin/
SRC = $(wildcard src/*.js)
BABEL_CMD = --optional runtime src --out-dir out

.PHONY: build lint prepublish test

build: base-install
	@babel $(BABEL_CMD) >> /dev/null

prepublish:
	@babel $(BABEL_CMD)

lint:
	@$(BIN)eslint $(SRC) -c .eslintrc

test:
	@./bin/test --suite src/test/test-integrator-actions

BIN = ./node_modules/.bin/
ENTRY = src/index
SRC = $(wildcard src/*.js)
SKETCHES = $(wildcard sketches/*.js)
OUT = build/build.js

.PHONY: install lint

install:
	@echo "Git hooks..."
	@ln -s -f ../../hooks/pre-commit .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "Dependencies..."
	@npm install
	@$(BIN)jspm install

lint:
	@$(BIN)eslint $(SRC) $(SKETCHES) -c .eslintrc

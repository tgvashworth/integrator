BIN = ./node_modules/.bin/
SELENIUM = http://selenium-release.storage.googleapis.com/2.45/selenium-server-standalone-2.45.0.jar
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
	@echo "  Downloading selenium-server..."
	@wget $(SELENIUM)
	@npm install
	@$(BIN)jspm install

lint:
	@$(BIN)eslint $(SRC) $(SKETCHES) -c .eslintrc

BIN = ./node_modules/.bin/
SELENIUM_JAR = selenium-server-standalone-2.45.0.jar
SELENIUM_URL = http://selenium-release.storage.googleapis.com/2.45/$(SELENIUM_JAR)
ENTRY = src/index
SRC = $(wildcard src/*.js)
SKETCHES = $(wildcard sketches/*.js)
EXAMPLES = $(wildcard examples/*.js)
OUT = build/build.js

.PHONY: install lint

install:
	@echo "Git hooks..."
	@ln -s -f ../../hooks/pre-commit .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "Dependencies..."
	@echo "    Downloading selenium-server..."
	@wget $(SELENIUM_URL) --quiet
	@echo "    Done"
	@npm install
	@$(BIN)jspm install

selenium-server:
	@java -jar $(SELENIUM_JAR)

lint:
	@$(BIN)eslint $(SRC) $(SKETCHES) $(EXAMPLES) -c .eslintrc

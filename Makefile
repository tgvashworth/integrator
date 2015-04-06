BIN = ./node_modules/.bin/
SELENIUM_JAR = selenium-server-standalone-2.45.0.jar
SELENIUM_URL = http://selenium-release.storage.googleapis.com/2.45/$(SELENIUM_JAR)
ENTRY = src/index
SRC = $(wildcard src/*.js)
SKETCHES = $(wildcard sketches/*.js)
EXAMPLES = $(wildcard examples/*.js)
OUT = build/build.js

.PHONY: docker-install install lint server selenium-server

docker-install:
	@npm install
	@$(BIN)jspm install

install: docker-install
	@echo "Git hooks..."
	@ln -s -f ../../hooks/pre-commit .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "Dependencies..."
	@echo "    Downloading selenium-server..."
	@wget $(SELENIUM_URL) --quiet -O $(SELENIUM_JAR)
	@echo "    Done"

selenium-server:
	@java -jar $(SELENIUM_JAR)

server:
	@python -m SimpleHTTPServer 8080

lint:
	@$(BIN)eslint $(SRC) $(SKETCHES) $(EXAMPLES) -c .eslintrc

BIN = ./node_modules/.bin/
SELENIUM_JAR = selenium-server-standalone-2.45.0.jar
SELENIUM_URL = http://selenium-release.storage.googleapis.com/2.45/$(SELENIUM_JAR)
SRC = $(wildcard src/*.js)
SKETCHES = $(wildcard sketches/*.js)
EXAMPLES = $(wildcard src/examples/*.js)

.PHONY: base-install install lint server selenium-server grid test

base-install:
	@npm install

install: base-install
	@echo "Git hooks..."
	@ln -s -f ../../hooks/pre-commit .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@ln -s -f ../../hooks/pre-push .git/hooks/pre-push
	@chmod +x .git/hooks/pre-push
	@echo "Dependencies..."
	@echo "    Downloading selenium-server..."
	wget $(SELENIUM_URL) --quiet -O bin/$(SELENIUM_JAR)
	@echo "    Done"

build:
	@babel src --out-dir out >> /dev/null

selenium-server:
	@java -jar $(SELENIUM_JAR)

server:
	@python -m SimpleHTTPServer 9876

grid:
	@docker-compose --file config/docker-compose.yml up

lint:
	@$(BIN)eslint $(SRC) $(SKETCHES) $(EXAMPLES) -c .eslintrc

test: build
	@./bin/test --suite out/test/test-integrator-actions

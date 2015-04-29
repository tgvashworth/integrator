BIN = ./node_modules/.bin/
SELENIUM_JAR = bin/selenium-server-standalone-2.45.0.jar
SELENIUM_URL = http://selenium-release.storage.googleapis.com/2.45/$(SELENIUM_JAR)
SRC = $(wildcard src/*.js)
SKETCHES = $(wildcard sketches/*.js)
EXAMPLES = $(wildcard examples/*.js)

.PHONY: docker-install install lint server selenium-server grid test

docker-install:
	@npm install
	@$(BIN)jspm install

install: docker-install
	@echo "Git hooks..."
	@ln -s -f ../../hooks/pre-commit .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@ln -s -f ../../hooks/pre-push .git/hooks/pre-push
	@chmod +x .git/hooks/pre-push
	@echo "Dependencies..."
	@echo "    Downloading selenium-server..."
	@wget $(SELENIUM_URL) --quiet -O $(SELENIUM_JAR)
	@echo "    Done"

selenium-server:
	@java -jar $(SELENIUM_JAR)

server:
	@python -m SimpleHTTPServer 9876

grid:
	@docker-compose --file config/docker-compose.yml up

lint:
	@$(BIN)eslint $(SRC) $(SKETCHES) $(EXAMPLES) -c .eslintrc

test:
	@./bin/test --suite test/test-integrator-actions

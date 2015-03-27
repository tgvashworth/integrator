PATH := node_modules/.bin:$(PATH)

ENTRY := src/index
SRC = $(wildcard src/*.js)
SKETCHES = $(wildcard sketches/*.js)
OUT := build/build.js

.PHONY: all

all:
	@jspm bundle-sfx $(ENTRY) $(OUT)

install:
	@echo "Git hooks..."
	@ln -s -f ../../hooks/pre-commit .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "Dependencies..."
	@npm install
	@jspm install

lint:
	@eslint $(SRC) $(SKETCHES) -c .eslintrc

watch:
	@nodemon -q -w $(dir $(ENTRY)) --exec make

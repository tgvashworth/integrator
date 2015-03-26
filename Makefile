PATH := node_modules/.bin:$(PATH)

ENTRY := src/index
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
	@eslint $(dir $(ENTRY)) -c .eslintrc

watch:
	@make install
	@nodemon -q -w $(dir $(ENTRY)) --exec make

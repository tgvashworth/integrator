PATH := node_modules/.bin:$(PATH)

ENTRY := src/index
OUT := build/build.js

.PHONY: all

all:
	@jspm bundle-sfx $(ENTRY) $(OUT)

install:
	@npm install
	@jspm install

watch:
	@make install
	@nodemon -q -w $(dir $(ENTRY)) --exec make

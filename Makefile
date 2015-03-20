ENTRY = src/index.js
OUT = build/out.js
CMD = babel $(ENTRY) -o $(OUT) -s

.PHONY: all

all:
	$(CMD)

watch:
	$(CMD) -w

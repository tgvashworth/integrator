ENTRY = src.js
OUT = out.js
CMD = babel $(ENTRY) -o $(OUT) -s

.PHONY: all

all:
	$(CMD)

watch:
	$(CMD) -w

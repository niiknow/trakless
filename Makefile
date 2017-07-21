#
# Task args.
#

PORT ?= 0
BROWSER ?= ie:9
TESTS = $(wildcard test/*.coffee)
SRC = $(wildcard src/*.coffee)
MINIFY = $(BINS)/uglifyjs
PID = test/server/pid.txt
BINS = node_modules/.bin
DUO = $(BINS)/duo
DUOT = $(BINS)/duo-test -p test/server -R spec -P $(PORT) -c "make build.js"
COFFEE = bin/coffee --js --bare

#
# Default target.
#

default: main

#
# Clean.
#

clean:
	@rm -f trakless.js trakless.min.js
	@rm -rf lib
	@rm -rf build

clean-all: clean
	@rm -rf components
	@rm -rf node_modules npm-debug.log

#
# Test with phantomjs.
#

test: $(BUILD)
	@$(DUOT) phantomjs

#
# Test with saucelabs
#

test-sauce: $(BUILD)
	@$(DUOT) saucelabs \
		--browsers $(BROWSER) \
		--title trakless

#
# Test in the browser.
#
# On the link press `cmd + doubleclick`.
#

test-browser: $(BUILD)
	@$(DUOT) browser

#
# Phony targets.
#

.PHONY: clean
.PHONY: test
.PHONY: test-browser
.PHONY: test-coverage
.PHONY: test-sauce


#
# Target for `trakless.js` file.
#

main: node_modules $(SRC)
	@$(DUO) --use duo-coffee -S src/index.coffee > trakless.js
	@$(MINIFY) trakless.js --output trakless.min.js

#
# Target for `*.js` file for tests
#
#
lib/%.js: node_modules $(SRC)
	node_modules/coffee-script/bin/coffee --bare -c -o $(@D) $(patsubst lib/%,src/%,$(patsubst %.js,%.coffee,$@))

#
#
# Target for `node_modules` folder.
#

node_modules: package.json
	@npm install
	@touch $@

#
# Target for build files.
#

$(BUILD): node_modules $(TESTS) src/index.coffee
	@$(DUO) --development --use duo-coffee test/tests.coffee > $(BUILD)

#
# Phony build target
#

build: $(BUILD)

.PHONY: build

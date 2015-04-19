
#
# Task args.
#

PORT ?= 0
BROWSER ?= ie:9
TESTS = $(wildcard test/*.js)
SRC = $(wildcard src/*.coffee)
MINIFY = $(BINS)/uglifyjs
PID = test/server/pid.txt
BINS = node_modules/.bin
BUILD = build.js
DUO = $(BINS)/duo
DUOT = $(BINS)/duo-test -p test/server -R spec -P $(PORT) -c "make build.js"

#
# Default target.
#

default: trakless

#
# Clean.
#

clean:
	@rm -rf components $(BUILD)
	@rm -f trakless.js trakless.min.js
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
		--title trakless.js

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

trakless: node_modules $(SRC)
	@$(DUO) --use duo-coffee src/index.coffee > trakless.js
	@$(MINIFY) trakless.js --output trakless.min.js

#
# Target for `node_modules` folder.
#

node_modules: package.json
	@npm install

#
# Target for build files.
#

$(BUILD): $(TESTS) trakless.js
	@$(DUO) --development test/tests.js > $(BUILD)

#
# Phony build target
#

build: build.js

.PHONY: build
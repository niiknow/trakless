(function umd(require){
  if ('object' == typeof exports) {
    module.exports = require('1');
  } else if ('function' == typeof define && define.amd) {
    define(function(){ return require('1'); });
  } else {
    this['trakless'] = require('1');
  }
})((function outer(modules, cache, entries){

  /**
   * Global
   */

  var global = (function(){ return this; })();

  /**
   * Require `name`.
   *
   * @param {String} name
   * @param {Boolean} jumped
   * @api public
   */

  function require(name, jumped){
    if (cache[name]) return cache[name].exports;
    if (modules[name]) return call(name, require);
    throw new Error('cannot find module "' + name + '"');
  }

  /**
   * Call module `id` and cache it.
   *
   * @param {Number} id
   * @param {Function} require
   * @return {Function}
   * @api private
   */

  function call(id, require){
    var m = cache[id] = { exports: {} };
    var mod = modules[id];
    var name = mod[2];
    var fn = mod[0];

    fn.call(m.exports, function(req){
      var dep = modules[id][1][req];
      return require(dep ? dep : req);
    }, m, m.exports, outer, modules, cache, entries);

    // expose as `name`.
    if (name) cache[name] = cache[id];

    return cache[id].exports;
  }

  /**
   * Require all entries exposing them on global if needed.
   */

  for (var id in entries) {
    if (entries[id]) {
      global[entries[id]] = require(id);
    } else {
      require(id);
    }
  }

  /**
   * Duo flag.
   */

  require.duo = true;

  /**
   * Expose cache.
   */

  require.cache = cache;

  /**
   * Expose modules
   */

  require.modules = modules;

  /**
   * Return newest require.
   */

   return require;
})({
1: [function(require, module, exports) {
(function() {
  (function(win) {
    var attrs, fn, i, j, k, len, len1, prefix, ref, ref1, script, trakless;
    trakless = require('./trakless.coffee');
    attrs = {
      site: function(value) {
        return trakless.setSiteId(value);
      },
      pixel: function(value) {
        if (typeof value !== "string") {
          return;
        }
        return trakless.setPixel(value);
      }
    };
    ref = win.document.getElementsByTagName("script");
    for (i = 0, len = ref.length; i < len; i++) {
      script = ref[i];
      if (/trakless/i.test(script.src)) {
        ref1 = ['', 'data-'];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          prefix = ref1[j];
          for (k in attrs) {
            fn = attrs[k];
            fn(script.getAttribute(prefix + k));
          }
        }
      }
    }
    return win.trakless = trakless;
  })(window);

}).call(this);

}, {"./trakless.coffee":2}],
2: [function(require, module, exports) {
(function() {
  var $defaultTracker, $pixel, $siteid, tracker, trakless;

  tracker = require('./tracker.coffee');

  $defaultTracker = null;

  $siteid = 0;

  $pixel = '/pixel.gif';


  /**
   * tracker factory
  #
   */

  trakless = (function() {
    function trakless() {}


    /**
    	 * set default siteid
    	#
    	 * @param {Number} siteid - the site id
    	 * @return {Object}
     */

    trakless.setSiteId = function(siteid) {
      $siteid = siteid > 0 ? siteid : $siteid;
    };


    /**
    	 * set default pixel
    	#
    	 * @param {String} pixel - the default pixel url
    	 * @return {Object}
     */

    trakless.setPixel = function(pixelUrl) {
      $pixel = pixelUrl || $pixel;
    };


    /**
    	 * you can provide different siteid and pixelUrl for in multi-tracker and site scenario
    	#
    	 * @param {Number} siteid - the siteid
    	 * @param {String} pixelUrl - the pixel url
    	 * @return {Object}
     */

    trakless.getTracker = function(siteid, pixelUrl) {
      var rst;
      rst = new tracker(siteid, pixelUrl);
      rst.siteid = siteid || $siteid;
      rst.pixel = pixelUrl || $pixel;
      return rst;
    };


    /**
    	 * get the default racker
    	#
     */

    trakless.getDefaultTracker = function() {
      if ($defaultTracker == null) {
        $defaultTracker = trakless.getTracker();
      }
      return $defaultTracker;
    };


    /**
    	 * utility
    	#
     */

    trakless.util = myutil;

    return trakless;

  })();

  module.exports = trakless;

}).call(this);

}, {"./tracker.coffee":3}],
3: [function(require, module, exports) {
(function() {
  var $defaults, $sessionid, $uuid, Emitter, cookie, defaults, getImage, myutil, query, store, tracker, uuid, webanalyser;

  defaults = require('defaults');

  cookie = require('cookie');

  Emitter = require('emitter');

  query = require('querystring');

  store = require('segmentio-store.js');

  uuid = require('uuid');

  webanalyser = require('webanalyser');

  myutil = require('./myutil.coffee');

  $defaults = null;

  $uuid = store.get('uuid');

  $sessionid = cookie('pa:usid');

  if ($uuid == null) {
    $uuid = uuid();
    store.set('uuid', $uuid);
  }

  if ($sessionid == null) {
    $sessionid = new Date().getTime();
    cookie('tls:usid', $sessionid, {
      path: '/'
    });
  }


  /*
           * Send image request to server using GET.
           * The infamous web bug (or beacon) is a transparent, single pixel (1x1) image
   */

  getImage = function(cfgUrl, request, callback) {
    var image;
    image = new Image(1, 1);
    image.onload = function() {
      var iterator;
      iterator = 0;
      if (typeof callback === 'function') {
        callback();
      }
    };
    image.src = cfgUrl + (cfgUrl.indexOf('?') < 0 ? '?' : '&') + request;
    return image;
  };


  /**
   * tracker class
  #
   */

  tracker = (function() {
    function tracker() {}

    tracker.prototype.defaults = webanalyser.getResult();

    tracker.prototype.pixel = '/pixel.gif';

    tracker.prototype.siteid = 0;

    tracker.prototype._track = function(ht, extra) {
      var data, i, k, len, myData, myDef, pixel, v;
      if (extra == null) {
        extra = {};
      }
      if (this.siteid > 0) {
        pixel = myutil.trim(this.pixel);
        myDef = this.defaults;
        if ((pixel.indexOf('//') === 0) && (myDef.dl.indexOf('http') !== 0)) {
          pixel = 'http:' + pixel;
        }
        data = ht === 'pageview' ? defaults(extra, myDef) : extra;
        myData = {};
        for (v = i = 0, len = data.length; i < len; v = ++i) {
          k = data[v];
          if (v != null) {
            if (!(typeof v === "string") || (myutil.trim(v).length > 0)) {
              myData[k] = v;
            }
          }
        }
        myData.z = new Date().getTime();
        myData.ht = ht;
        myData.uuid = $uuid;
        myData.siteid = this.siteid;
        myData.usid = $sessionid;
        getImage(pixel, query.stringify(myData));
        this.emit('track', ht, data);
      }
      return this;
    };


    /**
    	 * track generic method
    	#
    	 * @param {String} ht - hit types with possible values of 'pageview', 'event', 'transaction', 'item', 'social', 'exception', 'timing', 'app', 'custom'
    	 * @param {Object} extra - extended data
    	 * @return {Object}
     */

    tracker.prototype.track = function(ht, extra) {
      var self;
      self = this;
      myutil.ready(function() {
        return self._track(ht || 'custom', extra);
      });
      return this;
    };


    /**
    	 * track pageview
    	#
    	 * @param {Object} extra - extended data
    	 * @return {Object}
     */

    tracker.prototype.trackPageView = function(extra) {
      return this.track('pageview', extra);
    };


    /**
    	 * track event
    	#
    	 * @param {String} category
    	 * @param {String} action
    	 * @param {String} label
    	 * @param {String} value - Values must be non-negative.
    	 * @return {Object}
     */

    tracker.prototype.trackEvent = function(category, action, label, value) {
      if (value && value < 0) {
        value = null;
      }
      return this.track('event', {
        ec: category || 'event',
        ea: action,
        el: label,
        ev: value
      });
    };


    /**
    	 * track item
    	#
    	 * @param {String} id - *required* [OD564]
    	 * @param {Number} name - *required* [Shoe] Specifies the item name.
    	 * @param {Number} price [3.50] Specifies the price for a single item / unit.
    	 * @param {Number} quantity [4] Specifies the number of items purchased.
    	 * @param {String} code [SKU47] Specifies the SKU or item code.
    	 * @param {String} category [Blue] Specifies the category that the item belongs to.
    	 * @param {String} currencycode [EUR] When present indicates the local currency for all transaction currency values. Value should be a valid ISO 4217 currency code.
    	 * @return {Object}
     */

    tracker.prototype.trackItemOrTransaction = function(id, name, price, quantity, code, category, currencycode) {
      return this.track('item', {
        ti: id,
        "in": name,
        ip: price,
        iq: quantity,
        ic: code,
        iv: category,
        cu: currencycode
      });
    };


    /**
    	 * track transaction
    	#
    	 * @param {String} id - *required* [OD564]
    	 * @param {String} affiliation [Member] Specifies the affiliation or store name.
    	 * @param {Number} revenue [15.47] Specifies the total revenue associated with the transaction. This value should include any shipping or tax costs.
    	 * @param {Number} shipping [3.50] Specifies the total shipping cost of the transaction.
    	 * @param {Number} tax [1.20] Specifies the total tax of the transaction.
    	 * @param {Number} price [3.50] Specifies the price for a single item / unit.
    	 * @param {Number} quantity [4] Specifies the number of items purchased.
    	 * @param {String} code [SKU47] Specifies the SKU or item code.
    	 * @param {String} category [Blue] Specifies the category that the item belongs to.
    	 * @param {String} currencycode [EUR] When present indicates the local currency for all transaction currency values. Value should be a valid ISO 4217 currency code.
    	 * @return {Object}
     */

    tracker.prototype.trackTransaction = function(id, affiliation, revenue, shipping, tax, name, price, quantity, code, category, currencycode) {
      return this.track('transaction', {
        ti: id,
        ta: affiliation,
        tr: revenue,
        ts: shipping,
        tt: tax,
        "in": name,
        ip: price,
        iq: quantity,
        ic: code,
        iv: category,
        cu: currencycode
      });
    };


    /**
    	 * track social
    	#
    	 * @param {String} network - *required* [facebook] Specifies the social network, for example Facebook or Google Plus.
    	 * @param {String} action - *required* [like] Specifies the social interaction action. For example on Google Plus when a user clicks the +1 button, the social action is 'plus'.
    	 * @param {String} target - *required* [http://foo.com] Specifies the target of a social interaction. This value is typically a URL but can be any text.
    	 * @return {Object}
     */

    tracker.prototype.trackSocial = function(network, action, target) {
      return this.track('social', {
        sn: network,
        sa: action,
        st: target
      });
    };


    /**
    	 * track exception
    	#
    	 * @param {String} description - Specifies the description of an exception.
    	 * @param {String} isFatal - true/false Specifies whether the exception was fatal.
    	 * @return {Object}
     */

    tracker.prototype.trackException = function(description, isFatal) {
      return this.track('exception', {
        exf: isFatal ? 1 : 0,
        exd: description
      });
    };


    /**
    	 * track app
    	#
    	 * @param {String} name - *required* [MyApp] Specifies the application name.
    	 * @param {String} id - *required* [com.company.app] Application identifier.
    	 * @param {String} version - *required* [1.2] Specifies the application version.
    	 * @param {String} installerid - *required* com.platform.vending
    	 * @return {Object}
     */

    tracker.prototype.trackApp = function(name, id, version, installerid) {
      return this.track('app', {
        an: name,
        aid: id,
        av: version,
        aiid: installer
      });
    };


    /**
    	 * track custom
    	#
    	 * @param {Object} customDataObject - object with any property you want
    	 * @return {Object}
     */

    tracker.prototype.trackCustom = function(customDataObject) {
      return this.track('custom', customDataObject);
    };

    return tracker;

  })();

  Emitter(tracker.prototype);

  module.exports = tracker;

}).call(this);

}, {"defaults":4,"cookie":5,"emitter":6,"querystring":7,"segmentio-store.js":8,"uuid":9,"webanalyser":10,"./myutil.coffee":11}],
4: [function(require, module, exports) {
'use strict';

/**
 * Merge default values.
 *
 * @param {Object} dest
 * @param {Object} defaults
 * @return {Object}
 * @api public
 */
var defaults = function (dest, src, recursive) {
  for (var prop in src) {
    if (recursive && dest[prop] instanceof Object && src[prop] instanceof Object) {
      dest[prop] = defaults(dest[prop], src[prop], true);
    } else if (! (prop in dest)) {
      dest[prop] = src[prop];
    }
  }

  return dest;
};

/**
 * Expose `defaults`.
 */
module.exports = defaults;

}, {}],
5: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var debug = require('debug')('cookie');

/**
 * Set or get cookie `name` with `value` and `options` object.
 *
 * @param {String} name
 * @param {String} value
 * @param {Object} options
 * @return {Mixed}
 * @api public
 */

module.exports = function(name, value, options){
  switch (arguments.length) {
    case 3:
    case 2:
      return set(name, value, options);
    case 1:
      return get(name);
    default:
      return all();
  }
};

/**
 * Set cookie `name` to `value`.
 *
 * @param {String} name
 * @param {String} value
 * @param {Object} options
 * @api private
 */

function set(name, value, options) {
  options = options || {};
  var str = encode(name) + '=' + encode(value);

  if (null == value) options.maxage = -1;

  if (options.maxage) {
    options.expires = new Date(+new Date + options.maxage);
  }

  if (options.path) str += '; path=' + options.path;
  if (options.domain) str += '; domain=' + options.domain;
  if (options.expires) str += '; expires=' + options.expires.toUTCString();
  if (options.secure) str += '; secure';

  document.cookie = str;
}

/**
 * Return all cookies.
 *
 * @return {Object}
 * @api private
 */

function all() {
  return parse(document.cookie);
}

/**
 * Get cookie `name`.
 *
 * @param {String} name
 * @return {String}
 * @api private
 */

function get(name) {
  return all()[name];
}

/**
 * Parse cookie `str`.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parse(str) {
  var obj = {};
  var pairs = str.split(/ *; */);
  var pair;
  if ('' == pairs[0]) return obj;
  for (var i = 0; i < pairs.length; ++i) {
    pair = pairs[i].split('=');
    obj[decode(pair[0])] = decode(pair[1]);
  }
  return obj;
}

/**
 * Encode.
 */

function encode(value){
  try {
    return encodeURIComponent(value);
  } catch (e) {
    debug('error `encode(%o)` - %o', value, e)
  }
}

/**
 * Decode.
 */

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch (e) {
    debug('error `decode(%o)` - %o', value, e)
  }
}

}, {"debug":12}],
12: [function(require, module, exports) {

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Use chrome.storage.local if we are in an app
 */

var storage;

if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined')
  storage = chrome.storage.local;
else
  storage = localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      storage.removeItem('debug');
    } else {
      storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

}, {"./debug":13}],
13: [function(require, module, exports) {

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

}, {"ms":14}],
14: [function(require, module, exports) {
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

}, {}],
6: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  fn._off = on;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = index(callbacks, fn._off || fn);
  if (~i) callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

}, {"indexof":15}],
15: [function(require, module, exports) {
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
}, {}],
7: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var encode = encodeURIComponent;
var decode = decodeURIComponent;
var trim = require('trim');
var type = require('type');

/**
 * Parse the given query `str`.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if ('string' != typeof str) return {};

  str = trim(str);
  if ('' == str) return {};
  if ('?' == str.charAt(0)) str = str.slice(1);

  var obj = {};
  var pairs = str.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var parts = pairs[i].split('=');
    var key = decode(parts[0]);
    var m;

    if (m = /(\w+)\[(\d+)\]/.exec(key)) {
      obj[m[1]] = obj[m[1]] || [];
      obj[m[1]][m[2]] = decode(parts[1]);
      continue;
    }

    obj[parts[0]] = null == parts[1]
      ? ''
      : decode(parts[1]);
  }

  return obj;
};

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

exports.stringify = function(obj){
  if (!obj) return '';
  var pairs = [];

  for (var key in obj) {
    var value = obj[key];

    if ('array' == type(value)) {
      for (var i = 0; i < value.length; ++i) {
        pairs.push(encode(key + '[' + i + ']') + '=' + encode(value[i]));
      }
      continue;
    }

    pairs.push(encode(key) + '=' + encode(obj[key]));
  }

  return pairs.join('&');
};

}, {"trim":16,"type":17}],
16: [function(require, module, exports) {

exports = module.exports = trim;

function trim(str){
  if (str.trim) return str.trim();
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  if (str.trimLeft) return str.trimLeft();
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  if (str.trimRight) return str.trimRight();
  return str.replace(/\s*$/, '');
};

}, {}],
17: [function(require, module, exports) {
/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object Error]': return 'error';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val !== val) return 'nan';
  if (val && val.nodeType === 1) return 'element';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val)

  return typeof val;
};

}, {}],
8: [function(require, module, exports) {
var json             = require('json')
  , store            = {}
  , win              = window
	,	doc              = win.document
	,	localStorageName = 'localStorage'
	,	namespace        = '__storejs__'
	,	storage;

store.disabled = false
store.set = function(key, value) {}
store.get = function(key) {}
store.remove = function(key) {}
store.clear = function() {}
store.transact = function(key, defaultVal, transactionFn) {
	var val = store.get(key)
	if (transactionFn == null) {
		transactionFn = defaultVal
		defaultVal = null
	}
	if (typeof val == 'undefined') { val = defaultVal || {} }
	transactionFn(val)
	store.set(key, val)
}
store.getAll = function() {}

store.serialize = function(value) {
	return json.stringify(value)
}
store.deserialize = function(value) {
	if (typeof value != 'string') { return undefined }
	try { return json.parse(value) }
	catch(e) { return value || undefined }
}

// Functions to encapsulate questionable FireFox 3.6.13 behavior
// when about.config::dom.storage.enabled === false
// See https://github.com/marcuswestin/store.js/issues#issue/13
function isLocalStorageNameSupported() {
	try { return (localStorageName in win && win[localStorageName]) }
	catch(err) { return false }
}

if (isLocalStorageNameSupported()) {
	storage = win[localStorageName]
	store.set = function(key, val) {
		if (val === undefined) { return store.remove(key) }
		storage.setItem(key, store.serialize(val))
		return val
	}
	store.get = function(key) { return store.deserialize(storage.getItem(key)) }
	store.remove = function(key) { storage.removeItem(key) }
	store.clear = function() { storage.clear() }
	store.getAll = function() {
		var ret = {}
		for (var i=0; i<storage.length; ++i) {
			var key = storage.key(i)
			ret[key] = store.get(key)
		}
		return ret
	}
} else if (doc.documentElement.addBehavior) {
	var storageOwner,
		storageContainer
	// Since #userData storage applies only to specific paths, we need to
	// somehow link our data to a specific path.  We choose /favicon.ico
	// as a pretty safe option, since all browsers already make a request to
	// this URL anyway and being a 404 will not hurt us here.  We wrap an
	// iframe pointing to the favicon in an ActiveXObject(htmlfile) object
	// (see: http://msdn.microsoft.com/en-us/library/aa752574(v=VS.85).aspx)
	// since the iframe access rules appear to allow direct access and
	// manipulation of the document element, even for a 404 page.  This
	// document can be used instead of the current document (which would
	// have been limited to the current path) to perform #userData storage.
	try {
		storageContainer = new ActiveXObject('htmlfile')
		storageContainer.open()
		storageContainer.write('<s' + 'cript>document.w=window</s' + 'cript><iframe src="/favicon.ico"></iframe>')
		storageContainer.close()
		storageOwner = storageContainer.w.frames[0].document
		storage = storageOwner.createElement('div')
	} catch(e) {
		// somehow ActiveXObject instantiation failed (perhaps some special
		// security settings or otherwse), fall back to per-path storage
		storage = doc.createElement('div')
		storageOwner = doc.body
	}
	function withIEStorage(storeFunction) {
		return function() {
			var args = Array.prototype.slice.call(arguments, 0)
			args.unshift(storage)
			// See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
			// and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
			storageOwner.appendChild(storage)
			storage.addBehavior('#default#userData')
			storage.load(localStorageName)
			var result = storeFunction.apply(store, args)
			storageOwner.removeChild(storage)
			return result
		}
	}

	// In IE7, keys may not contain special chars. See all of https://github.com/marcuswestin/store.js/issues/40
	var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")
	function ieKeyFix(key) {
		return key.replace(forbiddenCharsRegex, '___')
	}
	store.set = withIEStorage(function(storage, key, val) {
		key = ieKeyFix(key)
		if (val === undefined) { return store.remove(key) }
		storage.setAttribute(key, store.serialize(val))
		storage.save(localStorageName)
		return val
	})
	store.get = withIEStorage(function(storage, key) {
		key = ieKeyFix(key)
		return store.deserialize(storage.getAttribute(key))
	})
	store.remove = withIEStorage(function(storage, key) {
		key = ieKeyFix(key)
		storage.removeAttribute(key)
		storage.save(localStorageName)
	})
	store.clear = withIEStorage(function(storage) {
		var attributes = storage.XMLDocument.documentElement.attributes
		storage.load(localStorageName)
		for (var i=0, attr; attr=attributes[i]; i++) {
			storage.removeAttribute(attr.name)
		}
		storage.save(localStorageName)
	})
	store.getAll = withIEStorage(function(storage) {
		var attributes = storage.XMLDocument.documentElement.attributes
		var ret = {}
		for (var i=0, attr; attr=attributes[i]; ++i) {
			var key = ieKeyFix(attr.name)
			ret[attr.name] = store.deserialize(storage.getAttribute(key))
		}
		return ret
	})
}

try {
	store.set(namespace, namespace)
	if (store.get(namespace) != namespace) { store.disabled = true }
	store.remove(namespace)
} catch(e) {
	store.disabled = true
}
store.enabled = !store.disabled

module.exports = store;
}, {"json":18}],
18: [function(require, module, exports) {

var json = window.JSON || {};
var stringify = json.stringify;
var parse = json.parse;

module.exports = parse && stringify
  ? JSON
  : require('json-fallback');

}, {"json-fallback":19}],
19: [function(require, module, exports) {
/*
    json2.js
    2014-02-04

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

(function () {
    'use strict';

    var JSON = module.exports = {};

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function () {
                return this.valueOf();
            };
    }

    var cx,
        escapable,
        gap,
        indent,
        meta,
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        };
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

}, {}],
9: [function(require, module, exports) {

/**
 * Taken straight from jed's gist: https://gist.github.com/982883
 *
 * Returns a random v4 UUID of the form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx,
 * where each x is replaced with a random hexadecimal digit from 0 to f, and
 * y is replaced with a random hexadecimal digit from 8 to b.
 */

module.exports = function uuid(a){
  return a           // if the placeholder was passed, return
    ? (              // a random number from 0 to 15
      a ^            // unless b is 8,
      Math.random()  // in which case
      * 16           // a random number from
      >> a/4         // 8 to 11
      ).toString(16) // in hexadecimal
    : (              // or otherwise a concatenated string:
      [1e7] +        // 10000000 +
      -1e3 +         // -1000 +
      -4e3 +         // -4000 +
      -8e3 +         // -80000000 +
      -1e11          // -100000000000,
      ).replace(     // replacing
        /[018]/g,    // zeroes, ones, and eights with
        uuid         // random hex digits
      )
};
}, {}],
10: [function(require, module, exports) {
(function umd(require){
  if ('object' == typeof exports) {
    module.exports = require('1');
  } else if ('function' == typeof define && define.amd) {
    define(function(){ return require('1'); });
  } else {
    this['webanalyser'] = require('1');
  }
})((function outer(modules, cache, entries){

  /**
   * Global
   */

  var global = (function(){ return this; })();

  /**
   * Require `name`.
   *
   * @param {String} name
   * @param {Boolean} jumped
   * @api public
   */

  function require(name, jumped){
    if (cache[name]) return cache[name].exports;
    if (modules[name]) return call(name, require);
    throw new Error('cannot find module "' + name + '"');
  }

  /**
   * Call module `id` and cache it.
   *
   * @param {Number} id
   * @param {Function} require
   * @return {Function}
   * @api private
   */

  function call(id, require){
    var m = cache[id] = { exports: {} };
    var mod = modules[id];
    var name = mod[2];
    var fn = mod[0];

    fn.call(m.exports, function(req){
      var dep = modules[id][1][req];
      return require(dep ? dep : req);
    }, m, m.exports, outer, modules, cache, entries);

    // expose as `name`.
    if (name) cache[name] = cache[id];

    return cache[id].exports;
  }

  /**
   * Require all entries exposing them on global if needed.
   */

  for (var id in entries) {
    if (entries[id]) {
      global[entries[id]] = require(id);
    } else {
      require(id);
    }
  }

  /**
   * Duo flag.
   */

  require.duo = true;

  /**
   * Expose cache.
   */

  require.cache = cache;

  /**
   * Expose modules
   */

  require.modules = modules;

  /**
   * Return newest require.
   */

   return require;
})({
1: [function(require, module, exports) {
(function() {
  (function(document, navigator, screen, location) {
    'use strict';
    var $defaults, $endTime, $onLoadHandlers, $startTime, $timeoutId, defaults, flashdetect, result, webanalyser;
    defaults = require('defaults');
    flashdetect = require('flashdetect');
    $startTime = new Date().getTime();
    $endTime = new Date().getTime();
    $timeoutId = null;
    $onLoadHandlers = [];
    $defaults = {
      sr: screen.width + "x" + screen.height,
      vp: screen.availWidth + "x" + screen.availHeight,
      sd: screen.colorDepth,
      je: navigator.javaEnabled ? navigator.javaEnabled() : false,
      ul: navigator.languages ? navigator.languages[0] : navigator.language || navigator.userLanguage || navigator.browserLanguage
    };

    /**
     * webanalyser
     */
    webanalyser = (function() {
      function webanalyser() {}

      webanalyser.prototype.getResult = function() {
        var rst;
        if (defaults.dl == null) {
          rst = {
            dr: document.referrer,
            dl: location.href,
            dh: location.hostname,
            dt: document.title,
            z: new Date().getTime()
          };
          if (flashdetect.installed) {
            rst.fl = flashdetect.major + " " + flashdetect.minor + " " + flashdetect.revisionStr;
          }
          $defaults = defaults(rst, $defaults);
        }
        return $defaults;
      };

      return webanalyser;

    })();
    result = new webanalyser();
    return module.exports = result;
  })(document, navigator, screen, location);

}).call(this);

}, {"defaults":2,"flashdetect":3}],
2: [function(require, module, exports) {
'use strict';

/**
 * Merge default values.
 *
 * @param {Object} dest
 * @param {Object} defaults
 * @return {Object}
 * @api public
 */
var defaults = function (dest, src, recursive) {
  for (var prop in src) {
    if (recursive && dest[prop] instanceof Object && src[prop] instanceof Object) {
      dest[prop] = defaults(dest[prop], src[prop], true);
    } else if (! (prop in dest)) {
      dest[prop] = src[prop];
    }
  }

  return dest;
};

/**
 * Expose `defaults`.
 */
module.exports = defaults;

}, {}],
3: [function(require, module, exports) {
/*
Copyright (c) Copyright (c) 2007, Carl S. Yestrau All rights reserved.
Code licensed under the BSD License: http://www.featureblend.com/license.txt
Version: 1.0.4
*/
var flashdetect = new function(){
    var self = this;
    self.installed = false;
    self.raw = "";
    self.major = -1;
    self.minor = -1;
    self.revision = -1;
    self.revisionStr = "";
    var activeXDetectRules = [
        {
            "name":"ShockwaveFlash.ShockwaveFlash.7",
            "version":function(obj){
                return getActiveXVersion(obj);
            }
        },
        {
            "name":"ShockwaveFlash.ShockwaveFlash.6",
            "version":function(obj){
                var version = "6,0,21";
                try{
                    obj.AllowScriptAccess = "always";
                    version = getActiveXVersion(obj);
                }catch(err){}
                return version;
            }
        },
        {
            "name":"ShockwaveFlash.ShockwaveFlash",
            "version":function(obj){
                return getActiveXVersion(obj);
            }
        }
    ];
    /**
     * Extract the ActiveX version of the plugin.
     * 
     * @param {Object} The flash ActiveX object.
     * @type String
     */
    var getActiveXVersion = function(activeXObj){
        var version = -1;
        try{
            version = activeXObj.GetVariable("$version");
        }catch(err){}
        return version;
    };
    /**
     * Try and retrieve an ActiveX object having a specified name.
     * 
     * @param {String} name The ActiveX object name lookup.
     * @return One of ActiveX object or a simple object having an attribute of activeXError with a value of true.
     * @type Object
     */
    var getActiveXObject = function(name){
        var obj = -1;
        try{
            obj = new ActiveXObject(name);
        }catch(err){
            obj = {activeXError:true};
        }
        return obj;
    };
    /**
     * Parse an ActiveX $version string into an object.
     * 
     * @param {String} str The ActiveX Object GetVariable($version) return value. 
     * @return An object having raw, major, minor, revision and revisionStr attributes.
     * @type Object
     */
    var parseActiveXVersion = function(str){
        var versionArray = str.split(",");//replace with regex
        return {
            "raw":str,
            "major":parseInt(versionArray[0].split(" ")[1], 10),
            "minor":parseInt(versionArray[1], 10),
            "revision":parseInt(versionArray[2], 10),
            "revisionStr":versionArray[2]
        };
    };
    /**
     * Parse a standard enabledPlugin.description into an object.
     * 
     * @param {String} str The enabledPlugin.description value.
     * @return An object having raw, major, minor, revision and revisionStr attributes.
     * @type Object
     */
    var parseStandardVersion = function(str){
        var descParts = str.split(/ +/);
        var majorMinor = descParts[2].split(/\./);
        var revisionStr = descParts[3];
        return {
            "raw":str,
            "major":parseInt(majorMinor[0], 10),
            "minor":parseInt(majorMinor[1], 10), 
            "revisionStr":revisionStr,
            "revision":parseRevisionStrToInt(revisionStr)
        };
    };
    /**
     * Parse the plugin revision string into an integer.
     * 
     * @param {String} The revision in string format.
     * @type Number
     */
    var parseRevisionStrToInt = function(str){
        return parseInt(str.replace(/[a-zA-Z]/g, ""), 10) || self.revision;
    };
    /**
     * Is the major version greater than or equal to a specified version.
     * 
     * @param {Number} version The minimum required major version.
     * @type Boolean
     */
    self.majorAtLeast = function(version){
        return self.major >= version;
    };
    /**
     * Is the minor version greater than or equal to a specified version.
     * 
     * @param {Number} version The minimum required minor version.
     * @type Boolean
     */
    self.minorAtLeast = function(version){
        return self.minor >= version;
    };
    /**
     * Is the revision version greater than or equal to a specified version.
     * 
     * @param {Number} version The minimum required revision version.
     * @type Boolean
     */
    self.revisionAtLeast = function(version){
        return self.revision >= version;
    };
    /**
     * Is the version greater than or equal to a specified major, minor and revision.
     * 
     * @param {Number} major The minimum required major version.
     * @param {Number} (Optional) minor The minimum required minor version.
     * @param {Number} (Optional) revision The minimum required revision version.
     * @type Boolean
     */
    self.versionAtLeast = function(major){
        var properties = [self.major, self.minor, self.revision];
        var len = Math.min(properties.length, arguments.length);
        for(i=0; i<len; i++){
            if(properties[i]>=arguments[i]){
                if(i+1<len && properties[i]==arguments[i]){
                    continue;
                }else{
                    return true;
                }
            }else{
                return false;
            }
        }
    };
    /**
     * Constructor, sets raw, major, minor, revisionStr, revision and installed public properties.
     */
    self.flashdetect = function(){
        if(navigator.plugins && navigator.plugins.length>0){
            var type = 'application/x-shockwave-flash';
            var mimeTypes = navigator.mimeTypes;
            if(mimeTypes && mimeTypes[type] && mimeTypes[type].enabledPlugin && mimeTypes[type].enabledPlugin.description){
                var version = mimeTypes[type].enabledPlugin.description;
                var versionObj = parseStandardVersion(version);
                self.raw = versionObj.raw;
                self.major = versionObj.major;
                self.minor = versionObj.minor; 
                self.revisionStr = versionObj.revisionStr;
                self.revision = versionObj.revision;
                self.installed = true;
            }
        }else if(navigator.appVersion.indexOf("Mac")==-1 && window.execScript){
            var version = -1;
            for(var i=0; i<activeXDetectRules.length && version==-1; i++){
                var obj = getActiveXObject(activeXDetectRules[i].name);
                if(!obj.activeXError){
                    self.installed = true;
                    version = activeXDetectRules[i].version(obj);
                    if(version!=-1){
                        var versionObj = parseActiveXVersion(version);
                        self.raw = versionObj.raw;
                        self.major = versionObj.major;
                        self.minor = versionObj.minor; 
                        self.revision = versionObj.revision;
                        self.revisionStr = versionObj.revisionStr;
                    }
                }
            }
        }
    }();
};
flashdetect.JS_RELEASE = "1.0.4";

module.exports = flashdetect;

}, {}]}, {}, {"1":""})
);
}, {"defaults":4,"flashdetect":20}],
20: [function(require, module, exports) {
/*
Copyright (c) Copyright (c) 2007, Carl S. Yestrau All rights reserved.
Code licensed under the BSD License: http://www.featureblend.com/license.txt
Version: 1.0.4
*/
var flashdetect = new function(){
    var self = this;
    self.installed = false;
    self.raw = "";
    self.major = -1;
    self.minor = -1;
    self.revision = -1;
    self.revisionStr = "";
    var activeXDetectRules = [
        {
            "name":"ShockwaveFlash.ShockwaveFlash.7",
            "version":function(obj){
                return getActiveXVersion(obj);
            }
        },
        {
            "name":"ShockwaveFlash.ShockwaveFlash.6",
            "version":function(obj){
                var version = "6,0,21";
                try{
                    obj.AllowScriptAccess = "always";
                    version = getActiveXVersion(obj);
                }catch(err){}
                return version;
            }
        },
        {
            "name":"ShockwaveFlash.ShockwaveFlash",
            "version":function(obj){
                return getActiveXVersion(obj);
            }
        }
    ];
    /**
     * Extract the ActiveX version of the plugin.
     * 
     * @param {Object} The flash ActiveX object.
     * @type String
     */
    var getActiveXVersion = function(activeXObj){
        var version = -1;
        try{
            version = activeXObj.GetVariable("$version");
        }catch(err){}
        return version;
    };
    /**
     * Try and retrieve an ActiveX object having a specified name.
     * 
     * @param {String} name The ActiveX object name lookup.
     * @return One of ActiveX object or a simple object having an attribute of activeXError with a value of true.
     * @type Object
     */
    var getActiveXObject = function(name){
        var obj = -1;
        try{
            obj = new ActiveXObject(name);
        }catch(err){
            obj = {activeXError:true};
        }
        return obj;
    };
    /**
     * Parse an ActiveX $version string into an object.
     * 
     * @param {String} str The ActiveX Object GetVariable($version) return value. 
     * @return An object having raw, major, minor, revision and revisionStr attributes.
     * @type Object
     */
    var parseActiveXVersion = function(str){
        var versionArray = str.split(",");//replace with regex
        return {
            "raw":str,
            "major":parseInt(versionArray[0].split(" ")[1], 10),
            "minor":parseInt(versionArray[1], 10),
            "revision":parseInt(versionArray[2], 10),
            "revisionStr":versionArray[2]
        };
    };
    /**
     * Parse a standard enabledPlugin.description into an object.
     * 
     * @param {String} str The enabledPlugin.description value.
     * @return An object having raw, major, minor, revision and revisionStr attributes.
     * @type Object
     */
    var parseStandardVersion = function(str){
        var descParts = str.split(/ +/);
        var majorMinor = descParts[2].split(/\./);
        var revisionStr = descParts[3];
        return {
            "raw":str,
            "major":parseInt(majorMinor[0], 10),
            "minor":parseInt(majorMinor[1], 10), 
            "revisionStr":revisionStr,
            "revision":parseRevisionStrToInt(revisionStr)
        };
    };
    /**
     * Parse the plugin revision string into an integer.
     * 
     * @param {String} The revision in string format.
     * @type Number
     */
    var parseRevisionStrToInt = function(str){
        return parseInt(str.replace(/[a-zA-Z]/g, ""), 10) || self.revision;
    };
    /**
     * Is the major version greater than or equal to a specified version.
     * 
     * @param {Number} version The minimum required major version.
     * @type Boolean
     */
    self.majorAtLeast = function(version){
        return self.major >= version;
    };
    /**
     * Is the minor version greater than or equal to a specified version.
     * 
     * @param {Number} version The minimum required minor version.
     * @type Boolean
     */
    self.minorAtLeast = function(version){
        return self.minor >= version;
    };
    /**
     * Is the revision version greater than or equal to a specified version.
     * 
     * @param {Number} version The minimum required revision version.
     * @type Boolean
     */
    self.revisionAtLeast = function(version){
        return self.revision >= version;
    };
    /**
     * Is the version greater than or equal to a specified major, minor and revision.
     * 
     * @param {Number} major The minimum required major version.
     * @param {Number} (Optional) minor The minimum required minor version.
     * @param {Number} (Optional) revision The minimum required revision version.
     * @type Boolean
     */
    self.versionAtLeast = function(major){
        var properties = [self.major, self.minor, self.revision];
        var len = Math.min(properties.length, arguments.length);
        for(i=0; i<len; i++){
            if(properties[i]>=arguments[i]){
                if(i+1<len && properties[i]==arguments[i]){
                    continue;
                }else{
                    return true;
                }
            }else{
                return false;
            }
        }
    };
    /**
     * Constructor, sets raw, major, minor, revisionStr, revision and installed public properties.
     */
    self.flashdetect = function(){
        if(navigator.plugins && navigator.plugins.length>0){
            var type = 'application/x-shockwave-flash';
            var mimeTypes = navigator.mimeTypes;
            if(mimeTypes && mimeTypes[type] && mimeTypes[type].enabledPlugin && mimeTypes[type].enabledPlugin.description){
                var version = mimeTypes[type].enabledPlugin.description;
                var versionObj = parseStandardVersion(version);
                self.raw = versionObj.raw;
                self.major = versionObj.major;
                self.minor = versionObj.minor; 
                self.revisionStr = versionObj.revisionStr;
                self.revision = versionObj.revision;
                self.installed = true;
            }
        }else if(navigator.appVersion.indexOf("Mac")==-1 && window.execScript){
            var version = -1;
            for(var i=0; i<activeXDetectRules.length && version==-1; i++){
                var obj = getActiveXObject(activeXDetectRules[i].name);
                if(!obj.activeXError){
                    self.installed = true;
                    version = activeXDetectRules[i].version(obj);
                    if(version!=-1){
                        var versionObj = parseActiveXVersion(version);
                        self.raw = versionObj.raw;
                        self.major = versionObj.major;
                        self.minor = versionObj.minor; 
                        self.revision = versionObj.revision;
                        self.revisionStr = versionObj.revisionStr;
                    }
                }
            }
        }
    }();
};
flashdetect.JS_RELEASE = "1.0.4";

module.exports = flashdetect;

}, {}],
11: [function(require, module, exports) {
(function() {
  (function(win) {
    var $trakless2, doc, domevent, myutil, traklessParent;
    domevent = require('domevent');
    $trakless2 = win.trakless;
    doc = win.document;

    /**
     *  util
     */
    myutil = (function() {
      function myutil() {}


      /**
       * allow for getting all attributes
      #
       * @param {HTMLElement} el - element
       * @return {Object}
       */

      myutil.allData = function(el) {
        var camelCaseName, data, i, k, len, name, ref, v;
        data = {};
        ref = el.attributes;
        for (v = i = 0, len = ref.length; i < len; v = ++i) {
          k = ref[v];
          name = /^data-/.replace(attr.name, '');
          camelCaseName = name.replace(/-(.)/g, function($0, $1) {
            return $1.toUpperCase();
          });
          data[camelCaseName] = attr.value;
        }
        return data;
      };


      /**
       * mini jquery
      #
       */

      myutil.$ = domevent;


      /**
       * attach to event
      #
       * @param {String} ename - event name
       * @param {Function} cb - callback
       * @return {Object}
       */

      myutil.on = function(ename, cb) {
        domevent(doc).on(ename, cb);
        return this;
      };


      /**
       * detach event
      #
       * @param {String} ename - event name
       * @param {Function} cb - callback
       * @return {Object}
       */

      myutil.off = function(ename, cb) {
        domevent(doc).off(ename, cb);
        return this;
      };


      /**
       * trigger event
      #
       * @param {String} ename - event name
       * @param {Object} edata - event data
       * @return {Object}
       */

      myutil.trigger = function(ename, edata) {
        if ($trakless2 && $trakless2.util) {
          $trakless2.util.$.trigger({
            type: ename,
            detail: edata
          });
        }
        return this;
      };


      /**
       * parse a string to JSON, return string if fail
      #
       * @param {String} v - string value
       * @return {Object}
       */

      myutil.stringToJSON = function(v) {
        var v2;
        if (typeof v === "string") {
          v2 = domevent.parseJSON(v);
          if (!(v2 == null)) {
            return v2;
          }
        }
        return v;
      };


      /**
       * get or set session data - store in cookie
       * if no value is provided, then it is a get
      #
       * @param {String} k - key
       * @param {Object} v - value
       * @return {Object}
       */

      myutil.session = function(k, v) {
        if ((v != null)) {
          if (!(typeof v === "string")) {
            v = domevent.toJSON(v);
          }
          cookie('tls:' + k, v, {
            path: '/'
          });
          return v;
        }
        return this.stringToJSON(cookie('tls:' + k));
      };


      /**
       * click listener - useful util for click tracking
      #
       * @param {String} el - element or parent
       * @param {Function} handler - function handler
       * @param {String} monitor - selector/query of child to monitor
       * @return {Object}
       */

      myutil.onClick = function(el, handler, monitor) {
        domevent(el).on('click', handler, monitor);
        return this;
      };


      /**
       * document ready
      #
       */

      myutil.ready = domevent.ready;


      /**
       * each
      #
       */

      myutil.applyDefaults = defaults;


      /**
       * trim
      #
       */

      myutil.trim = function(v) {
        return v.replace(/^\s+|\s+$/gm, '');
      };

      return myutil;

    })();
    $trakless2 = trakless;
    if (win.top !== win) {
      try {
        traklessParent = win.top.trakless;
        $trakless2 = traklessParent;
      } catch (_error) {
        $trakless2 = win.parent.trakless;
      }
    }
    return module.exports = myutil;
  })(window);

}).call(this);

}, {"domevent":21}],
21: [function(require, module, exports) {
myObj = null
mydefine = function(h, F){
	myObj = F().$;
};
// minified.js config start -- use this comment to re-create a configuration in the Builder
// - Only sections always, each, error, fill, get, ie6compatibility, 
// - ie7compatibility, ie8compatibility, ie9compatibility, off, on, onclick, parsejson, 
// - promise, ready, request, set, tojson, trigger, values, wait.


mydefine("minified",function(){function E(a){return a!=g?""+a:""}function A(a){return"string"==typeof a}function B(a){return a&&a.nodeType}function F(a){return a}function m(a,b,c){return E(a).replace(b,c!=g?c:"")}function C(a,b,c){for(var d in a)a.hasOwnProperty(d)&&b.call(c||a,d,a[d]);return a}function r(a,b,c){if(a)for(var d=0;d<a.length;d++)b.call(c||a,a[d],d);return a}function P(a,b){var c=[],d=n(b)?b:function(a){return b!=a};r(a,function(b,f){d.call(a,b,f)&&c.push(b)});return c}function x(a,b,
c){var d=[];a(b,function(a,f){t(a=c.call(b,a,f))?r(a,function(a){d.push(a)}):a!=g&&d.push(a)});return d}function G(a,b){var c=[];r(a,function(d,e){c.push(b.call(a,d,e))});return c}function K(a,b){var c=b||{},d;for(d in a)c[d]=a[d]}function L(a,b,c){if(n(a))return a.apply(c&&b,G(c||b,F))}function Q(a){G(a,function(a){return L(a,void 0,void 0)})}function R(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}function n(a){return"function"==typeof a&&!a.item}function t(a){return a&&a.length!=
g&&!A(a)&&!B(a)&&!n(a)&&a!==p}function S(a,b){for(var c=0;a&&c<a.length;c++)a[c]===b&&a.splice(c--,1)}function H(a){return a.Nia=a.Nia||++Z}function T(a,b){var c=[],d={},e;l(a,function(a){l(b(a),function(a){d[e=H(a)]||(c.push(a),d[e]=!0)})});return c}function aa(a,b,c,d,e,f){return function(h,k){var g,u=h||p.event,U=!f,y=k||u.target||u.srcElement;if(f)for(;y&&y!=b&&!(U=f(y));)y=y.parentNode;U&&(g=(!a.apply(q(f?y:b),c||[u,d])||""==e)&&"|"!=e)&&!k&&(u.preventDefault&&(u.preventDefault(),u.stopPropagation()),
u.cancelBubble=!0);return!g}}function M(a,b){l(b,function(a){a.element.detachEvent("on"+a.a,a.b)})}function V(a){D?D.push(a):setTimeout(a,0)}function W(a){return x(l,a,function(a){if(t(a))return W(a);B(a)&&(a=a.cloneNode(!0),a.removeAttribute&&a.removeAttribute("id"));return a})}function q(a,b,c){return n(a)?V(a):new I(z(a,b,c))}function z(a,b,c){function d(a){a=x(l,a,function y(a){return t(a)?x(l,a,y):a});return f?P(a,function(a){for(;a=a.parentNode;)if(a==f||c)return a==f}):a}function e(a,b){var c=
RegExp("(^|\\s+)"+a+"(?=$|\\s)","i");return function(d){return a?c.test(d[b]):!0}}var f,h,k,g;if(b&&1!=(b=z(b)).length)return T(b,function(b){return z(a,b,c)});f=b&&b[0];if(!A(a))return d(a);if(f&&1!=B(f))return[];if(1<(b=a.split(/\s*,\s*/)).length)return T(b,function(a){return z(a,f,c)});if(b=/(\S+)\s+(.+)$/.exec(a))return z(b[2],z(b[1],f),c);if(a!=(b=m(a,/^#/)))return d(document.getElementById(b));h=(b=/([\w-]*)\.?([\w-]*)/.exec(a))[1];g=b[2];b=(k=document.getElementsByClassName&&g)?(f||document).getElementsByClassName(g):
(f||document).getElementsByTagName(h||"*");if(h=k?h:g)b=P(b,e(h,k?"tagName":"className"));return c?d(b):b}function ba(a,b){function c(a,b){var c=RegExp("(^|\\s+)"+a+"(?=$|\\s)","i");return function(d){return a?c.test(d[b]):!0}}var d={},e=d;if(n(a))return a;if("number"==typeof a)return function(b,c){return c==a};if(!a||"*"==a||A(a)&&(e=/^([\w-]*)\.?([\w-]*)$/.exec(a))){var f=c(e[1],"tagName"),h=c(e[2],"className");return function(a){return 1==B(a)&&f(a)&&h(a)}}if(b)return function(c){return q(a,b).find(c)!=
g};q(a).each(function(a){d[H(a)]=!0});return function(a){return d[H(a)]}}function l(a,b){t(a)?r(a,b):a!=g&&b(a,0);return a}function J(){function a(a,d){b==g&&a!=g&&(b=a,h=t(d)?d:[d],setTimeout(function(){r(c,function(a){a()})},0));return b}var b,c=[],d=arguments,e=d.length,f=0,h=[];r(d,function u(b,c){try{b.then?b.then(function(b){var d;(b&&"object"==typeof b||n(b))&&n(d=b.then)?u(d,c):(h[c]=G(arguments,F),++f==e&&a(!0,2>e?h[c]:h))},function(b){h[c]=G(arguments,F);a(!1,2>e?h[c]:[h[c][0],h,c])}):b(function(){a(!0,
arguments)},function(){a(!1,arguments)})}catch(d){a(!1,[d,h,c])}});a.stop=function(){r(d,function(a){a.stop&&a.stop()});return L(a.stop0)};var k=a.then=function(d,e){function f(){try{var a=b?d:e;n(a)?function ca(a){try{var b,c=0;if((a&&"object"==typeof a||n(a))&&n(b=a.then)){if(a===k)throw new TypeError;b.call(a,function(a){c++||ca(a)},function(a){c++||k(!1,[a])});k.stop0=a.stop}else k(!0,[a])}catch(d){c++||k(!1,[d])}}(L(a,X,h)):k(b,h)}catch(c){k(!1,[c])}}var k=J();k.stop0=a.stop;b!=g?setTimeout(f,
0):c.push(f);return k};a.always=function(a){return k(a,a)};a.error=function(a){return k(0,a)};return a}function I(a,b){var c=0;if(a)for(var d=0,e=a.length;d<e;d++){var f=a[d];if(b&&t(f))for(var h=0,k=f.length;h<k;h++)this[c++]=f[h];else this[c++]=f}else this[c++]=b;this.length=c;this._=!0}var p=this,N={},O={},Z=1,v={},D=/^[ic]/.test(document.readyState)?g:[],w=!!document.all&&!document.addEventListener,g=null,X;K({each:function(a){return function(b,c,d){return a(this,b,c,d)}}(r),f:0,remove:function(){l(this,
function(a){w&&1==B(a)&&(l(z("*",a),function(a){M(0,v[a.Nia]);delete v[a.Nia]}),M(0,v[a.Nia]),delete v[a.Nia]);a.parentNode.removeChild(a)})},get:function(a,b){var c=this,d=c[0];if(d){if(A(a)){var e=/^(\W*)(.*)/.exec(m(a,/^%/,"@data-")),f=e[1],d=O[f]?O[f](this,e[2]):"$"==a?c.get("className"):"$$"==a?w?d.style.cssText:c.get("@style"):"$$slide"==a?c.get("$height"):"$$fade"==a||"$$show"==a?"hidden"==c.get("$visibility")||"none"==c.get("$display")?0:"$$fade"==a?w?isNaN(c.get("$filter",!0))?1:c.get("$filter",
!0)/100:isNaN(c.get("$opacity",!0))?1:c.get("$opacity",!0):1:"$$scrollX"==a?p.pageXOffset!=g?p.pageXOffset:(document.documentElement||document.body.parentNode||document.body).scrollLeft:"$$scrollY"==a?p.pageXOffset!=g?p.pageYOffset:(document.documentElement||document.body.parentNode||document.body).scrollTop:"$"==f?p.getComputedStyle?p.getComputedStyle(d,g).getPropertyValue(m(e[2],/[A-Z]/g,function(a){return"-"+a.toLowerCase()})):(d.currentStyle||d.style)[m(e[2],/^float$/,"cssFloat")]:"@"==f?d.getAttribute(e[2]):
d[e[2]];return b?parseFloat(m(d,/^[^\d-]+/)):d}var h={};(t(a)?l:C)(a,function(a){h[a]=c.get(a,b)});return h}},set:function(a,b){var c=this;if(b!==X){var d=/^(\W*)(.*)/.exec(m(m(a,/^\$float$/,"cssFloat"),/^%/,"@data-")),e=d[1];if(N[e])N[e](this,d[2],b);else"$$fade"==a?c.set({$visibility:b?"visible":"hidden"}).set(w?1>b?{$filter:"alpha(opacity = "+100*b+")",$zoom:1}:{$filter:""}:{$opacity:b}):"$$slide"==a?c.set({$visibility:b?"visible":"hidden",$overflow:"hidden",$height:/px/.test(b)?b:function(a,c,
d){a=q(d);d={$position:"absolute",$visibility:"hidden",$display:"block",$height:g};c=a.get(d);d=a.set(d).get("clientHeight");a.set(c);return d*b+"px"}}):"$$show"==a?b?c.set({$visibility:b?"visible":"hidden",$display:""}).set({$display:function(a){return"none"==a?"block":a}}):c.set({$display:"none"}):"$$"==a?w?c.set("$cssText",b):c.set("@style",b):l(this,function(c,h){var k=n(b)?b(q(c).get(a),h,c):b;"$"==e?d[2]?c.style[d[2]]=k:l(k&&k.split(/\s+/),function(a){var b=m(a,/^[+-]/),d=c.className||"",e=
m(d,RegExp("(^|\\s+)"+b+"(?=$|\\s)"));if(/^\+/.test(a)||b==a&&d==e)e+=" "+b;c.className=m(e,/^\s+|\s+$/g)}):"$$scrollX"==a?c.scroll(k,q(c).get("$$scrollY")):"$$scrollY"==a?c.scroll(q(c).get("$$scrollX"),k):"@"==e?k==g?c.removeAttribute(d[2]):c.setAttribute(d[2],k):c[d[2]]=k})}else A(a)||n(a)?c.set("$",a):C(a,function(a,b){c.set(a,b)});return c},add:function(a,b){return this.each(function(c,d){function e(a){t(a)?l(a,e):n(a)?e(a(c,d)):a!=g&&(a=B(a)?a:document.createTextNode(a),f?f.parentNode.insertBefore(a,
f.nextSibling):b?b(a,c,c.parentNode):c.appendChild(a),f=a)}var f;e(d&&!n(a)?W(a):a)})},fill:function(a){return this.each(function(a){q(a.childNodes).remove()}).add(a)},values:function(a){var b=a||{};this.each(function(a){var d=a.name||a.id,e=E(a.value);if(/form/i.test(a.tagName))for(d=0;d<a.elements.length;d++)q(a.elements[d]).values(b);else!d||/ox|io/i.test(a.type)&&!a.checked||(b[d]=b[d]==g?e:x(l,[b[d],e],F))});return b},on:function(a,b,c,d,e){return n(b)?this.on(g,a,b,c,e):A(d)?this.on(a,b,c,g,
d):this.each(function(f,h){l(a?z(a,f):f,function(a){l(E(b).split(/\s/),function(b){var f=m(b,/[?|]/),g=!!e&&("blur"==f||"focus"==f),l=aa(c,a,d,h,m(b,/[^?|]/g),e&&ba(e,a));b={element:a,b:l,a:f,c:g};(c.M=c.M||[]).push(b);w?(a.attachEvent("on"+b.a+(g?"in":""),l),f=H(a),(v[f]=v[f]||[]).push(b)):(a.addEventListener(f,l,g),(a.M=a.M||[]).push(b))})})})},onClick:function(a,b,c,d){return n(b)?this.on(a,"click",b,c,d):this.onClick(g,a,b,c)},trigger:function(a,b){return this.each(function(c){for(var d,e=c;e&&
!d;)l(w?v[e.Nia]:e.M,function(e){e.a==a&&(d=d||!e.b(b,c))}),e=e.parentNode})},e:0},I.prototype);K({request:function(a,b,c,d){d=d||{};var e,f=0,h=J(),k=c&&c.constructor==d.constructor;try{h.xhr=e=p.XMLHttpRequest?new XMLHttpRequest:new ActiveXObject("Msxml2.XMLHTTP.3.0"),h.stop0=function(){e.abort()},k&&(c=x(C,c,function(a,b){return x(l,b,function(b){return encodeURIComponent(a)+(b!=g?"="+encodeURIComponent(b):"")})}).join("&")),c==g||/post/i.test(a)||(b+="?"+c,c=g),e.open(a,b,!0,d.user,d.pass),k&&
/post/i.test(a)&&e.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),C(d.headers,function(a,b){e.setRequestHeader(a,b)}),C(d.xhr,function(a,b){e[a]=b}),e.onreadystatechange=function(){4!=e.readyState||f++||(200==e.status?h(!0,[e.responseText,e]):h(!1,[e.status,e.responseText,e]))},e.send(c)}catch(m){f||h(!1,[0,g,E(m)])}return h},toJSON:function b(c){return c==g?""+c:A(c=c.valueOf())?'"'+m(c,/[\\\"\x00-\x1f\u2028\u2029]/g,R)+'"':t(c)?"["+x(l,c,b).join()+"]":c&&"object"==typeof c?
"{"+x(C,c,function(c,e){return b(c)+":"+b(e)}).join()+"}":E(c)},parseJSON:p.JSON?p.JSON.parse:function(b){b=m(b,/[\x00\xad\u0600-\uffff]/g,R);if(/^[[\],:{}\s]*$/.test(m(m(b,/\\["\\\/bfnrtu]/g),/"[^"\\\n\r]*"|true|false|null|[\d.eE+-]+/g)))return eval("("+b+")")},ready:V,off:function(b){l(b.M,function(b){w?(b.element.detachEvent("on"+b.a+(b.c?"in":""),b.b),S(v[b.element.Nia],b)):(b.element.removeEventListener(b.a,b.b,b.c),S(b.element.M,b))});b.M=g},wait:function(b,c){var d=J(),e=setTimeout(function(){d(!0,
c)},b);d.stop0=function(){d(!1);clearTimeout(e)};return d}},q);K({each:r,toObject:function(b,c){var d={};r(b,function(b){d[b]=c});return d},d:0,promise:J},function(){return new I(arguments,!0)});if(w){var Y=function(){Q(D);D=g};document.attachEvent("onreadystatechange",function(){/^[ic]/.test(document.readyState)&&Y()});p.attachEvent("onload",Y)}else document.addEventListener("DOMContentLoaded",function(){Q(D);D=g},!1);p.g=function(){l(v,M)};return{$:q,M:I,getter:O,setter:N}});

module.exports = myObj;
}, {}]}, {}, {"1":""})
);
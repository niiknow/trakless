(function outer(modules, cache, entries){

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
  var $defaultTracker, $defaults, $pixel, $sessionid, $siteid, $trakless2, Emitter, attrs, cookie, defaults, doc, domevent, domify, fn, getImage, i, j, k, len, len1, mytrakless, myutil, prefix, query, ref, ref1, script, tracker, trakless, traklessParent, util, uuid, webanalyser, win, xstore;

  xstore = require('xstore');

  Emitter = require('emitter');

  domevent = require('domevent');

  cookie = require('cookie');

  defaults = require('defaults');

  query = require('querystring');

  uuid = require('uuid');

  webanalyser = require('webanalyser');

  domify = require('domify');

  win = window;

  doc = win.document;

  $defaultTracker = null;

  $siteid = 0;

  $pixel = '/pixel.gif';

  $defaults = null;

  $sessionid = cookie('trakless:usid');

  if ($sessionid == null) {
    $sessionid = new Date().getTime();
    cookie('tls:usid', $sessionid, {
      path: '/'
    });
  }


  /**
   * Send image request to server using GET.
   * The infamous web bug (or beacon) is a transparent, single pixel (1x1) image
  #
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
   *  util
   */

  util = (function() {
    function util() {}


    /**
     * allow for getting all attributes
    #
     * @param {HTMLElement} el - element
     * @return {Object}
     */

    util.prototype.allData = function(el) {
      var attr, camelCaseName, data, i, k, len, name, ref;
      data = {};
      ref = el.attributes;
      for (k = i = 0, len = ref.length; i < len; k = ++i) {
        attr = ref[k];
        name = attr.name.replace(/^data-/g, '');
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

    util.prototype.$ = domevent;


    /**
     * parse a string to JSON, return string if fail
    #
     * @param {String} v - string value
     * @return {Object}
     */

    util.prototype.stringToJSON = function(v) {
      var v2;
      if (typeof v === "string") {
        if (v.indexOf('{') >= 0 || v.indexOf('[') >= 0) {
          v2 = domevent.parseJSON(v);
          if (!(v2 == null)) {
            return v2;
          }
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

    util.prototype.session = function(k, v) {
      if ((v != null)) {
        if (!(typeof v === "string")) {
          v = domevent.toJSON(v);
        }
        cookie('tls:' + k, v, {
          path: '/'
        });
        return v;
      }
      v = cookie('tls:' + k);
      if (typeof v === 'undefined') {
        return v;
      }
      return this.stringToJSON(v);
    };


    /**
     * document ready
    #
     */

    util.prototype.ready = domevent.ready;


    /**
     * trim
    #
     */

    util.prototype.trim = function(v) {
      return v.replace(/^\s+|\s+$/gm, '');
    };


    /**
     * set a class
    #
     */

    util.prototype.setClass = function(el, cls) {
      return domevent(el).set('$', cls);
    };


    /**
     * append or retrieve html
    #
     */

    util.prototype.html = function(el, html) {
      var newDiv;
      if (html != null) {
        while (el.firstChild != null) {
          el.removeChild(el.firstChild);
        }
        newDiv = domify(html);
        return el.appendChild(newDiv);
      } else {
        return el.innerHTML;
      }
    };

    return util;

  })();

  myutil = new util();


  /**
   * tracker class
  #
   */

  tracker = (function() {
    function tracker() {}

    tracker.prototype.defaults = webanalyser.getResult();

    tracker.prototype.pixel = '/pixel.gif';

    tracker.prototype.siteid = 0;

    tracker.prototype.store = null;

    tracker.prototype.uuid = null;

    tracker.prototype._trackit = function(myData, pixel) {
      var self;
      self = this;
      myData.uuid = self.uuid;
      myData.siteid = self.siteid;
      myData.usid = $sessionid;
      getImage(pixel, query.stringify(myData));
      self.emit('track', myData.ht, myData);
      return self;
    };

    tracker.prototype._track = function(ht, extra) {
      var data, i, k, len, myData, myDef, pixel, self, v;
      self = this;
      if (extra == null) {
        extra = {};
      }
      if (self.siteid > 0) {
        pixel = myutil.trim(this.pixel);
        myDef = self.defaults;
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
        if (!self.uuid) {
          self.uuid = uuid();
        }
        if (self.store != null) {
          self.store.get('trakless-uuid').then(function(id) {
            if (!id) {
              self.store.set('trakless-uuid', self.uuid);
            }
            self.uuid = id || self.uuid;
            return self._trackit(myData, pixel);
          });
        } else {
          self._trackit(myData, pixel);
        }
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


  /**
   * tracker factory
  #
   */

  mytrakless = (function() {
    function mytrakless() {}


    /**
     * set default siteid
    #
     * @param {Number} siteid - the site id
     * @return {Object}
     */

    mytrakless.prototype.setSiteId = function(siteid) {
      $siteid = siteid > 0 ? siteid : $siteid;
    };


    /**
     * set default pixel
    #
     * @param {String} pixel - the default pixel url
     * @return {Object}
     */

    mytrakless.prototype.setPixel = function(pixelUrl) {
      $pixel = pixelUrl || $pixel;
    };


    /**
     * the storage
    #
     * @return {Object}
     */

    mytrakless.prototype.store = xstore;


    /**
     * you can provide different siteid and pixelUrl for in multi-tracker and site scenario
    #
     * @param {Number} siteid - the siteid
     * @param {String} pixelUrl - the pixel url
     * @return {Object}
     */

    mytrakless.prototype.getTracker = function(siteid, pixelUrl) {
      var rst;
      rst = new tracker(siteid, pixelUrl);
      rst.siteid = siteid || $siteid;
      rst.pixel = pixelUrl || $pixel;
      rst.store = xstore;
      return rst;
    };


    /**
     * get the default racker
    #
     */

    mytrakless.prototype.getDefaultTracker = function() {
      if ($defaultTracker == null) {
        $defaultTracker = trakless.getTracker();
      }
      return $defaultTracker;
    };


    /**
     * utility
    #
     */

    mytrakless.prototype.util = myutil;


    /**
     * similar to emit, except it broadcast to parent
    #
     */

    mytrakless.prototype.broadcast = function(en, ed) {
      if (typeof $trakless2 !== "undefined" && $trakless2 !== null) {
        $trakless2.emit(en, ed);
      }
      return this;
    };

    return mytrakless;

  })();

  trakless = new mytrakless;

  Emitter(trakless);

  $trakless2 = trakless;

  if (win.top !== win) {
    try {
      traklessParent = win.top.trakless;
      $trakless2 = traklessParent;
    } catch (_error) {
      $trakless2 = win.parent.trakless;
    }
  }

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

  win.trakless = trakless;

  module.exports = trakless;

}).call(this);

}, {"xstore":2,"emitter":3,"domevent":4,"cookie":5,"defaults":6,"querystring":7,"uuid":8,"webanalyser":9,"domify":10}],
2: [function(require, module, exports) {
// Generated by CoffeeScript 1.9.2
(function(win) {
  var cacheBust, deferredObject, delay, dnt, doPostMessage, doc, handleMessageEvent, hash, iframe, load, lstore, mydeferred, myproxy, myq, onMessage, proxyPage, proxyWin, q, randomHash, store, usePostMessage, xstore;
  doc = win.document;
  load = require('load-iframe');
  store = require('store.js');
  proxyPage = 'http://niiknow.github.io/xstore/xstore.html';
  deferredObject = {};
  iframe = void 0;
  proxyWin = void 0;
  usePostMessage = win.postMessage != null;
  cacheBust = 0;
  hash = void 0;
  delay = 333;
  lstore = {};
  myq = [];
  q = setInterval(function() {
    if (myq.length > 0) {
      return myq.shift()();
    }
  }, delay + 5);
  dnt = win.navigator.doNotTrack || navigator.msDoNotTrack || win.doNotTrack;
  onMessage = function(fn) {
    if (win.addEventListener) {
      return win.addEventListener("message", fn, false);
    } else {
      return win.attachEvent("onmessage", fn);
    }
  };

  /**
   * defer/promise class
  #
   */
  mydeferred = (function() {
    var i, k, len, ref, v;

    function mydeferred() {}

    mydeferred.prototype.q = function(event, item) {
      var d, deferredHash, self;
      self = this;
      self.mycallbacks = [];
      self.myerrorbacks = [];
      deferredHash = randomHash();
      d = [0, deferredHash, event, item.k, item.v];
      deferredObject[deferredHash] = self;
      if (usePostMessage) {
        doPostMessage(JSON.stringify(d));
      } else {
        if (iframe !== null) {
          cacheBust += 1;
          d[0] = +(new Date) + cacheBust;
          hash = '#' + JSON.stringify(d);
          if (iframe.src) {
            iframe.src = "" + proxyPage + hash;
          } else if ((iframe.contentWindow != null) && (iframe.contentWindow.location != null)) {
            iframe.contentWindow.location = "" + proxyPage + hash;
          } else {
            iframe.setAttribute('src', "" + proxyPage + hash);
          }
        }
      }
      self.then = function(fn, fnErr) {
        if (fnErr) {
          self.myerrorbacks.push(fnErr);
        }
        self.mycallbacks.push(fn);
        return self;
      };
      return self;
    };

    mydeferred.prototype.myresolve = function(data) {
      var i, k, len, ref, self, v;
      self = this;
      ref = self.mycallbacks || [];
      for (k = i = 0, len = ref.length; i < len; k = ++i) {
        v = ref[k];
        v(data);
      }
      return self;
    };

    mydeferred.prototype.myreject = function(e) {
      var self;
      return self = this;
    };

    ref = self.myerrorbacks || [];
    for (k = i = 0, len = ref.length; i < len; k = ++i) {
      v = ref[k];
      v(data);
    }

    self;

    return mydeferred;

  })();
  myproxy = (function() {
    function myproxy() {}

    myproxy.prototype.delay = 333;

    myproxy.prototype.hash = win.location.hash;

    myproxy.prototype.init = function() {
      var self;
      self = this;
      if (usePostMessage) {
        return onMessage(self.handleProxyMessage);
      } else {
        return setInterval((function() {
          var newhash;
          newhash = win.location.hash;
          if (newhash !== hash) {
            hash = newhash;
            self.handleProxyMessage({
              data: JSON.parse(newhash.substr(1))
            });
          }
        }), self.delay);
      }
    };

    myproxy.prototype.handleProxyMessage = function(e) {
      var d, id, key, method, myCacheBust, self;
      d = e.data;
      if (typeof d === "string") {
        if (/^xstore-/.test(d)) {
          d = d.split(",");
        } else {
          try {
            d = JSON.parse(d);
          } catch (_error) {
            return;
          }
        }
      }
      if (!(d instanceof Array)) {
        return;
      }
      id = d[1];
      if (!/^xstore-/.test(id)) {
        return;
      }
      self = this;
      key = d[3] || 'xstore';
      method = d[2];
      cacheBust = 0;
      if (method === 'get') {
        d[4] = store.get(key);
      } else if (method === 'set') {
        store.set(key, d[4]);
      } else if (method === 'remove') {
        store.remove(key);
      } else if (method === 'clear') {
        store.clear();
      } else {
        d[2] = 'error-' + method;
      }
      d[1] = id.replace('xstore-', 'xstoreproxy-');
      if (usePostMessage) {
        e.source.postMessage(JSON.stringify(d), '*');
      } else {
        cacheBust += 1;
        myCacheBust = +(new Date) + cacheBust;
        d[0] = myCacheBust;
        hash = '#' + JSON.stringify(d);
        win.location = win.location.href.replace(globals.location.hash, '') + hash;
      }
    };

    return myproxy;

  })();
  randomHash = function() {
    var rh;
    rh = Math.random().toString(36).substr(2);
    return "xstore-" + rh;
  };
  doPostMessage = function(msg) {
    if ((proxyWin != null)) {
      clearInterval(q);
      proxyWin.postMessage(msg, '*');
      return;
    }
    return myq.push(function() {
      return doPostMessage(msg);
    });
  };
  handleMessageEvent = function(e) {
    var d, di, id;
    d = e.data;
    if (typeof d === "string") {
      if (/^xstoreproxy-/.test(d)) {
        d = d.split(",");
      } else {
        try {
          d = JSON.parse(d);
        } catch (_error) {
          return;
        }
      }
    }
    if (!(d instanceof Array)) {
      return;
    }
    id = d[1];
    if (!/^xstoreproxy-/.test(id)) {
      return;
    }
    id = id.replace('xstoreproxy-', 'xstore-');
    di = deferredObject[id];
    if (di) {
      if (/^error-/.test(d[2])) {
        di.myreject(d[2]);
      } else {
        di.myresolve(d[4]);
      }
      return delete deferredObject[id];
    }
  };

  /**
   * xstore class
  #
   */
  xstore = (function() {
    function xstore() {}

    xstore.prototype.hasInit = false;

    xstore.prototype.get = function(k) {
      this.init();
      if (dnt) {
        return {
          then: function(fn) {
            return fn(lstore[k]);
          }
        };
      }
      return (new mydeferred()).q('get', {
        'k': k
      });
    };

    xstore.prototype.set = function(k, v) {
      this.init();
      if (dnt) {
        return {
          then: function(fn) {
            lstore[k] = v;
            return fn(lstore[k]);
          }
        };
      }
      return (new mydeferred()).q('set', {
        'k': k,
        'v': v
      });
    };

    xstore.prototype.remove = function(k) {
      this.init();
      if (dnt) {
        return {
          then: function(fn) {
            delete lstore[k];
            return fn;
          }
        };
      }
      return (new mydeferred()).q('remove', {
        'k': k
      });
    };

    xstore.prototype.clear = function() {
      this.init();
      if (dnt) {
        return {
          then: function(fn) {
            lstore = {};
            return fn;
          }
        };
      }
      return (new mydeferred()).q('clear');
    };

    xstore.prototype.init = function(options) {
      var self;
      self = this;
      if (self.hasInit) {
        return self;
      }
      self.hasInit = true;
      options = options || {};
      if (options.isProxy) {
        (new myproxy()).init();
        return;
      }
      proxyPage = options.url || proxyPage;
      if (options.dntIgnore) {
        dnt = false;
      }
      if (!store.enabled) {
        dnt = true;
      }
      if (win.location.protocol === 'https') {
        proxyPage = proxyPage.replace('http:', 'https:');
      }
      return iframe = load(proxyPage, function() {
        iframe.setAttribute("id", "xstore");
        proxyWin = iframe.contentWindow;
        if (!usePostMessage) {
          hash = proxyWin.location.hash;
          return setInterval((function() {
            if (proxyWin.location.hash !== hash) {
              hash = proxyWin.location.hash;
              handleMessageEvent({
                origin: proxyDomain,
                data: hash.substr(1)
              });
            }
          }), delay);
        } else {
          return onMessage(handleMessageEvent);
        }
      });
    };

    return xstore;

  })();
  win.xstore = new xstore();
  return module.exports = win.xstore;
})(window);

}, {"load-iframe":11,"store.js":12}],
11: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var onload = require('script-onload');
var tick = require('next-tick');
var type = require('type');

/**
 * Expose `loadScript`.
 *
 * @param {Object} options
 * @param {Function} fn
 * @api public
 */

module.exports = function loadIframe(options, fn){
  if (!options) throw new Error('Cant load nothing...');

  // Allow for the simplest case, just passing a `src` string.
  if ('string' == type(options)) options = { src : options };

  var https = document.location.protocol === 'https:' ||
              document.location.protocol === 'chrome-extension:';

  // If you use protocol relative URLs, third-party scripts like Google
  // Analytics break when testing with `file:` so this fixes that.
  if (options.src && options.src.indexOf('//') === 0) {
    options.src = https ? 'https:' + options.src : 'http:' + options.src;
  }

  // Allow them to pass in different URLs depending on the protocol.
  if (https && options.https) options.src = options.https;
  else if (!https && options.http) options.src = options.http;

  // Make the `<iframe>` element and insert it before the first iframe on the
  // page, which is guaranteed to exist since this Javaiframe is running.
  var iframe = document.createElement('iframe');
  iframe.src = options.src;
  iframe.width = options.width || 1;
  iframe.height = options.height || 1;
  iframe.style.display = 'none';

  // If we have a fn, attach event handlers, even in IE. Based off of
  // the Third-Party Javascript script loading example:
  // https://github.com/thirdpartyjs/thirdpartyjs-code/blob/master/examples/templates/02/loading-files/index.html
  if ('function' == type(fn)) {
    onload(iframe, fn);
  }

  tick(function(){
    // Append after event listeners are attached for IE.
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(iframe, firstScript);
  });

  // Return the iframe element in case they want to do anything special, like
  // give it an ID or attributes.
  return iframe;
};
}, {"script-onload":13,"next-tick":14,"type":15}],
13: [function(require, module, exports) {

// https://github.com/thirdpartyjs/thirdpartyjs-code/blob/master/examples/templates/02/loading-files/index.html

/**
 * Invoke `fn(err)` when the given `el` script loads.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api public
 */

module.exports = function(el, fn){
  return el.addEventListener
    ? add(el, fn)
    : attach(el, fn);
};

/**
 * Add event listener to `el`, `fn()`.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api private
 */

function add(el, fn){
  el.addEventListener('load', function(_, e){ fn(null, e); }, false);
  el.addEventListener('error', function(e){
    var err = new Error('script error "' + el.src + '"');
    err.event = e;
    fn(err);
  }, false);
}

/**
 * Attach evnet.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api private
 */

function attach(el, fn){
  el.attachEvent('onreadystatechange', function(e){
    if (!/complete|loaded/.test(el.readyState)) return;
    fn(null, e);
  });
  el.attachEvent('onerror', function(e){
    var err = new Error('failed to load the script "' + el.src + '"');
    err.event = e || window.event;
    fn(err);
  });
}

}, {}],
14: [function(require, module, exports) {
"use strict"

if (typeof setImmediate == 'function') {
  module.exports = function(f){ setImmediate(f) }
}
// legacy node.js
else if (typeof process != 'undefined' && typeof process.nextTick == 'function') {
  module.exports = process.nextTick
}
// fallback for other environments / postMessage behaves badly on IE8
else if (typeof window == 'undefined' || window.ActiveXObject || !window.postMessage) {
  module.exports = function(f){ setTimeout(f) };
} else {
  var q = [];

  window.addEventListener('message', function(){
    var i = 0;
    while (i < q.length) {
      try { q[i++](); }
      catch (e) {
        q = q.slice(i);
        window.postMessage('tic!', '*');
        throw e;
      }
    }
    q.length = 0;
  }, true);

  module.exports = function(fn){
    if (!q.length) window.postMessage('tic!', '*');
    q.push(fn);
  }
}

}, {}],
15: [function(require, module, exports) {
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
12: [function(require, module, exports) {
;(function(win){
	var store = {},
		doc = win.document,
		localStorageName = 'localStorage',
		scriptTag = 'script',
		storage

	store.disabled = false
	store.version = '1.3.17'
	store.set = function(key, value) {}
	store.get = function(key, defaultVal) {}
	store.has = function(key) { return store.get(key) !== undefined }
	store.remove = function(key) {}
	store.clear = function() {}
	store.transact = function(key, defaultVal, transactionFn) {
		if (transactionFn == null) {
			transactionFn = defaultVal
			defaultVal = null
		}
		if (defaultVal == null) {
			defaultVal = {}
		}
		var val = store.get(key, defaultVal)
		transactionFn(val)
		store.set(key, val)
	}
	store.getAll = function() {}
	store.forEach = function() {}

	store.serialize = function(value) {
		return JSON.stringify(value)
	}
	store.deserialize = function(value) {
		if (typeof value != 'string') { return undefined }
		try { return JSON.parse(value) }
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
		store.get = function(key, defaultVal) {
			var val = store.deserialize(storage.getItem(key))
			return (val === undefined ? defaultVal : val)
		}
		store.remove = function(key) { storage.removeItem(key) }
		store.clear = function() { storage.clear() }
		store.getAll = function() {
			var ret = {}
			store.forEach(function(key, val) {
				ret[key] = val
			})
			return ret
		}
		store.forEach = function(callback) {
			for (var i=0; i<storage.length; i++) {
				var key = storage.key(i)
				callback(key, store.get(key))
			}
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
			storageContainer.write('<'+scriptTag+'>document.w=window</'+scriptTag+'><iframe src="/favicon.ico"></iframe>')
			storageContainer.close()
			storageOwner = storageContainer.w.frames[0].document
			storage = storageOwner.createElement('div')
		} catch(e) {
			// somehow ActiveXObject instantiation failed (perhaps some special
			// security settings or otherwse), fall back to per-path storage
			storage = doc.createElement('div')
			storageOwner = doc.body
		}
		var withIEStorage = function(storeFunction) {
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

		// In IE7, keys cannot start with a digit or contain certain chars.
		// See https://github.com/marcuswestin/store.js/issues/40
		// See https://github.com/marcuswestin/store.js/issues/83
		var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")
		function ieKeyFix(key) {
			return key.replace(/^d/, '___$&').replace(forbiddenCharsRegex, '___')
		}
		store.set = withIEStorage(function(storage, key, val) {
			key = ieKeyFix(key)
			if (val === undefined) { return store.remove(key) }
			storage.setAttribute(key, store.serialize(val))
			storage.save(localStorageName)
			return val
		})
		store.get = withIEStorage(function(storage, key, defaultVal) {
			key = ieKeyFix(key)
			var val = store.deserialize(storage.getAttribute(key))
			return (val === undefined ? defaultVal : val)
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
		store.getAll = function(storage) {
			var ret = {}
			store.forEach(function(key, val) {
				ret[key] = val
			})
			return ret
		}
		store.forEach = withIEStorage(function(storage, callback) {
			var attributes = storage.XMLDocument.documentElement.attributes
			for (var i=0, attr; attr=attributes[i]; ++i) {
				callback(attr.name, store.deserialize(storage.getAttribute(attr.name)))
			}
		})
	}

	try {
		var testKey = '__storejs__'
		store.set(testKey, testKey)
		if (store.get(testKey) != testKey) { store.disabled = true }
		store.remove(testKey)
	} catch(e) {
		store.disabled = true
	}
	store.enabled = !store.disabled

	if (typeof module != 'undefined' && module.exports && this.module !== module) { module.exports = store }
	else if (typeof define === 'function' && define.amd) { define(store) }
	else { win.store = store }

})(Function('return this')());

}, {}],
3: [function(require, module, exports) {

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

}, {"indexof":16}],
16: [function(require, module, exports) {
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
}, {}],
4: [function(require, module, exports) {
myObj = null
mydefine = function(h, F){
	myObj = F().$;
};
// minified.js config start -- use this comment to re-create a configuration in the Builder
// - Only sections always, error, get, ht, ie6compatibility, 
// - ie7compatibility, ie8compatibility, ie9compatibility, parsejson, promise, ready, remove, 
// - request, set, template, tojson.
mydefine("minified",function(){function P(a){return a.substr(0,3)}function A(a){return"string"==typeof a}function E(a){return a}function l(a,c,b){return(a!=k?""+a:"").replace(c,b!=k?b:"")}function B(a){return l(a,/^\s+|\s+$/g)}function u(a,c,b){for(var d in a)a.hasOwnProperty(d)&&c.call(b||a,d,a[d]);return a}function q(a,c){if(a)for(var b=0;b<a.length;b++)c.call(a,a[b],b)}function Q(a,c){var b=[],d=n(c)?c:function(a){return c!=a};q(a,function(c,f){d.call(a,c,f)&&b.push(c)});return b}function w(a,c,
b){var d=[];a(c,function(a,f){r(a=b.call(c,a,f))?q(a,function(a){d.push(a)}):a!=k&&d.push(a)});return d}function v(a,c){var b=[];q(a,function(d,e){b.push(c.call(a,d,e))});return b}function F(a,c){var b=c||{},d;for(d in a)b[d]=a[d];return b}function R(a,c,b){return c==k?b:0>c?Math.max(a.length+c,0):Math.min(a.length,c)}function G(a,c,b){if(n(a))return a.apply(b&&c,v(b||c,E))}function S(a){v(a,function(a){return G(a,void 0,void 0)})}function J(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}
function T(a){return l(a,/[\x00-\x1f'"\u2028\u2029]/g,J)}function C(a,c){for(var b=0,d,e=[];d=c.exec(a);)e.push(a.substring(b,d.index)),b=d.index+d[0].length;e.push(a.substr(b));return e}function U(a,c){function b(a,b){var d=[];e.call(b||a,a,function(a,b){r(a)?q(a,function(a,c){b.call(a,a,c)}):u(a,function(a,c){b.call(c,a,c)})},c||E,function(){G(d.push,d,arguments)},V);return d.join("")}if(H[a])return H[a];var d="with(_.isObject(obj)?obj:{}){"+v(C(a,/{{|}}}?/g),function(a,c){var b,d=B(a),e=l(d,/^{/),
d=d==e?"esc(":"";if(c%2)return(b=/^each\b(\s+([\w_]+(\s*,\s*[\w_]+)?)\s*:)?(.*)/.exec(e))?"each("+(B(b[4])?b[4]:"this")+", function("+b[2]+"){":(b=/^if\b(.*)/.exec(e))?"if("+b[1]+"){":(b=/^else\b\s*(if\b(.*))?/.exec(e))?"}else "+(b[1]?"if("+b[2]+")":"")+"{":(b=/^\/(if)?/.exec(e))?b[1]?"}\n":"});\n":(b=/^(var\s.*)/.exec(e))?b[1]+";":(b=/^#(.*)/.exec(e))?b[1]:(b=/(.*)::\s*(.*)/.exec(e))?"print("+d+'_.formatValue("'+T(b[2])+'",'+(B(b[1])?b[1]:"this")+(d&&")")+"));\n":"print("+d+(B(e)?e:"this")+(d&&")")+
");\n";if(a)return'print("'+T(a)+'");\n'}).join("")+"}",e=new Function("obj","each","esc","print","_",d);99<W.push(b)&&delete H[W.shift()];return H[a]=b}function ea(a){return l(a,/[<>'"&]/g,function(a){return"&#"+a.charCodeAt(0)+";"})}function X(a,c){return U(a,ea)(c)}function n(a){return"function"==typeof a&&!a.item}function r(a){return a&&a.length!=k&&!A(a)&&!(a&&a.nodeType)&&!n(a)&&a!==p}function Y(a,c){var b=[],d={},e;m(a,function(a){m(c(a),function(a){d[e=a.Nia=a.Nia||++fa]||(b.push(a),d[e]=
!0)})});return b}function K(a,c){m(c,function(a){a.element.detachEvent("on"+a.f,a.g)})}function Z(a){x?x.push(a):setTimeout(a,0)}function y(a,c,b){return n(a)?Z(a):new I(t(a,c,b))}function t(a,c,b){function d(a){a=w(m,a,function da(a){return r(a)?w(m,a,da):a});return f?Q(a,function(a){for(;a=a.parentNode;)if(a==f||b)return a==f}):a}function e(a,b){var c=RegExp("(^|\\s+)"+a+"(?=$|\\s)","i");return function(d){return a?c.test(d[b]):!0}}var f,g,h,k;if(c&&1!=(c=t(c)).length)return Y(c,function(c){return t(a,
c,b)});f=c&&c[0];if(!A(a))return d(a);if(f&&1!=(f&&f.nodeType))return[];if(1<(c=a.split(/\s*,\s*/)).length)return Y(c,function(a){return t(a,f,b)});if(c=/(\S+)\s+(.+)$/.exec(a))return t(c[2],t(c[1],f),b);if(a!=(c=l(a,/^#/)))return d(document.getElementById(c));g=(c=/([\w-]*)\.?([\w-]*)/.exec(a))[1];k=c[2];c=(h=document.getElementsByClassName&&k)?(f||document).getElementsByClassName(k):(f||document).getElementsByTagName(g||"*");if(g=h?g:k)c=Q(c,e(g,h?"tagName":"className"));return b?d(c):c}function m(a,
c){r(a)?q(a,c):a!=k&&c(a,0);return a}function L(){function a(a,d){c==k&&a!=k&&(c=a,g=r(d)?d:[d],setTimeout(function(){q(b,function(a){a()})},0));return c}var c,b=[],d=arguments,e=d.length,f=0,g=[];q(d,function ca(b,c){try{b.then?b.then(function(b){var d;(b&&"object"==typeof b||n(b))&&n(d=b.then)?ca(d,c):(g[c]=v(arguments,E),++f==e&&a(!0,2>e?g[c]:g))},function(b){g[c]=v(arguments,E);a(!1,2>e?g[c]:[g[c][0],g,c])}):b(function(){a(!0,arguments)},function(){a(!1,arguments)})}catch(d){a(!1,[d,g,c])}});
a.stop=function(){q(d,function(a){a.stop&&a.stop()});return G(a.stop0)};var h=a.then=function(d,e){function f(){try{var a=c?d:e;n(a)?function ga(a){try{var b,c=0;if((a&&"object"==typeof a||n(a))&&n(b=a.then)){if(a===h)throw new TypeError;b.call(a,function(a){c++||ga(a)},function(a){c++||h(!1,[a])});h.stop0=a.stop}else h(!0,[a])}catch(d){c++||h(!1,[d])}}(G(a,aa,g)):h(c,g)}catch(b){h(!1,[b])}}var h=L();h.stop0=a.stop;c!=k?setTimeout(f,0):b.push(f);return h};a.always=function(a){return h(a,a)};a.error=
function(a){return h(0,a)};return a}function I(a,c){var b=0;if(a)for(var d=0,e=a.length;d<e;d++){var f=a[d];if(c&&r(f))for(var g=0,h=f.length;g<h;g++)this[b++]=f[g];else this[b++]=f}else this[b++]=c;this.length=b;this._=!0}function V(){return new I(arguments,!0)}var p=this,M={},N={},fa=1,D={},x=/^[ic]/.test(document.readyState)?k:[],z=!!document.all&&!document.addEventListener,k=null,aa,O=C("January,February,March,April,May,June,July,August,September,October,November,December",/,/g);v(O,P);O=C("Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",
/,/g);v(O,P);C("am,pm",/,/g);C("am,am,am,am,am,am,am,am,am,am,am,am,pm,pm,pm,pm,pm,pm,pm,pm,pm,pm,pm,pm",/,/g);var H={},W=[];F({c:0,remove:function(){m(this,function(a){z&&1==(a&&a.nodeType)&&(m(t("*",a),function(a){K(0,D[a.Nia]);delete D[a.Nia]}),K(0,D[a.Nia]),delete D[a.Nia]);a.parentNode.removeChild(a)})},get:function(a,c){var b=this,d=b[0];if(d){if(A(a)){var e=/^(\W*)(.*)/.exec(l(a,/^%/,"@data-")),f=e[1],d=N[f]?N[f](this,e[2]):"$"==a?b.get("className"):"$$"==a?z?d.style.cssText:b.get("@style"):
"$$slide"==a?b.get("$height"):"$$fade"==a||"$$show"==a?"hidden"==b.get("$visibility")||"none"==b.get("$display")?0:"$$fade"==a?z?isNaN(b.get("$filter",!0))?1:b.get("$filter",!0)/100:isNaN(b.get("$opacity",!0))?1:b.get("$opacity",!0):1:"$$scrollX"==a?p.pageXOffset!=k?p.pageXOffset:(document.documentElement||document.body.parentNode||document.body).scrollLeft:"$$scrollY"==a?p.pageXOffset!=k?p.pageYOffset:(document.documentElement||document.body.parentNode||document.body).scrollTop:"$"==f?p.getComputedStyle?
p.getComputedStyle(d,k).getPropertyValue(l(e[2],/[A-Z]/g,function(a){return"-"+a.toLowerCase()})):(d.currentStyle||d.style)[l(e[2],/^float$/,"cssFloat")]:"@"==f?d.getAttribute(e[2]):d[e[2]];return c?parseFloat(l(d,/^[^\d-]+/)):d}var g={};(r(a)?m:u)(a,function(a){g[a]=b.get(a,c)});return g}},set:function(a,c){var b=this;if(c!==aa){var d=/^(\W*)(.*)/.exec(l(l(a,/^\$float$/,"cssFloat"),/^%/,"@data-")),e=d[1];if(M[e])M[e](this,d[2],c);else"$$fade"==a?b.set({$visibility:c?"visible":"hidden"}).set(z?1>
c?{$filter:"alpha(opacity = "+100*c+")",$zoom:1}:{$filter:""}:{$opacity:c}):"$$slide"==a?b.set({$visibility:c?"visible":"hidden",$overflow:"hidden",$height:/px/.test(c)?c:function(a,b,d){a=y(d);d={$position:"absolute",$visibility:"hidden",$display:"block",$height:k};b=a.get(d);d=a.set(d).get("clientHeight");a.set(b);return d*c+"px"}}):"$$show"==a?c?b.set({$visibility:c?"visible":"hidden",$display:""}).set({$display:function(a){return"none"==a?"block":a}}):b.set({$display:"none"}):"$$"==a?z?b.set("$cssText",
c):b.set("@style",c):m(this,function(b,g){var h=n(c)?c(y(b).get(a),g,b):c;"$"==e?d[2]?b.style[d[2]]=h:m(h&&h.split(/\s+/),function(a){var c=l(a,/^[+-]/),d=b.className||"",e=l(d,RegExp("(^|\\s+)"+c+"(?=$|\\s)"));if(/^\+/.test(a)||c==a&&d==e)e+=" "+c;b.className=B(e)}):"$$scrollX"==a?b.scroll(h,y(b).get("$$scrollY")):"$$scrollY"==a?b.scroll(y(b).get("$$scrollX"),h):"@"==e?h==k?b.removeAttribute(d[2]):b.setAttribute(d[2],h):b[d[2]]=h})}else A(a)||n(a)?b.set("$",a):u(a,function(a,c){b.set(a,c)});return b},
d:0,ht:function(a,c){var b;if(2<arguments.length){b=arguments;var d=[];if(b)for(var e=R(b,void 0,b.length),f=R(b,1,0);f<e;f++)d.push(b[f]);b=d;d=void 0;for(e=0;e<b.length;e++)d=F(b[e],d);b=d}else b=c;return this.set("innerHTML",n(a)?a(b):/{{/.test(a)?X(a,b):/^#\S+$/.test(a)?X(t(a,void 0,void 0)[0].text,b):a)}},I.prototype);F({request:function(a,c,b,d){d=d||{};var e,f=0,g=L(),h=b&&b.constructor==d.constructor;try{g.xhr=e=p.XMLHttpRequest?new XMLHttpRequest:new ActiveXObject("Msxml2.XMLHTTP.3.0"),g.stop0=
function(){e.abort()},h&&(b=w(u,b,function(a,b){return w(m,b,function(b){return encodeURIComponent(a)+(b!=k?"="+encodeURIComponent(b):"")})}).join("&")),b==k||/post/i.test(a)||(c+="?"+b,b=k),e.open(a,c,!0,d.user,d.pass),h&&/post/i.test(a)&&e.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),u(d.headers,function(a,b){e.setRequestHeader(a,b)}),u(d.xhr,function(a,b){e[a]=b}),e.onreadystatechange=function(){4!=e.readyState||f++||(200==e.status?g(!0,[e.responseText,e]):g(!1,[e.status,
e.responseText,e]))},e.send(b)}catch(l){f||g(!1,[0,k,l!=k?""+l:""])}return g},toJSON:function c(b){return b==k?""+b:A(b=b.valueOf())?'"'+l(b,/[\\\"\x00-\x1f\u2028\u2029]/g,J)+'"':r(b)?"["+w(m,b,c).join()+"]":b&&"object"==typeof b?"{"+w(u,b,function(b,e){return c(b)+":"+c(e)}).join()+"}":b!=k?""+b:""},parseJSON:p.JSON?p.JSON.parse:function(c){c=l(c,/[\x00\xad\u0600-\uffff]/g,J);if(/^[[\],:{}\s]*$/.test(l(l(c,/\\["\\\/bfnrtu]/g),/"[^"\\\n\r]*"|true|false|null|[\d.eE+-]+/g)))return eval("("+c+")")},
ready:Z,b:null,e:0},y);F({template:U,a:0,promise:L},V);if(z){var ba=function(){S(x);x=k};document.attachEvent("onreadystatechange",function(){/^[ic]/.test(document.readyState)&&ba()});p.attachEvent("onload",ba)}else document.addEventListener("DOMContentLoaded",function(){S(x);x=k},!1);p.h=function(){m(D,K)};return{$:y,M:I,getter:N,setter:M}});
module.exports = myObj;
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

}, {"debug":17}],
17: [function(require, module, exports) {

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

}, {"./debug":18}],
18: [function(require, module, exports) {

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

}, {"ms":19}],
19: [function(require, module, exports) {
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

}, {"trim":20,"type":15}],
20: [function(require, module, exports) {

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
8: [function(require, module, exports) {

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
9: [function(require, module, exports) {
// Generated by CoffeeScript 1.9.2
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

}, {"defaults":6,"flashdetect":21}],
21: [function(require, module, exports) {
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
10: [function(require, module, exports) {

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Tests for browser support.
 */

var div = document.createElement('div');
// Setup
div.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
// Make sure that link elements get serialized correctly by innerHTML
// This requires a wrapper element in IE
var innerHTMLBug = !div.getElementsByTagName('link').length;
div = undefined;

/**
 * Wrap map from jquery.
 */

var map = {
  legend: [1, '<fieldset>', '</fieldset>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  // for script/link/style tags to work in IE6-8, you have to wrap
  // in a div with a non-whitespace character in front, ha!
  _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
};

map.td =
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option =
map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>'];

map.polyline =
map.ellipse =
map.polygon =
map.circle =
map.text =
map.line =
map.path =
map.rect =
map.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

/**
 * Parse `html` and return a DOM Node instance, which could be a TextNode,
 * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
 * instance, depending on the contents of the `html` string.
 *
 * @param {String} html - HTML string to "domify"
 * @param {Document} doc - The `document` instance to create the Node for
 * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
 * @api private
 */

function parse(html, doc) {
  if ('string' != typeof html) throw new TypeError('String expected');

  // default to the global `document` object
  if (!doc) doc = document;

  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return doc.createTextNode(html);

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = doc.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = doc.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // one element
  if (el.firstChild == el.lastChild) {
    return el.removeChild(el.firstChild);
  }

  // several elements
  var fragment = doc.createDocumentFragment();
  while (el.firstChild) {
    fragment.appendChild(el.removeChild(el.firstChild));
  }

  return fragment;
}

}, {}]}, {}, {"1":""})

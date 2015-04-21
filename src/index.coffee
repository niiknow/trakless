
xstore = require('xstore')
Emitter = require('emitter')
domevent = require('domevent')
cookie = require('cookie')
defaults = require('defaults')
query = require('querystring')
uuid = require('uuid')
webanalyser = require('webanalyser')
domify = require('domify')

win = window
doc = win.document
$defaultTracker = null
$siteid = 0
$pixel = '/pixel.gif'

$defaults = null
$sessionid = cookie('trakless:usid')
if !$sessionid?
  $sessionid = new Date().getTime()
  cookie('tls:usid', $sessionid, { path: '/' })

###*
# Send image request to server using GET.
# The infamous web bug (or beacon) is a transparent, single pixel (1x1) image
#
###
getImage = (cfgUrl, request, callback) ->
    image = new Image(1, 1)

    image.onload = ->
      iterator = 0
      # To avoid JSLint warning of empty block
      if typeof callback == 'function'
        callback()
      return

    image.src = cfgUrl + (if cfgUrl.indexOf('?') < 0 then '?' else '&') + request
    return image 

###*
#  util
###
class util
  ###*
  # allow for getting all attributes
  #
  # @param {HTMLElement} el - element
  # @return {Object}
  ###
  allData: (el) ->
    data = {}
    if (el?)
      for attr, k in el.attributes
        name = attr.name.replace(/^data-/g, '')
        camelCaseName = name.replace(/-(.)/g, ($0, $1) ->
          $1.toUpperCase()
        )
        data[camelCaseName] = attr.value

    return data

  ###*
  # mini jquery
  #
  ####
  $: domevent

  ###*
  # parse a string to JSON, return string if fail
  #
  # @param {String} v - string value
  # @return {Object}
  ####
  stringToJSON: (v) ->
    if (typeof v is "string")
      if (v.indexOf('{') >= 0 or v.indexOf('[') >= 0)
        v2 = domevent.parseJSON(v)
        return v2 unless !v2?

    return v

  ###*
  # get or set session data - store in cookie
  # if no value is provided, then it is a get
  #
  # @param {String} k - key
  # @param {Object} v - value
  # @return {Object}
  ####
  session: (k, v) ->
    if (v?)
      if !(typeof v is "string")
        v = domevent.toJSON(v)
      cookie('tls:'+k, v, { path: '/' })
      return v

    v = cookie('tls:'+k)
    if (typeof v is 'undefined')
      return v
    # attempt to parse the result from cookie
    return @stringToJSON(v)
    
  ###*
  # document ready
  #
  ###
  ready: domevent.ready

  ###*
  # trim
  #
  ###
  trim: (v) ->
    return v.replace(/^\s+|\s+$/gm,'')

  ###*
  # set a class
  #
  ###
  setClass: (el, cls) ->
    domevent(el).set('$', cls)

  ###*
  # append or retrieve html
  #
  ###
  html: (el, html) ->
    if html?
      while el.firstChild?
        el.removeChild el.firstChild

      newDiv = domify(html)
      el.appendChild newDiv
    else
      return el.innerHTML

myutil = new util()

###*
# tracker class
#
###
class tracker
    defaults: webanalyser.getResult() # each tracker has it's own defaults
    pixel: '/pixel.gif' # each tracker can have its own pixel
    siteid: 0
    store: null
    uuid: null
    _trackit: (myData, pixel) ->
      self = @
      myData.uuid = self.uuid
      myData.siteid = self.siteid
      myData.usid = $sessionid

      getImage(pixel, query.stringify(myData))
      self.emit('track', myData.ht, myData)
      return self

    _track: (ht, extra) ->
      self = @
      if (!extra?)
        extra = {}

      # only track if valid siteid
      if (self.siteid > 0)
        pixel = myutil.trim(@pixel)
        myDef = self.defaults

        # make sure that pixel work with local file system
        if ((pixel.indexOf('//') == 0) and (myDef.dl.indexOf('http') != 0))
          pixel = 'http:' + pixel

        data = if (ht == 'pageview') then defaults(extra, myDef) else extra

        # only copy over non-null value
        myData = {}
        for k, v in data when v?
          if !(typeof v is "string") or (myutil.trim(v).length > 0)
            myData[k] = v

        myData.z = new Date().getTime()
        myData.ht = ht

        if !self.uuid
          self.uuid = uuid()

          if self.store?
            self.store.get('trakless-uuid').then (id) ->
              if !id 
                self.store.set('trakless-uuid', self.uuid)
              self.uuid = id or self.uuid
              self._trackit(myData, pixel)
        else
          self._trackit(myData, pixel)
      @ # chaining

    ###*
    # track generic method
    #
    # @param {String} ht - hit types with possible values of 'pageview', 'event', 'transaction', 'item', 'social', 'exception', 'timing', 'app', 'custom'
    # @param {Object} extra - extended data
    # @return {Object}
    ###
    track: (ht, extra) ->
      self = @
      # only track after doc is ready
      myutil.ready ->
        self._track(ht or 'custom', extra)
      @ # chaining

    ###*
    # track pageview
    #
    # @param {Object} extra - extended data
    # @return {Object}
    ###
    trackPageView: (extra) ->
      @track('pageview', extra)

    ###*
    # track event
    #
    # @param {String} category
    # @param {String} action
    # @param {String} label
    # @param {String} value - Values must be non-negative.
    # @return {Object}
    ###
    trackEvent: (category, action, label, value) ->
      if (value and value < 0)
        value = null

      @track('event', {
        ec: category || 'event'
        ea: action
        el: label
        ev: value
      })

    ###*
    # track item
    #
    # @param {String} id - *required* [OD564]
    # @param {Number} name - *required* [Shoe] Specifies the item name.
    # @param {Number} price [3.50] Specifies the price for a single item / unit.
    # @param {Number} quantity [4] Specifies the number of items purchased.
    # @param {String} code [SKU47] Specifies the SKU or item code.
    # @param {String} category [Blue] Specifies the category that the item belongs to.
    # @param {String} currencycode [EUR] When present indicates the local currency for all transaction currency values. Value should be a valid ISO 4217 currency code.
    # @return {Object}
    ###
    trackItemOrTransaction: (id, name, price, quantity, code, category, currencycode) ->
      @track('item', {
        ti: id
        in: name
        ip: price
        iq: quantity
        ic: code
        iv: category
        cu: currencycode
      })

    ###*
    # track transaction
    #
    # @param {String} id - *required* [OD564]
    # @param {String} affiliation [Member] Specifies the affiliation or store name.
    # @param {Number} revenue [15.47] Specifies the total revenue associated with the transaction. This value should include any shipping or tax costs.
    # @param {Number} shipping [3.50] Specifies the total shipping cost of the transaction.
    # @param {Number} tax [1.20] Specifies the total tax of the transaction.
    # @param {Number} price [3.50] Specifies the price for a single item / unit.
    # @param {Number} quantity [4] Specifies the number of items purchased.
    # @param {String} code [SKU47] Specifies the SKU or item code.
    # @param {String} category [Blue] Specifies the category that the item belongs to.
    # @param {String} currencycode [EUR] When present indicates the local currency for all transaction currency values. Value should be a valid ISO 4217 currency code.
    # @return {Object}
    ###
    trackTransaction: (id, affiliation, revenue, shipping, tax, name, price, quantity, code, category, currencycode) ->
      @track('transaction', {
        ti: id
        ta: affiliation
        tr: revenue
        ts: shipping
        tt: tax
        in: name
        ip: price
        iq: quantity
        ic: code
        iv: category
        cu: currencycode
      })

    ###*
    # track social
    #
    # @param {String} network - *required* [facebook] Specifies the social network, for example Facebook or Google Plus.
    # @param {String} action - *required* [like] Specifies the social interaction action. For example on Google Plus when a user clicks the +1 button, the social action is 'plus'.
    # @param {String} target - *required* [http://foo.com] Specifies the target of a social interaction. This value is typically a URL but can be any text.
    # @return {Object}
    ###
    trackSocial: (network, action, target) ->
      @track('social', {
        sn: network
        sa: action
        st: target
      })

    ###*
    # track exception
    #
    # @param {String} description - Specifies the description of an exception.
    # @param {String} isFatal - true/false Specifies whether the exception was fatal.
    # @return {Object}
    ###
    trackException: (description, isFatal) ->
      @track('exception', {
        exf: if isFatal then 1 else 0
        exd: description
      })

    ###*
    # track app
    #
    # @param {String} name - *required* [MyApp] Specifies the application name.
    # @param {String} id - *required* [com.company.app] Application identifier.
    # @param {String} version - *required* [1.2] Specifies the application version.
    # @param {String} installerid - *required* com.platform.vending
    # @return {Object}
    ###
    trackApp: (name, id, version, installerid) ->
      @track('app', {
        an: name
        aid: id
        av: version
        aiid: installer
      })

    ###*
    # track custom
    #
    # @param {Object} customDataObject - object with any property you want
    # @return {Object}
    ###
    trackCustom: (customDataObject) ->
      @track('custom', customDataObject)

# allow tracker to emmit events
Emitter(tracker.prototype)

###*
# tracker factory
#
###
class mytrakless
  ###*
  # set default siteid
  #
  # @param {Number} siteid - the site id
  # @return {Object}
  ###
  setSiteId: (siteid) ->
    $siteid = if siteid > 0 then siteid else $siteid
    return

  ###*
  # set default pixel
  #
  # @param {String} pixel - the default pixel url
  # @return {Object}
  ###
  setPixel: (pixelUrl) ->
    $pixel = pixelUrl or $pixel
    return

  ###*
  # the storage
  #
  # @return {Object}
  ###
  store: xstore

  ###*
  # you can provide different siteid and pixelUrl for in multi-tracker and site scenario
  #
  # @param {Number} siteid - the siteid
  # @param {String} pixelUrl - the pixel url
  # @return {Object}
  ###
  getTracker: (siteid, pixelUrl) ->
    rst = new tracker(siteid, pixelUrl)
    rst.siteid = siteid or $siteid
    rst.pixel = pixelUrl or $pixel
    rst.store = xstore
    return rst

  ###*
  # get the default racker
  #
  ###
  getDefaultTracker: () ->
    if (!$defaultTracker?)
      $defaultTracker = trakless.getTracker()
    return $defaultTracker

  ###*
  # utility
  #
  ###
  util: myutil

  ###*
  # similar to emit, except it broadcast to parent
  #
  ###
  broadcast: (en, ed) ->
    # trigger only if $trakless2 has been initialized
    if $trakless2?
      $trakless2.emit(en, ed)
    @

# initialize $trakless2 to allow event pass to anybody listening on the parent
trakless = new mytrakless
Emitter(trakless)
$trakless2 = trakless
if win.top != win

  try
    # this statement throw error if access is denied
    traklessParent = win.top.trakless
    $trakless2 = traklessParent
  catch # swallow any security error
    $trakless2 = win.parent.trakless

# auto init based on script attribute
attrs =
  site: (value) ->
    trakless.setSiteId(value)
  pixel: (value) ->
    return unless typeof value is "string"
    trakless.setPixel(value)

for script in win.document.getElementsByTagName("script")
  if /trakless/i.test(script.src)
    for prefix in ['','data-']
      for k,fn of attrs
        fn script.getAttribute prefix+k

# initialize trakless as global
win.trakless = trakless
module.exports = trakless

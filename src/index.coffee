defaults = require('defaults')
clone = require('clone')
cookie = require('cookie')
Emitter = require('emitter')
event = require('event')
query = require('querystring')
json = require('json')
closest = require('closest')
each = require('each')
store = require('segmentio-store.js')
uuid = require('uuid')
webanalyser = require('webanalyser')

$defaults = null
$siteid = 0
$pixel = '/pixel.gif'
$uuid = store.get('uuid')
$sessionid = cookie('pa:usid')
if !$uuid?
  $uuid = uuid()
  store.set('uuid', $uuid)

if !$sessionid?
  $sessionid = new Date().getTime()
  cookie('pa:usid', $sessionid, { path: '/' })

###
           * Send image request to server using GET.
           * The infamous web bug (or beacon) is a transparent, single pixel (1x1) image
###
getImage = (configTrackerUrl, request, callback) ->
  image = new Image(1, 1)

  image.onload = ->
    iterator = 0
    # To avoid JSLint warning of empty block
    if typeof callback == 'function'
      callback()
    return

  image.src = configTrackerUrl + (if configTrackerUrl.indexOf('?') < 0 then '?' else '&') + request
  return image 

###*
# tracker class
#
###
class tracker
  defaults: webanalyser.getResult() # each tracker has it's own defaults
  pixel: '/pixel.gif' # each tracker can have its own pixel
  siteid: 0
  _track: (ht, extra) ->
    if (!extra?)
      extra = {}

    # only track if valid siteid
    if (@siteid > 0)
      pixel = @pixel.replace(/^\s+|\s+$/gm,'')
      myDef = @defaults

      # make sure that pixel work with local file system
      if ((pixel.indexOf('//') == 0) and (myDef.dl.indexOf('http') != 0))
        pixel = 'http:' + pixel

      data = if (ht == 'pageview') then defaults(extra, myDef) else clone(extra) 

      # only copy over non-null value
      myData = {}
      each(data, (k, v) ->
        if v? 
          if !(typeof v is "string") or (v.replace(/^\s+|\s+$/gm,'').length > 0)
            myData[k] = v
      )

      myData.z = new Date().getTime()
      myData.ht = ht
      myData.uuid = $uuid
      myData.siteid = @siteid
      myData.usid = $sessionid

      getImage(pixel, query.stringify(myData))
      @emit('track', ht, data)

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
    webanalyser.ready ->
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
class trakless
  ###*
  # set default siteid
  #
  # @param {Number} siteid - the site id
  # @return {Object}
  ###
  @setSiteId: (siteid) ->
    $siteid = if siteid > 0 then siteid else $siteid
    return

  ###*
  # set default pixel
  #
  # @param {String} pixel - the default pixel url
  # @return {Object}
  ###
  @setPixel: (pixelUrl) ->
    $pixel = pixelUrl or $pixel
    return

  ###*
  # you can provide different siteid and pixelUrl for in multi-tracker and site scenario
  #
  # @param {Number} siteid - the siteid
  # @param {String} pixelUrl - the pixel url
  # @return {Object}
  ###
  @getTracker: (siteid, pixelUrl) ->
    rst = new tracker(siteid, pixelUrl)
    rst.siteid = siteid or $siteid
    rst.pixel = pixelUrl or $pixel
    return rst

  ###*
  # you can provide different siteid and pixelUrl for in multi-tracker and site scenario
  #
  # @param {HTMLElement} el - element to get data attribute from
  # @param {String} attrName - the attribute name
  # @return {Object}
  ###
  @getData: (el, attrName) ->
    attrValue = el.getAttribute(attrName)
    return if (attrValue.indexOf('{') > 0) then json.parse(attrValue) else attrValue

  ###*
  # Delegate event `type` to `selector`
  # and invoke `fn(e)`. A callback function
  # is returned which may be passed to `.unbind()`.
  #
  # @param {Element} el
  # @param {String} selector
  # @param {String} type
  # @param {Function} fn
  # @param {Boolean} capture
  # @return {Function}
  # @api public
  ###
  @bind: (el, selector, type, fn, capture) ->
    event.bind el, type, ((e) ->
      target = e.target or e.srcElement
      e.delegateTarget = closest(target, selector, true, el)
      if e.delegateTarget
        fn.call el, e
      return
    ), capture

  ###*
  # Unbind event `type`'s callback `fn`.
  #
  # @param {Element} el
  # @param {String} type
  # @param {Function} fn
  # @param {Boolean} capture
  # @api public
  ###
  @unbind: (el, type, fn, capture) ->
    event.unbind el, type, fn, capture
    return

# auto init if document is available
if (document?)
  attrs =
    site: (value) ->
      trakless.setSiteId(value)
    pixel: (value) ->
      return unless typeof value is "string"
      $pixel = value

  for script in document.getElementsByTagName("script")
    if /trakless/i.test(script.src)
      for prefix in ['','data-']
        for k,fn of attrs
          fn script.getAttribute prefix+k

module.exports = trakless

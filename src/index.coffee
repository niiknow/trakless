mystore = require('xstore')
xstore = new mystore()
Emitter = require('emitter')
cookie = require('cookie')
defaults = require('defaults')
query = require('querystring')
uuid = require('uuid')
webanalyser = require('webanalyser')
docReady = require('doc-ready')
debounce = require('debounce')
lsqueue = require('lsqueue')
queue = new lsqueue('tksq')

win = window
doc = win.document
hasNOL = win.navigator.onLine
session = win.sessionStorage
$siteid = 0
$pixel = '//niiknow.github.io/pixel.gif'

# get first day of current year
$st = (new Date(new Date().getFullYear(), 0, 1)).getTime()

$defaults = null
if(typeof(session) is 'undefined')
  session = 
    getItem: (k) ->
      return cookie(k)
    setItem: (k, v) ->
      return cookie(k, v, { path: '/' })

$sessionid = new Date().getTime() - $st

try 
  $sessionid = session.getItem('tklsid')
  if !$sessionid?
    # get time since january 2014
    $sessionid = new Date().getTime() - $st
    session.setItem('tklsid', $sessionid)
catch
  # do nothing

###*
# Send image request to server using GET.
# The infamous web bug (or beacon) is a transparent, single pixel (1x1) image
#
###
getImage = (cfgUrl, tks, qs, callback) ->
    image = new Image(1, 1)

    if (cfgUrl.indexOf('//') == 0)
      cfgUrl = if win.location.protocol is'https' then "https:#{cfgUrl}" else "http:#{cfgUrl}" 

    image.onload = ->
      iterator = 0
      # To avoid JSLint warning of empty block
      if typeof callback == 'function'
        callback()
      return
    url = cfgUrl + (if cfgUrl.indexOf('?') < 0 then '?' else '&') + "#{tks}&#{qs}"
    image.src = url
    return image 

###*
 * determine if a object is dom
 * @param  {Object}  obj the object
 * @return {Boolean}     true or false
###
isDom = (obj) ->
  if (obj?)
    if obj.nodeName
      switch obj.nodeType
        when 1
          return true
        when 3
          return object.nodeValue?
  return false

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
  # parse a string to JSON, return string if fail
  #
  # @param {String} v - string value
  # @return {Object}
  ####
  parseJSON: (v) ->
    if (typeof v is "string")
      if (v.indexOf('{') >= 0 or v.indexOf('[') >= 0)
        v2 = JSON.parse(v)
        return v2 unless !v2?

    return v

  ###*
  # parse a JSON to string, return string if fail
  #
  # @param {String} v - string value
  # @return {Object}
  ####
  stringify: (v) ->
    if (typeof v is "string")
      return v

    return JSON.stringify(v)

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
        v = @stringify(v)
      cookie('tls:'+k, v, { path: '/' })
      return v

    v = cookie('tls:'+k)
    if (typeof v is 'undefined')
      return v
    # attempt to parse the result from cookie
    return @parseJSON(v)
  
  ###*
  # cookie
  #
  ###
  cookie: cookie

  ###*
  # document ready
  #
  ###
  ready: docReady

  ###*
  # trim
  #
  ###
  trim: (v) ->
    return v.replace(/^\s+|\s+$/gm,'')

myutil = new util()

###*
# tracker class
#
###
class tracker
    pixel: '//niiknow.github.io/pixel.gif' # each tracker can have its own pixel
    siteid: 0
    store: null
    uuid: null
    getId: () ->
      self = @
      return "#{self.siteid}-#{self.pixel}".replace(/[^a-zA-z]/gi, '$')
    _tk: (data, ht, pixel) ->
      self = @

      tkd = 
        uuid: self.uuid
        siteid: self.siteid
        usid: $sessionid
        ht: ht
        z: data.z

      # only copy over non-null value
      myData = {}
      for k, v of data when v?
        if !(typeof v is "string") or (myutil.trim(v).length > 0)
          # ignore uuid and z
          if ((k + '') != 'undefined' and k != 'uuid' and k != 'z' and !isDom(v))
            if (typeof v is 'boollean')
              v = if v then 1 else 0
            myData[k] = v

      # allow interception of data
      self.emit('track', {ht: ht, pixel: pixel, qs: [tkd, myData]})
      getImage(pixel, query.stringify(tkd), query.stringify(myData))
      self.emit('tracked', {ht: ht, pixel: pixel, qs: [tkd, myData]})
      return self

    _track: (ht, ctx) ->
      self = @
      if (!ctx?)
        ctx = {}

      # only track if valid siteid
      if (self.siteid > 0)
        pixel = myutil.trim(@pixel)

        if !self.uuid
          self.uuid = uuid()

          if self.store?
            self.store.get('tklsuid').then (id) ->
              if !id 
                self.store.set('tklsuid', self.uuid)
              self.uuid = id or self.uuid
              self._tk(ctx, ht, pixel)
        else
          self._tk(ctx, ht, pixel)
      @ # chaining

    ###*
    # track generic method
    #
    # @param {String} ht - hit types with possible values of 'pageview', 'event', 'transaction', 'item', 'social', 'exception', 'timing', 'app', 'custom'
    # @param {Object} ctx - extended data
    # @return {Object}
    ###
    track: (ht, ctx) ->
      self = @
      # only track after doc is ready
      myutil.ready ->
        self._track(ht or 'custom', ctx)
      @ # chaining

    ###*
    # track pageview
    #
    # @param {Object} ctx - extended data
    # @return {Object}
    ###
    pageview: (ctx) ->
      @track('pageview', ctx)

    ###*
    # track event
    #
    # @param {String} category
    # @param {String} action
    # @param {String} label
    # @param {String} property
    # @param {String} value - Values must be non-negative.
    # @return {Object}
    ###
    event: (category, action, label, property, value) ->
      if (value and value < 0)
        value = null

      @track('event', {
        ec: category || 'event'
        ea: action
        el: label
        ep: property
        ev: value
      })

# allow tracker to emmit events
Emitter(tracker.prototype)

###*
# tracker factory
#
###
class mytrakless
  ###*
   * create an instance of trakless
   * @return {object}
  ###
  constructor: ()->
    self = @
    self._track = debounce ->
      self = @

      # only track if we can detect onLine or is onLine
      if (!hasNOL or win.navigator.onLine)
        item = queue.pop()
        if (item?)
          self.emit('track', item)    
          for k, v of self.trackers
            v.track(item.ht, item.ctx)   
          self.emit('tracked', item)       
    , 222

    return self

  ###*
   * store all trackers
   * @type {Object}
  ###
  trackers: {}

  ###*
  # set default siteid
  #
  # @param {Number} siteid - the site id
  # @return {Object}
  ###
  setSiteId: (siteid) ->
    mysid = parseInt(siteid)
    $siteid = if mysid > 0 then mysid else $siteid
    return

  ###*
  # set default pixel
  #
  # @param {String} pixel - the default pixel url
  # @return {Object}
  ###
  setPixel: (pixelUrl) ->
    if (pixelUrl)
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
    self = @
    rst = new tracker()
    rst.siteid = if siteid? then siteid else $siteid
    rst.pixel = if pixelUrl? then pixelUrl else $pixel

    if rst.siteid? and rst.pixel?
      rst.store = xstore
      id = rst.getId()
      if !self.trackers[id]
        self.trackers[id] = rst
        rst.on 'tracked', self._track

      return self.trackers[id]

    throw "siteid or pixelUrl is required"

  ###*
  # get the default racker
  #
  ###
  getDefaultTracker: () ->
    self = @
    id = "#{$siteid}-#{$pixel}".replace(/[^a-zA-z]/gi, '$')
    if (!self.trackers[id]?)
      self.getTracker() 

    return self.trackers[id]

  ###*
  # utility
  #
  ###
  util: myutil

  ###*
   * track event
   * @param  {string} category
   * @param  {string} action
   * @param  {string} label
   * @param  {string} property
   * @param  {string} value
   * @return {object}
  ###
  event: (category, action, label, property, value) ->
   if (value and value < 0)
      value = null

    @track('event', {
      ec: category || 'event'
      ea: action
      el: label
      ep: property
      ev: value
    })

  ###*
   * track page view
   * @param  {object} ctx context/addtional parameter
   * @return {object}
  ###
  pageview: (ctx) ->
    @track('pageview', ctx)

  ###*
   * track anything
   * @param  {string} ht  hit type
   * @param  {object} ctx context/additonal parameter
   * @return {object}
  ###
  track: (ht, ctx) ->
    self = @
    self.getDefaultTracker()

    ctx = ctx or {}
    ctx.z = new Date().getTime() - $st
    queue.push({ht: ht, ctx: ctx})
    self._track()
    return self

  ###*
   * For situation when trakless is in an iframe, you can use this method
   * to emit event to the parent.
   * @param  {string} en event name
   * @param  {string} ed event detail
   * @return {object}    trakless
  ###
  emitTop: (en, ed) ->
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

# plugin example
trakless.on 'track', (item) ->
  if (item.ht is 'pageview')
    myDef = webanalyser.get()
    item.ctx = defaults(item.ctx, myDef) 

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
win._tk = trakless
module.exports = trakless

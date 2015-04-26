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
  $sessionid = session.getItem('tksuid')
  if !$sessionid?
    # get time since january 2014
    $sessionid = new Date().getTime() - $st
    session.setItem('tksuid', $sessionid)
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
    defaults: webanalyser.get() # each tracker has it's own defaults
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
          if ((k + '') != 'undefined' and k != 'uuid' and k != 'z')
            if (typeof v is 'boollean')
              v = if v then 1 else 0
            myData[k] = v

      getImage(pixel, query.stringify(tkd), query.stringify(myData))
      self.emit('track', tkd.ht, tkd, myData)
      return self

    _track: (ht, extra) ->
      self = @
      if (!extra?)
        extra = {}

      # only track if valid siteid
      if (self.siteid > 0)
        pixel = myutil.trim(@pixel)
        myDef = self.defaults
        data = if (ht == 'pageview') then defaults(extra, myDef) else extra

        if !self.uuid
          self.uuid = uuid()

          if self.store?
            self.store.get('tklsuid').then (id) ->
              if !id 
                self.store.set('tklsuid', self.uuid)
              self.uuid = id or self.uuid
              self._tk(data, ht, pixel)
        else
          self._tk(data, ht, pixel)
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
      item = queue.pop()
      if (item?)
        for k, v of self.trackers
          v.track(item.ht, item.ctx)
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
        rst.on 'track', self._track

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
win._tk = trakless
module.exports = trakless

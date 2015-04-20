win = window
tracker = require('./tracker.coffee')
myutil = require('./myutil.coffee')
xstore = require('xstore')

$defaultTracker = null
$siteid = 0
$pixel = '/pixel.gif'

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
  # the storage
  #
  # @return {Object}
  ###
  @store: xstore

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
    rst.store = xstore
    return rst

  ###*
  # get the default racker
  #
  ###
  @getDefaultTracker: () ->
    if (!$defaultTracker?)
      $defaultTracker = trakless.getTracker()
    return $defaultTracker

  ###*
  # utility
  #
  ###
  @util: myutil

# initialize $trakless2 to allow event pass to anybody listening on the parent
$trakless2 = trakless
if win.top != win

  try
    # this statement throw error if access is denied
    traklessParent = win.top.trakless
    $trakless2 = traklessParent
  catch # swallow any security error
    $trakless2 = win.parent.trakless

trakless.util.trakless2 = $trakless2

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

((window, document) ->
  tracker = require('./tracker.coffee')
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

  # auto init based on script attribute
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

  # initialize trakless as global
  window.trakless = trakless
  module.exports = trakless
) window, document

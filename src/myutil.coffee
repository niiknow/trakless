((win) ->
  domevent = require('domevent')
  $trakless2 = win.trakless
  doc = win.document

  ###*
  #  util
  ###
  class myutil
    ###*
    # allow for getting all attributes
    #
    # @param {HTMLElement} el - element
    # @return {Object}
    ###
    @allData: (el) ->
      data = {}
      for k, v in el.attributes
        name = /^data-/.replace(attr.name, '')
        camelCaseName = name.replace(/-(.)/g, ($0, $1) ->
          $1.toUpperCase()
        )
        data[camelCaseName] = attr.value

      return data

    ###*
    # mini jquery
    #
    ####
    @$: domevent

    ###*
    # attach to event
    #
    # @param {String} ename - event name
    # @param {Function} cb - callback
    # @return {Object}
    ####
    @on: (ename, cb) ->
      domevent(doc).on(ename, cb)
      @

    ###*
    # detach event
    #
    # @param {String} ename - event name
    # @param {Function} cb - callback
    # @return {Object}
    ####
    @off: (ename, cb) ->
      domevent(doc).off(ename, cb)
      @

    ###*
    # trigger event
    #
    # @param {String} ename - event name
    # @param {Object} edata - event data
    # @return {Object}
    ####
    @trigger: (ename, edata) ->
      # trigger only if $trakless2 has been initialized
      if $trakless2 and $trakless2.util
          $trakless2.util.$.trigger
            type: ename
            detail: edata
      @

    ###*
    # parse a string to JSON, return string if fail
    #
    # @param {String} v - string value
    # @return {Object}
    ####
    @stringToJSON: (v) ->
      if (typeof v is "string")
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
    @session: (k, v) ->
      if (v?)
        if !(typeof v is "string")
          v = domevent.toJSON(v)
        cookie('tls:'+k, v, { path: '/' })
        return v

      # attempt to parse the result from cookie
      return @stringToJSON(cookie('tls:'+k))

    ###*
    # click listener - useful util for click tracking
    #
    # @param {String} el - element or parent
    # @param {Function} handler - function handler
    # @param {String} monitor - selector/query of child to monitor
    # @return {Object}
    ####
    @onClick: (el, handler, monitor) ->
      domevent(el).on('click', handler, monitor)
      @

    ###*
    # document ready
    #
    ###
    @ready: domevent.ready

    ###*
    # each
    #
    ###
    @applyDefaults: defaults

    ###*
    # trim
    #
    ###
    @trim: (v) ->
      return v.replace(/^\s+|\s+$/gm,'')


  # initialize $trakless2 to allow event pass to anybody listening on the parent
  $trakless2 = trakless
  if win.top != win

    try
      # this statement throw error if access is denied
      traklessParent = win.top.trakless
      $trakless2 = traklessParent
    catch # swallow any security error
      $trakless2 = win.parent.trakless

  module.exports = myutil

) window

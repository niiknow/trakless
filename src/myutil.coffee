win = window
domevent = require('domevent')
cookie = require('cookie')
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
  allData: (el) ->
    data = {}
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
  # click listener - useful util for click tracking
  #
  # @param {String} el - element or parent
  # @param {Function} handler - function handler
  # @param {String} monitor - selector/query of child to monitor
  # @return {Object}
  ####
  onClick: (el, handler, monitor) ->
    domevent(el).on('click', handler, monitor)
    @

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

module.exports = new myutil()

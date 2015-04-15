((win) ->
  trakless = require('./trakless.coffee')

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
) window

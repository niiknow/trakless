((win) ->
  trakless = require('./trakless.coffee')

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
) window

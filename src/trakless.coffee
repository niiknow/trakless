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

module.exports = trakless

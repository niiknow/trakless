trakless = require('../src/index.coffee')
assert = require('component-assert')

describe 'trakless.trackPageView', ->
  it 'should fire a tracking pixel', (done)->
    trakless.setSiteId(1)
    console.log new Date('January 1, 2015').getTime()
    traker = trakless.getDefaultTracker()
    traker.on 'track', (evt) -> 
      assert evt is 'pageview', 'pageview pixel fired'
      done()
    traker.trackPageView()


  	


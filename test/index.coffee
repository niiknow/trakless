trakless = require('../src/index.coffee')
assert = require('component-assert')

describe 'trakless.pageview', ->
  it 'should fire a tracking pixel', (done)->
    trakless.setSiteId(1)
    traker = trakless.getDefaultTracker()
    traker.on 'track', (evt) -> 
      assert evt.ht is 'pageview', 'pageview pixel fired'
      done()
    traker.pageview()


  	


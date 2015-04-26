_tk = require('../src/index.coffee')
assert = require('component-assert')

describe 'trakless.pageview', ->
  it 'should fire a tracking pixel', (done)->
    _tk.setSiteId(1)
    _tk.on 'track', (evt) -> 
      assert evt.ht is 'pageview', 'pageview pixel fired'
      done()
    _tk.pageview()


  	


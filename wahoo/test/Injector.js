var assert = require('chai').assert;

var Injector = require('../Injector');

var injector;

var args = {
  a: 'hello',
  b: 'world',
};
function injectable(a, b) { return a + b; }


describe("The Injector", function() {
  describe("invoke method", function() {
    beforeEach(function() {
      injector = new Injector(args);
    })

    it("lets you inject functions.", function() { 
      var result = injector.invoke(injectable)
      assert.equal(result, 'helloworld');
    });

    it("lets you pass in static arguments.", function() {
      var result = injector.invoke(injectable, ['goodbye'])
      assert.equal(result, 'goodbyeworld');
    });

    it("lets you override modules.", function() {
      var result = injector.invoke(injectable, {a: 'm&m'})
      assert.equal(result, 'm&mworld');
    });
  });

  it("lets you customize how values are injected.", function() {
    function doubler(a) { return a + a; }
    doublingInjector = new Injector(args, doubler);
    var result = doublingInjector.invoke(injectable);
    assert.equal(result, 'hellohelloworldworld');
  })
});

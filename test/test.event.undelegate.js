/* global describe, beforeEach, afterEach, it, expect */
/* global $, EventManager, prefix, container */
/* jshint multistr: true */
describe('Event Delegate & Undelegate & Trigger', function() {
    this.timeout(1000)

    describe('EventManager._delegateBxTypeEvents( prefix, element, owner )', function() {
        beforeEach(function(done) {
            expect(
                $._data(document.body).events
            ).to.equal(undefined)
            container.html('<div bx-click="foo( 42, \'43\', 44 )">hello</div>')
            done()
        })
        afterEach(function(done) {
            expect(
                $._data(document.body).events
            ).to.equal(undefined)
            container.empty()
            done()
        })
        it('$element.trigger()', function(done) {
            var count = 0
            var owner = {
                answer: 42,
                foo: function(event, arg1, arg2, arg3) {
                    expect(this).to.be.equal(owner)
                    expect(this.answer).to.be.equal(42)
                    expect(event.type).to.be.equal('click')
                    expect([
                        arg1, arg2, arg3
                    ]).to.be.deep.equal([
                        42, '43', 44
                    ])
                    count++
                }
            }
            EventManager._delegate(prefix, container, owner)
            container.find('div').trigger('click')
            EventManager._undelegate(prefix, container)
            container.find('div').trigger('click')

            if (count === 1) done()
        })
    })
})
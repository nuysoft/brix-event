/* global describe, beforeEach, afterEach, it, expect */
/* global manager, $, container */
/* jshint multistr: true */
describe('Event Target', function() {
    this.timeout(1000)

    describe('bx-selector-type', function() {
        beforeEach(function() {
            expect(
                $._data(document.body).events
            ).to.equal(undefined)
        })
        afterEach(function(done) {
            expect(
                $._data(document.body).events
            ).to.equal(undefined)
            container.empty()
            done()
        })
        it('<div bx-body-click="foo( 42, \'42\' )">hello</div>', function(done) {
            container.html(this.test.title)
            var owner = {
                element: container,
                foo: function(event, arg1, arg2) {
                    expect(event.type).to.equal('click')
                    expect(arg1).to.equal(42)
                    expect(arg2).to.equal('42')
                    done()
                }
            }
            manager.delegate(container, owner)
            container.find('div').click()
            manager.undelegate(container)
        })
        it('<div bx-document-click="foo( 43, \'43\' )">hello</div>', function(done) {
            container.html(this.test.title)
            var owner = {
                foo: function(event, arg1, arg2) {
                    expect(event.type).to.equal('click')
                    expect(arg1).to.equal(43)
                    expect(arg2).to.equal('43')
                    done()
                }
            }
            manager.delegate(container, owner)
            container.find('div').click()
            manager.undelegate(container)
        })
        it('<div bx-window-click="foo( 44, \'44\' )">hello</div>', function(done) {
            container.html(this.test.title)
            var owner = {
                foo: function(event, arg1, arg2) {
                    expect(event.type).to.equal('click')
                    expect(arg1).to.equal(44)
                    expect(arg2).to.equal('44')
                    done()
                }
            }
            manager.delegate(container, owner)
            container.find('div').click()
            manager.undelegate(container)
        })
    })

    // TODO
    // describe('prefix-type', function() {})

})
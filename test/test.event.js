/* global require, console */
/* global chai, describe, before, it */
/* jshint multistr: true */
describe('Event', function() {

    this.timeout(1000)

    var expect = chai.expect
    var $, _, Event
    var container

    var types = ('blur focus focusin focusout load resize scroll unload click dblclick ' +
        'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
        'change select submit keydown keypress keyup error contextmenu').split(' ')
    var tpl = '<div bx-<%= type %>="<%= type %>Handle( <%= index %> )"></div>'

    before(function(done) {
        require(['jquery', 'underscore', 'brix/event'], function() {
            $ = arguments[0]
            _ = arguments[1]
            Event = arguments[2]
            container = $('#container')

            expect($).to.not.equal(undefined)
            expect(_).to.not.equal(undefined)
            expect(Event).to.not.equal(undefined)

            done()
        })
    })

    describe('Event._parseMethodAndParams( handler )', function() {
        var handler
        it('foo()', function() {
            handler = Event._parseMethodAndParams(this.test.title)
            expect(handler).to.deep.equal({
                method: 'foo',
                params: []
            })
        })
        it('foo( Math.random() )', function() {
            handler = Event._parseMethodAndParams(this.test.title)
            expect(handler).to.have.property('method')
                .that.be.a('string').equal('foo')
            expect(handler).to.have.property('params')
                .that.be.an('array').with.length(1)
            expect(handler).to.have.deep.property('params[0]')
                .that.be.a('number').within(0, 1)
        })
        it('foo( Math.random(), Math.random() )', function() {
            handler = Event._parseMethodAndParams(this.test.title)
            expect(handler).to.have.property('method')
                .that.be.a('string').equal('foo')
            expect(handler).to.have.property('params')
                .that.be.an('array').with.length(2)
            expect(handler).to.with.deep.property('params[0]')
                .that.within(0, 1)
            expect(handler).to.with.deep.property('params[1]')
                .that.within(0, 1)
        })
        it('foo( 42, "42" )', function() {
            handler = Event._parseMethodAndParams(this.test.title)
            expect(handler).to.have.property('method')
                .that.be.a('string').equal('foo')
            expect(handler).to.have.property('params')
                .that.be.an('array').with.length(2)
            expect(handler).to.have.deep.property('params[0]')
                .that.be.a('number').equal(42)
            expect(handler).to.have.deep.property('params[1]')
                .that.be.a('string').equal('42')
        })
        it('foo( { 42: 42 }, [ 42 ] )', function() {
            handler = Event._parseMethodAndParams(this.test.title)
            expect(handler).to.have.property('method')
                .that.be.a('string').equal('foo')
            expect(handler).to.have.property('params')
                .that.be.an('array').with.length(2)
            expect(handler).to.have.deep.property('params[0]')
                .that.be.a('object').deep.equal({
                    42: 42
                })
            expect(handler).to.have.deep.property('params[1]')
                .that.be.an('array').deep.equal([42])
        })
        it('foo( 42 + 42, "42" + "42" )', function() {
            handler = Event._parseMethodAndParams(this.test.title)
            expect(handler).to.have.property('method')
                .that.be.a('string').equal('foo')
            expect(handler).to.have.property('params')
                .that.be.an('array').with.length(2)
            expect(handler).to.have.deep.property('params[0]')
                .that.be.a('number').equal(42 + 42)
            expect(handler).to.have.deep.property('params[1]')
                .that.be.an('string').equal('4242')
        })
    })

    describe('Event._parseBxEvents( element )', function() {
        it('<div bx-click="foo( 42, \'42\' )"></div>', function(done) {
            var bxEvents = Event._parseBxEvents($(this.test.title))
            expect(bxEvents).to.be.an('array').with.length(1)
            _.each(bxEvents, function(bxEvent /*, index*/ ) {
                expect(bxEvent).to.have.property('target')
                    .that.have.property('nodeType')
                expect(bxEvent).to.have.property('type', 'click')
                expect(bxEvent).to.have.property('handler', 'foo( 42, \'42\' )')
                expect(bxEvent).to.have.property('method', 'foo')
                expect(bxEvent).to.have.property('params')
                    .that.deep.equal([42, '42'])
            })
            done()
        })
        it('<div bx-blur="blurHandle" bx-focus="focusHandle" bx-focusin="focusinHandle" bx-focusout="focusoutHandle"></div>', function(done) {
            var bxEvents = Event._parseBxEvents($(this.test.title))
            expect(bxEvents).to.be.an('array').with.length(4)
            _.each(bxEvents, function(bxEvent, index) {
                expect(bxEvent).to.have.property('target')
                    .that.have.property('nodeType')
                expect(bxEvent).to.have.property('type')
                    .that.not.equal('')
                expect(bxEvent).to.have.property('handler', bxEvent.type + 'Handle')
                expect(bxEvent).to.have.property('method', bxEvent.type + 'Handle')
                expect(bxEvent).to.have.property('params')
                    .that.deep.equal([])
            })
            done()
        })
        it('<div bx-blur="blurHandle" bx-focus="focusHandle" bx-focusin="focusinHandle" bx-focusout="focusoutHandle"></div>', function(done) {
            var bxEvents = Event._parseBxEvents($(this.test.title + this.test.title + this.test.title))
            expect(bxEvents).to.be.an('array').with.length(12)
            _.each(bxEvents, function(bxEvent, index) {
                expect(bxEvent).to.have.property('target')
                    .that.have.property('nodeType')
                expect(bxEvent).to.have.property('type')
                    .that.not.to.equal('')
                expect(bxEvent).to.have.property('handler', bxEvent.type + 'Handle')
                expect(bxEvent).to.have.property('method', bxEvent.type + 'Handle')
                expect(bxEvent).to.have.property('params')
                    .that.deep.equal([])
            })
            done()
        })
    })
    describe('Event._parseBxEvents( element, deep )', function() {
        it('nested bx-type', function(done) {
            var element, html
            _.map(types, function(type, index) {
                html = _.template(tpl)({
                    type: type,
                    index: index
                })
                if (index === 0) container.append(element = $(html))
                else element = $(html).appendTo(element)
            })

            var bxEvents = Event._parseBxEvents(container, true)
            expect(bxEvents).to.be.an('array').with.length(types.length)
            _.each(bxEvents, function(bxEvent, index) {
                expect(bxEvent).to.have.property('target')
                    .that.have.property('nodeType')
                expect(bxEvent).to.have.property('type')
                    .that.not.to.equal('')
                expect(bxEvent).to.have.property('handler', bxEvent.type + 'Handle( ' + index + ' )')
                expect(bxEvent).to.have.property('method', bxEvent.type + 'Handle')
                expect(bxEvent).to.have.property('params')
                    .that.deep.equal([index])
            })

            container.empty()
            done()
        })
        it('nested bx-type x3', function(done) {
            var element, html
            _.map(types, function(type, index) {
                html = _.template(tpl + tpl + tpl)({
                    type: type,
                    index: index
                })
                if (index === 0) container.append(element = $(html))
                else element = $(html).appendTo(element[index % 3])
            })

            var bxEvents = Event._parseBxEvents(container, true)
            expect(bxEvents).to.be.an('array').with.length(types.length * 3)
            _.each(bxEvents, function(bxEvent, index) {
                expect(bxEvent).to.have.property('target')
                    .that.have.property('nodeType')
                expect(bxEvent).to.have.property('type')
                    .that.not.equal('')
                expect(bxEvent).to.have.property('handler').to.match(
                    new RegExp(bxEvent.type + 'Handle\\( ' + '\\d+' + ' \\)')
                )
                expect(bxEvent).to.have.property('method', bxEvent.type + 'Handle')
                expect(bxEvent).to.have.property('params')
                    .that.be.an('array').with.length(1)
            })

            container.empty()
            done()
        })
    })
    describe('Event._parseBxTypes( element )', function() {
        it('<div bx-blur="blurHandle" bx-focus="focusHandle" bx-focusin="focusinHandle" bx-focusout="focusoutHandle"></div>', function(done) {
            var bxTypes = Event._parseBxTypes($(this.test.title))
            expect(bxTypes).to.be.an('array').with.length(4)
                .that.deep.equal(['blur', 'focus', 'focusin', 'focusout'])
            done()
        })
        it('<div bx-blur="blurHandle" bx-focus="focusHandle" bx-focusin="focusinHandle" bx-focusout="focusoutHandle"></div>', function(done) {
            var bxTypes = Event._parseBxTypes($(this.test.title + this.test.title + this.test.title))
            expect(bxTypes).to.be.an('array').with.length(4)
                .that.deep.equal(['blur', 'focus', 'focusin', 'focusout'])
            done()
        })
    })
    describe('Event._parseBxTypes( element, deep )', function() {
        it('nested bx-type', function(done) {
            var element, html
            _.map(types, function(type, index) {
                html = _.template(tpl)({
                    type: type,
                    index: index
                })
                if (index === 0) container.append(element = $(html))
                else element = $(html).appendTo(element)
            })

            var bxTypes = Event._parseBxTypes(container, true)
            expect(bxTypes).to.be.an('array').with.length(types.length)
                .that.deep.equal(types.sort())

            container.empty()
            done()
        })
        it('nested bx-type x3', function(done) {
            var element, html
            _.map(types, function(type, index) {
                html = _.template(tpl + tpl + tpl)({
                    type: type,
                    index: index
                })
                if (index === 0) container.append(element = $(html))
                else element = $(html).appendTo(element[index % 3])
            })

            var bxTypes = Event._parseBxTypes(container, true)
            expect(bxTypes).to.be.an('array').with.length(types.length)
                .that.deep.equal(types.sort())

            container.empty()
            done()
        })
    })

    describe('Event._delegateBxTypeEvents( owner, element )', function() {
        beforeEach(function(done) {
            container.html('<div bx-click="foo( 42, \'43\', 44 )">hello</div>')
            done()
        })
        afterEach(function(done) {
            container.empty()
            done()
        })
        it('$element.trigger()', function(done) {
            var owner = {
                foo: function(event, arg1, arg2, arg3) {
                    expect(event).to.have.property('type', 'click')
                    expect(arg1).to.equal(42)
                    expect(arg2).to.equal('43')
                    expect(arg3).to.equal(44)
                    done()
                }
            }
            var $element = container.find('div')
            Event._delegateBxTypeEvents(owner, $element)
            $element.trigger('click')
        })
        it('$element.trigger( extraParameter )', function(done) {
            var owner = {
                foo: function(event, arg1, arg2, arg3, arg4) {
                    expect(event).to.have.property('type', 'click')
                    expect(arg1).to.equal(41)
                    expect(arg2).to.equal(42)
                    expect(arg3).to.equal('43')
                    expect(arg4).to.equal(44)
                    done()
                }
            }
            var $element = container.find('div')
            Event._delegateBxTypeEvents(owner, $element)
            $element.trigger('click', 41)
        })
        it('$element.trigger( [ extraParameter, extraParameter ] )', function(done) {
            var owner = {
                foo: function(event, arg1, arg2, arg3, arg4, arg5) {
                    expect(event).to.have.property('type', 'click')
                    expect(arg1).to.equal(40)
                    expect(arg2).to.equal('41')
                    expect(arg3).to.equal(42)
                    expect(arg4).to.equal('43')
                    expect(arg5).to.equal(44)
                    done()
                }
            }
            var $element = container.find('div')
            Event._delegateBxTypeEvents(owner, $element)
            $element.trigger('click', [40, '41'])
        })
        it('$element.click()', function(done) {
            var owner = {
                foo: function(event, arg1, arg2, arg3) {
                    expect(event).to.have.property('type', 'click')
                    expect(arg1).to.equal(42)
                    expect(arg2).to.equal('43')
                    expect(arg3).to.equal(44)
                    done()
                }
            }
            var $element = container.find('div')
            Event._delegateBxTypeEvents(owner, $element)
            $element.click()
        })
        it('element.click()', function(done) {
            var owner = {
                foo: function(event, arg1, arg2, arg3) {
                    expect(event).to.have.property('type', 'click')
                    expect(arg1).to.equal(42)
                    expect(arg2).to.equal('43')
                    expect(arg3).to.equal(44)
                    done()
                }
            }
            var element = container.find('div')[0]
            Event._delegateBxTypeEvents(owner, element)
            element.click()
        })
    })

    describe('Event._delegateBxTypeEvents( owner, element, deep )', function() {
        beforeEach(function(done) {
            container.html('<div bx-click="foo( 42, \'43\', 44 )">hello</div>')
            done()
        })
        afterEach(function(done) {
            Event._undelegateBxTypeEvents(container, true)
            container.empty()
            done()
        })
        it('$element.trigger()', function(done) {
            var owner = {
                foo: function(event, arg1, arg2, arg3) {
                    expect(event).to.have.property('type', 'click')
                    expect(arg1).to.equal(42)
                    expect(arg2).to.equal('43')
                    expect(arg3).to.equal(44)
                    done()
                }
            }
            var $element = container.find('div')
            Event._delegateBxTypeEvents(owner, container, true)
            $element.trigger('click')
        })
        it('$element.trigger( extraParameter )', function(done) {
            var owner = {
                foo: function(event, arg1, arg2, arg3, arg4) {
                    expect(event).to.have.property('type', 'click')
                    expect(arg1).to.equal(41)
                    expect(arg2).to.equal(42)
                    expect(arg3).to.equal('43')
                    expect(arg4).to.equal(44)
                    done()
                }
            }
            var $element = container.find('div')
            Event._delegateBxTypeEvents(owner, container, true)
            $element.trigger('click', 41)
        })
        it('$element.trigger( [ extraParameter, extraParameter ] )', function(done) {
            var owner = {
                foo: function(event, arg1, arg2, arg3, arg4, arg5) {
                    expect(event).to.have.property('type', 'click')
                    expect(arg1).to.equal(40)
                    expect(arg2).to.equal('41')
                    expect(arg3).to.equal(42)
                    expect(arg4).to.equal('43')
                    expect(arg5).to.equal(44)
                    done()
                }
            }
            var $element = container.find('div')
            Event._delegateBxTypeEvents(owner, container, true)
            $element.trigger('click', [40, '41'])
        })
        it('$element.click()', function(done) {
            var owner = {
                foo: function(event, arg1, arg2, arg3) {
                    expect(event).to.have.property('type', 'click')
                    expect(arg1).to.equal(42)
                    expect(arg2).to.equal('43')
                    expect(arg3).to.equal(44)
                    done()
                }
            }
            var $element = container.find('div')
            Event._delegateBxTypeEvents(owner, container, true)
            $element.click()
        })
        it('element.click()', function(done) {
            var owner = {
                foo: function(event, arg1, arg2, arg3) {
                    expect(event).to.have.property('type', 'click')
                    expect(arg1).to.equal(42)
                    expect(arg2).to.equal('43')
                    expect(arg3).to.equal(44)
                    done()
                }
            }
            var $element = container.find('div')
            Event._delegateBxTypeEvents(owner, container, true)
            $element[0].click()
        })
    })

    describe('Event._delegateBxTypeEvents( owner, element, deep ) Nested', function() {
        beforeEach(function(done) {
            container.empty()
            done()
        })
        afterEach(function(done) {
            Event._undelegateBxTypeEvents(container, true)
            container.empty()
            done()
        })
        it(types, function(done) {
            var element, html
            _.map(types, function(type, index) {
                html = _.template(tpl)({
                    type: type,
                    index: index
                })
                if (index === 0) container.append(element = $(html))
                else element = $(html).appendTo(element)
            })

            var owner = {}
            _.each(types, function(type, index) {
                owner[type + 'Handle'] = function(event, arg) {
                    expect(event.type).to.equal(type)
                    expect(arg).to.equal(index)
                    if (event.type === 'error') event.stopPropagation()
                }
            })

            Event._delegateBxTypeEvents(owner, container, true)

            _.each(types, function(type, index) {
                $('[bx-' + type + ']', container).trigger(type)
            })

            done()

        })
    })

    describe('Owner.delegateBxTypeEvents()', function() {
        beforeEach(function(done) {
            container.empty()
            done()
        })
        afterEach(function(done) {
            container.empty()
            done()
        })

        it(types, function(done) {
            var element, html
            _.map(types, function(type, index) {
                html = _.template(tpl)({
                    type: type,
                    index: index
                })
                if (index === 0) container.append(element = $(html))
                else element = $(html).appendTo(element)
            })

            var owner = _.extend({
                answer: 42,
                element: container
            }, Event)
            _.each(types, function(type, index) {
                owner[type + 'Handle'] = function(event, arg) {
                    expect(event.type).to.equal(type)
                    expect(arg).to.equal(index)
                    if (event.type === 'error') event.stopPropagation()
                }
            })

            owner.delegateBxTypeEvents()

            _.each(types, function(type, index) {
                $('[bx-' + type + ']', container).trigger(type)
            })

            owner.undelegateBxTypeEvents()

            done()
        })
    })

    describe('Owner.delegateBxTypeEvents() Redelegate', function() {
        beforeEach(function(done) {
            container.empty()
            done()
        })
        afterEach(function(done) {
            container.empty()
            done()
        })

        it(types, function(done) {
            var element, html
            _.map(types, function(type, index) {
                html = _.template(tpl)({
                    type: type,
                    index: index
                })
                if (index === 0) container.append(element = $(html))
                else element = $(html).appendTo(element)
            })

            var owner = _.extend({
                answer: 42,
                element: container
            }, Event)
            _.each(types, function(type, index) {
                owner[type + 'Handle'] = function(event, arg) {
                    expect(event.type).to.equal(type)
                    expect(arg).to.equal(index)
                    if (event.type === 'error') event.stopPropagation()
                }
            })

            owner.delegateBxTypeEvents()

            container.empty()
            _.map(types, function(type, index) {
                html = _.template(tpl)({
                    type: type,
                    index: index
                })
                if (index === 0) container.append(element = $(html))
                else element = $(html).appendTo(element)
            })

            owner.delegateBxTypeEvents()

            _.each(types, function(type, index) {
                $('[bx-' + type + ']', container).trigger(type)
            })

            owner.undelegateBxTypeEvents()

            done()
        })
    })

    // TODO
    describe('bx-selector-type', function() {
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
            _.extend(owner, Event)
            owner.delegateBxTypeEvents()
            owner.element.find('div').click()
            owner.undelegateBxTypeEvents()
        })
        it('<div bx-document-click="foo( 43, \'43\' )">hello</div>', function(done) {
            container.html(this.test.title)
            var owner = {
                element: container,
                foo: function(event, arg1, arg2) {
                    expect(event.type).to.equal('click')
                    expect(arg1).to.equal(43)
                    expect(arg2).to.equal('43')
                    done()
                }
            }
            _.extend(owner, Event)
            owner.delegateBxTypeEvents()
            owner.element.find('div').click()
            owner.undelegateBxTypeEvents()
        })
        it('<div bx-window-click="foo( 44, \'44\' )">hello</div>', function(done) {
            container.html(this.test.title)
            var owner = {
                element: container,
                foo: function(event, arg1, arg2) {
                    expect(event.type).to.equal('click')
                    expect(arg1).to.equal(44)
                    expect(arg2).to.equal('44')
                    done()
                }
            }
            _.extend(owner, Event)
            owner.delegateBxTypeEvents()
            owner.element.find('div').click()
            owner.undelegateBxTypeEvents()
        })
    })

    // TODO
    describe('prefix-type', function() {

    })

})
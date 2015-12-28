/* global require */
/* global chai, describe, before, after, beforeEach, afterEach, it */
/* jshint multistr: true */
/*
    ## BDD
    1. 结构 
        describe suite
            [ describe ]
            before after beforeEach afterEach
            it test
        done
            搜索 this.async = fn && fn.length
    2. 常用 expect
        expect().to
            .equal .deep.equal .not.equal
            .match
            .have.length .with.length
            .have.property .have.deep.property
            .to.be.a .to.be.an
            .that
    3. 速度 
        搜索 test.speed
        slow > 75
        75 / 2 < medium < 75
        fast < 75 / 2
 */
describe('Event NameSpace', function() {

    this.timeout(1000)

    var expect = chai.expect
    var $, _, EventManager, manager
    var container
    var prefix = 'bx-'

    var types = ('blur focus focusin focusout load resize scroll unload click dblclick ' +
            'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
            'change select submit keydown keypress keyup contextmenu').split(' ') // error 
    var tpl = '<div bx-<%= type %>="<%= type %>Handle( <%= index %> )"></div>'

    before(function(done) {
        require(['jquery', 'underscore', 'brix/event'], function() {
            $ = arguments[0]
            _ = arguments[1]
            EventManager = arguments[2]
            manager = EventManager('bx-')
            container = $('#container')

            expect($).to.not.equal(undefined)
            expect(_).to.not.equal(undefined)
            expect(EventManager).to.not.equal(undefined)
            expect(manager).to.not.equal(undefined)

            done()
        })
    })

    describe('EventManager._parseBxEvents( prefix, element )', function() {
        it('<div bx-click.ns="foo( 42, \'42\' )"></div>', function(done) {
            var bxEvents = EventManager._parseBxEvents(prefix, $(this.test.title))
            expect(bxEvents).to.be.an('array').with.length(1)
            _.each(bxEvents, function(bxEvent /*, index*/ ) {
                // target type handler method params
                expect(bxEvent).to.have.property('target')
                    .that.have.property('nodeType')
                expect(bxEvent).to.have.property('type', 'click.ns')
                expect(bxEvent).to.have.property('handler', 'foo( 42, \'42\' )')
                expect(bxEvent).to.have.property('method', 'foo')
                expect(bxEvent).to.have.property('params')
                    .that.deep.equal([42, '42'])
            })
            done()
        })
        it('<div bx-blur.ns="blurHandle" bx-focus.ns="focusHandle" bx-focusin.ns="focusinHandle" bx-focusout.ns="focusoutHandle"></div>', function(done) {
            var bxEvents = EventManager._parseBxEvents(prefix, $(this.test.title))
            expect(bxEvents).to.be.an('array').with.length(4)
            _.each(bxEvents, function(bxEvent /*, index*/ ) {
                // target type handler method params
                expect(bxEvent).to.have.property('target')
                    .that.have.property('nodeType')
                expect(bxEvent).to.have.property('type')
                    .that.not.equal('')
                expect(bxEvent).to.have.property(
                    'handler', (
                        bxEvent.type + 'Handle'
                    ).replace('.ns', '')
                )
                expect(bxEvent).to.have.property(
                    'method', (
                        bxEvent.type + 'Handle'
                    ).replace('.ns', '')
                )
                expect(bxEvent).to.have.property('params')
                    .that.deep.equal([])
            })
            done()
        })
        it('<div bx-blur.ns="blurHandle" bx-focus.ns="focusHandle" bx-focusin.ns="focusinHandle" bx-focusout.ns="focusoutHandle"></div>', function(done) {
            var bxEvents = EventManager._parseBxEvents(prefix, $(this.test.title + this.test.title + this.test.title))
            expect(bxEvents).to.be.an('array').with.length(12)
            _.each(bxEvents, function(bxEvent /*, index*/ ) {
                // target type handler method params
                expect(bxEvent).to.have.property('target')
                    .that.have.property('nodeType')
                expect(bxEvent).to.have.property('type')
                    .that.not.to.equal('')
                expect(bxEvent).to.have.property(
                    'handler', (
                        bxEvent.type + 'Handle'
                    ).replace('.ns', '')
                )
                expect(bxEvent).to.have.property(
                    'method', (
                        bxEvent.type + 'Handle'
                    ).replace('.ns', '')
                )
                expect(bxEvent).to.have.property('params')
                    .that.deep.equal([])
            })
            done()
        })
    })
    describe('EventManager._parseBxEvents( prefix, element ) Nested', function() {
        it('nested bx-type', function(done) {
            var element, html
            _.map(types, function(type, index) {
                html = _.template(tpl)({
                    type: type + '.ns',
                    index: index
                })
                if (index === 0) container.append(element = $(html))
                else element = $(html).appendTo(element)
            })

            var bxEvents = EventManager._parseBxEvents(prefix, container)
            expect(bxEvents).to.be.an('array').with.length(types.length)
            _.each(bxEvents, function(bxEvent, index) {
                // target type handler method params
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
                    type: type + '.ns',
                    index: index
                })
                if (index === 0) container.append(element = $(html))
                else element = $(html).appendTo(element[index % 3])
            })

            var bxEvents = EventManager._parseBxEvents(prefix, container)
            expect(bxEvents).to.be.an('array').with.length(types.length * 3)
            _.each(bxEvents, function(bxEvent /*, index*/ ) {
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
    describe('EventManager._parseBxTypes( prefix, element )', function() {
        it('<div bx-blur.ns="blurHandle" bx-focus.ns="focusHandle" bx-focusin.ns="focusinHandle" bx-focusout.ns="focusoutHandle"></div>', function(done) {
            var bxTypes = EventManager._parseBxTypes(prefix, $(this.test.title))
            expect(bxTypes).to.be.an('array').with.length(4)
                .that.deep.equal(['blur.ns', 'focus.ns', 'focusin.ns', 'focusout.ns'])
            done()
        })
        it('<div bx-blur.ns="blurHandle" bx-focus.ns="focusHandle" bx-focusin.ns="focusinHandle" bx-focusout.ns="focusoutHandle"></div>', function(done) {
            var bxTypes = EventManager._parseBxTypes(prefix, $(this.test.title + this.test.title + this.test.title))
            expect(bxTypes).to.be.an('array').with.length(4)
                .that.deep.equal(['blur.ns', 'focus.ns', 'focusin.ns', 'focusout.ns'])
            done()
        })
    })
    describe('EventManager._parseBxTypes( prefix, element, deep )', function() {
        afterEach(function(done) {
            container.empty()
            done()
        })
        it('nested bx-type', function(done) {
            var element, html
            _.map(types, function(type, index) {
                html = _.template(tpl)({
                    type: type + '.ns',
                    index: index
                })
                if (index === 0) container.append(element = $(html))
                else element = $(html).appendTo(element)
            })

            var bxTypes = EventManager._parseBxTypes(prefix, container, true)
            expect(bxTypes).to.be.an('array').with.length(types.length)
                .that.deep.equal(
                    types.sort().map(function(type, index) {
                        return type + '.ns'
                    })
                )

            done()
        })
        it('nested bx-type x3', function(done) {
            var element, html
            _.map(types, function(type, index) {
                html = _.template(tpl + tpl + tpl)({
                    type: type + '.ns',
                    index: index
                })
                if (index === 0) container.append(element = $(html))
                else element = $(html).appendTo(element[index % 3])
            })

            var bxTypes = EventManager._parseBxTypes(prefix, container, true)
            expect(bxTypes).to.be.an('array').with.length(types.length)
                .that.deep.equal(
                    types.sort().map(function(type, index) {
                        return type + '.ns'
                    })
                )

            done()
        })
    })

    describe('EventManager._delegateBxTypeEvents( prefix, element, owner )', function() {
        beforeEach(function(done) {
            container.html('<div bx-click.ns="foo( 42, \'43\', 44 )">hello</div>')
            done()
        })
        afterEach(function(done) {
            container.empty()
            done()
        })
        it('$element.trigger()', function(done) {
            var count = 0
            var owner = {
                foo: function(event, arg1, arg2, arg3) {
                    expect(event).to.have.property('type', 'click')
                    expect(arg1).to.equal(42)
                    expect(arg2).to.equal('43')
                    expect(arg3).to.equal(44)

                    count++
                }
            }
            var $element = container.find('div')
            EventManager._delegateBxTypeEvents(prefix, $element, owner)
            $element.trigger('click')
            $element.trigger('click.ns')
            if (count === 1) done()
        })
        it('$element.trigger( extraParameter )', function(done) {
            var count = 0
            var owner = {
                foo: function(event, arg1, arg2, arg3, arg4) {
                    expect(event).to.have.property('type', 'click')
                    expect(arg1).to.equal(41)
                    expect(arg2).to.equal(42)
                    expect(arg3).to.equal('43')
                    expect(arg4).to.equal(44)

                    count++
                }
            }
            var $element = container.find('div')
            EventManager._delegateBxTypeEvents(prefix, $element, owner)
            $element.trigger('click', 41)
            $element.trigger('click.ns', 41)
            if (count === 1) done()
        })
        it('$element.trigger( [ extraParameter, extraParameter ] )', function(done) {
            var count = 0
            var owner = {
                foo: function(event, arg1, arg2, arg3, arg4, arg5) {
                    expect(event).to.have.property('type', 'click')
                    expect(event).to.have.property('namespace', 'ns')
                    expect(arg1).to.equal(40)
                    expect(arg2).to.equal('41')
                    expect(arg3).to.equal(42)
                    expect(arg4).to.equal('43')
                    expect(arg5).to.equal(44)

                    count++
                }
            }
            var $element = container.find('div')
            EventManager._delegateBxTypeEvents(prefix, $element, owner)
            $element.trigger('click', [40, '41'])
            $element.trigger('click.ns', [40, '41'])
            if (count === 1) done()
        })
        it('$element.click()', function(done) {
            var count = 0
            var owner = {
                foo: function(event, arg1, arg2, arg3) {
                    expect(event).to.have.property('type', 'click')
                    expect(arg1).to.equal(42)
                    expect(arg2).to.equal('43')
                    expect(arg3).to.equal(44)

                    count++
                }
            }
            var $element = container.find('div')
            EventManager._delegateBxTypeEvents(prefix, $element, owner)
            $element.click()

            if (count === 0) done()
        })
        it('element.click()', function(done) {
            var count =0
            var owner = {
                foo: function(event, arg1, arg2, arg3) {
                    expect(event).to.have.property('type', 'click')
                    expect(arg1).to.equal(42)
                    expect(arg2).to.equal('43')
                    expect(arg3).to.equal(44)

                    count++
                }
            }
            var $element = container.find('div')
            EventManager._delegateBxTypeEvents(prefix, $element[0], owner)
            if ($element[0].click) $element[0].click()
            else $element.click()

                if (count === 0) done()
        })
    })

    describe('EventManager._delegateBxTypeEvents( prefix, owner, element ) Nested', function() {
        beforeEach(function(done) {
            container.empty()
            done()
        })
        afterEach(function(done) {
            EventManager._undelegateBxTypeEvents(prefix, container, true)
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

            EventManager._delegateBxTypeEvents(prefix, container, owner)

            _.each(types, function(type /*, index*/ ) {
                $('[bx-' + type + ']', container).trigger(type)
            })

            done()

        })
    })

    describe('manager.delegate( element, owner )', function() {
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

            var owner = {
                answer: 42
            }
            _.each(types, function(type, index) {
                owner[type + 'Handle'] = function(event, arg) {
                    expect(event.type).to.equal(type)
                    expect(arg).to.equal(index)
                    expect(this.answer).to.equal(42)
                }
            })

            manager.delegate(container, owner)

            _.each(types, function(type /*, index*/ ) {
                $('[bx-' + type + ']', container).trigger(type)
            })

            manager.undelegate(container)

            done()
        })
    })

    describe('manager.delegate( element, owner ) Redelegate', function() {
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

            var owner = {
                answer: 42
            }
            _.each(types, function(type, index) {
                owner[type + 'Handle'] = function(event, arg) {
                    expect(event.type).to.equal(type)
                    expect(arg).to.equal(index)
                    expect(this.answer).to.equal(42)
                }
            })

            manager.delegate(container, owner)

            container.empty()
            _.map(types, function(type, index) {
                html = _.template(tpl)({
                    type: type,
                    index: index
                })
                if (index === 0) container.append(element = $(html))
                else element = $(html).appendTo(element)
            })

            manager.delegate(container, owner)

            _.each(types, function(type /*, index*/ ) {
                $('[bx-' + type + ']', container).trigger(type)
            })

            manager.undelegate(container)

            done()
        })
    })

})
/* global describe, afterEach, it, expect */
/* global EventManager, prefix, $, _, types, tpl, container */
/* jshint multistr: true */
describe('Event Hnadler Parser', function() {
    this.timeout(1000)

    describe('EventManager._parseMethodAndParams( handler )', function() {
        function parse_then_check(expression, method, len) {
            var handler = EventManager._parseMethodAndParams(expression)
            expect(handler.method).to.be.a('string').equal(method)
            expect(handler.params).to.be.an('array').with.length(len)
            return handler
        }

        it('foo()', function() {
            var handler = parse_then_check(this.test.title, 'foo', 0)
            this.test.title += ' => ' + JSON.stringify(handler)
        })
        it('foo( Math.random() )', function() {
            var handler = parse_then_check(this.test.title, 'foo', 1)
            expect(handler.params[0]).to.be.a('number').within(0, 1)
            this.test.title += ' => ' + JSON.stringify(handler)
        })
        it('foo( Math.random(), Math.random() )', function() {
            var handler = parse_then_check(this.test.title, 'foo', 2)
            expect(handler.params[0]).to.be.a('number').within(0, 1)
            expect(handler.params[1]).to.be.a('number').within(0, 1)
            this.test.title += ' => ' + JSON.stringify(handler)
        })
        it('foo( 42, "42" )', function() {
            var handler = parse_then_check(this.test.title, 'foo', 2)
            expect(handler.params[0]).to.be.a('number').equal(42)
            expect(handler.params[1]).to.be.a('string').equal('42')
            this.test.title += ' => ' + JSON.stringify(handler)
        })
        it('foo( { 42: 42 }, [ 42 ] )', function() {
            var handler = parse_then_check(this.test.title, 'foo', 2)
            expect(handler.params[0]).to.be.a('object').deep.equal({
                42: 42
            })
            expect(handler.params[1]).to.be.an('array').deep.equal([
                42
            ])
            this.test.title += ' => ' + JSON.stringify(handler)
        })
        it('foo( 42 + 42, "42" + "42" )', function() {
            var handler = parse_then_check(this.test.title, 'foo', 2)
            expect(handler.params[0]).to.be.a('number').equal(42 + 42)
            expect(handler.params[1]).to.be.a('string').equal('42' + '42')
            this.test.title += ' => ' + JSON.stringify(handler)
        })

        // 特殊情况：参数是 0 false '' undefined null
        it('foo(0)', function() {
            var handler = parse_then_check(this.test.title, 'foo', 1)
            expect(handler.params[0]).to.be.a('number').equal(0)
            this.test.title += ' => ' + JSON.stringify(handler)
        })
        it('foo(false)', function() {
            var handler = parse_then_check(this.test.title, 'foo', 1)
            expect(handler.params[0]).to.be.a('boolean').equal(false)
            this.test.title += ' => ' + JSON.stringify(handler)
        })
        it('foo(undefined)', function() {
            var handler = parse_then_check(this.test.title, 'foo', 1)
            expect(handler.params[0]).to.equal(undefined)
            this.test.title += ' => ' + JSON.stringify(handler)
        })
        it('foo(null)', function() {
            var handler = parse_then_check(this.test.title, 'foo', 1)
            expect(handler.params[0]).to.equal(null)
            this.test.title += ' => ' + JSON.stringify(handler)
        })
        it('foo("")', function() {
            var handler = parse_then_check(this.test.title, 'foo', 1)
            expect(handler.params[0]).to.be.a('string').equal('')
            this.test.title += ' => ' + JSON.stringify(handler)
        })

        // 特殊情况：参数格式不完整
        it('foo(,42)', function() {
            var handler = parse_then_check(this.test.title, 'foo', 2)
            expect(handler.params[0]).to.equal(undefined)
            expect(handler.params[1]).to.be.a('number').equal(42)
            this.test.title += ' => ' + JSON.stringify(handler)
        })
        it('foo(,42,)', function() {
            var handler = parse_then_check(this.test.title, 'foo', 2)
            expect(handler.params[0]).to.equal(undefined)
            expect(handler.params[1]).to.be.a('number').equal(42)
            this.test.title += ' => ' + JSON.stringify(handler)
        })
        it('foo(,,,)', function() {
            var handler = parse_then_check(this.test.title, 'foo', 3)
            expect(handler.params[0]).to.equal(undefined)
            expect(handler.params[1]).to.equal(undefined)
            expect(handler.params[2]).to.equal(undefined)
            this.test.title += ' => ' + JSON.stringify(handler)
        })
        it('foo("a", "b", "c")', function() {
            var handler = parse_then_check(this.test.title, 'foo', 3)
            expect(handler.params[0]).to.equal('a')
            expect(handler.params[1]).to.equal('b')
            expect(handler.params[2]).to.equal('c')
            this.test.title += ' => ' + JSON.stringify(handler)
        })
        it('foo(a,b,c)', function() {
            var handler = parse_then_check(this.test.title, 'foo', 3)
            expect(handler.params[0]).to.equal('a')
            expect(handler.params[1]).to.equal('b')
            expect(handler.params[2]).to.equal('c')
            this.test.title += ' => ' + JSON.stringify(handler)
        })

        // fix 空格
        it('foo(  "a"  ,  "b"  ,  "c"  )', function() {
            var handler = parse_then_check(this.test.title, 'foo', 3)
            expect(handler.params[0]).to.equal('a')
            expect(handler.params[1]).to.equal('b')
            expect(handler.params[2]).to.equal('c')
            this.test.title += ' - Spaces => ' + JSON.stringify(handler)
        })
        // fix 空格
        it('foo(  a  ,  b  ,  c  )', function() {
            var handler = parse_then_check(this.test.title, 'foo', 3)
            expect(handler.params[0]).to.equal('a')
            expect(handler.params[1]).to.equal('b')
            expect(handler.params[2]).to.equal('c')
            this.test.title += ' - Spaces => ' + JSON.stringify(handler)
        })
    })

    describe('EventManager._parseBxEvents( prefix, element )', function() {
        function parse_then_check(html, len) {
            var bxEvents = EventManager._parseBxEvents(prefix, $(html))
            expect(bxEvents).to.be.an('array').with.length(len)
            _.each(bxEvents, function(bxEvent /*, index*/ ) {
                // target type handler method params
                expect(bxEvent.target).to.have.property('nodeType')
                expect(bxEvent.type).to.not.equal(undefined)
                expect(bxEvent.handler).to.not.equal(undefined)
                expect(bxEvent.method).to.not.equal(undefined)
                expect(bxEvent.params).to.not.equal(undefined)
            })
            return bxEvents
        }
        it('<div bx-click="foo( 42, \'42\' )"></div>', function(done) {
            var bxEvents = parse_then_check(this.test.title, 1)
            _.each(bxEvents, function(bxEvent /*, index*/ ) {
                expect(bxEvent.type).to.equal('click')
                expect(bxEvent.handler).to.equal('foo( 42, \'42\' )')
                expect(bxEvent.method).to.equal('foo')
                expect(bxEvent.params).to.deep.equal([42, '42'])
            })
            done()
        })
        it('<div bx-blur="blurHandle" bx-focus="focusHandle" bx-focusin="focusinHandle" bx-focusout="focusoutHandle"></div>', function(done) {
            var bxEvents = parse_then_check(this.test.title, 4)
            _.each(bxEvents, function(bxEvent /*, index*/ ) {
                expect(bxEvent.type).to.not.equal('')
                expect(bxEvent.handler).to.equal(bxEvent.type + 'Handle')
                expect(bxEvent.method).to.equal(bxEvent.type + 'Handle')
                expect(bxEvent.params).to.deep.equal([])
            })
            done()
        })
        it('<div bx-blur="blurHandle" bx-focus="focusHandle" bx-focusin="focusinHandle" bx-focusout="focusoutHandle"></div> x3', function(done) {
            var bxEvents = parse_then_check(this.test.title + this.test.title + this.test.title, 4 * 3)
            _.each(bxEvents, function(bxEvent /*, index*/ ) {
                expect(bxEvent.type).to.not.equal('')
                expect(bxEvent.handler).to.equal(bxEvent.type + 'Handle')
                expect(bxEvent.method).to.equal(bxEvent.type + 'Handle')
                expect(bxEvent.params).to.deep.equal([])
            })
            done()
        })
    })
    describe('EventManager._parseBxEvents( prefix, element ) Nested', function() {
        afterEach(function() {
            container.empty()
        })
        it('nested bx-type', function(done) {
            var element, html
            _.each(types, function(type, index) {
                html = _.template(tpl)({
                    type: type,
                    index: index
                })
                if (index === 0) container.append(element = $(html))
                else element = $(html).appendTo(element)
            })

            var bxEvents = EventManager._parseBxEvents(prefix, container)
            expect(bxEvents).to.be.an('array').with.length(types.length)
            _.each(bxEvents, function(bxEvent, index) {
                expect(bxEvent.target).to.have.property('nodeType')
                expect(bxEvent.type).to.not.equal('')
                expect(bxEvent.handler).to.equal(bxEvent.type + 'Handle( ' + index + ' )')
                expect(bxEvent.method).to.equal(bxEvent.type + 'Handle')
                expect(bxEvent.params).to.deep.equal([index])
            })
            done()
        })
        it('nested bx-type x3', function(done) {
            var element, html
            _.each(types, function(type, index) {
                html = _.template(tpl + tpl + tpl)({
                    type: type,
                    index: index
                })
                if (index === 0) container.append(element = $(html))
                else element = $(html).appendTo(element[index % 3])
            })

            var bxEvents = EventManager._parseBxEvents(prefix, container)
            expect(bxEvents).to.be.an('array').with.length(types.length * 3)
            _.each(bxEvents, function(bxEvent /*, index*/ ) {
                expect(bxEvent.target).to.have.property('nodeType')
                expect(bxEvent.type).to.not.equal('')
                expect(bxEvent.handler).to.be.match(
                    new RegExp(bxEvent.type + 'Handle\\( ' + '\\d+' + ' \\)')
                )
                expect(bxEvent.method).to.equal(bxEvent.type + 'Handle')
                expect(bxEvent.params).to.be.an('array').with.length(1)
            })
            done()
        })
    })
    describe('EventManager._parseBxTypes( prefix, element )', function() {
        it('<div bx-blur="blurHandle" bx-focus="focusHandle" bx-focusin="focusinHandle" bx-focusout="focusoutHandle"></div>', function(done) {
            var bxTypes = EventManager._parseBxTypes(prefix, $(this.test.title))
            expect(bxTypes).to.be.an('array').with.length(4)
                .that.deep.equal(['blur', 'focus', 'focusin', 'focusout'])
            done()
        })
        it('<div bx-blur="blurHandle" bx-focus="focusHandle" bx-focusin="focusinHandle" bx-focusout="focusoutHandle"></div> x3', function(done) {
            var bxTypes = EventManager._parseBxTypes(prefix, $(this.test.title + this.test.title + this.test.title))
            expect(bxTypes).to.be.an('array').with.length(4)
                .that.deep.equal(['blur', 'focus', 'focusin', 'focusout'])
            done()
        })
    })
    describe('EventManager._parseBxTypes( prefix, element ) Nexted', function() {
        afterEach(function(done) {
            container.empty()
            done()
        })
        it('nested bx-type', function(done) {
            var element, html
            _.each(types, function(type, index) {
                html = _.template(tpl)({
                    type: type,
                    index: index
                })
                if (index === 0) container.append(element = $(html))
                else element = $(html).appendTo(element)
            })

            var bxTypes = EventManager._parseBxTypes(prefix, container)
            expect(bxTypes).to.be.an('array').with.length(types.length)
                .that.deep.equal(types.sort())

            done()
        })
        it('nested bx-type x3', function(done) {
            var element, html
            _.each(_.range(3), function() {
                _.each(types, function(type, index) {
                    html = _.template(tpl)({
                        type: type,
                        index: index
                    })
                    if (index === 0) container.append(element = $(html))
                    else element = $(html).appendTo(element)
                })
            })

            var bxTypes = EventManager._parseBxTypes(prefix, container)
            expect(bxTypes).to.be.an('array').with.length(types.length)
                .that.deep.equal(types.sort())

            done()
        })
    })
})
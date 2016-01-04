/* global describe, beforeEach, afterEach, it, expect */
/* global EventManager, manager, prefix, $, _, types, tpl, container */
/* jshint multistr: true */
describe('Event Delegate & Trigger', function() {
    this.timeout(1000)

    describe('EventManager._delegate( prefix, element, owner )', function() {
        var hello = '<div bx-click="foo( 42, \'43\', 44 )">hello</div>'
        this.title += ' - ' + hello
        beforeEach(function(done) {
            expect(
                $._data(document.body).events
            ).to.equal(undefined)
            container.html(hello)
            done()
        })
        afterEach(function(done) {
            EventManager._undelegate(prefix, container)
            expect(
                $._data(document.body).events
            ).to.equal(undefined)
            container.empty()
            done()
        })
        it('$element.trigger()', function(done) {
            var owner = {
                answer: 42,
                foo: function(event, arg1, arg2, arg3) {
                    expect(this).to.equal(owner)
                    expect(this.answer).to.equal(42)
                    expect(event.type).to.equal('click')
                    expect([
                        arg1, arg2, arg3
                    ]).to.deep.equal([
                        42, '43', 44
                    ])
                    done()
                }
            }
            EventManager._delegate(prefix, container, owner)
            container.find('div').trigger('click')
        })
        it('$element.trigger( extraParameter )', function(done) {
            var owner = {
                answer: 42,
                foo: function(event, arg1, arg2, arg3, arg4) {
                    expect(this).to.equal(owner)
                    expect(this.answer).to.equal(42)
                    expect(event.type).to.equal('click')
                    expect([
                        arg1, arg2, arg3, arg4
                    ]).to.deep.equal([
                        41, 42, '43', 44
                    ])
                    done()
                }
            }
            EventManager._delegate(prefix, container, owner)
            container.find('div').trigger('click', 41)
        })
        it('$element.trigger( [ extraParameter, extraParameter ] )', function(done) {
            var owner = {
                answer: 42,
                foo: function(event, arg1, arg2, arg3, arg4, arg5) {
                    expect(this).to.equal(owner)
                    expect(this.answer).to.equal(42)
                    expect(event.type).to.equal('click')
                    expect([
                        arg1, arg2, arg3, arg4, arg5
                    ]).to.deep.equal([
                        40, '41', 42, '43', 44
                    ])
                    done()
                }
            }
            EventManager._delegate(prefix, container, owner)
            container.find('div').trigger('click', [40, '41'])
        })
        it('$element.click()', function(done) {
            var owner = {
                answer: 42,
                foo: function(event, arg1, arg2, arg3) {
                    expect(this).to.equal(owner)
                    expect(this.answer).to.equal(42)
                    expect(event.type).to.equal('click')
                    expect([
                        arg1, arg2, arg3
                    ]).to.deep.equal([
                        42, '43', 44
                    ])
                    done()
                }
            }
            EventManager._delegate(prefix, container, owner)
            container.find('div').click()
        })
        it('element.click()', function(done) {
            var owner = {
                answer: 42,
                foo: function(event, arg1, arg2, arg3) {
                    expect(this).to.equal(owner)
                    expect(this.answer).to.equal(42)
                    expect(event.type).to.equal('click')
                    expect([
                        arg1, arg2, arg3
                    ]).to.deep.equal([
                        42, '43', 44
                    ])
                    done()
                }
            }
            EventManager._delegate(prefix, container, owner)
            var $element = container.find('div')
            if ($element[0].click) $element[0].click() // 浏览器
            else $element.click() // phantomjs
        })
    })

    describe('EventManager._delegate( prefix, element, owner ) Nested', function() {
        beforeEach(function(done) {
            expect(
                $._data(document.body).events
            ).to.equal(undefined)
            done()
        })
        afterEach(function(done) {
            EventManager._undelegate(prefix, container)
            expect(
                $._data(document.body).events
            ).to.equal(undefined)
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
                    expect(this).to.equal(owner)
                    expect(this.answer).to.equal(42)
                    expect([event.type, event.handleObj.origType]).to.include(type)
                        // expect(event.type).to.equal(type)
                    expect(arg).to.equal(index)
                    if (event.type === 'error') event.stopPropagation()
                }
            })

            EventManager._delegate(prefix, container, owner)
            _.each(types, function(type /*, index*/ ) {
                $('[bx-' + type + ']', container).trigger(type)
            })
            done()
        })
    })

    describe('manager.delegate( element, owner )', function() {
        beforeEach(function(done) {
            expect(
                $._data(document.body).events
            ).to.equal(undefined)
            done()
        })
        afterEach(function(done) {
            manager.undelegate(container)
            expect(
                $._data(document.body).events
            ).to.equal(undefined)
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
                    expect(this).to.equal(owner)
                    expect(this.answer).to.equal(42)
                    expect([event.type, event.handleObj.origType]).to.include(type)
                        // expect(event.type).to.equal(type)
                    expect(arg).to.equal(index)
                }
            })

            manager.delegate(container, owner)

            _.each(types, function(type /*, index*/ ) {
                $('[bx-' + type + ']', container).trigger(type)
            })
            done()
        })
    })

    describe('manager.delegate( element, owner ) Redelegate', function() {
        beforeEach(function(done) {
            expect(
                $._data(document.body).events
            ).to.equal(undefined)
            done()
        })
        afterEach(function(done) {
            manager.undelegate(container)
            expect(
                $._data(document.body).events
            ).to.equal(undefined)
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
                    expect(this).to.equal(owner)
                    expect(this.answer).to.equal(42)
                    expect([event.type, event.handleObj.origType]).to.include(type)
                        // expect(event.type).to.equal(type)
                    expect(arg).to.equal(index)
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
            done()
        })
    })
})
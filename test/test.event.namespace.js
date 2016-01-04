/* global describe, beforeEach, afterEach, it, expect */
/* global EventManager, $, _, Mock, container */
/* jshint multistr: true */
describe('Event Delegate & Trigger - Namespace', function() {
    this.timeout(100)

    var bxManager, mxManager, logs

    beforeEach(function(done) {
        var complex = Mock.heredoc(function() {
            /*!
            <div 
                bx-click="foo()" bx-click.ns0="foo()" bx-click.ns1="foo()"
                mx-click="foo()" mx-click.ns0="foo()" mx-click.ns1="foo()">
            </div>
             */
        })
        expect(
            $._data(document.body).events
        ).to.equal(undefined)
        container.html(_.template(complex)())

        logs = []

        // 定义事件管理器
        bxManager = new EventManager('bx-')
        mxManager = new EventManager('mx-')

        // 定义宿主对象，可以是任意对象
        var owner1 = {
            foo: function foo(event) {
                expect(this).to.be.equal(owner1)
                logs.push([event.type, 'owner1', arguments.callee.name, event.namespace].join(' '))
            },
            stop: function stop(event) {
                expect(this).to.be.equal(owner1)
                logs.push([event.type, 'owner1', arguments.callee.name, event.namespace].join(' '))
                event.stopPropagation()
            }
        }
        var owner2 = {
            foo: function foo(event) {
                expect(this).to.be.equal(owner2)
                logs.push([event.type, 'owner2', arguments.callee.name, event.namespace].join(' '))
            },
            stop: function stop(event) {
                expect(this).to.be.equal(owner2)
                logs.push([event.type, 'owner2', arguments.callee.name, event.namespace].join(' '))
                event.stopPropagation()
            }
        }

        // 绑定
        bxManager.delegate(container, owner1)
        bxManager.delegate(container, owner1)
        mxManager.delegate(container, owner2)
        mxManager.delegate(container, owner2)

        done()
    })
    afterEach(function(done) {
        // 移除
        bxManager.undelegate(container)
        bxManager.undelegate(container)
        mxManager.undelegate(container)
        mxManager.undelegate(container)

        expect(
            $._data(document.body).events
        ).to.equal(undefined)
        container.empty()
        done()
    })

    describe('Trigger', function() {
        it('> div', function(done) {
            $(this.test.title, container).trigger('click.ns0')
            console.log(logs)
            expect(logs).to.be.deep.equal([
                'click owner1 foo ns0', 'click owner2 foo ns0',
            ])
            this.test.title += ' => ' + JSON.stringify(logs)
            done()
        })
        it('> div', function(done) {
            $(this.test.title, container).trigger('click.ns1')
            console.log(logs)
            expect(logs).to.be.deep.equal([
                'click owner1 foo ns1', 'click owner2 foo ns1',
            ])
            this.test.title += ' => ' + JSON.stringify(logs)
            done()
        })
    })
})
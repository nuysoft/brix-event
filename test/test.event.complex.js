/* global describe, beforeEach, afterEach, it, expect */
/* global EventManager, $, _, Mock, container */
/* jshint multistr: true */
describe('Event Delegate & Trigger - Complex', function() {
    this.timeout(1000)

    var bxManager, mxManager, logs

    beforeEach(function(done) {
        var complex = Mock.heredoc(function() {
            /*!
            <ul>
                <% for (var i = 0; i < 3; i++) { %>
                    <li bx-click="foo(<%=i%>,li)" mx-click="foo(<%=i%>,li)">
                        <span bx-click="foo(<%=i%>,span)" mx-click="foo(<%=i%>,span)"><%=i%></span>
                        <span bx-click="stop(<%=i%>,span)" mx-click="stop(<%=i%>,span)"><%=i%></span>
                        <ul bx-click="foo(<%=i%>-*,ul)" mx-click="foo(<%=i%>-*,ul)">
                            <% for (var ii = 0; ii < 3; ii++) { %>
                                <li bx-click="foo(<%=i%>-<%=ii%>,li)" mx-click="foo(<%=i%>-<%=ii%>,li)">
                                    <span bx-click="foo(<%=i%>-<%=ii%>,span)" mx-click="foo(<%=i%>-<%=ii%>,span)"><%=i%>-<%=ii%></span>
                                    <span bx-click="stop(<%=i%>-<%=ii%>,span)" mx-click="stop(<%=i%>-<%=ii%>,span)"><%=i%>-<%=ii%></span>
                                    <ul bx-click="foo(<%=i%>-<%=ii%>-*,ul)" mx-click="foo(<%=i%>-<%=ii%>-*,ul)">
                                        <% for (var iii = 0; iii < 3; iii++) { %>
                                            <li bx-click="foo(<%=i%>-<%=ii%>-<%=iii%>,li)" mx-click="foo(<%=i%>-<%=ii%>-<%=iii%>,li)">
                                                <span bx-click="foo(<%=i%>-<%=ii%>-<%=iii%>,span)" mx-click="foo(<%=i%>-<%=ii%>-<%=iii%>,span)"%>-<%=ii%>-<%=iii%></span>
                                                <span bx-click="stop(<%=i%>-<%=ii%>-<%=iii%>,span)" mx-click="stop(<%=i%>-<%=ii%>-<%=iii%>,span)"%>-<%=ii%>-<%=iii%></span>
                                            </li>
                                        <% } %>
                                    </ul>
                                </li>
                            <% } %>
                        </ul>
                    </li>
                <% } %>
            </ul>
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
            foo: function foo(event, arg1, arg2) {
                expect(this).to.equal(owner1)
                logs.push([event.type, 'owner1', arguments.callee.name, arg1, arg2].join(' '))
            },
            stop: function stop(event, arg1, arg2) {
                expect(this).to.equal(owner1)
                logs.push([event.type, 'owner1', arguments.callee.name, arg1, arg2].join(' '))
                event.stopPropagation()
            }
        }
        var owner2 = {
            foo: function foo(event, arg1, arg2) {
                expect(this).to.equal(owner2)
                logs.push([event.type, 'owner2', arguments.callee.name, arg1, arg2].join(' '))
            },
            stop: function stop(event, arg1, arg2) {
                expect(this).to.equal(owner2)
                logs.push([event.type, 'owner2', arguments.callee.name, arg1, arg2].join(' '))
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

    describe('Tree', function() {
        it('> ul > li:eq(0)', function(done) {
            $(this.test.title, container).click()
            expect(logs).to.deep.equal([
                'click owner1 foo 0 li', 'click owner2 foo 0 li',
            ])
            this.test.title += ' => ' + JSON.stringify(logs)
            done()
        })
        it('> ul > li:eq(1)', function(done) {
            $(this.test.title, container).click()
            expect(logs).to.deep.equal([
                'click owner1 foo 1 li', 'click owner2 foo 1 li',
            ])
            this.test.title += ' => ' + JSON.stringify(logs)
            done()
        })
        it('> ul > li:eq(2)', function(done) {
            $(this.test.title, container).click()
            expect(logs).to.deep.equal([
                'click owner1 foo 2 li', 'click owner2 foo 2 li',
            ])
            this.test.title += ' => ' + JSON.stringify(logs)
            done()
        })

        it('> ul > li:eq(1) > span:eq(0)', function(done) {
            $(this.test.title, container).click()
            expect(logs).to.deep.equal([
                'click owner1 foo 1 span', 'click owner2 foo 1 span',
                'click owner1 foo 1 li', 'click owner2 foo 1 li',
            ])
            this.test.title += ' => ' + JSON.stringify(logs)
            done()
        })

        it('> ul > li:eq(1) > ul', function(done) {
            $(this.test.title, container).click()
            expect(logs).to.deep.equal([
                'click owner1 foo 1-* ul', 'click owner2 foo 1-* ul',
                'click owner1 foo 1 li', 'click owner2 foo 1 li',
            ])
            this.test.title += ' => ' + JSON.stringify(logs)
            done()
        })

        it('> ul > li:eq(1) > ul > li:eq(1)', function(done) {
            $(this.test.title, container).click()
            expect(logs).to.deep.equal([
                'click owner1 foo 1-1 li', 'click owner2 foo 1-1 li',
                'click owner1 foo 1-* ul', 'click owner2 foo 1-* ul',
                'click owner1 foo 1 li', 'click owner2 foo 1 li',
            ])
            this.test.title += ' => ' + JSON.stringify(logs)
            done()
        })

        it('> ul > li:eq(1) > ul > li:eq(1) > span:eq(0)', function(done) {
            $(this.test.title, container).click()
            expect(logs).to.deep.equal([
                'click owner1 foo 1-1 span', 'click owner2 foo 1-1 span',
                'click owner1 foo 1-1 li', 'click owner2 foo 1-1 li',
                'click owner1 foo 1-* ul', 'click owner2 foo 1-* ul',
                'click owner1 foo 1 li', 'click owner2 foo 1 li',
            ])
            this.test.title += ' => ' + JSON.stringify(logs)
            done()
        })

        it('> ul > li:eq(1) > ul > li:eq(1) > ul', function(done) {
            $(this.test.title, container).click()
            expect(logs).to.deep.equal([
                'click owner1 foo 1-1-* ul', 'click owner2 foo 1-1-* ul',
                'click owner1 foo 1-1 li', 'click owner2 foo 1-1 li',
                'click owner1 foo 1-* ul', 'click owner2 foo 1-* ul',
                'click owner1 foo 1 li', 'click owner2 foo 1 li',
            ])
            this.test.title += ' => ' + JSON.stringify(logs)
            done()
        })

        it('> ul > li:eq(1) > ul > li:eq(1) > ul > li:eq(1)', function(done) {
            $(this.test.title, container).click()
            expect(logs).to.deep.equal([
                'click owner1 foo 1-1-1 li', 'click owner2 foo 1-1-1 li',
                'click owner1 foo 1-1-* ul', 'click owner2 foo 1-1-* ul',
                'click owner1 foo 1-1 li', 'click owner2 foo 1-1 li',
                'click owner1 foo 1-* ul', 'click owner2 foo 1-* ul',
                'click owner1 foo 1 li', 'click owner2 foo 1 li',
            ])
            this.test.title += ' => ' + JSON.stringify(logs)
            done()
        })

        it('> ul > li:eq(1) > ul > li:eq(1) > ul > li:eq(1) > span:eq(0)', function(done) {
            $(this.test.title, container).click()
            expect(logs).to.deep.equal([
                'click owner1 foo 1-1-1 span', 'click owner2 foo 1-1-1 span',
                'click owner1 foo 1-1-1 li', 'click owner2 foo 1-1-1 li',
                'click owner1 foo 1-1-* ul', 'click owner2 foo 1-1-* ul',
                'click owner1 foo 1-1 li', 'click owner2 foo 1-1 li',
                'click owner1 foo 1-* ul', 'click owner2 foo 1-* ul',
                'click owner1 foo 1 li', 'click owner2 foo 1 li',
            ])
            this.test.title += ' => ' + JSON.stringify(logs)
            done()
        })
    })

    describe('StopPropagation', function() {
        it('> ul > li:eq(1) > span:eq(1)', function(done) {
            $(this.test.title, container).click()
            expect(logs).to.deep.equal([
                'click owner1 stop 1 span', 'click owner2 stop 1 span',
            ])
            this.test.title += ' => ' + JSON.stringify(logs)
            done()
        })
        it('> ul > li:eq(1) > ul > li:eq(1) > span:eq(1)', function(done) {
            $(this.test.title, container).click()
            expect(logs).to.deep.equal([
                'click owner1 stop 1-1 span', 'click owner2 stop 1-1 span',
            ])
            this.test.title += ' => ' + JSON.stringify(logs)
            done()
        })
        it('> ul > li:eq(1) > ul > li:eq(1) > ul > li:eq(1)> span:eq(1)', function(done) {
            $(this.test.title, container).click()
            expect(logs).to.deep.equal([
                'click owner1 stop 1-1-1 span', 'click owner2 stop 1-1-1 span',
            ])
            this.test.title += ' => ' + JSON.stringify(logs)
            done()
        })
    })
})
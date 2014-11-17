/* global define */
/* global setTimeout */

/*
    ## BX-EVENT

    支持 **bx-type** 风格的事件模型，实现事件与与 DOM 结构的松耦合，提升可读性、可复用性和可测试性。

    ### WHY BX-TYPE

    通常，我们用 `$( selector ).on( events [, selector ] [, data ], handler )` 来绑定事件。

    这么做的主要问题在于，会与选择器表达式 `selector` 紧密耦合，即与 DOM 结构和 CSS 类样式紧密耦合。当选择器表达式 `selector` 比较复杂时，更加明显。

    假设有下面的 DOM 结构，我们需要在 `button.minus` 和 `button.plus` 上绑定 `click` 事件：

    ```html
    <div id="container">
        <div class="datepicker">
            <div class="picker-header">
                <button class="minus">-</button>
                <button class="plus">+</button>
            </div>
        </div>
    </div>
    ```

    如果采用传统的写法，需要依赖 DOM 结构和 CSS 类样式才能实现：

    ```js
    var owner = {
        date: moment()
    }
    var $container = $('#container')
    $container
        .on('click', '.datepicker .picker-header .minus', function( event ) {
            owner.date.add(-1, 'month')
        })
        .on('click', '.datepicker .picker-header .plus', function( event ) {
            owner.date.add(1, 'month')
        })
    ```

    在阅读上面的代码时，为了查找节点对应的事件监听函数，也需要先观察 DOM 结构和 CSS 类样式。

    而 **bx-type** 风格的事件模型在写法上，与 DOM 结构和 CSS 类样式无关，只需要在 `button.minus` 和 `button.plus` 上稍作配置，就像下面的代码所示：

    ```html
    <button class="minux" bx-click="changeDate(-1)">-</button>
    <button class="plus" bx-click="changeDate(1)">+</button>
    ```
    在 JavaScript 代码中，可以把 `that.date.add(-1, 'month')` 和 `that.date.add(-1, 'month')` 合并为方法 `changeDate`：

    ```js
    var owner = {
        element: $('#container'),
        date: moment(),
        changeDate: function(event, dir) {
            if (!event.type) dir = event
            this.date.add(dir, 'month')
        }
    }
    _.extend(owner, Event)
    owner.delegateBxTypeEvents()
    ```
    
    首先，通过增加语义化的名称 `changeDate`，会使代码更加容易阅读和查找。
    其次，方法 `changeDate` 合并了相似的代码。这种方式使得提升代码复用性更加容易。
    并且，通过在方法 `changeDate` 中增加 `if (!event.type) dir = event`，使得可以直接执行 `changeDate(dir)` ，而不需要依赖事件系统。这可以让测试代码不再依赖事件系统。
    
    #### 结论

    **bx-type** 风格的事件模型让开发体验更愉悦。
    
    #### 结语
    
    早在 AngularJS 之前，Magix 就已引入了 **bx-type** 风格的事件模型。这次提取为独立库，实现和 API 更加清晰，希望能复用到更多的框架和库中，
    
    ### HOW BX-TYPE

    **bx-type** 风格的事件模型并不需要重新建设一套新的事件模型，只是在浏览器模型基础上，增强了事件绑定的写法，事件的传播机制和触发机制没有任何变化。
    
    具体的实现基于 jQuery 事件模型，所以 jQuery 提供的所有事件方法都可以继续使用。

    ### WHAT BX-TYPE

    提供了两个方法：`.delegateBxTypeEvents()`、`.undelegateBxTypeEvents`，分别用于绑定和移除 **bx-type** 风格的事件。

    ```js
    var owner = {
        element: element,
        method1: function(event, extra) {
            // ...
        },
        method2: function(event, extra) {
            // ...
        }
    }
    _.extend(owner, Event)
    owner.delegateBxTypeEvents()
    owner.undelegateBxTypeEvents()
    ```
*/
define(
    [
        'jquery', 'underscore'
    ],
    function(
        jQuery, _
    ) {

        var DEBUG = ~location.search.indexOf('debug') && {
            fix: function(arg, len) {
                var fix = parseInt(len) - arg.length
                for (var i = 0; i < fix; i++) {
                    arg += ' '
                }
                return arg
            }
        }

        var PREFIX
        var RE_BX_TYPE

        function setup(prefix) {
            PREFIX = prefix
            RE_BX_TYPE = new RegExp(PREFIX + '(?!name|options)(.+)')
        }
        setup('bx-')

        var RE_FN_ARGS = /([^()]+)(?:\((.*)\))?/
        var NAMESPACE = '.' + (Math.random() + '').replace(/\D/g, '')

        var RE_BX_TARGET_TYPE = /^(window|document|body)-(.+)/

        return {
            setup: function(prefix) {
                if (prefix) return PREFIX

                setup(prefix)

                return this
            },

            /*
                #### .delegateBxTypeEvents( [ element ] )

                在节点 `element` 上代理 `bx-type` 风格的事件监听函数。
            */
            delegateBxTypeEvents: function(element) {
                element = element || this.element
                if (!element) return this

                var label = 'bx-event'
                if (DEBUG) {
                    console.group(label)
                    console.time(label)
                    console.log(jQuery(element).toArray())
                }

                _delegateBxTypeEvents(this, element, false)
                _delegateBxTypeEvents(this, element, true)

                if (DEBUG) {
                    console.timeEnd(label)
                    console.groupEnd(label)
                }

                return this
            },
            /*
                #### .undelegateBxTypeEvents()

                从节点 `element` 上移除 `bx-type` 风格的事件监听函数。
            */
            undelegateBxTypeEvents: function(element) {
                element = element || this.element
                if (!element) return this

                _undelegateBxTypeEvents(element, false)
                _undelegateBxTypeEvents(element, true)

                return this
            },
            _delegateBxTypeEvents: _delegateBxTypeEvents,
            _undelegateBxTypeEvents: _undelegateBxTypeEvents,
            _parseBxTypes: _parseBxTypes,
            _parseBxEvents: _parseBxEvents,
            _parseMethodAndParams: _parseMethodAndParams,
        }

        function _delegateBxTypeEvents(owner, element, deep) {
            var $element = jQuery(element)
            var data = $element.data()
            if (!data._bxevents) data._bxevents = {}

            var types = _parseBxTypes(element, deep)
            _.each(types, function(type /*, index*/ ) {
                if (data._bxevents[type]) return
                data._bxevents[type] = true

                var bxtype = PREFIX + type
                var selector = '[' + PREFIX + type + ']' // 'bx-' + type
                var $target = $element

                if (DEBUG) {
                    console.log(DEBUG.fix(type, 16), bxtype)
                }

                RE_BX_TARGET_TYPE.exec('')
                if (RE_BX_TARGET_TYPE.exec(type)) {
                    _delegateBxTargetType(type, element, owner)
                    return
                }

                $element.on.apply(
                    $element,
                    deep ? [type + NAMESPACE, selector, _appetizer] : [type + NAMESPACE, _appetizer]
                )
                $element.on.apply(
                    $element,
                    deep ? [bxtype + NAMESPACE, selector, __entrees] : [bxtype + NAMESPACE, __entrees]
                )

                function __entrees(event) {
                    var extraParameters = [].slice.call(arguments, 1)
                    _entrees.apply(this, [event, owner].concat(extraParameters))
                }
            })
        }

        // 开胃菜
        function _appetizer(event) {
            // type ==> bx-type
            var type = event.type
            var bxtype = PREFIX + type
            event.type = bxtype // bx-type

            jQuery(event.target).trigger(event, [].slice.call(arguments, 1))

            // bx-type ==> type
            event.type = type
        }

        // 主菜
        function _entrees(event, owner) {
            // bx-type ==> type
            var bxtype = event.type // bx-type
            var type = bxtype.replace(PREFIX, '') // type
            event.type = type

            var extraParameters = [].slice.call(arguments, 2)

            var handler = jQuery(event.currentTarget).attr(bxtype)
            if (!handler) return

            var parts = _parseMethodAndParams(handler)
            if (parts && owner[parts.method]) {
                owner[parts.method].apply(
                    owner, [event].concat(extraParameters).concat(parts.params)
                )
            } else {
                /* jshint evil:true */
                eval(handler)
            }

            // type ==> bx-type
            event.type = bxtype
        }

        function _undelegateBxTypeEvents(element, deep) {
            var $element = jQuery(element)
            var bxevents = $element.data()._bxevents
            _.each(bxevents, function(flag, type) {
                bxevents[type] = false

                RE_BX_TARGET_TYPE.exec('')
                if (RE_BX_TARGET_TYPE.exec(type)) {
                    _undelegateBxTargetTypeEvents(type, element)
                    return
                }

                var bxtype = PREFIX + type
                var selector = '[' + PREFIX + type + ']' // 'bx-' + type

                $element.off.apply(
                    $element,
                    deep ? [type + NAMESPACE, selector] : [type + NAMESPACE]
                )
                $element.off.apply(
                    $element,
                    deep ? [bxtype + NAMESPACE, selector] : [bxtype + NAMESPACE]
                )
            })
        }

        // 在指定的节点上绑定事件
        function _delegateBxTargetType(type, element, owner) {
            // $1 window|document|body, $2 type
            RE_BX_TARGET_TYPE.exec('')
            var ma = RE_BX_TARGET_TYPE.exec(type)
            if (!ma) throw '不支持 ' + type

            var bxtype = PREFIX + type

            var $target =
                ma[1] === 'window' && 　jQuery(window) ||
                ma[1] === 'document' && 　jQuery(document) ||
                ma[1] === 'body' && 　jQuery(document.body)

            $target.on(ma[2] + NAMESPACE, _appetizer)
            $target.on(bxtype + NAMESPACE, _entrees)

            // 开胃菜
            function _appetizer(event) {
                var originalType = event.type // click
                event.type = bxtype // bx-window-click
                jQuery(event.target).trigger(event, [].slice.call(arguments, 1))
                event.type = originalType
            }

            // 主菜
            function _entrees(event) {
                var selector = '[' + PREFIX + type + ']'
                var $targets = function() {
                    var targets = []
                    if (jQuery(event.target).is(selector)) targets.push(event.target)
                    var parents = jQuery(event.target).parentsUntil(element, selector)
                    targets = targets.concat(parents.toArray())
                    return $(targets)
                }()

                // bx-target-type ==> type
                var currentType = event.type // bx-target-type
                var originalType = ma[2] // type
                event.type = originalType

                var extraParameters = [].slice.call(arguments, 2)

                _.each($targets, function(item, index) {
                    var handler = jQuery(item).attr(currentType)
                    if (!handler) return

                    var parts = _parseMethodAndParams(handler)
                    if (parts && owner[parts.method]) {
                        owner[parts.method].apply(
                            owner, [event].concat(extraParameters).concat(parts.params)
                        )
                    } else {
                        /* jshint evil:true */
                        eval(handler)
                    }
                })

                // type ==> bx-target-type
                event.type = currentType
            }
        }

        // TODO
        function _undelegateBxTargetTypeEvents(type, element) {
            RE_BX_TARGET_TYPE.exec('')
            var ma = RE_BX_TARGET_TYPE.exec(type)
            if (!ma) throw '不支持 ' + type

            var bxtype = PREFIX + type

            var $target =
                ma[1] === 'window' && 　jQuery(window) ||
                ma[1] === 'document' && 　jQuery(document) ||
                ma[1] === 'body' && 　jQuery(document.body)

            $target.off(ma[2] + NAMESPACE)
            $target.off(bxtype + NAMESPACE)
        }

        /**
         * 解析 bx-type 风格的事件配置
         * @param  {element} 一个 DOM 元素
         * @param  {boolean} 是否进行深度查找
         * @return {array}
         *      [
         *        {
         *          target:
         *          type:
         *          handler:
         *          method:
         *          params:
         *        },
         *      ]
         */
        function _parseBxEvents(element, deep) {
            var events = []

            // 数组 or 伪数组
            if (!element.nodeType && element.length) {
                _.each(element, function(item /*, index*/ ) {
                    events = events.concat(
                        _parseBxEvents(item, deep)
                    )
                })
                return events
            }

            var elements = deep ? element.getElementsByTagName('*') : [element]
            _.each(elements, function(item /*, index*/ ) {
                _.each(item.attributes, function(attribute) {
                    RE_BX_TYPE.exec('') // reset lastIndex to 0
                    var ma = RE_BX_TYPE.exec(attribute.name)
                    if (!ma) return
                    var handleObj = {
                        target: item,
                        type: ma[1],
                        handler: attribute.value
                    }
                    _.extend(handleObj, _parseMethodAndParams(attribute.value))

                    // 避免重复代理
                    if (item._bx_events && item._bx_events[handleObj.type]) return

                    events.push(handleObj)

                    if (!item._bx_events) item._bx_events = {}
                    item._bx_events[handleObj.type] = true
                })
            })
            return events
        }

        /**
         * 解析 bx-type 风格的事件类型
         * @param  {element} 一个 DOM 元素
         * @param  {boolean} 是否进行深度查找
         * @return {array}
         *      [ 'click', 'change', ... ]
         */
        function _parseBxTypes(element, deep) {
            return _.unique(
                _.map(
                    // [ { target type handler fn params }, ... ]
                    _parseBxEvents(element, deep),
                    function(item) {
                        return item.type
                    }
                )
            ).sort()
        }

        /**
         * 解析函数名称和参数值
         * @param  {string} 表达式。
         * @return {object}
         *      {
         *          fn:
         *          params:
         *      }
         */
        function _parseMethodAndParams(handler) {
            if (!handler) return

            var parts = RE_FN_ARGS.exec(handler)
            var method
            var params
            if (parts && parts[1]) {
                method = parts[1]
                params = parts[2] || ''
                try {
                    // 1. 尝试保持参数的类型 
                    /* jshint evil: true */
                    params = eval('(function(){ return [].splice.call(arguments, 0 ) })(' + params + ')')
                } catch (error) {
                    // 2. 如果失败，只能解析为字符串
                    params = parts[2].split(/,\s*/)
                }
                return {
                    method: method,
                    params: params
                }
            }
        }

    }
)
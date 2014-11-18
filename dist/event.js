
/* global define */
/* global window, document, location, console */
define(
    'brix/event',[
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
            /*
                #### .setup( [ prefix ] )

                读取或设置 `bx-type` 风格中的前缀 `bx-`。
             */
            setup: function(prefix) {
                if (prefix) return PREFIX

                setup(prefix)

                return this
            },

            /*
                #### .delegateBxTypeEvents( [ element ] )

                在节点 `element` 上代理 `bx-type` 风格的事件监听函数。参数 `element` 是可选的，如果未传入，则默认为 `this.element`。
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

                从节点 `element` 上移除 `bx-type` 风格的事件监听函数。。参数 `element` 是可选的，如果未传入，则默认为 `this.element`。
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

            /*
                在当前组件（关联的元素）上，为一个或多个事件类型绑定一个事件监听函数。
                在内部，Brix 上的事件方法通过调用第三方库（例如 jQuery、KISSY 等）的事件绑定方法来实现。
            */
            on: function(types, selector, data, fn) {
                jQuery(this.relatedElement || this.element).on(types, selector, data, fn)
                return this
            },
            /*
                在当前组件（关联的元素）上，为一个或多个事件类型绑定一个事件监听函数，这个监听函数最多执行一次。
            */
            one: function(types, selector, data, fn) {
                jQuery(this.relatedElement || this.element).one(types, selector, data, fn)
                return this
            },
            /*
                在当前组件（关联的元素）上，移除绑定的一个或多个类型的监听函数。
            */
            off: function(types, selector, fn) {
                jQuery(this.relatedElement || this.element).off(types, selector, fn)
                return this
            },
            /*
                在当前组件（关联的元素）上，执行所有绑定的事件监听函数和默认行为，并模拟冒泡过程。
            */
            trigger: function(type, data) {
                jQuery(this.relatedElement || this.element).trigger(type, data)
                return this
            },
            /*
                在当前组件（关联的元素）上，执行所有绑定的事件监听函数，并模拟冒泡过程，但不触发默认行为。
            */
            triggerHandler: function(type, data) {
                jQuery(this.relatedElement || this.element).triggerHandler(type, data)
                return this
            }
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
                /* jshint unused:false */
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

            $target.on(ma[2] + NAMESPACE, _bxTargetTypeAppetizer)
            $target.on(bxtype + NAMESPACE, _bxTargetTypeEntrees)

            // 开胃菜
            function _bxTargetTypeAppetizer(event) {
                var originalType = event.type // click
                event.type = bxtype // bx-window-click
                jQuery(event.target).trigger(event, [].slice.call(arguments, 1))
                event.type = originalType
            }

            // 主菜
            function _bxTargetTypeEntrees(event) {
                var selector = '[' + PREFIX + type + ']'
                var $targets = function() {
                    var targets = []
                    if (jQuery(event.target).is(selector)) targets.push(event.target)
                    var parents = jQuery(event.target).parentsUntil(element, selector)
                    targets = targets.concat(parents.toArray())
                    return jQuery(targets)
                }()

                // bx-target-type ==> type
                var currentType = event.type // bx-target-type
                var originalType = ma[2] // type
                event.type = originalType

                var extraParameters = [].slice.call(arguments, 2)

                _.each($targets, function(item /*, index*/ ) {
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
        function _undelegateBxTargetTypeEvents(type /*, element*/ ) {
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
);
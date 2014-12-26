
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
                var fix = parseInt(len, 10) - ('' + arg).length
                for (var i = 0; i < fix; i++) arg += ' '
                return arg
            }
        }

        var PREFIX = 'bx-'
        var BX_EVENT_NAMESPACE = '.' + (Math.random() + '').replace(/\D/g, '')
        var RE_FN_ARGS = /([^()]+)(?:\((.*)\))?/
        var RE_TARGET_TYPE = /^(window|document|body)-(.+)/
        var BX_EVENT_SEPARATION = 'bx-event-separation'
        var BX_EVENT_CACHE = 'bx-event-cache'

        // 事件管理器
        function EventManager(prefix) {
            // Allow instantiation without the 'new' keyword
            if (!(this instanceof EventManager)) {
                return new EventManager(prefix)
            }
            this.prefix = prefix || PREFIX
        }

        // 在节点 `element` 上代理 `bx-type` 风格的事件监听函数，事件监听函数定义在宿主对象 `owner` 中。
        EventManager.prototype.delegate = function(element, owner) {
            element = element || document.body
            owner = owner || window

            var label = this.prefix + 'event'
            if (DEBUG) {
                console.group(label)
                console.time(label)
                console.log(element)
            }

            _undelegateBxTypeEvents(this.prefix, element)
            _delegateBxTypeEvents(this.prefix, element, owner)

            if (DEBUG) {
                console.timeEnd(label)
                console.groupEnd(label)
            }
        }

        // 从节点 `element` 上移除 `bx-type` 风格的事件监听函数。
        EventManager.prototype.undelegate = function(element) {
            element = element || document.body
            _undelegateBxTypeEvents(this.prefix, element)
        }

        // 工具方法
        EventManager._delegateBxTypeEvents = _delegateBxTypeEvents
        EventManager._undelegateBxTypeEvents = _undelegateBxTypeEvents
        EventManager._parseBxTypes = _parseBxTypes
        EventManager._parseBxEvents = _parseBxEvents
        EventManager._parseMethodAndParams = _parseMethodAndParams

        return EventManager

        /*
            在节点 `element` 上代理 `prefix-type` 风格的事件监听函数。

            1. 跑马圈地：为 element 设置唯一标识 SEPARATION
            2. 解析节点 element 内 bx-type 风格的事件类型
            3. 遍历事件类型数组，逐个代理
                3.1 如果代理过，则跳过
                3.2 在 body 上代理事件
                3.3 记录事件相关的属性 type、bxtype、namespace、selector、appetizer
         */
        function _delegateBxTypeEvents(prefix, element, owner) {
            var $body = jQuery(document.body)
            var $element = jQuery(element)
            var data = $element.data()

            data[BX_EVENT_SEPARATION] = Math.random()
            if (!data[BX_EVENT_CACHE]) data[BX_EVENT_CACHE] = {}

            var types = _parseBxTypes(prefix, element)
            _.each(types, function(type /*, index*/ ) {
                var bxtype = prefix + type // bx-type
                var selector = '[' + bxtype + ']' // [bx-type]

                // 已经代理过该类型的事件，无需再次代理
                if (data[BX_EVENT_CACHE][bxtype]) return

                if (DEBUG) {
                    console.log(DEBUG.fix(type, 16), bxtype)
                }

                RE_TARGET_TYPE.exec('')
                if (RE_TARGET_TYPE.exec(type)) {
                    _delegateBxTargetType(prefix, type, element, owner)
                    return
                }

                // 在 body 上代理
                $body.on(type + BX_EVENT_NAMESPACE, selector, appetizer)

                // 记录开胃菜 appetizer()，用于将来移除
                data[BX_EVENT_CACHE][bxtype] = {
                    type: type,
                    bxtype: bxtype,
                    namespace: BX_EVENT_NAMESPACE,
                    selector: selector,
                    appetizer: appetizer
                }

                // 开胃菜
                function appetizer(event) {
                    if (jQuery(event.target).closest('.disabled').length) return
                    if (closestSeparation(event.currentTarget) !== data[BX_EVENT_SEPARATION]) return

                    var extraParameters = [].slice.call(arguments, 1)
                    entrees.apply(this, [event, owner, prefix].concat(extraParameters))
                }
            })
        }

        // 主菜
        function entrees(event, owner, prefix) {
            var extraParameters = [].slice.call(arguments, 3)

            var handler = jQuery(event.currentTarget).attr(prefix + event.type)
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
        }

        function closestSeparation(element) {
            var separation = jQuery(element).data(BX_EVENT_SEPARATION)
            if (!separation) {
                var parents = jQuery(element).parents()
                for (var i = 0; i < parents.length; i++) {
                    if (parents.eq(i).data(BX_EVENT_SEPARATION)) {
                        separation = parents.eq(i).data(BX_EVENT_SEPARATION)
                        break
                    }
                }
            }
            return separation
        }

        function _undelegateBxTypeEvents(prefix, element) {
            var $body = jQuery(document.body)
            var $element = jQuery(element)
            var data = $element.data()

            /* jshint unused:false */
            _.each(data[BX_EVENT_CACHE], function(item, bxtype) {
                RE_TARGET_TYPE.exec('')
                if (RE_TARGET_TYPE.exec(item.type)) {
                    _undelegateBxTargetTypeEvents(prefix, item.type, element)
                    return
                }
                $body.off(item.type + item.namespace, item.selector, item.appetizer)
            })
            data[BX_EVENT_CACHE] = {}
        }

        // 在指定的节点上绑定事件
        function _delegateBxTargetType(prefix, type, element, owner) {
            // $1 window|document|body, $2 type
            RE_TARGET_TYPE.exec('')
            var ma = RE_TARGET_TYPE.exec(type)
            if (!ma) throw '不支持 ' + type

            var bxtype = prefix + type

            var $target =
                ma[1] === 'window' && 　jQuery(window) ||
                ma[1] === 'document' && 　jQuery(document) ||
                ma[1] === 'body' && 　jQuery(document.body)

            $target.on(ma[2] + BX_EVENT_NAMESPACE, _bxTargetTypeAppetizer)
            $target.on(bxtype + BX_EVENT_NAMESPACE, _bxTargetTypeEntrees)

            // 开胃菜
            function _bxTargetTypeAppetizer(event) {
                var originalType = event.type // click
                event.type = bxtype // bx-window-click
                jQuery(event.target).trigger(event, [].slice.call(arguments, 1))
                event.type = originalType
            }

            // 主菜
            function _bxTargetTypeEntrees(event) {
                var selector = '[' + prefix + type + ']'
                var $targets = function() {
                    var targets = []
                    if (jQuery(event.target).is(selector)) targets.push(event.target)
                    var parents = jQuery(event.target).parentsUntil(element, selector)
                    targets = targets.concat(parents.toArray())
                    return jQuery(targets)
                }()

                // bx-target-type => type
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

                // type => bx-target-type
                event.type = currentType
            }
        }

        // TODO
        function _undelegateBxTargetTypeEvents(prefix, type /*, element*/ ) {
            RE_TARGET_TYPE.exec('')
            var ma = RE_TARGET_TYPE.exec(type)
            if (!ma) throw '不支持 ' + type

            var bxtype = prefix + type

            var $target =
                ma[1] === 'window' && 　jQuery(window) ||
                ma[1] === 'document' && 　jQuery(document) ||
                ma[1] === 'body' && 　jQuery(document.body)

            $target.off(ma[2] + BX_EVENT_NAMESPACE)
            $target.off(bxtype + BX_EVENT_NAMESPACE)
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
        function _parseBxEvents(prefix, element) {
            var RE_BX_TYPE = new RegExp(prefix + '(?!name|options)(.+)')
            var events = []

            // 数组 or 伪数组
            if (!element.nodeType && element.length) {
                _.each(element, function(item /*, index*/ ) {
                    events = events.concat(
                        _parseBxEvents(prefix, item)
                    )
                })
                return events
            }

            var elements = [element].concat(
                [].slice.call(element.getElementsByTagName('*'), 0)
            )
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
                    // if (item._bx_events && item._bx_events[handleObj.type]) return

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
        function _parseBxTypes(prefix, element) {
            return _.unique(
                _.map(
                    // [ { target type handler fn params }, ... ]
                    _parseBxEvents(prefix, element),
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
         *          fn: '',
         *          params: [ arg1, arg2, ... ]
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
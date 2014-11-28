/* global define */
/* global window, document, location, console */
define(
    [
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

        var RE_FN_ARGS = /([^()]+)(?:\((.*)\))?/
        var NAMESPACE = '.' + (Math.random() + '').replace(/\D/g, '')

        var RE_TARGET_TYPE = /^(window|document|body)-(.+)/

        function EventManager(prefix) {
            // Allow instantiation without the 'new' keyword
            if (!(this instanceof EventManager)) {
                return new EventManager(prefix)
            }

            this.prefix = prefix || 'bx-'

            // 原型方法 => 实例方法
            this.delegateBxTypeEvents = this.delegateBxTypeEvents
            this.undelegateBxTypeEvents = this.undelegateBxTypeEvents

            // 缩短方法名
            this.delegate = this.delegateBxTypeEvents
            this.undelegate = this.undelegateBxTypeEvents
        }

        EventManager.prototype.delegateBxTypeEvents = function(element, owner) {
            element = element || this.element
            owner = owner || this

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

        EventManager.prototype.undelegateBxTypeEvents = function(element) {
            element = element || this.element
            _undelegateBxTypeEvents(this.prefix, element)
        }

        // 静态方法
        EventManager.prefix = 'bx-'
        EventManager.delegateBxTypeEvents = EventManager.prototype.delegateBxTypeEvents
        EventManager.undelegateBxTypeEvents = EventManager.prototype.undelegateBxTypeEvents
        EventManager._delegateBxTypeEvents = _delegateBxTypeEvents
        EventManager._undelegateBxTypeEvents = _undelegateBxTypeEvents
        EventManager._parseBxTypes = _parseBxTypes
        EventManager._parseBxEvents = _parseBxEvents
        EventManager._parseMethodAndParams = _parseMethodAndParams

        // 缩短方法名
        EventManager.delegate = EventManager.prototype.delegateBxTypeEvents
        EventManager.undelegate = EventManager.prototype.undelegateBxTypeEvents

        return EventManager

        function _delegateBxTypeEvents(prefix, element, owner) {
            var SEPARATION = 'bx-event-separation'
            var $body = jQuery(document.body)
            var $element = jQuery(element)
            var separation = Math.random()
            $element.data(SEPARATION, separation)
            var data = $element.data()
            if (!data._bxevents) data._bxevents = {}

            var types = _parseBxTypes(prefix, element)
            _.each(types, function(type /*, index*/ ) {
                var bxtype = prefix + type
                var selector = '[' + bxtype + ']' // 'bx-' + type

                if (data._bxevents[bxtype]) return
                data._bxevents[bxtype] = true


                if (DEBUG) {
                    console.log(DEBUG.fix(type, 16), bxtype)
                }

                RE_TARGET_TYPE.exec('')
                if (RE_TARGET_TYPE.exec(type)) {
                    _delegateBxTargetType(prefix, type, element, owner)
                    return
                }

                $body.on(type + NAMESPACE, selector, _appetizer)

                $element.data(bxtype, _appetizer)

                // 开胃菜
                function _appetizer(event) {
                    if (jQuery(event.target).closest('.disabled').length) return

                    var parents = jQuery(event.currentTarget).parents()
                    var lastestSeparation = jQuery(event.currentTarget).data(SEPARATION)
                    if (!lastestSeparation) {
                        for (var i = 0; i < parents.length; i++) {
                            if (parents.eq(i).data(SEPARATION)) {
                                lastestSeparation = parents.eq(i).data(SEPARATION)
                                break
                            }
                        }
                    }
                    if (lastestSeparation !== separation) return

                    var extraParameters = [].slice.call(arguments, 1)
                    _entrees.apply(this, [event, owner, prefix].concat(extraParameters))
                }
            })
        }

        // 主菜
        function _entrees(event, owner, prefix) {
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

        function _undelegateBxTypeEvents(prefix, element) {
            var $body = jQuery(document.body)
            var $element = jQuery(element)
            var bxevents = $element.data()._bxevents
            var rePrefix = new RegExp('^' + prefix)

            /* jshint unused:false */
            _.each(bxevents, function(flag, bxtype) {
                if (!rePrefix.exec(bxtype)) return

                bxevents[bxtype] = false
                var type = bxtype.replace(prefix, '')

                RE_TARGET_TYPE.exec('')
                if (RE_TARGET_TYPE.exec(type)) {
                    _undelegateBxTargetTypeEvents(prefix, type, element)
                    return
                }

                var selector = '[' + bxtype + ']'
                var _appetizer = $element.data(bxtype)

                $body.off(type + NAMESPACE, selector, _appetizer)
            })
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
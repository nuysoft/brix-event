
define('brix/event/constant',[],function() {
	return {
		PREFIX: 'bx-',
		BX_EVENT_NAMESPACE: '.' + (Math.random() + '').replace(/\D/g, ''),
		RE_FN_ARGS: /([^()]+)(?:\((.*)\))?/,
		RE_TARGET_TYPE: /^(window|document|body)-(.+)/,
		BX_EVENT_SEPARATION: 'bx-event-separation-',
		BX_EVENT_CACHE: 'bx-event-cache-'
	}
});
define('brix/event/debug',[], function() {
	return ~location.search.indexOf('brix.event.debug') && {
		fix: function(arg, len) {
			var fix = parseInt(len, 10) - ('' + arg).length
			for (var i = 0; i < fix; i++) arg += ' '
			return arg
		}
	}
});
define(
	'brix/event/parser',[
		'jquery', 'underscore',
		'./constant'
	],
	function(
		jQuery, _,
		Constant
	) {
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
		function parseBxEvents(prefix, element) {
			var RE_BX_TYPE = new RegExp(prefix + '(?!name|options)(.+)')
			var events = []

			// 数组 or 伪数组
			if (!element.nodeType && element.length) {
				_.each(element, function(item /*, index*/ ) {
					events = events.concat(
						parseBxEvents(prefix, item)
					)
				})
				return events
			}

			var elements = function() {
				/*
				    “Array.prototype.slice: 'this' is not a JavaScript object” error in IE8
				    var elements = [element].concat(
				        [].slice.call(element.getElementsByTagName('*'), 0)
				    )
				 */
				var elements = [element]
				if (element.getElementsByTagName) {
					var all = element.getElementsByTagName('*')
					for (var i = 0; i < all.length; i++) {
						elements.push(all[i])
					}
				}
				return elements
			}()
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
					_.extend(handleObj, parseMethodAndParams(attribute.value))

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
		function parseBxTypes(prefix, element) {
			return _.unique(
				_.map(
					// [ { target type handler fn params }, ... ]
					parseBxEvents(prefix, element),
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
		function parseMethodAndParams(handler) {
			if (!handler) return

			var parts = Constant.RE_FN_ARGS.exec(handler)
			var method
			var params

			if (parts && parts[1]) {
				method = parts[1]
				params = jQuery.trim(parts[2] || '')
				try {
					/* jshint evil: true */
					params = eval('[' + params + ']')
				} catch (error) {
					params = params.split(/\s*,\s*/)
				}
				return {
					method: method,
					params: params
				}
			}
		}

		return {
			parseBxEvents: parseBxEvents,
			parseBxTypes: parseBxTypes,
			parseMethodAndParams: parseMethodAndParams
		}
	}
);
define(
    'brix/event/handle',[
        'jquery',
        './parser'
    ],
    function(
        jQuery,
        Parser
    ) {
        // 主菜
        // event.namespace          通过 brix-event 管理的事件的命名空间都是 Constant.BX_EVENT_NAMESPACE
        // event.originalNamespace  用于存放事件的原始命名空间
        function entrees(event, owner, prefix, type) {
            var extraParameters = [].slice.call(arguments, 4)

            var currentTarget = jQuery(event.currentTarget)
            var handler = currentTarget.attr(prefix + type) ||
                currentTarget.attr(prefix + event.type + '.' + event.namespace) ||
                currentTarget.attr(prefix + event.type)
            if (!handler) return

            var parts = Parser.parseMethodAndParams(handler)
            if (parts && owner[parts.method]) {
                // 尝试恢复 namespace
                var namespace = event.namespace
                var originalNamespace = event.originalNamespace
                if (originalNamespace) event.namespace = originalNamespace

                try {
                    owner[parts.method].apply(
                        owner, [event].concat(extraParameters).concat(parts.params)
                    )
                } finally {
                    // 尝试恢复 namespace
                    if (originalNamespace) event.namespace = namespace
                }

            } else {
                /* jshint evil:true */
                eval(handler)
            }
        }
        return entrees
    }
);
define('brix/event/target/delegate',['jquery', 'underscore', '../constant', '../parser'], function(jQuery, _, Constant, Parser) {
	// 在指定的节点上绑定事件
	function delegate(prefix, type, element, owner) {
		// $1 window|document|body, $2 type
		Constant.RE_TARGET_TYPE.exec('')
		var ma = Constant.RE_TARGET_TYPE.exec(type)
		if (!ma) throw '不支持 ' + type

		var bxtype = prefix + type

		var $target =
			ma[1] === 'window' && 　jQuery(window) ||
			ma[1] === 'document' && 　jQuery(document) ||
			ma[1] === 'body' && 　jQuery(document.body)

		$target.on(ma[2] + Constant.BX_EVENT_NAMESPACE, _bxTargetTypeAppetizer)
		$target.on(bxtype + Constant.BX_EVENT_NAMESPACE, _bxTargetTypeEntrees)

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

				var parts = Parser.parseMethodAndParams(handler)
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
	return delegate
});
define('brix/event/target/undelegate',['jquery', '../constant'], function(jQuery, Constant) {
	function undelegate(prefix, type /*, element*/ ) {
		Constant.RE_TARGET_TYPE.exec('')
		var ma = Constant.RE_TARGET_TYPE.exec(type)
		if (!ma) throw '不支持 ' + type

		var bxtype = prefix + type

		var $target =
			ma[1] === 'window' && 　jQuery(window) ||
			ma[1] === 'document' && 　jQuery(document) ||
			ma[1] === 'body' && 　jQuery(document.body)

		$target.off(ma[2] + Constant.BX_EVENT_NAMESPACE)
		$target.off(bxtype + Constant.BX_EVENT_NAMESPACE)
	}
	return undelegate
});
define('brix/event/target/index',['./delegate', './undelegate'], function(delegate, undelegate) {
	return {
		delegate: delegate,
		undelegate: undelegate
	}
});
define(
	'brix/event/delegate',[
		'jquery', 'underscore',
		'./constant', './debug', './parser',
		'./handle',
		'./target/index'
	],
	function(
		jQuery, _,
		Constant, DEBUG, Parser,
		entrees,
		Target
	) {
		/*
		    在节点 `element` 上代理 `prefix-type` 风格的事件监听函数。

		    1. 跑马圈地：为 element 设置唯一标识 SEPARATION
		    2. 解析节点 element 内 bx-type 风格的事件类型
		    3. 遍历事件类型数组，逐个代理
		        3.1 如果代理过，则跳过
		        3.2 在 body 上代理事件
		        3.3 记录事件相关的属性 type、bxtype、namespace、selector、appetizer
		 */
		function delegate(prefix, element, owner) {
			var $body = jQuery(document.body)
			var $element = jQuery(element)
			var data = $element.data()

			if (!data) return

			data[Constant.BX_EVENT_SEPARATION + prefix] = Math.random()
			if (!data[Constant.BX_EVENT_CACHE + prefix]) data[Constant.BX_EVENT_CACHE + prefix] = {}

			var types = Parser.parseBxTypes(prefix, element)
			_.each(types, function(type /*, index*/ ) {
				var bxtype = prefix + type // bx-type
				var selector = ('[' + bxtype + ']').replace(/\./g, '\\.') // [bx-type]

				// 已经代理过该类型的事件，无需再次代理
				if (data[Constant.BX_EVENT_CACHE + prefix][bxtype]) return

				if (DEBUG) {
					console.log(DEBUG.fix(type, 16), bxtype)
				}

				Constant.RE_TARGET_TYPE.exec('')
				if (Constant.RE_TARGET_TYPE.exec(type)) {
					Target.delegate(prefix, type, element, owner)
					data[Constant.BX_EVENT_CACHE + prefix][bxtype] = {
						type: type,
						bxtype: bxtype
					}
					return
				}

				// 在 body 上代理
				$body.on(type + Constant.BX_EVENT_NAMESPACE, selector, appetizer)

				// 记录开胃菜 appetizer()，用于将来移除
				data[Constant.BX_EVENT_CACHE + prefix][bxtype] = {
					type: type,
					bxtype: bxtype,
					namespace: Constant.BX_EVENT_NAMESPACE,
					selector: selector,
					appetizer: appetizer
				}

				// 开胃菜
				function appetizer(event) {
					if (jQuery(event.target).closest('.disabled').length) return
					if (closestSeparation(prefix, event.currentTarget) !== data[Constant.BX_EVENT_SEPARATION + prefix]) return

					var extraParameters = [].slice.call(arguments, 1)
					if (!event.owner) event.owner = owner
					if (!event.component) event.component = function() {
						try {
							// 尝试获取节点关联的组件实例
							return require('brix/loader').query(event.currentTarget)[0]
						} catch (error) {}
					}()
					entrees.apply(this, [event, owner, prefix, type].concat(extraParameters))
				}
			})
		}

		function closestSeparation(prefix, element) {
			var separation = jQuery(element).data(Constant.BX_EVENT_SEPARATION + prefix)
			if (!separation) {
				var parents = jQuery(element).parents()
				for (var i = 0; i < parents.length; i++) {
					if (parents.eq(i).data(Constant.BX_EVENT_SEPARATION + prefix)) {
						separation = parents.eq(i).data(Constant.BX_EVENT_SEPARATION + prefix)
						break
					}
				}
			}
			return separation
		}

		return delegate
	}
);
define('brix/event/undelegate',['jquery', 'underscore', './constant', './target/index'], function(jQuery, _, Constant, Target) {
    function undelegate(prefix, element) {
        var $body = jQuery(document.body)
        var $element = jQuery(element)
        var data = $element.data()

        if (!data) return

        /* jshint unused:false */
        _.each(data[Constant.BX_EVENT_CACHE + prefix], function(item, bxtype) {
            Constant.RE_TARGET_TYPE.exec('')
            if (Constant.RE_TARGET_TYPE.exec(item.type)) {
                Target.undelegate(prefix, item.type, element)
                return
            }
            $body.off(item.type + item.namespace, item.selector, item.appetizer)
        })
        data[Constant.BX_EVENT_CACHE + prefix] = {}
    }
    return undelegate
});
define(
    'brix/event',[
        './event/constant',
        './event/debug',
        './event/parser',
        './event/delegate', './event/undelegate'
    ],
    function(
        Constant,
        DEBUG,
        Parser,
        delegate, undelegate
    ) {
        // 事件管理器
        function EventManager(prefix) {
            // Allow instantiation without the 'new' keyword
            if (!(this instanceof EventManager)) {
                return new EventManager(prefix)
            }
            this.prefix = prefix || Constant.PREFIX
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

            undelegate(this.prefix, element)
            delegate(this.prefix, element, owner)

            if (DEBUG) {
                console.timeEnd(label)
                console.groupEnd(label)
            }

            return this
        }

        // 从节点 `element` 上移除 `bx-type` 风格的事件监听函数。
        EventManager.prototype.undelegate = function(element) {
            element = element || document.body
            undelegate(this.prefix, element)

            return this
        }

        // 全局命名空间
        EventManager.NAMESPACE = Constant.BX_EVENT_NAMESPACE

        // 工具方法
        EventManager._delegate = delegate
        EventManager._undelegate = undelegate
        EventManager._parseBxEvents = Parser.parseBxEvents
        EventManager._parseBxTypes = Parser.parseBxTypes
        EventManager._parseMethodAndParams = Parser.parseMethodAndParams

        return EventManager
    }
);
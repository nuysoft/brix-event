define(
	[
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
)
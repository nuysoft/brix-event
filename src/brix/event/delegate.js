define(
	[
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
)
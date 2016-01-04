define(['jquery', 'underscore', '../constant', '../parser'], function(jQuery, _, Constant, Parser) {
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
})
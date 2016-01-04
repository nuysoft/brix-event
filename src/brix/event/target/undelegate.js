define(['jquery', '../constant'], function(jQuery, Constant) {
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
})
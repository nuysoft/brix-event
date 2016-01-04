define([], function() {
	return ~location.search.indexOf('brix.event.debug') && {
		fix: function(arg, len) {
			var fix = parseInt(len, 10) - ('' + arg).length
			for (var i = 0; i < fix; i++) arg += ' '
			return arg
		}
	}
})
define(function() {
	return {
		PREFIX: 'bx-',
		BX_EVENT_NAMESPACE: '.' + (Math.random() + '').replace(/\D/g, ''),
		RE_FN_ARGS: /([^()]+)(?:\((.*)\))?/,
		RE_TARGET_TYPE: /^(window|document|body)-(.+)/,
		BX_EVENT_SEPARATION: 'bx-event-separation-',
		BX_EVENT_CACHE: 'bx-event-cache-'
	}
})
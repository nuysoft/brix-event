define(
    [
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
)
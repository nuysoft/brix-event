define(['jquery', 'underscore', './constant', './target/index'], function(jQuery, _, Constant, Target) {
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
})
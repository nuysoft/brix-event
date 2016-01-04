define(
    [
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
)
# Brix Event

支持 **bx-type** 风格的事件模型，实现事件与 DOM 结构的松耦合，提升可读性、可复用性和可测试性。

### 安装 <small>Install</small>

```sh
$ bower install --save brix-event
$ npm install --save brix-event
```

### 用法 <small>Usage</small>

```js
// 配置 Brix Event 和依赖库
require.config({
    paths: {
        jquery: 'bower_components/jquery/dist/jquery',
        underscore: 'bower_components/underscore/underscore',
        'brix/event': 'bower_components/brix-event/dist/event'
    }
})
```

```html
<!-- 定义 HTML -->
<div id="target">
    <div bx-click="foo(42)">click here</div>
</div>
```

```js
// 使用 Brix Event
require(['jquery', 'brix/event'], function($, EventManager) {
    // 创建事件管理器
    var manager = new EventManager('bx-')
    // 创建宿主对象，可以是任意对象
    var owner = {
        foo: function(event, arg) {
            console.log(this, this === owner) // this, true
            console.log(event.type, arg) // event, 42
        }
    }
    // 指定目标容器节点
    var target = $('#target')
    // 绑定 bx-type 风格的事件
    manager.delegate( target, owner )
    // 移除 bx-type 风格的事件
    // manager.undelegate( target )
})
```

> 必须指定宿主对象。

### 方法 <small>Methods</small>

共计 3 个公开方法：

* EventManager( prefix )

    构造函数。构造一个事件管理器。

* .delegate( element, owner )

    在节点 `element` 上代理 `bx-type` 风格的事件监听函数，事件监听函数定义在宿主对象 `owner` 中。

* .undelegate( element )

    从节点 `element` 上移除 `bx-type` 风格的事件监听函数。参数 `element` 是可选的，如果未传入，则默认为 `this.element`。

### WHY BX-TYPE

通常，我们用 `.on( events [, selector ] [, data ], handler )` 来绑定事件。

这么做的主要问题在于，会与选择器表达式 `selector` 紧密耦合，即与 DOM 结构和 CSS 类样式紧密耦合。当选择器表达式 `selector` 比较复杂时，更加明显。

假设有下面的 DOM 结构，我们需要在 `button.minus` 和 `button.plus` 上绑定 `click` 事件：

```html
<div id="container">
    <div class="datepicker">
        <div class="picker-header">
            <button class="minus">-</button>
            <button class="plus">+</button>
        </div>
    </div>
</div>
```

如果采用传统的写法，需要依赖 DOM 结构和 CSS 类样式才能实现：

```js
var owner = {
    date: moment()
}
var $container = $('#container')
$container
    .on('click', '.datepicker .picker-header .minus', function( event ) {
        owner.date.add(-1, 'month')
    })
    .on('click', '.datepicker .picker-header .plus', function( event ) {
        owner.date.add(1, 'month')
    })
```

在阅读上面的代码时，为了查找节点对应的事件监听函数，也需要先观察 DOM 结构和 CSS 类样式。

而 **bx-type** 风格的事件模型在写法上，与 DOM 结构和 CSS 类样式无关，只需要在 `button.minus` 和 `button.plus` 上稍作配置，就像下面的代码所示：

```html
<button class="minux" bx-click="changeDate(-1)">-</button>
<button class="plus" bx-click="changeDate(1)">+</button>
```

在 JavaScript 代码中，可以把 `owner.date.add(-1, 'month')` 和 `owner.date.add(-1, 'month')` 合并为方法 `changeDate`：

```js
var owner = {
    date: moment(),
    changeDate: function(event, dir) {
        if (!event.type) dir = event
        this.date.add(dir, 'month')
    }
}
var manager = new EventManager('bx-')
manager.delegate( $('#container'), owner )
```

在上面的代码中，有几点改进之处可以借鉴：

首先，通过增加语义化的名称 `changeDate`，会使代码更加容易阅读和查找；参数 `-1` 和 `1` 直接以函数调用的方式写在 HTML 中，传参方式更加方便和直观。

其次，方法 `changeDate` 合并了相似的代码。这种方式使得提升代码复用性更加容易。

并且，通过在方法 `changeDate` 中增加 `if (!event.type) dir = event`，使得可以直接执行 `changeDate(dir)` ，而不再需要依赖事件系统。这可以让测试代码不再依赖事件系统。

#### 结论

**bx-type** 风格的事件模型让开发体验更愉悦。

#### 结语

早在 [AngularJS](http://angularjs.org/) 之前，[Magix](http://thx.github.io/magix/articles/about-delegate-event/) 就已引入了 **bx-type** 风格的事件模型。这次提取为独立库，实现和 API 更加清晰，希望能复用到更多的框架和库中，

### HOW BX-TYPE

**bx-type** 风格的事件模型并不需要重新建设一套新的事件模型，只是在浏览器模型基础上，增强了事件绑定的写法，事件的传播机制和触发机制没有任何变化。

具体的实现基于 jQuery 事件模型，所以 jQuery 提供的所有事件方法都可以继续使用。

### WHAT BX-TYPE

提供了两个方法：`.delegate()`、`.undelegate`，分别用于绑定和移除 **bx-type** 风格的事件。

```js
// 定义宿主对象，可以是任意对象
var owner = {
    method1: function(event, extra) {
        // ...
    },
    method2: function(event, extra) {
        // ...
    }
}
// 指定目标容器节点
var target = $('#target')
// 定义事件管理器
var manager = new EventManager('bx-')
// 绑定 bx-type 风格的事件
manager.delegate( target, owner )
// 移除 bx-type 风格的事件
// manager.undelegate( target )
```
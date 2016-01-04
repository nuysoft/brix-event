/* global chai, before */
/* jshint multistr: true */
/* exported expect, $, _, Mock, container, prefix, types, tpl */
var expect = chai.expect
var $, _, Mock, EventManager, manager
var container
var prefix = 'bx-'

var types = ('blur focus focusin focusout load resize scroll unload click dblclick ' +
        'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
        'change select submit keydown keypress keyup contextmenu').split(' ') // error 
var tpl = '<div bx-<%= type %>="<%= type %>Handle( <%= index %> )"></div>'

before(function(done) {
    require(['jquery', 'underscore', 'mock', 'brix/event'], function() {
        $ = arguments[0]
        _ = arguments[1]
        Mock = arguments[2]
        EventManager = arguments[3]
        manager = EventManager('bx-')
        container = $('#container')

        expect($).to.not.equal(undefined)
        expect(_).to.not.equal(undefined)
        expect(EventManager).to.not.equal(undefined)
        expect(manager).to.not.equal(undefined)

        done()
    })
})
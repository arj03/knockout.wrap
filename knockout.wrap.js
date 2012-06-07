// Knockout Fast Mapping v0.1
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function (factory) {
	// Module systems magic dance.

	if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
		// CommonJS or Node: hard-coded dependency on "knockout"
		factory(require("knockout"), exports);
	} else if (typeof define === "function" && define["amd"]) {
		// AMD anonymous module with hard-coded dependency on "knockout"
		define(["knockout", "exports"], factory);
	} else {
		// <script> tag: use the global `ko` object, attaching a `wrap` property
		factory(ko, ko.wrap = {});
	}
}(function (ko, exports) {
    
    exports.fromJS = function(jsObject, computedFunctions)
    {
	return wrap(jsObject, computedFunctions);
    }

    exports.fromJSON = function (jsonString, computedFunctions) {
	var parsed = ko.utils.parseJson(jsonString);
	arguments[0] = parsed;
	return exports.fromJS.apply(this, computedFunctions);
    };
    
    exports.toJS = function (jsObject) {
	return unwrap(jsObject);
    }

    exports.toJSON = function (jsObject) {
	var plainJavaScriptObject = exports.toJS(jsObject);
	return ko.utils.stringifyJson(plainJavaScriptObject);
    };

    function typeOf(value) {
	var s = typeof value;
	if (s === 'object') {
            if (value) {
		if (Object.prototype.toString.call(value) == '[object Array]') {
                    s = 'array';
		}
            } else {
		s = 'null';
            }
	}
	return s;
    }

    // unwrapping
    function unwrapObject(o)
    {
	var t = {};

	for (var k in o)
	{
	    var v = o[k];

	    if (ko.isComputed(v))
		continue;

	    t[k] = unwrap(v);
	}

	return t;
    }

    function unwrapArray(a)
    {
	var r = [];

	if (!a || a.length == 0)
	    return r;
	
	for (var i = 0, l = a.length; i < l; ++i)
	    r.push(unwrap(a[i]));

	return r;
    }

    function unwrap(v)
    {
	var isObservable = ko.isObservable(v);

	if (isObservable)
	{
	    var val = v();

	    if (typeOf(val) == "array")
	    {
		return unwrapArray(val);
	    }
	    else
	    {
		return val;
	    }
	}
	else
	{
	    if (typeOf(v) == "array")
	    {
		return unwrapArray(v);
	    }
	    else if (typeOf(v) == "object")
	    {
		return unwrapObject(v);
	    }
	    else
	    {
		return v;
	    }
	}
    }
    

    // wrapping

    function wrapObject(o, computedFunctions)
    {
	var t = {};

	for (var k in o)
	{
	    var v = o[k];

	    if (computedFunctions)
		lvl.push(currentLvl() + "/" + k);

	    t[k] = wrap(v, computedFunctions);

	    if (computedFunctions)
		lvl.pop();
	}

	if (computedFunctions && computedFunctions[currentLvl()])
	    t = computedFunctions[currentLvl()](t);

	return t;
    }

    function wrapArray(a, computedFunctions)
    {
	var r = ko.observableArray();

	if (!a || a.length == 0)
	    return r;

	for (var i = 0, l = a.length; i < l; ++i)
	    r.push(wrap(a[i], computedFunctions));

	return r;
    }

    var lvl = [""];

    function currentLvl()
    {
	return lvl[lvl.length-1];
    }

    function wrap(v, computedFunctions)
    {
	if (typeOf(v) == "array")
	{
	    return wrapArray(v, computedFunctions);
	}
	else if (typeOf(v) == "object")
	{
	    return wrapObject(v, computedFunctions);
	}
	else
	{
	    var t = ko.observable();
	    t(v);
	    return t;
	}
    }
}));
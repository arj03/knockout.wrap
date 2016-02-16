// Knockout Fast Mapping v1.0.2
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function(factory) {
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
}(function(ko, exports) {

    // this function mimics ko.mapping
    exports.fromJS = function(jsObject, computedFunctions) {
        reset();
        return wrap(jsObject, computedFunctions);
    }; // this function unwraps the outer for assigning the result to an observable
    // see https://github.com/SteveSanderson/knockout/issues/517
    exports.updateFromJS = function(observable, jsObject, computedFunctions) {
        reset();
        return observable(ko.utils.unwrapObservable(wrap(jsObject, computedFunctions)));
    };
    exports.fromJSON = function(jsonString, computedFunctions) {
        var parsed = ko.utils.parseJson(jsonString);
        arguments[0] = parsed;
        return exports.fromJS.apply(this, computedFunctions);
    };

    exports.toJS = function (observable, options) {
        var defaultOptions = { ignore: ['__ko_mapping__'], includeComputed: false };
        options = ko.utils.extend(defaultOptions, options);
        return unwrap(observable, options);
    };
    exports.toJSON = function (observable, options) {
        var plainJavaScriptObject = exports.toJS(observable, options);
        return ko.utils.stringifyJson(plainJavaScriptObject);
    };

    function typeOf(value) {
        var s = typeof value;
        if (s === "object") {
            if (value) {
                if (value.constructor == Date)
                    s = "date";
                else if (Object.prototype.toString.call(value) == "[object Array]")
                    s = "array";
            } else {
                s = "null";
            }
        }
        return s;
    }

    // unwrapping
    function unwrapObject(o, opts) {
        var ignore = opts && opts.ignore ? opts.ignore : [];
        var includeComputed = opts && opts.includeComputed;
        var t = {};

        for (var k in o) {
            var v = o[k];

            // ignore properties in the ignore array and computed observables if includeComputed is false
            if ((ko.isComputed(v) && !includeComputed) || ignore.indexOf(k) !== (-1))
                continue;

            t[k] = unwrap(v, opts);
        }

        return t;
    }

    function unwrapArray(a, opts) {
        var r = [];

        if (!a || a.length == 0)
            return r;

        for (var i = 0, l = a.length; i < l; ++i)
            r.push(unwrap(a[i], opts));

        return r;
    }

    function unwrap(v, opts) {
        var isObservable = ko.isObservable(v);

        if (isObservable) {
            var val = v();

            return unwrap(val, opts);
        } else {
            if (typeOf(v) == "array") {
                return unwrapArray(v, opts);
            } else if (typeOf(v) == "object") {
                return unwrapObject(v, opts);
            } else {
                return v;
            }
        }
    }

    function reset() {
        parents = [{ obj: null, wrapped: null, lvl: "" }];
    }

    // wrapping

    function wrapObject(o, computedFunctions) {
        // check for infinite recursion
        for (var i = 0; i < parents.length; ++i) {
            if (parents[i].obj === o) {
                return parents[i].wrapped;
            }
        }

        var t = {};

        for (var k in o) {
            var v = o[k];

            parents.push({ obj: o, wrapped: t, lvl: currentLvl() + "/" + k });

            t[k] = wrap(v, computedFunctions);

            parents.pop();
        }

        if (computedFunctions && computedFunctions[currentLvl()])
            t = computedFunctions[currentLvl()](t);

        if (hasES5Plugin())
            ko.track(t);

        return t;
    }

    function wrapArray(a, computedFunctions) {
        var r = ko.observableArray();

        if (!a || a.length == 0)
            return r;

        for (var i = 0, l = a.length; i < l; ++i)
            r.push(wrap(a[i], computedFunctions));

        return r;
    }

    // a stack, used for two purposes:
    //  - circular reference checking
    //  - computed functions
    var parents;

    function currentLvl() {
        return parents[parents.length - 1].lvl;
    }

    function wrap(v, computedFunctions) {
        if (typeOf(v) == "array") {
            return wrapArray(v, computedFunctions);
        } else if (typeOf(v) == "object") {
            return wrapObject(v, computedFunctions);
        } else {
            if (!hasES5Plugin() && typeof v !== "function") {
                var t = ko.observable();
                t(v);
                return t;
            } else
                return v;
        }
    }

    function hasES5Plugin() {
        return ko.track != null;
    }
}));
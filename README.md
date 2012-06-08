Knockout wrap
=============

Motivation
----------

The performance of ko.mapping.fromJS(JSObject) is very slow. A simple
test wrapping 500 simple elements takes 700ms in firefox. This seems
to be a [known issue](http://daringfireball.net/projects/markdown/),
that is still there.

Futhermore I don't have the need for ko.mappings ability to find out
what needs to be updated in already mapped objects. This shaves off a
huge chunk of the complexity.

Solution
--------

A new plugin knockout.wrap with almost the same interface as
ko.mapping (fromJS, fromJSON, toJS and toJSON). The plugin can do
simple mappings from JS to observables and the other way again.
Because the code is much simpler it is super fast:

ko.mappin.fromJS(500JSObjects): 737ms
ko.wrap.fromJS(500JSObjects): 16ms

ko.mappin.toJS(500WrappedObjects): 22ms
ko.wrap.toJS(500WrappedObjects): 5ms 

Usage
-----

   var observable = ko.mappin.fromJS(JSObjects);

   var jsObjects = ko.mappin.toJS(observable);

Please note that if you are updating an observable, then it's
preferable to use ko.updateFromJS(observable, jsObject).

ko.mapping can attach computed functions while it is wrapping. ko.wrap
can do this as well, the syntax is a bit different:

    function populateArray()
    {
        var t = {elements: []};

        for (var i = 0; i < 500; ++i)
	   t.elements.push({id: i, name: "hello" + i});

	return t;
    }

    var computedFunctions = {
        "/elements": function(e) {
            e.nameLength = ko.computed(function() {
                return e.name().length;
            }, e);
            return e;
        }
    };

    ko.wrap.fromJS(t, computedFunctions);

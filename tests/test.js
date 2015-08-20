function objWithLargeArray()
{
    var t = {elements: []};

    for (var i = 0; i < 500; ++i)
	t.elements.push({id: i, name: "hello" + i});

    return t;
}

function objWithLargeArrayComplex()
{
    var t = {elements: []};

    for (var i = 0; i < 500; ++i)
	t.elements.push({id: i, data: { name: "hello" + i} });

    return t;
}

function cyclicData()
{
    var employee = {orders: []};

    for (var i = 0; i < 10; ++i)
	employee.orders.push({ id: i, name: "order " + i, employee: employee });

    return employee;
}

$(document).ready(function() {
    test("fromJS simple", function() {  
        var simple = objWithLargeArray();
        var wrapped = ko.wrap.fromJS(simple);

        deepEqual(wrapped.elements()[0].id(), 0);
        deepEqual(wrapped.elements()[0].name(), "hello0");

        deepEqual(wrapped.elements()[100].id(), 100);
        deepEqual(wrapped.elements()[100].name(), "hello100");

        notDeepEqual(wrapped.elements()[0].id(), "0", "type is preserved");
        notDeepEqual(wrapped.elements()[340].name(), "hello341");
    });

    test("fromJS complex", function() {  
        var complex = objWithLargeArrayComplex();
        var wrapped = ko.wrap.fromJS(complex);

        deepEqual(wrapped.elements()[0].id(), 0);
        deepEqual(wrapped.elements()[0].data.name(), "hello0");

        deepEqual(wrapped.elements()[100].id(), 100);
        deepEqual(wrapped.elements()[100].data.name(), "hello100");

        notDeepEqual(wrapped.elements()[0].id(), "0", "type is preserved");
        notDeepEqual(wrapped.elements()[340].data.name(), "hello341");
    });

    test("fromJS date property", function() {
        var date = new Date();
        var withDate = { 'DateObject': date };
        var wrapped = ko.wrap.fromJS(withDate);

        ok(ko.isObservable(wrapped.DateObject), 'Property is observable');
        ok(typeof wrapped.DateObject === 'function' && wrapped.DateObject() === date, 'Date value preserved');
    });

    test("fromJS with functions", function() {
        var withFunction = { 'func': function() { return 2; } };
        var wrapped = ko.wrap.fromJS(withFunction);

        ok(!ko.isObservable(wrapped.func), 'Function should not be made observable');
        ok(typeof wrapped.func === 'function' && wrapped.func() === 2, 'Function is preserved');
    });

    test("toJS date property", function() {
        var date = new Date();
        var unwrapped = ko.wrap.toJS({ 'DateObject': date });

        ok(unwrapped.DateObject === date, 'Date value preserved');
    });

    test("toJS complex object", function() {
        var model = {
            prop: ko.observable({
                arr: ko.observableArray(['a', 'b', 'c']),
                val: ko.observable('val')
            }),
            arr2: ko.observableArray(['a', 'b', 'c'])
        };

        var unwrapped = ko.wrap.toJS(model);

        ok(unwrapped.prop.arr[1], model.prop().arr()[1], 'Multi level array');
        ok(unwrapped.prop.val === model.prop().val(), 'Multi level value');
    });

    test("toJS", function() {
        var t = ko.observableArray([ko.observable({'test':1})]);
        var unwrapped = ko.wrap.toJS(t);

        deepEqual(unwrapped[0].test, 1);

        t = ko.observable(1);
        unwrapped = ko.wrap.toJS(t);

        deepEqual(unwrapped, 1);

        t = ko.observable({a: 1, b: 2});
        unwrapped = ko.wrap.toJS(t);

        deepEqual(unwrapped.a, 1);
        deepEqual(unwrapped.b, 2);
    });

    test("toJSON", function() {
        var t = ko.observableArray([ko.observable({'test':1})]);
        var unwrapped = ko.wrap.toJSON(t);

        deepEqual(unwrapped, '[{"test":1}]');

        t = ko.observable(1);
        unwrapped = ko.wrap.toJSON(t);

        deepEqual(unwrapped, '1');

        t = ko.observable({a: 1, b: 2});
        unwrapped = ko.wrap.toJSON(t);

        deepEqual(unwrapped, '{"a":1,"b":2}');
    });

    test("cyclic test", function() {  
        var data = cyclicData();
        var wrapped = ko.wrap.fromJS(data);

        deepEqual(wrapped.orders().length, 10);

        deepEqual(wrapped.orders()[0].id(), 0);
        deepEqual(wrapped.orders()[0].name(), "order 0");
        deepEqual(wrapped, wrapped.orders()[0].employee);
        deepEqual(wrapped, wrapped.orders()[0].employee.orders()[0].employee);
    });

    test("attaching computed functions", function() {  
        var simple = objWithLargeArray();

        var computedFunctions = {
	    "/elements": function(e) {
	        e.nameLength = ko.computed(function() {
		    return e.name().length;
	        }, e);
	        return e;
	    }
        };

        var wrappedSimple = ko.wrap.fromJS(simple, computedFunctions);
        
        deepEqual(wrappedSimple.elements()[3].nameLength(), 5+1);
        deepEqual(wrappedSimple.elements()[10].nameLength(), 5+2);
        deepEqual(wrappedSimple.elements()[300].nameLength(), 5+3);
    });

    test("attaching computed functions complex", function() {  
        var complex = objWithLargeArrayComplex();

        var computedFunctions = {
	    "/elements/data": function(e) {
	        e.nameLength = ko.computed(function() {
		    return e.name().length;
	        }, e);
	        return e;
	    }
        };

        var wrapped = ko.wrap.fromJS(complex, computedFunctions);
        
        deepEqual(wrapped.elements()[3].data.nameLength(), 5+1);
        deepEqual(wrapped.elements()[10].data.nameLength(), 5+2);
        deepEqual(wrapped.elements()[300].data.nameLength(), 5+3);
    });
});  

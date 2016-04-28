var babelHelpers = {};
babelHelpers.typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
};

babelHelpers.classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

babelHelpers.createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

babelHelpers;

// thanks AngularJS
function isDate(value) {
    return toString.call(value) === '[object Date]';
}

function isFunction(value) {
    return typeof value === 'function';
}

var isArray = function () {
    if (!isFunction(Array.isArray)) {
        return function (value) {
            return toString.call(value) === '[object Array]';
        };
    }
    return Array.isArray;
}();

function isRegExp(value) {
    return toString.call(value) === '[object RegExp]';
}

function equals(o1, o2) {
    if (o1 === o2) return true;
    if (o1 === null || o2 === null) return false;
    if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
    var t1 = typeof o1 === 'undefined' ? 'undefined' : babelHelpers.typeof(o1),
        t2 = typeof o2 === 'undefined' ? 'undefined' : babelHelpers.typeof(o2),
        length,
        key,
        keySet;
    if (t1 == t2) {
        if (t1 == 'object') {
            if (isArray(o1)) {
                if (!isArray(o2)) return false;
                if ((length = o1.length) == o2.length) {
                    for (key = 0; key < length; key++) {
                        if (!equals(o1[key], o2[key])) return false;
                    }
                    return true;
                }
            } else if (isDate(o1)) {
                if (!isDate(o2)) return false;
                return isNaN(o1.getTime()) && isNaN(o2.getTime()) || o1.getTime() === o2.getTime();
            } else if (isRegExp(o1) && isRegExp(o2)) {
                return o1.toString() == o2.toString();
            } else {
                if (isArray(o2)) return false;
                keySet = {};
                for (key in o1) {
                    if (key.charAt(0) === '$' || isFunction(o1[key])) continue;
                    if (!equals(o1[key], o2[key])) return false;
                    keySet[key] = true;
                }
                for (key in o2) {
                    if (!keySet.hasOwnProperty(key) && key.charAt(0) !== '$' && o2[key] !== undefined && !isFunction(o2[key])) return false;
                }
                return true;
            }
        }
    }
    return false;
}

var ObservableLibraryMethods = ['clear',
// 'getItem',
// 'iterate',
// 'key',
// 'keys',
// 'length',
'removeItem', 'setItem'];

var LocalForageObservableWrapper = function () {
    function LocalForageObservableWrapper(options, subscriptionObserver) {
        babelHelpers.classCallCheck(this, LocalForageObservableWrapper);

        this.options = options;
        this.subscriptionObserver = subscriptionObserver;
    }

    babelHelpers.createClass(LocalForageObservableWrapper, [{
        key: 'hasMethodFilterOptions',
        value: function hasMethodFilterOptions() {
            if (this.options) {
                for (var i = 0, methodName; methodName = ObservableLibraryMethods[i]; i++) {
                    if (this.options[methodName]) {
                        return true;
                    }
                }
            }
            return false;
        }
    }, {
        key: 'publish',
        value: function publish(publishObject) {
            if (publishObject.success && typeof this.subscriptionObserver.next === 'function') {
                try {
                    this.subscriptionObserver.next(publishObject);
                } catch (e) {/* */}
            } else if (publishObject.fail && typeof this.subscriptionObserver.error === 'function') {
                    try {
                        this.subscriptionObserver.error(publishObject);
                    } catch (e) {/* */}
                }
        }
    }]);
    return LocalForageObservableWrapper;
}();

function processObserverList(list, changeArgs) {
    for (var i = 0, observableWrapper; observableWrapper = list[i]; i++) {
        var itemOptions = observableWrapper.options;
        if (!itemOptions || (!itemOptions.key || itemOptions.key === changeArgs.key) && (itemOptions[changeArgs.methodName] === true || !observableWrapper.hasMethodFilterOptions())) {
            observableWrapper.publish(changeArgs);
        }
    }
}

function handleMethodCall(localforageInstance, methodName, args) {
    return localforageInstance.ready().then(function () {
        var changeArgs = {
            key: args[0],
            methodName: methodName,
            oldValue: null,
            newValue: null
        };

        if (methodName === 'setItem' && args[1] !== undefined) {
            changeArgs.newValue = args[1];
        }

        // if change detection is enabled to at least one active observable
        // and an applicable method is called then we should retrieve the old value
        var detectChanges = (methodName === 'setItem' || methodName === 'removeItem') && !!localforageInstance._observables.changeDetection.length;

        var getOldValuePromise = detectChanges ? localforageInstance.getItem(changeArgs.key).then(function (value) {
            changeArgs.oldValue = value;
            // don't return anything
        }) : Promise.resolve();

        var promise = getOldValuePromise.then(function () {
            return localforageInstance._baseMethods[methodName].apply(localforageInstance, args);
        }) /*.then(function() {
             return getDriverPromise(localforageInstance, localforageInstance.driver());
           }).then(function(driver) {
             return driver[methodName].apply(localforageInstance, args);
           })*/;

        // don't return this promise so that the observers
        // get notified after the method invoker
        promise.then(function () {
            changeArgs.success = true;
        }).catch(function (error) {
            changeArgs.fail = true;
            changeArgs.error = error;
        }).then(function () {
            if (detectChanges && !equals(changeArgs.oldValue, changeArgs.newValue)) {
                processObserverList(localforageInstance._observables.changeDetection, changeArgs);
            }
            processObserverList(localforageInstance._observables.callDetection, changeArgs);
        });

        return promise;
    });
}

function wireUpMethods(localforageInstance) {
    function wireUpMethod(localforageInstance, methodName) {
        localforageInstance._baseMethods = localforageInstance._baseMethods || {};
        localforageInstance._baseMethods[methodName] = localforageInstance[methodName];
        localforageInstance[methodName] = function () {
            return handleMethodCall(this, methodName, arguments);
        };
    }

    for (var i = 0, len = ObservableLibraryMethods.length; i < len; i++) {
        var methodName = ObservableLibraryMethods[i];
        wireUpMethod(localforageInstance, methodName);
    }
}

function setup(localforageInstance) {
    if (!localforageInstance._observables) {
        localforageInstance._observables = {
            callDetection: [],
            changeDetection: []
        };

        wireUpMethods(localforageInstance);
    }
}

function localforageObservable(options) {
    var localforageInstance = this;
    setup(localforageInstance);

    var localforageObservablesList = options && options.changeDetection === false ? localforageInstance._observables.callDetection : localforageInstance._observables.changeDetection;

    var observable = localforageObservable.factory(function (observer) {
        var observableWrapper = new LocalForageObservableWrapper(options, observer);
        localforageObservablesList.push(observableWrapper);

        return function () {
            var index = localforageObservablesList.indexOf(observableWrapper);
            if (index >= 0) {
                return localforageObservablesList.splice(index, 1);
            }
        };
    });

    return observable;
}

// In case the user want to override the used Observables
// eg: with RxJS or ES-Observable
localforageObservable.factory = function (subscribeFn) {
    return new Observable(subscribeFn);
};

function extendPrototype(localforage) {
    try {
        var localforagePrototype = Object.getPrototypeOf(localforage);
        if (localforagePrototype) {
            localforagePrototype.newObservable = localforageObservable;
            return true;
        }
    } catch (e) {/* */}
    return false;
}

var extendPrototypeResult = extendPrototype(localforage);

export { localforageObservable, extendPrototype, extendPrototypeResult };
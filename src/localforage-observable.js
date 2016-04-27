(function() {
    'use strict';

    // Promises!
    var Promise = (typeof module !== 'undefined' && module.exports) ?
                  require('promise') : this.Promise;

    var globalObject = this;
    var serializer = null;

    var ModuleType = {
        DEFINE: 1,
        EXPORT: 2,
        WINDOW: 3
    };

    // Attaching to window (i.e. no module loader) is the assumed,
    // simple default.
    var moduleType = ModuleType.WINDOW;

    // Find out what kind of module setup we have; if none, we'll just attach
    // localForage to the main window.
    if (typeof define === 'function' && define.amd) {
        moduleType = ModuleType.DEFINE;
    } else if (typeof module !== 'undefined' && module.exports) {
        moduleType = ModuleType.EXPORT;
    }

    function getDriverPromise(localForageInstance, driverName) {
        getDriverPromise.result = getDriverPromise.result || {};
        if (getDriverPromise.result[driverName]) {
            return getDriverPromise.result[driverName];
        }
        if (!localForageInstance || typeof localForageInstance.getDriver !== 'function') {
            Promise.reject(new Error(
                'localforage.getDriver() was not available! ' +
                'localforage-observable requires localforage v1.4+'));
        }
        getDriverPromise.result[driverName] = localForageInstance.getDriver(driverName);
        return getDriverPromise.result[driverName];
    }


    var ObservableLibraryMethods = [
        'clear',
        // 'getItem',
        // 'iterate',
        // 'key',
        // 'keys',
        // 'length',
        'removeItem',
        'setItem'
    ];

    function LocalForageObservableWrapper (options, subscriptionObserver) {
        this.options = options;
        this.subscriptionObserver = subscriptionObserver;
    }

    LocalForageObservableWrapper.prototype.hasMethodFilterOptions = function () {
        if (this.options) {
            for (var i = 0, methodName; (methodName = ObservableLibraryMethods[i]); i++) {
                if (this.options[methodName]) {
                    return true;
                }
            }
        }
        return false;
    };

    LocalForageObservableWrapper.prototype.publish = function (publishObject) {
        if (publishObject.success && typeof this.subscriptionObserver.next === 'function') {
            try {
                this.subscriptionObserver.next(publishObject);
            } catch (e) { }
        } else if (publishObject.fail && typeof this.subscriptionObserver.error === 'function') {
            try {
                this.subscriptionObserver.error(publishObject);
            } catch (e) { }
        }
    };

    function isSubscriptionObject(subscriptionObject) {
        return subscriptionObject &&
            (typeof subscriptionObject.next === 'function' ||
             typeof subscriptionObject.error === 'function' ||
             typeof subscriptionObject.complete === 'function');
    }

    function localforageObservable(options) {
        var localforageInstance = this;
        setup(localforageInstance);

        var localforageObservablesList = options && options.changeDetection === false ?
            localforageInstance._observables.callDetection :
            localforageInstance._observables.changeDetection;

        var observable = localforageObservable.createNewObservable(function(observer) {
            var observableWrapper = new LocalForageObservableWrapper(options, observer);
            localforageObservablesList.push(observableWrapper);

            return function() {
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
    localforageObservable.createNewObservable = function (subscribeFn) {
        return new Observable(subscribeFn);
    };

    function processObserverList(list, changeArgs) {
        for (var i = 0, observableWrapper; (observableWrapper = list[i]); i++) {
            var itemOptions = observableWrapper.options;
            if (!itemOptions || (
                (!itemOptions.key || itemOptions.key === changeArgs.key) &&
                (itemOptions[changeArgs.methodName] === true ||
                 !observableWrapper.hasMethodFilterOptions())
               )) {
                observableWrapper.publish(changeArgs);
            }
        }
    }

    var isEqual = (function() {
      // thanks AngularJS
      function equals(o1, o2) {
        if (o1 === o2) return true;
        if (o1 === null || o2 === null) return false;
        if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
        var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
        if (t1 == t2) {
          if (t1 == 'object') {
            if (isArray(o1)) {
              if (!isArray(o2)) return false;
              if ((length = o1.length) == o2.length) {
                for(key=0; key<length; key++) {
                  if (!equals(o1[key], o2[key])) return false;
                }
                return true;
              }
            } else if (isDate(o1)) {
              if (!isDate(o2)) return false;
              return (isNaN(o1.getTime()) && isNaN(o2.getTime())) || (o1.getTime() === o2.getTime());
            } else if (isRegExp(o1) && isRegExp(o2)) {
              return o1.toString() == o2.toString();
            } else {
              if (isArray(o2)) return false;
              keySet = {};
              for(key in o1) {
                if (key.charAt(0) === '$' || isFunction(o1[key])) continue;
                if (!equals(o1[key], o2[key])) return false;
                keySet[key] = true;
              }
              for(key in o2) {
                if (!keySet.hasOwnProperty(key) &&
                    key.charAt(0) !== '$' &&
                    o2[key] !== undefined &&
                    !isFunction(o2[key])) return false;
              }
              return true;
            }
          }
        }
        return false;
      }

      function isDate(value) {
        return toString.call(value) === '[object Date]';
      }

      var isArray = (function() {
        if (!isFunction(Array.isArray)) {
          return function(value) {
            return toString.call(value) === '[object Array]';
          };
        }
        return Array.isArray;
      })();

      function isFunction(value){return typeof value === 'function';}

      function isRegExp(value) {
        return toString.call(value) === '[object RegExp]';
      }

      return equals;
    })();

    function handleMethodCall(localforageInstance, methodName, args) {
        return localforageInstance.ready()
            .then(function () {
                var key = args[0];
                var oldValue = null;
                var newValue = null;
                if (methodName === 'setItem' && newValue !== undefined) {
                    newValue = args[1];
                }

                var detectChanges = (methodName === 'setItem' || methodName === 'removeItem') &&
                                    !!localforageInstance._observables.changeDetection.length;

                var getOldValuePromise = detectChanges ?
                    localforageInstance.getItem(key).then(function(value) {
                        oldValue = value;
                        // don't return anything
                    }) :
                    Promise.resolve();

                var promise = getOldValuePromise.then(function() {
                    return localforageInstance._baseMethods[methodName].apply(localforageInstance, args);
                })/*.then(function() {
                    return getDriverPromise(localforageInstance, localforageInstance.driver());
                }).then(function(driver) {
                    return driver[methodName].apply(localforageInstance, args);
                })*/;

                var changeArgs = {
                    key: key,
                    methodName: methodName,
                    oldValue: oldValue,
                    newValue: newValue
                };

                // don't return this promise so that the observers
                // get notified after the method invoker
                promise.then(function() {
                    changeArgs.success = true;
                }).catch(function(error) {
                    changeArgs.fail = true;
                    changeArgs.error = error;
                }).then(function() {
                    if (detectChanges && !isEqual(oldValue, newValue)) {
                        processObserverList(
                            localforageInstance._observables.changeDetection,
                            changeArgs);
                    }
                    processObserverList(
                            localforageInstance._observables.callDetection,
                            changeArgs);
                });

                return promise;
            });
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

    function extendPrototype(localforage) {
        var localforagePrototype = Object.getPrototypeOf(localforage);
        if (localforagePrototype) {
            localforagePrototype.newObservable = localforageObservable;
        }
    }

    extendPrototype(localforage);

    if (moduleType === ModuleType.DEFINE) {
        define('localforageObservable', function() {
            return localforageObservable;
        });
    } else if (moduleType === ModuleType.EXPORT) {
        module.exports = localforageObservable;
    } else {
        this.localforageObservable = localforageObservable;
    }
}).call(window);

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

    function LocalForageObservable() {
        this.subscribers = [];
    }

    LocalForageObservable.prototype.isSubscriptionObject = function (subscriptionObject) {
        return subscriptionObject &&
            (typeof subscriptionObject.next === 'function' ||
             typeof subscriptionObject.error === 'function' ||
             typeof subscriptionObject.complete === 'function');
    };

    LocalForageObservable.prototype.hasMethodFilterOptions = function () {
        if (this.options) {
            for (var i = 0, methodName; (methodName = ObservableLibraryMethods[i]); i++) {
                if (this.options[methodName]) {
                    return true;
                }
            }
        }
        return false;
    };

    LocalForageObservable.prototype.subscribe = function (subscriptionObject) {
        if (!this.isSubscriptionObject(subscriptionObject) && arguments.length) {
            subscriptionObject = {
                next: typeof arguments[0] === 'function' ? arguments[0] : undefined,
                error: typeof arguments[1] === 'function' ? arguments[1] : undefined,
                complete: typeof arguments[2] === 'function' ? arguments[2] : undefined
            };
        }

        if (this.isSubscriptionObject(subscriptionObject)) {
            this.subscribers.push(subscriptionObject);

            var that = this;
            return {
                unsubscribe: function() {
                    that._unsubscribe(subscriptionObject);
                }
            };
        }
    };

    LocalForageObservable.prototype._unsubscribe = function (subscriptionObject) {
        if (subscriptionObject) {
            var index = this.subscribers.indexOf(subscriptionObject);
            if (index >= 0) {
                return this.subscribers.splice(index, 1);
            }
        }
    };

    LocalForageObservable.prototype.publish = function (publishObject) {
        for (var i = 0, subscriber; (subscriber = this.subscribers[i]); i++) {
            if (publishObject.success && typeof subscriber.next === 'function') {
                try {
                    subscriber.next(publishObject);
                } catch (e) { }
            } else if (publishObject.fail && typeof subscriber.error === 'function') {
                try {
                    subscriber.error(publishObject);
                } catch (e) { }
            }
        }
    };

    // LocalForageObservable.prototype.destroy = function () {
    //     for (var i = 0, subscriber; (subscriber = this.subscribers[i]); i++) {
    //         if (typeof subscriber.complete === 'function') {
    //             try {
    //                 subscriber.complete();
    //             } catch (e) { }
    //         }
    //     }

    //     this.subscribers.length = 0;
    // };

    // function LocalForageObservableOptions() { }
    // LocalForageObservableOptions.prototype.key = '';
    // LocalForageObservableOptions.prototype.setItem = true;
    // LocalForageObservableOptions.prototype.removeItem = true;
    // LocalForageObservableOptions.prototype.clear = true;

    function setup(localforageInstance) {
        if (!localforageInstance._observables) {
            localforageInstance._observables = {
                callDetection: [],
                changeDetection: []
            };

            wireUpMethods(localforageInstance);
        }
    }

    function extendObservable(localforageInstance, observable, options) {
        observable.options = options;
        // observable.localforageInstance = localforageInstance;
        observable.localforageObservablesList = options && options.changeDetection === false ?
            localforageInstance._observables.callDetection :
            localforageInstance._observables.changeDetection;

        var baseObservableSubscribe = observable.subscribe;
        observable.subscribe = function() {
            var subscription = baseObservableSubscribe.apply(this, arguments);
            if (subscription) {
                if (this.localforageObservablesList.indexOf(observable) < 0) {
                    this.localforageObservablesList.push(observable);
                }

                var that = this;
                var baseUnsubscribe = subscription.unsubscribe;
                subscription.unsubscribe = function() {
                    var index = that.localforageObservablesList.indexOf(observable);
                    if (index >= 0) {
                        return that.localforageObservablesList.splice(index, 1);
                    }
                };
            }

            return subscription;
        };

        // var baseDestroy = observable.destroy;
        // observable.destroy = function() {
        //     baseDestroy.apply(observable, arguments);
        //     var index = targetObservablesList.indexOf(observable);
        //     if (index >= 0) {
        //         return targetObservablesList.splice(index, 1);
        //     }
        // };
    }

    function localforageObservable(options) {
        var localforageInstance = this;
        setup(localforageInstance);

        var observable = localforageObservable.createNewObservable();
        extendObservable(localforageInstance, observable, options);

        return observable;
    }

    // In case the user want to override the used Observables
    // eg: with RxJS or ES-Observable
    localforageObservable.createNewObservable = function () {
        return new LocalForageObservable();
    };

    // function getItemKeyValue(key) {
    //     var localforageInstance = this;
    //     var promise = localforageInstance.getItem(key).then(function(value) {
    //         return {
    //             key: key,
    //             value: value
    //         };
    //     });
    //     return promise;
    // }

    // function LocalForageObservableChange() { }
    // LocalForageObservableChange.prototype.key = '';
    // LocalForageObservableChange.prototype.methodName = '';
    // LocalForageObservableChange.prototype.oldValue = null;
    // LocalForageObservableChange.prototype.newValue = null;
    // LocalForageObservableChange.prototype.success = false;
    // LocalForageObservableChange.prototype.fail = false;
    // LocalForageObservableChange.prototype.error = '';

    function processObserverList(list, changeArgs) {
        for (var i = 0, observable; (observable = list[i]); i++) {
            var itemOptions = observable.options;
            if (!itemOptions || (
                (!itemOptions.key || itemOptions.key === changeArgs.key) &&
                (itemOptions[changeArgs.methodName] === true ||
                 !observable.hasMethodFilterOptions())
               )) {
                observable.publish(changeArgs);
            }
        }
    }

    function isEqual(a, b) {
        return a === b;
    }

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

                var oldValuePromise = detectChanges ?
                    localforageInstance.getItem(key).then(function(value) {
                        oldValue = value;
                    }) :
                    Promise.resolve();

                var promise = oldValuePromise.then(function() {
                    return localforageInstance._baseMethods[methodName].apply(localforageInstance, args);
                })/*.then(function() {
                    return localforageInstance.getDriver(localforageInstance.driver());
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

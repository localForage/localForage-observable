(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('localforage')) :
  typeof define === 'function' && define.amd ? define(['exports', 'localforage'], factory) :
  (factory((global.localforageObservable = global.localforageObservable || {}),global.localforage));
}(this, (function (exports,localforage) { 'use strict';

localforage = 'default' in localforage ? localforage['default'] : localforage;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
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
    var t1 = typeof o1 === 'undefined' ? 'undefined' : _typeof(o1),
        t2 = typeof o2 === 'undefined' ? 'undefined' : _typeof(o2),
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
        classCallCheck(this, LocalForageObservableWrapper);

        this.options = options;
        this.subscriptionObserver = subscriptionObserver;
    }

    createClass(LocalForageObservableWrapper, [{
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
        if (!itemOptions || (!itemOptions.key || itemOptions.key === changeArgs.key) && (itemOptions[changeArgs.methodName] === true || !observableWrapper.hasMethodFilterOptions()) && (
        // do not publish cross tab evets when the observable
        // doesn't explicitelly require it,
        // to avoid messing troubles in existing implementations.
        !changeArgs.crossTabNotification || itemOptions.crossTabNotification)) {
            observableWrapper.publish(changeArgs);
        }
    }
}

/* global window:true */
var isSupported = typeof window !== 'undefined' && typeof window.addEventListener === 'function' && typeof window.removeEventListener === 'function' && typeof JSON !== 'undefined' && JSON.stringify && JSON.parse && localforage.supports(localforage.LOCALSTORAGE);

var sysKeyPrefix = ['_localforage_sys', '_localforage_observable_sys'].join('/');

var db = isSupported ? window.localStorage : null;
var inited = false;

var StorageEventObserver = function () {
    function StorageEventObserver(localforageInstance) {
        classCallCheck(this, StorageEventObserver);

        this.localforageInstance = localforageInstance;
        this._onStorageEventBinded = this._onStorageEvent.bind(this);
    }

    createClass(StorageEventObserver, [{
        key: 'setup',
        value: function setup() {
            if (!isSupported || inited) {
                return;
            }
            window.addEventListener('storage', this._onStorageEventBinded, false);
            inited = true;
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            this.localforageInstance = null;
            if (inited) {
                window.removeEventListener('storage', this._onStorageEventBinded, false);
                inited = false;
            }
        }
    }, {
        key: '_onStorageEvent',
        value: function _onStorageEvent(e) {
            var _this = this;

            if (e.key !== sysKeyPrefix) {
                return;
            }
            try {
                var payload = JSON.parse(e.newValue);
                if (!payload) {
                    return;
                }

                var dbInfo = this.localforageInstance._dbInfo;
                if (dbInfo.name !== payload.name || dbInfo.storeName !== payload.storeName) {
                    return;
                }

                return this.localforageInstance.ready().then(function () {
                    var changeArgs = {
                        key: payload.key,
                        methodName: payload.methodName,
                        oldValue: null,
                        newValue: null,
                        success: payload.success,
                        fail: payload.fail,
                        error: payload.error,
                        valueChange: payload.valueChange,
                        crossTabNotification: 'StorageEvent',
                        originalEvent: e
                    };

                    if (payload.methodName === 'setItem' && payload.success) {
                        return _this.localforageInstance.getItem(payload.key).then(function (newValue) {
                            changeArgs.newValue = newValue;
                            return changeArgs;
                        });
                    }
                    return changeArgs;
                }).then(function (changeArgs) {
                    // this will run only in case the crossTabChangeDetection
                    // is enaled on the other page or there is at least one
                    // changeDetection Observable
                    if (changeArgs.valueChange) {
                        processObserverList(_this.localforageInstance._observables.changeDetection, changeArgs);
                    }
                    processObserverList(_this.localforageInstance._observables.callDetection, changeArgs);
                });
            } catch (ex) {
                return Promise.reject(ex);
            }
        }
    }, {
        key: 'publish',
        value: function publish(changeArgs) {
            if (!isSupported) {
                return;
            }

            var dbInfo = this.localforageInstance._dbInfo;

            var errorString;
            try {
                if (changeArgs.error) {
                    errorString = JSON.stringify(changeArgs.error);
                }
            } catch (ex) {
                // empty
            }

            var payload = {
                name: dbInfo.name,
                storeName: dbInfo.storeName,
                key: changeArgs.key,
                methodName: changeArgs.methodName,
                valueChange: changeArgs.valueChange,
                success: changeArgs.success,
                fail: changeArgs.fail,
                error: errorString,
                ticks: +new Date()
            };

            var value = JSON.stringify(payload);

            db.setItem(sysKeyPrefix, value);
        }
    }]);
    return StorageEventObserver;
}();

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
        var detectChanges = (methodName === 'setItem' || methodName === 'removeItem') && (localforageInstance._observables.changeDetection.length || localforageInstance._observables.crossTabChangeDetection);

        var getOldValuePromise = detectChanges ? localforageInstance.getItem(changeArgs.key).then(function (value) {
            changeArgs.oldValue = value;
            // don't return anything
        }) : Promise.resolve();

        var promise = getOldValuePromise.then(function () {
            return localforageInstance._baseMethods[methodName].apply(localforageInstance, args);
        });

        // don't return this promise so that the observers
        // get notified after the method invoker
        promise.then(function () {
            changeArgs.success = true;
        }).catch(function (error) {
            changeArgs.fail = true;
            changeArgs.error = error;
        }).then(function () {
            changeArgs.valueChange = detectChanges && !equals(changeArgs.oldValue, changeArgs.newValue);
            if (changeArgs.valueChange) {
                processObserverList(localforageInstance._observables.changeDetection, changeArgs);
            }
            processObserverList(localforageInstance._observables.callDetection, changeArgs);
        }).then(function () {
            if (localforageInstance._observables.crossTabObserver) {
                localforageInstance._observables.crossTabObserver.publish(changeArgs);
            }
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

function setup$1(localforageInstance) {
    if (!localforageInstance._observables) {
        localforageInstance._observables = {
            callDetection: [],
            changeDetection: []
        };

        wireUpMethods(localforageInstance);
    }
    if (!localforageInstance._observables.crossTabObserver) {
        localforageInstance._observables.crossTabObserver = new StorageEventObserver(localforageInstance);
    }
}

function configObservables(options) {
    var localforageInstance = this;
    setup$1(localforageInstance);

    if (!options) {
        return;
    }

    var obs = localforageInstance._observables;
    if (options.crossTabNotification) {
        if (!obs.crossTabObserver) {
            obs.crossTabObserver = new StorageEventObserver(localforageInstance);
        }
        obs.crossTabObserver.setup();
    } else {
        obs.crossTabObserver.destroy();
        obs.crossTabObserver = null;
    }

    obs.crossTabChangeDetection = options.crossTabChangeDetection;
}

function newObservable(options) {
    var localforageInstance = this;
    setup$1(localforageInstance);

    var localforageObservablesList = options && options.changeDetection === false ? localforageInstance._observables.callDetection : localforageInstance._observables.changeDetection;

    var observable = newObservable.factory(function (observer) {
        var observableWrapper = new LocalForageObservableWrapper(options, observer);
        localforageObservablesList.push(observableWrapper);

        return function unsubscribeFn() {
            var index = localforageObservablesList.indexOf(observableWrapper);
            if (index >= 0) {
                return localforageObservablesList.splice(index, 1);
            }
        };
    });

    return observable;
}

function getItemObservable(key, options) {
    var localforageInstance = this;

    options = options || {};
    options.key = key;

    var observable = newObservable.factory(function (observer) {
        var getItemSettled = localforageInstance.getItem(key).then(function (value) {
            observer.next(value);
        }).catch(function (errorValue) {
            return observer.error(errorValue);
        });

        var changeObservable = localforageInstance.newObservable(options);
        var changeObservableSubscription = changeObservable.subscribe({
            next: function next(changeObject) {
                getItemSettled.then(function () {
                    observer.next(changeObject.newValue);
                });
            },
            error: function error(errorValue) {
                getItemSettled.then(function () {
                    observer.error(errorValue);
                });
            },
            complete: function complete() {
                getItemSettled.then(function () {
                    observer.complete();
                });
            }
        });

        return function () {
            changeObservableSubscription.unsubscribe();
        };
    });

    return observable;
}

// In case the user want to override the used Observables
// eg: with RxJS or ES-Observable
newObservable.factory = function (subscribeFn) {
    return new Observable(subscribeFn);
};

// to avoid breaking changes
var localforageObservable = newObservable;

function extendPrototype(localforage$$1) {
    try {
        var localforagePrototype = Object.getPrototypeOf(localforage$$1);
        if (localforagePrototype) {
            localforagePrototype.newObservable = newObservable;
            localforagePrototype.getItemObservable = getItemObservable;
            localforagePrototype.configObservables = configObservables;
            return localforage$$1;
        }
    } catch (e) {/* */}
    return false;
}

var extendPrototypeResult = !!extendPrototype(localforage);

exports.newObservable = newObservable;
exports.getItemObservable = getItemObservable;
exports.localforageObservable = localforageObservable;
exports.extendPrototype = extendPrototype;
exports.extendPrototypeResult = extendPrototypeResult;

Object.defineProperty(exports, '__esModule', { value: true });

})));

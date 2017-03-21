import localforage from 'localforage';
import { equals as isEqual } from './utils';
import { ObservableLibraryMethods } from './ObservableLibraryMethods';
import { LocalForageObservableWrapper } from './LocalForageObservableWrapper';
import { processObserverList } from './facades';
import CrossTabObserver from './StorageEventObserver';

function handleMethodCall(localforageInstance, methodName, args) {
    return localforageInstance.ready()
        .then(function () {
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
            var detectChanges = (methodName === 'setItem' || methodName === 'removeItem') &&
                                (localforageInstance._observables.changeDetection.length ||
                                 localforageInstance._observables.crossTabChangeDetection);

            var getOldValuePromise = detectChanges ?
                localforageInstance.getItem(changeArgs.key).then(function(value) {
                    changeArgs.oldValue = value;
                    // don't return anything
                }) :
                Promise.resolve();

            var promise = getOldValuePromise.then(function() {
                return localforageInstance._baseMethods[methodName].apply(localforageInstance, args);
            });

            // don't return this promise so that the observers
            // get notified after the method invoker
            promise.then(function() {
                changeArgs.success = true;
            }).catch(function(error) {
                changeArgs.fail = true;
                changeArgs.error = error;
            }).then(function() {
                changeArgs.valueChange = detectChanges && !isEqual(changeArgs.oldValue, changeArgs.newValue);
                if (changeArgs.valueChange) {
                    processObserverList(
                        localforageInstance._observables.changeDetection,
                        changeArgs);
                }
                processObserverList(
                    localforageInstance._observables.callDetection,
                    changeArgs);
            }).then(function() {
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

function setup(localforageInstance) {
    if (!localforageInstance._observables) {
        localforageInstance._observables = {
            callDetection: [],
            changeDetection: []
        };

        wireUpMethods(localforageInstance);
    }
    if (!localforageInstance._observables.crossTabObserver) {
        localforageInstance._observables.crossTabObserver = new CrossTabObserver(localforageInstance);
    }
}

function configObservables(options) {
    var localforageInstance = this;
    setup(localforageInstance);

    if (!options) {
        return;
    }

    var obs = localforageInstance._observables;
    if (options.crossTabNotification) {
        if (!obs.crossTabObserver) {
            obs.crossTabObserver = new CrossTabObserver(localforageInstance);
        }
        obs.crossTabObserver.setup();
    } else {
        obs.crossTabObserver.destroy();
        obs.crossTabObserver = null;
    }

    obs = options.crossTabChangeDetection;
}

export function newObservable(options) {
    var localforageInstance = this;
    setup(localforageInstance);

    var localforageObservablesList = options && options.changeDetection === false ?
        localforageInstance._observables.callDetection :
        localforageInstance._observables.changeDetection;

    var observable = newObservable.factory(function(observer) {
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

export function getItemObservable(key, options) {
    var localforageInstance = this;

    options = options || {};
    options.key = key;

    var observable = newObservable.factory(function(observer) {
        var getItemSettled = localforageInstance.getItem(key).then((value) => {
            observer.next(value);
        })
        .catch(errorValue => observer.error(errorValue));

        var changeObservable = localforageInstance.newObservable(options);
        var changeObservableSubscription = changeObservable.subscribe({
            next: function(changeObject) {
                getItemSettled.then(function() {
                    observer.next(changeObject.newValue);
                });
            },
            error: function (errorValue) {
                getItemSettled.then(function() {
                    observer.error(errorValue);
                });
            },
            complete: () => {
                getItemSettled.then(function() {
                    observer.complete();
                });
            }
        });

        return function() {
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
export var localforageObservable = newObservable;

export function extendPrototype(localforage) {
    try {
        var localforagePrototype = Object.getPrototypeOf(localforage);
        if (localforagePrototype) {
            localforagePrototype.newObservable = newObservable;
            localforagePrototype.getItemObservable = getItemObservable;
            localforagePrototype.configObservables = configObservables;
            return localforage;
        }
    } catch (e) { /* */ }
    return false;
}

export var extendPrototypeResult = !!extendPrototype(localforage);

import localforage from 'localforage';
import { equals as isEqual } from './utils';
import { ObservableLibraryMethods } from './ObservableLibraryMethods';
import { LocalForageObservableWrapper } from './LocalForageObservableWrapper';

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
                                !!localforageInstance._observables.changeDetection.length;

            var getOldValuePromise = detectChanges ?
                localforageInstance.getItem(changeArgs.key).then(function(value) {
                    changeArgs.oldValue = value;
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

            // don't return this promise so that the observers
            // get notified after the method invoker
            promise.then(function() {
                changeArgs.success = true;
            }).catch(function(error) {
                changeArgs.fail = true;
                changeArgs.error = error;
            }).then(function() {
                if (detectChanges && !isEqual(changeArgs.oldValue, changeArgs.newValue)) {
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

function setup(localforageInstance) {
    if (!localforageInstance._observables) {
        localforageInstance._observables = {
            callDetection: [],
            changeDetection: []
        };

        wireUpMethods(localforageInstance);
    }
}

export function localforageObservable(options) {
    var localforageInstance = this;
    setup(localforageInstance);

    var localforageObservablesList = options && options.changeDetection === false ?
        localforageInstance._observables.callDetection :
        localforageInstance._observables.changeDetection;

    var observable = localforageObservable.factory(function(observer) {
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
localforageObservable.factory = function (subscribeFn) {
    return new Observable(subscribeFn);
};

export function extendPrototype(localforage) {
    try {
        var localforagePrototype = Object.getPrototypeOf(localforage);
        if (localforagePrototype) {
            localforagePrototype.newObservable = localforageObservable;
            return true;
        }
    } catch (e) { /* */ }
    return false;
}

export var extendPrototypeResult = extendPrototype(localforage);

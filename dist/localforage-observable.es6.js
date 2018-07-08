import localforage from 'localforage';

function processObserverList(list, changeArgs) {
    for (const observableWrapper of list) {
        const itemOptions = observableWrapper.options;
        if (!itemOptions ||
            ((!itemOptions.key || itemOptions.key === changeArgs.key) &&
                (itemOptions[changeArgs.methodName] === true ||
                    !observableWrapper.hasMethodFilterOptions()) &&
                (!changeArgs.crossTabNotification ||
                    itemOptions.crossTabNotification))) {
            observableWrapper.publish(changeArgs);
        }
    }
}

const ObservableLibraryMethods = [
    'clear',
    'removeItem',
    'setItem',
];

class LocalForageObservableWrapper {
    constructor(options, subscriptionObserver) {
        this.options = options;
        this.subscriptionObserver = subscriptionObserver;
    }
    hasMethodFilterOptions() {
        if (this.options) {
            for (const methodName of ObservableLibraryMethods) {
                if (this.options[methodName]) {
                    return true;
                }
            }
        }
        return false;
    }
    publish(publishObject) {
        if (publishObject.success &&
            typeof this.subscriptionObserver.next === 'function') {
            try {
                this.subscriptionObserver.next(publishObject);
            }
            catch (e) {
            }
        }
        else if (publishObject.fail &&
            typeof this.subscriptionObserver.error === 'function') {
            try {
                this.subscriptionObserver.error(publishObject);
            }
            catch (e) {
            }
        }
    }
}

const isSupported = typeof window !== 'undefined' &&
    typeof window.addEventListener === 'function' &&
    typeof window.removeEventListener === 'function' &&
    typeof JSON !== 'undefined' &&
    JSON.stringify &&
    JSON.parse &&
    localforage.supports(localforage.LOCALSTORAGE);
const sysKeyPrefix = ['_localforage_sys', '_localforage_observable_sys'].join('/');
const db = isSupported ? window.localStorage : null;
let inited = false;
class StorageEventObserver {
    constructor(localforageInstance) {
        this.localforageInstance = localforageInstance;
        this._onStorageEventBinded = this._onStorageEvent.bind(this);
    }
    setup() {
        if (!isSupported || inited) {
            return;
        }
        window.addEventListener('storage', this._onStorageEventBinded, false);
        inited = true;
    }
    destroy() {
        this.localforageInstance = null;
        if (inited) {
            window.removeEventListener('storage', this._onStorageEventBinded, false);
            inited = false;
        }
    }
    _onStorageEvent(e) {
        if (!this.localforageInstance ||
            e.key !== sysKeyPrefix ||
            !e.newValue) {
            return;
        }
        try {
            const payload = JSON.parse(e.newValue);
            if (!payload) {
                return;
            }
            const dbInfo = this.localforageInstance._dbInfo;
            if (dbInfo.name !== payload.name ||
                dbInfo.storeName !== payload.storeName) {
                return;
            }
            return this.localforageInstance
                .ready()
                .then(() => {
                const changeArgs = {
                    key: payload.key,
                    methodName: payload.methodName,
                    oldValue: null,
                    newValue: null,
                    success: payload.success,
                    fail: payload.fail,
                    error: payload.error,
                    valueChange: payload.valueChange,
                    crossTabNotification: 'StorageEvent',
                    originalEvent: e,
                };
                if (payload.methodName === 'setItem' && payload.success) {
                    return this.localforageInstance.getItem(payload.key).then((newValue) => {
                        changeArgs.newValue = newValue;
                        return changeArgs;
                    });
                }
                return changeArgs;
            })
                .then((changeArgs) => {
                if (changeArgs.valueChange) {
                    processObserverList(this.localforageInstance._observables
                        .changeDetection, changeArgs);
                }
                processObserverList(this.localforageInstance._observables.callDetection, changeArgs);
            });
        }
        catch (ex) {
            return Promise.reject(ex);
        }
    }
    publish(changeArgs) {
        if (!isSupported || !db) {
            return;
        }
        const dbInfo = this.localforageInstance._dbInfo;
        let errorString;
        try {
            if (changeArgs.error) {
                errorString = JSON.stringify(changeArgs.error);
            }
        }
        catch (ex) {
        }
        const payload = {
            name: dbInfo.name,
            storeName: dbInfo.storeName,
            key: changeArgs.key,
            methodName: changeArgs.methodName,
            valueChange: changeArgs.valueChange,
            success: changeArgs.success,
            fail: changeArgs.fail,
            error: errorString,
            ticks: +new Date(),
        };
        const value = JSON.stringify(payload);
        db.setItem(sysKeyPrefix, value);
    }
}

function isDate(value) {
    return toString.call(value) === '[object Date]';
}
function isFunction(value) {
    return typeof value === 'function';
}
const isArray = (function () {
    if (!isFunction(Array.isArray)) {
        return function (value) {
            return toString.call(value) === '[object Array]';
        };
    }
    return Array.isArray;
})();
function isRegExp(value) {
    return toString.call(value) === '[object RegExp]';
}
function equals(o1, o2) {
    if (o1 === o2)
        return true;
    if (o1 === null || o2 === null)
        return false;
    if (o1 !== o1 && o2 !== o2)
        return true;
    var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
    if (t1 == t2) {
        if (t1 == 'object') {
            if (isArray(o1)) {
                if (!isArray(o2))
                    return false;
                if ((length = o1.length) == o2.length) {
                    for (key = 0; key < length; key++) {
                        if (!equals(o1[key], o2[key]))
                            return false;
                    }
                    return true;
                }
            }
            else if (isDate(o1)) {
                if (!isDate(o2))
                    return false;
                return ((isNaN(o1.getTime()) && isNaN(o2.getTime())) ||
                    o1.getTime() === o2.getTime());
            }
            else if (isRegExp(o1) && isRegExp(o2)) {
                return o1.toString() == o2.toString();
            }
            else {
                if (isArray(o2))
                    return false;
                keySet = {};
                for (key in o1) {
                    if (key.charAt(0) === '$' || isFunction(o1[key]))
                        continue;
                    if (!equals(o1[key], o2[key]))
                        return false;
                    keySet[key] = true;
                }
                for (key in o2) {
                    if (!keySet.hasOwnProperty(key) &&
                        key.charAt(0) !== '$' &&
                        o2[key] !== undefined &&
                        !isFunction(o2[key]))
                        return false;
                }
                return true;
            }
        }
    }
    return false;
}

function handleMethodCall(localforageInstance, methodName, args) {
    return localforageInstance.ready().then(function () {
        const changeArgs = {
            key: args[0],
            methodName,
            oldValue: null,
            newValue: null,
        };
        if (methodName === 'setItem' && args[1] !== undefined) {
            changeArgs.newValue = args[1];
        }
        const detectChanges = (methodName === 'setItem' || methodName === 'removeItem') &&
            (!!localforageInstance._observables.changeDetection.length ||
                !!localforageInstance._observables.crossTabChangeDetection);
        const getOldValuePromise = detectChanges
            ? localforageInstance.getItem(changeArgs.key).then(function (value) {
                changeArgs.oldValue = value;
            })
            : Promise.resolve();
        const promise = getOldValuePromise.then(function () {
            return localforageInstance._baseMethods[methodName].apply(localforageInstance, args);
        });
        promise
            .then(function () {
            changeArgs.success = true;
        })
            .catch(function (error) {
            changeArgs.fail = true;
            changeArgs.error = error;
        })
            .then(function () {
            changeArgs.valueChange =
                detectChanges &&
                    !equals(changeArgs.oldValue, changeArgs.newValue);
            if (changeArgs.valueChange) {
                processObserverList(localforageInstance._observables.changeDetection, changeArgs);
            }
            processObserverList(localforageInstance._observables.callDetection, changeArgs);
        })
            .then(function () {
            if (localforageInstance._observables.crossTabObserver) {
                localforageInstance._observables.crossTabObserver.publish(changeArgs);
            }
        });
        return promise;
    });
}
function wireUpMethods(localforageInstance) {
    function wireUpMethod(localforageInstance, methodName) {
        localforageInstance._baseMethods =
            localforageInstance._baseMethods || {};
        localforageInstance._baseMethods[methodName] =
            localforageInstance[methodName];
        localforageInstance[methodName] = function () {
            return handleMethodCall(this, methodName, arguments);
        };
    }
    for (const methodName of ObservableLibraryMethods) {
        wireUpMethod(localforageInstance, methodName);
    }
}
function setup(lfInstance) {
    const localforageInstance = lfInstance;
    if (!localforageInstance._observables) {
        localforageInstance._observables = {
            callDetection: [],
            changeDetection: [],
        };
        wireUpMethods(localforageInstance);
    }
    if (!localforageInstance._observables.crossTabObserver) {
        localforageInstance._observables.crossTabObserver = new StorageEventObserver(localforageInstance);
    }
    return localforageInstance;
}
function configObservables(options) {
    const localforageInstance = setup(this);
    if (!options) {
        return;
    }
    const obs = localforageInstance._observables;
    if (options.crossTabNotification) {
        if (!obs.crossTabObserver) {
            obs.crossTabObserver = new StorageEventObserver(localforageInstance);
        }
        obs.crossTabObserver.setup();
    }
    else {
        if (obs.crossTabObserver) {
            obs.crossTabObserver.destroy();
            obs.crossTabObserver = undefined;
        }
    }
    obs.crossTabChangeDetection = options.crossTabChangeDetection;
}
const newObservable = function (options) {
    const localforageInstance = setup(this);
    const localforageObservablesList = options && options.changeDetection === false
        ? localforageInstance._observables.callDetection
        : localforageInstance._observables.changeDetection;
    const observable = newObservable.factory(function (observer) {
        const observableWrapper = new LocalForageObservableWrapper(options, observer);
        localforageObservablesList.push(observableWrapper);
        return function unsubscribeFn() {
            const index = localforageObservablesList.indexOf(observableWrapper);
            if (index >= 0) {
                return localforageObservablesList.splice(index, 1);
            }
        };
    });
    return observable;
};
newObservable.factory = function (subscribeFn) {
    return new Observable(subscribeFn);
};
function getItemObservable(key, options) {
    const localforageInstance = this;
    options = options || {};
    options.key = key;
    const observable = newObservable.factory(function (observer) {
        const getItemSettled = localforageInstance
            .getItem(key)
            .then(value => {
            observer.next(value);
        })
            .catch(errorValue => observer.error(errorValue));
        const changeObservable = localforageInstance.newObservable(options);
        const changeObservableSubscription = changeObservable.subscribe({
            next(changeObject) {
                getItemSettled.then(function () {
                    observer.next(changeObject.newValue);
                });
            },
            error(errorValue) {
                getItemSettled.then(function () {
                    observer.error(errorValue);
                });
            },
            complete: () => {
                getItemSettled.then(function () {
                    observer.complete();
                });
            },
        });
        return function () {
            changeObservableSubscription.unsubscribe();
        };
    });
    return observable;
}
let localforageObservable = newObservable;
function extendPrototype(localforage$$1) {
    try {
        const localforagePrototype = Object.getPrototypeOf(localforage$$1);
        if (localforagePrototype) {
            localforagePrototype.newObservable = newObservable;
            localforagePrototype.getItemObservable = getItemObservable;
            localforagePrototype.configObservables = configObservables;
            return localforage$$1;
        }
    }
    catch (e) {
    }
    return false;
}
let extendPrototypeResult = !!extendPrototype(localforage);

export { newObservable, getItemObservable, localforageObservable, extendPrototype, extendPrototypeResult };

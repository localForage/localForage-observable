import window from 'window';
import localforage from 'localforage';
import { processObserverList } from './facades';

var isSupported = typeof window !== 'undefined' &&
                  window.addEventListener &&
                  typeof JSON !== 'undefined' &&
                  JSON.stringify &&
                  JSON.parse &&
                  localforage.supports(localforage.LOCALSTORAGE);

var sysKeyPrefix = [
    '_localforage_sys',
    '_localforage_observable_sys'
].join('/');

var db = isSupported ? window.localStorage : null;
var inited = false;

export default class StorageEventObserver {

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
        if (e.key !== sysKeyPrefix) {
            return;
        }
        try {
            var payload = JSON.parse(e.newValue);
            if (!payload) {
                return;
            }

            var dbInfo = this.localforageInstance._dbInfo;
            if (dbInfo.name !== payload.name ||
                dbInfo.storeName !== payload.storeName) {
                return;
            }

            return this.localforageInstance.ready().then(() => {
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
                    return this.localforageInstance.getItem(payload.key).then(newValue => {
                        changeArgs.newValue = newValue;
                        return changeArgs;
                    });
                }
                return changeArgs;
            }).then(changeArgs => {
                // we currently do not support dirty checking on cross tab observers
                if (changeArgs.valueChange) {
                    processObserverList(
                        this.localforageInstance._observables.changeDetection,
                        changeArgs);
                }
                processObserverList(
                    this.localforageInstance._observables.callDetection,
                    changeArgs);
            });
        } catch (ex) {
            return Promise.reject(ex);
        }
    }

    publish(changeArgs) {
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
}


// {
//     target: Window → index.html,
//     isTrusted: true,
//     key: "_localforage_sys/_localforage_observable_sys",
//     oldValue: {
//         name: localforage,
//         storeName: keyvaluepairs,
//         key: notObservedKey,
//         methodName: setItem,
//         ticks: 1486492946207
//     },
//     newValue: {
//         name: localforage,
//         storeName: keyvaluepairs,
//         methodName: clear,
//         ticks: 1486492946213
//     },
//     url: "file:///home/teo/Drive/Dev/localForage-extensions/localForage-observable/examples/index.html",
//     storageArea: Storage,
//     currentTarget: Window → index.html,
//     eventPhase: 2,
//     bubbles: false,
//     cancelable: false
// }

// {
//     target: Window → index.html,
//     isTrusted: true,
//     key: "x",
//     oldValue: "1486402032655",
//     newValue: "1486402081880",
//     url: "....html",
//     storageArea: Storage,
//     eventPhase: 0,
//     bubbles: false,
//     cancelable: false,
//     defaultPrevented: false
// }

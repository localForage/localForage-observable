/* global window:true */
import localforage from 'localforage';
import { processObserverList } from './facades';
import { LocalForageWithObservablePrivateProps } from './LocalForageWithObservablePrivateProps';

interface StorageEventPayload {
    name: string;
    storeName: string;
    key: string;
    methodName: string;
    valueChange: boolean;
    success: boolean;
    fail: boolean;
    error: string;
    ticks: number;
}

const isSupported =
    typeof window !== 'undefined' &&
    typeof window.addEventListener === 'function' &&
    typeof window.removeEventListener === 'function' &&
    typeof JSON !== 'undefined' &&
    JSON.stringify &&
    JSON.parse &&
    localforage.supports(localforage.LOCALSTORAGE);

const sysKeyPrefix = ['_localforage_sys', '_localforage_observable_sys'].join(
    '/',
);

const db = isSupported ? window.localStorage : null;
let inited = false;

export default class StorageEventObserver {
    private localforageInstance: LocalForageWithObservablePrivateProps | null;

    constructor(localforageInstance: LocalForageWithObservableMethods) {
        this.localforageInstance = localforageInstance as LocalForageWithObservablePrivateProps;
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
            window.removeEventListener(
                'storage',
                this._onStorageEventBinded,
                false,
            );
            inited = false;
        }
    }

    _onStorageEventBinded: (e: StorageEvent) => Promise<void>;

    _onStorageEvent(e: StorageEvent) {
        if (
            !this.localforageInstance ||
            e.key !== sysKeyPrefix ||
            !e.newValue
        ) {
            return;
        }
        try {
            const payload = JSON.parse(
                e.newValue,
            ) as LocalForageObservableChange & {
                name: string;
                storeName: string;
            };
            if (!payload) {
                return;
            }

            const dbInfo = this.localforageInstance._dbInfo;
            if (
                dbInfo.name !== payload.name ||
                dbInfo.storeName !== payload.storeName
            ) {
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
                    } as LocalForageObservableChange;

                    if (payload.methodName === 'setItem' && payload.success) {
                        return this.localforageInstance!.getItem(
                            payload.key,
                        ).then((newValue: any) => {
                            changeArgs.newValue = newValue;
                            return changeArgs;
                        });
                    }
                    return changeArgs;
                })
                .then((changeArgs: LocalForageObservableChange) => {
                    // this will run only in case the crossTabChangeDetection
                    // is enaled on the other page or there is at least one
                    // changeDetection Observable
                    if (changeArgs.valueChange) {
                        processObserverList(
                            this.localforageInstance!._observables
                                .changeDetection,
                            changeArgs,
                        );
                    }
                    processObserverList(
                        this.localforageInstance!._observables.callDetection,
                        changeArgs,
                    );
                });
        } catch (ex) {
            return Promise.reject(ex);
        }
    }

    publish(changeArgs: LocalForageObservableChange) {
        if (!isSupported || !db) {
            return;
        }

        const dbInfo = this.localforageInstance!._dbInfo;

        let errorString;
        try {
            if (changeArgs.error) {
                errorString = JSON.stringify(changeArgs.error);
            }
        } catch (ex) {
            // empty
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
        } as StorageEventPayload;

        const value = JSON.stringify(payload);

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
//     url: "....html",
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

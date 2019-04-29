import localforage from 'localforage';
import { processObserverList, setOldValues } from './facades';
import { LocalForageObservableChangeWithPrivateProps } from './LocalForageObservableChangeWithPrivateProps';
import { LocalForageObservableWrapper } from './LocalForageObservableWrapper';
import { LocalForageWithObservablePrivateProps } from './LocalForageWithObservablePrivateProps';
import { ObservableLibraryMethods } from './ObservableLibraryMethods';
import CrossTabObserver from './StorageEventObserver';
import { equals as isEqual } from './utils';

function handleMethodCall(
    localforageInstance: LocalForageWithObservablePrivateProps,
    methodName: keyof LocalForageObservableMethodOptions,
    args: IArguments,
) {
    return localforageInstance.ready().then(function() {
        // if change detection is enabled to at least one active observable
        // and an applicable method is called then we should retrieve the old value
        const detectChanges =
            ObservableLibraryMethods.indexOf(methodName) >= 0 &&
            (!!localforageInstance._observables.changeDetection.length ||
                !!localforageInstance._observables.crossTabChangeDetection);

        const key = args[0];
        const newValue =
            methodName === 'setItem' && args[1] !== undefined ? args[1] : null;

        const changeArgs: LocalForageObservableChangeWithPrivateProps = {
            key,
            methodName,
            oldValue: null,
            newValue,
        };

        const promise = setOldValues(
            localforageInstance,
            detectChanges,
            changeArgs,
        ).then(function() {
            return localforageInstance._baseMethods[methodName].apply(
                localforageInstance,
                args,
            );
        });

        // don't return this promise so that the observers
        // get notified after the method invoker
        promise
            .then(function() {
                changeArgs.success = true;
            })
            .catch(function(error: Error) {
                changeArgs.fail = true;
                changeArgs.error = error;
            })
            .then(function() {
                changeArgs.valueChange =
                    detectChanges &&
                    (!isEqual(changeArgs.oldValue, changeArgs.newValue) ||
                        !!changeArgs._affectedItemsByKey);
                if (changeArgs.valueChange) {
                    processObserverList(
                        localforageInstance._observables.changeDetection,
                        changeArgs,
                    );
                }
                processObserverList(
                    localforageInstance._observables.callDetection,
                    changeArgs,
                );

                const { crossTabObserver } = localforageInstance._observables;
                if (crossTabObserver) {
                    crossTabObserver.publish(changeArgs);
                }
            });

        return promise;
    });
}

function wireUpMethods(
    localforageInstance: LocalForageWithObservablePrivateProps,
) {
    function wireUpMethod(
        localforageInstance: LocalForageWithObservablePrivateProps,
        methodName: keyof LocalForageObservableMethodOptions,
    ) {
        localforageInstance._baseMethods =
            localforageInstance._baseMethods || {};
        localforageInstance._baseMethods[methodName] =
            localforageInstance[methodName];
        localforageInstance[methodName] = function() {
            return handleMethodCall(this, methodName, arguments);
        };
    }

    for (const methodName of ObservableLibraryMethods) {
        wireUpMethod(localforageInstance, methodName);
    }
}

function setup(lfInstance: LocalForage) {
    const localforageInstance = lfInstance as LocalForageWithObservablePrivateProps;
    if (!localforageInstance._observables) {
        localforageInstance._observables = {
            callDetection: [],
            changeDetection: [],
        };

        wireUpMethods(localforageInstance);
    }
    if (!localforageInstance._observables.crossTabObserver) {
        localforageInstance._observables.crossTabObserver = new CrossTabObserver(
            localforageInstance,
        );
    }
    return localforageInstance;
}

function configObservables(
    this: LocalForage,
    options: LocalForageObservableOptions,
) {
    const localforageInstance = setup(this);

    if (!options) {
        return;
    }

    const obs = localforageInstance._observables;
    if (options.crossTabNotification) {
        if (!obs.crossTabObserver) {
            obs.crossTabObserver = new CrossTabObserver(localforageInstance);
        }
        obs.crossTabObserver.setup();
    } else {
        if (obs.crossTabObserver) {
            obs.crossTabObserver.destroy();
            obs.crossTabObserver = undefined;
        }
    }

    obs.crossTabChangeDetection = options.crossTabChangeDetection;
}

export const newObservable: LocalForageNewObservableFunc = function(
    this: LocalForage,
    options: LocalForageObservableOptions,
) {
    const localforageInstance = setup(this);

    const localforageObservablesList =
        options && options.changeDetection === false
            ? localforageInstance._observables.callDetection
            : localforageInstance._observables.changeDetection;

    const observable = newObservable.factory(function(observer) {
        const observableWrapper = new LocalForageObservableWrapper(
            options,
            observer,
        );
        localforageObservablesList.push(observableWrapper);

        return function unsubscribeFn() {
            const index = localforageObservablesList.indexOf(observableWrapper);
            if (index >= 0) {
                return localforageObservablesList.splice(index, 1);
            }
        };
    });

    return observable;
} as LocalForageNewObservableFunc;

// In case the user want to override the used Observables
// eg: with RxJS or ES-Observable
newObservable.factory = function<T>(subscribeFn: SubscriberFunction<T>) {
    return new Observable<T>(subscribeFn);
};

export function getItemObservable(
    this: LocalForageWithObservablePrivateProps,
    key: string,
    options: LocalForageObservableOptions,
) {
    const localforageInstance = this;

    options = options || {};
    options.key = key;

    const observable = newObservable.factory(function(observer) {
        const getItemSettled = localforageInstance
            .getItem(key)
            .then(value => {
                observer.next(value);
            })
            .catch(errorValue => observer.error(errorValue));

        const changeObservable = localforageInstance.newObservable(options);
        const changeObservableSubscription = changeObservable.subscribe({
            next(changeObject) {
                getItemSettled.then(function() {
                    observer.next(changeObject.newValue);
                });
            },
            error(errorValue) {
                getItemSettled.then(function() {
                    observer.error(errorValue);
                });
            },
            complete: () => {
                getItemSettled.then(function() {
                    observer.complete();
                });
            },
        });

        return function() {
            changeObservableSubscription.unsubscribe();
        };
    });

    return observable;
}

// to avoid breaking changes
export let localforageObservable = newObservable;

export function extendPrototype(localforage: LocalForage) {
    try {
        const localforagePrototype = Object.getPrototypeOf(localforage);
        if (localforagePrototype) {
            localforagePrototype.newObservable = newObservable;
            localforagePrototype.getItemObservable = getItemObservable;
            localforagePrototype.configObservables = configObservables;
            return localforage as LocalForageWithObservableMethods;
        }
    } catch (e) {
        /* */
    }
    return false;
}

export let extendPrototypeResult = !!extendPrototype(localforage);

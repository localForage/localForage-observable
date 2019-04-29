import { AffectedItemChange } from './AffectedItemChange';
import { LocalForageObservableChangeWithPrivateProps } from './LocalForageObservableChangeWithPrivateProps';
import { LocalForageObservableWrapper } from './LocalForageObservableWrapper';
import { LocalForageWithObservablePrivateProps } from './LocalForageWithObservablePrivateProps';
import { equals as isEqual } from './utils';

export function processObserverList(
    list: LocalForageObservableWrapper[],
    changeArgs: LocalForageObservableChangeWithPrivateProps,
) {
    for (const observableWrapper of list) {
        const itemOptions = observableWrapper.options;
        if (
            !itemOptions ||
            (observableWrapper.shouldNotifyAboutAffectedKey(changeArgs) &&
                observableWrapper.shouldNotifyAboutMethodCall(
                    changeArgs.methodName,
                ) &&
                // do not publish cross tab evets when the observable
                // doesn't explicitelly require it,
                // to avoid messing troubles in existing implementations.
                (!changeArgs.crossTabNotification ||
                    itemOptions.crossTabNotification))
        ) {
            observableWrapper.publish(changeArgs);
        }
    }
}

const getChangeArgsForKey = (
    localforageInstance: LocalForageWithObservablePrivateProps,
    methodName: keyof LocalForageObservableMethodOptions,
    key: string,
    newValue: any,
) => {
    return localforageInstance.getItem(key).then(oldValue => {
        return {
            key,
            methodName,
            oldValue,
            newValue,
        } as LocalForageObservableChange;
    });
};

const getChangeArgsForKeys = (
    localforageInstance: LocalForageWithObservablePrivateProps,
    methodName: keyof LocalForageObservableMethodOptions,
    keys: string[],
    newValue: any,
) => {
    return Promise.all(
        keys.map(key =>
            getChangeArgsForKey(localforageInstance, methodName, key, newValue),
        ),
    );
};

export const setOldValues = (
    localforageInstance: LocalForageWithObservablePrivateProps,
    detectChanges: boolean,
    changeArgs: LocalForageObservableChangeWithPrivateProps,
): Promise<void> => {
    if (!detectChanges) {
        return Promise.resolve();
    }
    if (changeArgs.methodName === 'clear') {
        const {
            observedKeys,
            allKeysObservers,
        } = localforageInstance._observables.changeDetection.reduce(
            (acc, o) => {
                if (!o.shouldNotifyAboutMethodCall('clear')) {
                    return acc;
                }

                const observesKey = o.options && o.options.key;
                if (!observesKey) {
                    acc.allKeysObservers.push(o);
                } else if (acc.observedKeys.indexOf(observesKey) < 0) {
                    acc.keyObservers.push(o);
                    acc.observedKeys.push(observesKey);
                }
                return acc;
            },
            {
                observedKeys: [] as string[],
                keyObservers: [] as LocalForageObservableWrapper[],
                allKeysObservers: [] as LocalForageObservableWrapper[],
            },
        );

        const keysPromise = allKeysObservers.length
            ? localforageInstance.keys()
            : Promise.resolve(observedKeys);

        return keysPromise
            .then(keys => {
                const affectedItems: AffectedItemChange[] = keys.map(key => {
                    return {
                        oldValue: changeArgs.oldValue,
                        newValue: changeArgs.newValue,
                        key,
                    };
                });

                let affectedItemsByKey:
                    | { [key: string]: AffectedItemChange }
                    | undefined;

                return Promise.all(
                    affectedItems.map(affectedItem => {
                        return localforageInstance
                            .getItem(affectedItem.key)
                            .then(value => {
                                affectedItem.oldValue = value;
                                const valueChange = !isEqual(
                                    affectedItem.oldValue,
                                    affectedItem.newValue,
                                );

                                if (valueChange) {
                                    affectedItemsByKey =
                                        affectedItemsByKey || {};
                                    affectedItemsByKey[
                                        affectedItem.key
                                    ] = affectedItem;
                                }
                            });
                    }),
                ).then(result => {
                    changeArgs._affectedItemsByKey = affectedItemsByKey;
                });
            })
            .then(() => undefined);
    }
    return localforageInstance.getItem(changeArgs.key).then(function(value) {
        changeArgs.oldValue = value;
        // don't return anything
    });
};

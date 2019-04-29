import { LocalForageObservableChangeWithPrivateProps } from './LocalForageObservableChangeWithPrivateProps';
import { ObservableLibraryMethods } from './ObservableLibraryMethods';

export class LocalForageObservableWrapper {
    constructor(
        public options: LocalForageObservableOptions,
        private subscriptionObserver: Observer<LocalForageObservableChange>,
    ) {}

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

    shouldNotifyAboutMethodCall(
        methodName: keyof LocalForageObservableMethodOptions,
    ) {
        return (
            !this.options ||
            !!this.options[methodName] ||
            // if it doesn't have any specific method set
            // it applies to all of them
            !this.hasMethodFilterOptions()
        );
    }

    shouldNotifyAboutKey(key: string) {
        return !this.options || !this.options.key || this.options.key === key;
    }

    shouldNotifyAboutAffectedKey(
        changeArgs: LocalForageObservableChangeWithPrivateProps,
    ) {
        if (!this.options || !this.options.key) {
            return true;
        }

        if (this.options.key === changeArgs.key) {
            return true;
        }

        // if it affects all keys
        if (changeArgs.methodName === 'clear') {
            if (!this.options.changeDetection) {
                return true;
            }

            if (changeArgs._affectedItemsByKey) {
                const affectedItem =
                    changeArgs._affectedItemsByKey[this.options.key];
                if (affectedItem && this.options.key === affectedItem.key) {
                    return true;
                }
            }
        }

        return false;
    }

    publish(publishObject: LocalForageObservableChange) {
        if (
            publishObject.success &&
            typeof this.subscriptionObserver.next === 'function'
        ) {
            try {
                this.subscriptionObserver.next(publishObject);
            } catch (e) {
                /* */
            }
            return;
        }

        if (
            publishObject.fail &&
            typeof this.subscriptionObserver.error === 'function'
        ) {
            try {
                this.subscriptionObserver.error(publishObject);
            } catch (e) {
                /* */
            }
            return;
        }
    }
}

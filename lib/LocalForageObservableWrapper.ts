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
        } else if (
            publishObject.fail &&
            typeof this.subscriptionObserver.error === 'function'
        ) {
            try {
                this.subscriptionObserver.error(publishObject);
            } catch (e) {
                /* */
            }
        }
    }
}

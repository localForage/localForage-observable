import { ObservableLibraryMethods } from './ObservableLibraryMethods';

export class LocalForageObservableWrapper {
    constructor (options, subscriptionObserver) {
        this.options = options;
        this.subscriptionObserver = subscriptionObserver;
    }

    hasMethodFilterOptions () {
        if (this.options) {
            for (var i = 0, methodName; (methodName = ObservableLibraryMethods[i]); i++) {
                if (this.options[methodName]) {
                    return true;
                }
            }
        }
        return false;
    }

    publish (publishObject) {
        if (publishObject.success && typeof this.subscriptionObserver.next === 'function') {
            try {
                this.subscriptionObserver.next(publishObject);
            } catch (e) { /* */ }
        } else if (publishObject.fail && typeof this.subscriptionObserver.error === 'function') {
            try {
                this.subscriptionObserver.error(publishObject);
            } catch (e) { /* */ }
        }
    }
}

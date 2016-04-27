/// <reference path="LocalForageObservable.d.ts" />
/// <reference path="Observable.d.ts" />

interface LocalForageObservableWrapper {
    constructor(options: LocalForageObservableOptions, subscriptionObserver: SubscriptionObserver);
    hasMethodFilterOptions(): boolean;
    publish(publishObject: LocalForageObservableChange): void;
}

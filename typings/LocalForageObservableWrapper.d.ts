/// <reference path="LocalForageObservableChange.d.ts" />
/// <reference path="LocalForageObservableOptions.d.ts" />
/// <reference path="Observable.d.ts" />

interface LocalForageObservableWrapper {
    constructor(options: LocalForageObservableOptions, subscriptionObserver: SubscriptionObserver<any>);
    hasMethodFilterOptions(): boolean;
    publish(publishObject: LocalForageObservableChange): void;
}

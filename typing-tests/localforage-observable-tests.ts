/// <reference types="localforage" />
/// <reference path="../typings/localforage-observable.d.ts" />
/// <reference path="../typings/Observable.d.ts" />

import { extendPrototype } from 'localforage-observable';

declare let localforage: LocalForage;

declare let RxObservable: {
    create<T>(subscribeFn: SubscriberFunction<T>): Observable<T>;
};

namespace LocalForageObservableTest {
    {
        let localforage2: LocalForageWithObservableMethods = extendPrototype(
            localforage,
        );
    }

    {
        let observable: Observable<
            LocalForageObservableChange
        > = localforage.newObservable();

        let subscription: Subscription = observable.subscribe({
            next: (value: LocalForageObservableChange) => {},
            error: (err: any) => {},
            complete: () => {},
        });
        subscription.unsubscribe();
    }

    {
        let newObservableOptions: LocalForageObservableOptions = {
            key: 'UserProfile',
        };

        let useProfileObservable: Observable<
            LocalForageObservableChange
        > = localforage.newObservable(newObservableOptions);
    }

    {
        let methodCallObservable: Observable<
            LocalForageObservableChange
        > = localforage.newObservable({
            setItem: true,
            changeDetection: false,
        });
    }

    {
        localforage.configObservables({
            crossTabNotification: true,
            crossTabChangeDetection: true,
        });

        let observable: Observable<
            LocalForageObservableChange
        > = localforage.newObservable({
            crossTabNotification: true,
        });
    }

    {
        let observable: Observable<string> = localforage.getItemObservable<
            string
        >('test');

        let subscription: Subscription = observable.subscribe({
            next: (value: string) => {},
            error: (err: any) => {},
            complete: () => {},
        });
        subscription.unsubscribe();
    }

    {
        localforage.newObservable.factory = function<T>(
            subscribeFn: SubscriberFunction<T>,
        ) {
            return RxObservable.create(subscribeFn);
        };
    }
}

/// <reference types="localforage" />
/// <reference path="../typings/localforage-observable.d.ts" />
/// <reference path="../typings/Observable.d.ts" />

import { extendPrototype } from 'localforage-observable';

declare let localForageInstance: LocalForage;

declare let RxObservable: {
  create(subscribeFn: SubscriberFunction<LocalForageObservableChange>): Observable<LocalForageObservableChange>
};

namespace LocalForageObservableTest {

    let localforage: LocalForageWithObservableMethods = extendPrototype(localForageInstance);

    {
        let observable: Observable<LocalForageObservableChange> = localforage.newObservable();

        let subscription: Subscription = observable.subscribe({
          next: (value: LocalForageObservableChange) => { },
          error: (err: any) => { },
          complete: () => { }
        });
        subscription.unsubscribe();
    }

    {
        let newObservableOptions: LocalForageObservableOptions = {
          key: 'UserProfile'
        };

        let useProfileObservable: Observable<LocalForageObservableChange> = localforage.newObservable(newObservableOptions);
    }

    {
        let methodCallObservable: Observable<LocalForageObservableChange> = localforage.newObservable({
          setItem: true,
          changeDetection: false
        });
    }

    {
        localforage.configObservables({
          crossTabNotification: true,
          crossTabChangeDetection: true
        });

        let observable: Observable<LocalForageObservableChange> = localforage.newObservable({
          crossTabNotification: true
        });
    }

    {
        localforage.newObservable.factory = function (subscribeFn: SubscriberFunction<LocalForageObservableChange>) {
            return RxObservable.create(subscribeFn);
        };
    }
}

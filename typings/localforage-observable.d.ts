/// <reference types="localforage" />
/// <reference path="LocalForageObservableChange.d.ts" />
/// <reference path="LocalForageObservableOptions.d.ts" />
/// <reference path="Observable.d.ts" />

interface LocalForageNewObservableFunc {
    (options?: LocalForageObservableOptions): Observable<LocalForageObservableChange>;

    factory(subscribeFn: SubscriberFunction<LocalForageObservableChange>): void;
}

interface ILocalForageWithObservableMethods {
    newObservable: LocalForageNewObservableFunc;

    getItemObservable<T>(key: String, options?: LocalForageObservableOptions): Observable<T>;

    configObservables(options: LocalForageObservableOptions): void;
}

interface LocalForage extends ILocalForageWithObservableMethods { }

interface LocalForageWithObservableMethods extends LocalForage { }

declare module "localforage-observable" {
    export function localforageWithObservableMethods(options: LocalForageObservableOptions)
        : Observable<LocalForageObservableChange>;

    export function extendPrototype(localforage: LocalForage)
        : LocalForageWithObservableMethods;

    export var extendPrototypeResult: boolean;
}

/// <reference types="localforage" />
/// <reference path="LocalForageObservableChange.d.ts" />
/// <reference path="LocalForageObservableOptions.d.ts" />
/// <reference path="Observable.d.ts" />

interface LocalForageNewObservableFunc {
    (
        this: LocalForageWithObservableMethods,
        options?: LocalForageObservableOptions,
    ): Observable<LocalForageObservableChange>;

    factory<T>(subscribeFn: SubscriberFunction<T>): Observable<T>;
}

interface ILocalForageWithObservableMethods {
    newObservable: LocalForageNewObservableFunc;

    getItemObservable<T>(
        key: string,
        options?: LocalForageObservableOptions,
    ): Observable<T>;

    configObservables(options: LocalForageObservableOptions): void;
}

interface LocalForage extends ILocalForageWithObservableMethods {}

interface LocalForageWithObservableMethods extends LocalForage {}

declare module 'localforage-observable' {
    export function localforageWithObservableMethods(
        options: LocalForageObservableOptions,
    ): Observable<LocalForageObservableChange>;

    export function extendPrototype(
        localforage: LocalForage,
    ): LocalForageWithObservableMethods;

    export const extendPrototypeResult: boolean;
}

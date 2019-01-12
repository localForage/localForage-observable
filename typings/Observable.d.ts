declare class Observable<T> {
    constructor(subscriber: SubscriberFunction<T>);

    // Subscribes to the sequence
    subscribe(observer: Observer<T>): Subscription;

    // // Subscribes to the sequence with a callback, returning a promise
    // forEach(onNext: any => any): Promise;

    // // Returns itself
    // [Symbol.observable](): Observable;

    // // Converts items to an Observable
    // static of(...items): Observable;

    // // Converts an observable or iterable to an Observable
    // static from(observable): Observable;

    // // Subclassing support
    // static get [Symbol.species](): Constructor;
}

interface Subscription {
    // Cancels the subscription
    unsubscribe(): void;
}

declare function SubscriberFunctionResultFn(): void;

// function SubscriberFunction(observer: SubscriptionObserver): (void => void)|Subscription;
interface SubscriberFunction<T> {
    (observer: SubscriptionObserver<T>): { (): void } | Subscription;
}

interface Observer<T> {
    // Receives the next value in the sequence
    next?: (value: T) => void;

    // Receives the sequence error
    error?: (errorValue?: any) => void;

    // Receives the sequence completion value
    complete?: () => void;
}

interface SubscriptionObserver<T> {
    // Sends the next value in the sequence
    next(value: T): void;

    // Sends the sequence error
    error(errorValue: any): void;

    // Sends the sequence completion value
    complete(): void;
}

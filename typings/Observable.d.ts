interface Observable {

    constructor(subscriber : SubscriberFunction);

    // Subscribes to the sequence
    subscribe(observer : Observer) : Subscription;

    // // Subscribes to the sequence with a callback, returning a promise
    // forEach(onNext : any => any) : Promise;

    // // Returns itself
    // [Symbol.observable]() : Observable;

    // // Converts items to an Observable
    // static of(...items) : Observable;

    // // Converts an observable or iterable to an Observable
    // static from(observable) : Observable;

    // // Subclassing support
    // static get [Symbol.species]() : Constructor;

}

interface Subscription {

    // Cancels the subscription
    unsubscribe() : void;
}

declare function SubscriberFunctionResultFn() : void;

// function SubscriberFunction(observer: SubscriptionObserver): (void => void)|Subscription;
interface SubscriberFunction { (observer: SubscriptionObserver): { (): void } | Subscription }


interface Observer {

    // Receives the next value in the sequence
    next(value);

    // Receives the sequence error
    error(errorValue);

    // Receives the sequence completion value
    complete(completeValue);
}

interface SubscriptionObserver {

    // Sends the next value in the sequence
    next(value);

    // Sends the sequence error
    error(errorValue);

    // Sends the sequence completion value
    complete(completeValue);
}

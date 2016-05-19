# localForage-observable
[![npm](https://img.shields.io/npm/dm/localforage-observable.svg)](https://www.npmjs.com/package/localforage-observable)  
Adds observables to [localForage](https://github.com/mozilla/localForage), providing a way to get notified whenever:
* a method that affects the database is invoked
* the value associated with a specific key changes

## Requirements

* [localForage](https://github.com/mozilla/localForage) v1.4.0+
* [zen-observable](https://github.com/zenparsing/zen-observable) (used by default) or [RxJS 5](https://github.com/ReactiveX/RxJS)

## Usage
Currently localForage Observables should only be created after `localforage.ready()`, so that localForage completes the initialization of the requested (or best matching) driver. Moreover, Observables will stop working in case you change the driver in use, after their creation.

### Observe everything
```js
var observable = localforage.newObservable();
var subscription = observable.subscribe({
  next: function(args) {
    console.log('I observe everything', args);
  },
  error: function(err) {
    console.log('Found an error!', err);
  },
  complete: function() {
    console.log('Observable destroyed!');
  }
});
```

### Observe a specific key
```js
var observable = localforage.newObservable({
    key: 'testKey'
});
var subscription = observable.subscribe({
  next: function(args) {
    console.log('testKey has changed to:', args.newValue);
  }
});
```

### Observe specific method calls
```js
var observable = localforage.newObservable({
    // setItem: false,
    removeItem: true,
    clear: true
});
var subscription = observable.subscribe({
  next: function(args) {
    console.log(args.methodName + ' was called!');
  }
});
```

### Cancel an Observable Subscription
```
subscription.unsubscribe();
```

### Value change detection
Deep value change detection is enabled by default. This way our Observable Subscribers get notified only when the value of the associated key actually changes. Obviously, deep equality checking adds some extra overhead, so in case that all you need is to get notified on any attempt to change a value, you can easily disable value checking:
```js
var observable = localforage.newObservable({
    key: 'testKey',
    changeDetection: false
});
```

## Examples
* [Simple example](http://codepen.io/thgreasi/pen/pyXbRg)
* [Observing keys](http://codepen.io/thgreasi/pen/LNKZxQ)
* [Observing methods](http://codepen.io/thgreasi/pen/wGLWgL)
* [Simple RxJS 5 example](http://codepen.io/thgreasi/pen/wGLWmv)

## API
```typescript
interface LocalForageObservableOptions {
    key: string;
    setItem: boolean;
    removeItem: boolean;
    clear: boolean;
    changeDetection?: boolean; // default true
}

interface LocalForageObservableChange {
    key: string;
    methodName: string;
    oldValue: any;
    newValue: any;
    success?: boolean;
    fail?: boolean;
    error: any;
}
```

## Using a different Observable library
You can actually use any library compatible with the [ES Observable spec proposal](https://github.com/zenparsing/es-observable). For example, in order to make localForage-observable use the Observables fo the RxJS, all you have to do is change the provided Observable Factory method:
```js
localforage.newObservable.factory = function (subscribeFn) {
    return Rx.Observable.create(subscribeFn);
};
```

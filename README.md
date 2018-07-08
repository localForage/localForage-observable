# localForage-observable
[![Build Status](https://travis-ci.org/localForage/localForage-observable.svg?branch=master)](https://travis-ci.org/localForage/localForage-observable)
[![npm](https://img.shields.io/npm/dm/localforage-observable.svg)](https://www.npmjs.com/package/localforage-observable)  
Adds observables to [localForage](https://github.com/mozilla/localForage), providing a way to get notified whenever:
* a method that affects the database is invoked
* the value associated with a specific key changes

## Requirements

* [localForage](https://github.com/mozilla/localForage) v1.4.0+
* [zen-observable](https://github.com/zenparsing/zen-observable) (used by default) or [RxJS 5](https://github.com/ReactiveX/RxJS)

## Usage
Currently localForage Observables should only be created after `localforage.ready()`, so that localForage completes the initialization of the requested (or best matching) driver. Moreover, Observables will stop working in case you change the driver in use, after their creation.

### Observe for changes with `newObservable()`

Creates an observable and subscribes to DB changes.
With this method Subscribers get notified with a `LocalForageObservableChange` object.
This method can be invoked with a `LocalForageObservableOptions` object as optional argument.

#### Observe everything
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

#### Observe a specific key
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

#### Observe specific method calls
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

### Get a "live" Observable of a DB Item Value with `getItemObservable(key)`

Creates an observable for a specific key that returns the current DB value and every new saved value.
With this method Subscribers receive the initial and ongoing DB values for a specific key as it changes.
This method can be invoked with a `LocalForageObservableOptions` object as extra optional argument.

```js
var useProfileObservable = localforage.getItemObservable('UserProfile');
useProfileSubscription = useProfileObservable.subscribe({
  next: function(value) {
    setCurrentUserNameToPage(value.username);
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

## Cross-Tab Observables [#5](https://github.com/localForage/localForage-observable/issues/5)
Cross-tab event emission, observation and value change detection **are disabled by default**.

In order to enable it, you have to:  
1) call the `configObservables()` method to start emmiting cross-tab events:
```js
localforage.configObservables({
  crossTabNotification: true
});
```
2) create observables with cross-tab observation enabled:
```js
var observable = localforage.newObservable({
  crossTabNotification: true,
  changeDetection: false
});
```
The arguments passed to cross-tab observable callbacks,  will also have the `crossTabNotification` property set.

### Cross-tab change detection

Cross-tab observation with change detection is also supported, but with some limitations.
The arguments passed to the callback will have the `valueChange` property set to true but:
* the `oldValue` will **always** be `null` and 
* the `newValue` will hold the value retrieved from the *local* db at the time that the notification arrived.
In that case you can use:
```js
localforage.configObservables({
  crossTabNotification: true,
  crossTabChangeDetection: true
});
var observable = localforage.newObservable({
  crossTabNotification: true
});
```

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
    valueChange?: boolean;
    success?: boolean;
    fail?: boolean;
    error: any;
    crossTabNotification?: string;
}
```

## Using a different Observable library
You can actually use any library compatible with the [ES Observable spec proposal](https://github.com/zenparsing/es-observable). For example, in order to make localForage-observable use the Observables of the RxJS, all you have to do is change the provided Observable Factory method:
```js
localforage.newObservable.factory = function (subscribeFn) {
    return Rx.Observable.create(subscribeFn);
};
```

## TypeScript

First of all, [include `localforage` with an import statement appropriate for your configuration](https://github.com/localForage/localForage/blob/master/README.md#typescript) and import `localforage-observable` right after it.

Normally, `localforage-observable` will extend the prototype of `locaforage` to include `newObservable()` etc, but unfortunately the typings can't be updated. As a result you should use the exported `extendPrototype()` method, which returns the provided localforage instance but with inherited typings that also include the extra methods of `localforage-observable`.

```javascript
import localForage from "localforage";
// OR based on your configuration:
// import * as localForage from "localforage";

import { extendPrototype } from "localforage-observable";

var localforage = extendPrototype(localForage);
localforage.ready().then(() => {
  // TypeScript will find `newObservable()` after the casting that `extendPrototype()` does
  var observable = localforage.newObservable();
});

```


## Examples
* [Simple example](http://codepen.io/thgreasi/pen/pyXbRg)
* [Simple getItemObservable example](http://codepen.io/thgreasi/pen/dvmRoq)
* [Observing keys](http://codepen.io/thgreasi/pen/LNKZxQ)
* [Observing methods](http://codepen.io/thgreasi/pen/wGLWgL)
* [Simple RxJS 5 example](http://codepen.io/thgreasi/pen/wGLWmv)
* [Cross-tab Observables](http://codepen.io/thgreasi/pen/NdObOW)
* [Cross-tab Change Detection](http://codepen.io/thgreasi/pen/bgmBmb)
* [Exaple Ionic2/Angular2/Typescript project](https://github.com/thgreasi/localForage-cordovaSQLiteDriver-TestIonic2App)

import * as m from 'mochainon';

import * as localforage from 'localforage';
import '../../';

import { formatChangeArg } from './utils/formatChangeArg';
const { expect } = m.chai;

describe('Localforage', function() {
    it('should get ready', function() {
        return expect(localforage.ready()).to.eventually.be.fulfilled;
    });
});

describe('Localforage Observable API', function() {
    it('should add the newObservable() method to localforage', function() {
        expect(localforage.newObservable).to.be.a('function');
    });

    it('should be able to create a new observable', function() {
        expect(() => localforage.newObservable()).to.not.throw();
        expect(localforage.newObservable())
            .to.have.property('subscribe')
            .that.is.a('function');
    });
});

describe('Localforage Observable', function() {
    let subscription: Subscription;
    let observableLogs: string[];
    let errorCallCount: number;
    let completeCallCount: number;

    beforeEach(function() {
        observableLogs = [];
        errorCallCount = 0;
        completeCallCount = 0;
    });

    const runTestScenario = () =>
        localforage
            .setItem('test1', 'value1')
            .then(() => localforage.setItem('test2', 'value2'))
            .then(() => localforage.setItem('test2', 'value2b'))
            .then(() => localforage.setItem('test2', 'value2b'))
            .then(() => localforage.setItem('test3', 'value3'))
            .then(() => localforage.removeItem('test3'))
            .then(() => localforage.removeItem('test3'))
            .then(() => localforage.clear())
            .then(() => localforage.clear());

    describe('Given a simple observable & subscription w/ changeDetection', function() {
        beforeEach(function() {
            return localforage
                .ready()
                .then(() => localforage.clear())
                .then(() => {
                    const observable = localforage.newObservable();
                    subscription = observable.subscribe({
                        next: (change: LocalForageObservableChange) =>
                            observableLogs.push(formatChangeArg(change)),
                        error: err => {
                            errorCallCount++;
                            console.error('Found an error!', err);
                        },
                        complete: () => {
                            completeCallCount++;
                        },
                    });
                });
        });

        it('should observe properly', function() {
            return runTestScenario()
                .then(() => subscription.unsubscribe())
                .then(function() {
                    expect(observableLogs).to.deep.equal([
                        "setItem('test1', 'value1')",
                        "setItem('test2', 'value2')",
                        "setItem('test2', 'value2b')",
                        "setItem('test3', 'value3')",
                        "removeItem('test3') => null",
                        // TODO: fix me
                        // 'clear()',
                    ]);
                    expect(errorCallCount).to.equal(0);
                    expect(completeCallCount).to.equal(0);
                });
        });

        it('should stop observing after unsubscribing', function() {
            return runTestScenario()
                .then(() => subscription.unsubscribe())
                .then(() =>
                    localforage.setItem('notObservedKey', 'notObservedValue'),
                )
                .then(() => localforage.setItem('test1', 'notObservedValue'))
                .then(() => localforage.removeItem('test1'))
                .then(() => localforage.clear())
                .then(function() {
                    expect(observableLogs).to.deep.equal([
                        "setItem('test1', 'value1')",
                        "setItem('test2', 'value2')",
                        "setItem('test2', 'value2b')",
                        "setItem('test3', 'value3')",
                        "removeItem('test3') => null",
                        // TODO: fix me
                        // 'clear()',
                    ]);
                    expect(errorCallCount).to.equal(0);
                    expect(completeCallCount).to.equal(0);
                });
        });
    });

    describe('Given a simple observable & subscription w/o changeDetection', function() {
        beforeEach(function() {
            return localforage
                .ready()
                .then(() => localforage.clear())
                .then(() => {
                    const observable = localforage.newObservable({
                        changeDetection: false,
                    });

                    subscription = observable.subscribe({
                        next: (change: LocalForageObservableChange) =>
                            observableLogs.push(formatChangeArg(change)),
                        error: err => {
                            errorCallCount++;
                            console.error('Found an error!', err);
                        },
                        complete: () => {
                            completeCallCount++;
                        },
                    });
                });
        });

        it('should observe properly', function() {
            return runTestScenario()
                .then(() => subscription.unsubscribe())
                .then(function() {
                    expect(observableLogs).to.deep.equal([
                        "setItem('test1', 'value1')",
                        "setItem('test2', 'value2')",
                        "setItem('test2', 'value2b')",
                        "setItem('test2', 'value2b')",
                        "setItem('test3', 'value3')",
                        "removeItem('test3') => null",
                        "removeItem('test3') => null",
                        'clear()',
                        'clear()',
                    ]);
                    expect(errorCallCount).to.equal(0);
                    expect(completeCallCount).to.equal(0);
                });
        });

        it('should stop observing after unsubscribing', function() {
            return runTestScenario()
                .then(() => subscription.unsubscribe())
                .then(() =>
                    localforage.setItem('notObservedKey', 'notObservedValue'),
                )
                .then(() => localforage.setItem('test1', 'notObservedValue'))
                .then(() => localforage.removeItem('test1'))
                .then(() => localforage.clear())
                .then(function() {
                    expect(observableLogs).to.deep.equal([
                        "setItem('test1', 'value1')",
                        "setItem('test2', 'value2')",
                        "setItem('test2', 'value2b')",
                        "setItem('test2', 'value2b')",
                        "setItem('test3', 'value3')",
                        "removeItem('test3') => null",
                        "removeItem('test3') => null",
                        'clear()',
                        'clear()',
                    ]);
                    expect(errorCallCount).to.equal(0);
                    expect(completeCallCount).to.equal(0);
                });
        });
    });
});

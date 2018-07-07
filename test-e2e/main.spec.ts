import * as m from 'mochainon';

import * as localforage from 'localforage';
import '../../';

import { formatChangeArg } from './utils/formatChangeArg';

describe('Localforage', function() {
    it('should get ready', function() {
        return m.chai.expect(localforage.ready()).to.eventually.be.fulfilled;
    });
});

describe('Localforage Observable API', function() {
    it('should add the newObservable() method to localforage', function() {
        m.chai.expect(localforage.newObservable).to.be.a('function');
    });

    it('should be able to create a new observable', function() {
        m.chai.expect(() => localforage.newObservable()).to.not.throw();
        m.chai
            .expect(localforage.newObservable())
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
            .then(function() {
                return localforage.setItem('test2', 'value2');
            })
            .then(function() {
                return localforage.setItem('test2', 'value2b');
            })
            .then(function() {
                return localforage.setItem('test2', 'value2b');
            })
            .then(function() {
                return localforage.setItem('test3', 'value3');
            })
            .then(function() {
                return localforage.clear();
            })
            .then(function() {
                return localforage.clear();
            });

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
                .then(function() {
                    subscription.unsubscribe();
                    return localforage.clear();
                })
                .then(function() {
                    m.chai.expect(observableLogs).to.deep.equal([
                        "setItem('test1', 'value1')",
                        "setItem('test2', 'value2')",
                        "setItem('test2', 'value2b')",
                        "setItem('test3', 'value3')",
                        // TODO: fix me
                        // 'clear()',
                    ]);
                    m.chai.expect(errorCallCount).to.equal(0);
                    m.chai.expect(completeCallCount).to.equal(0);
                });
        });

        it('should stop observing after unsubscribing', function() {
            return runTestScenario()
                .then(function() {
                    subscription.unsubscribe();
                    return localforage.setItem(
                        'notObservedKey',
                        'notObservedValue',
                    );
                })
                .then(function() {
                    return localforage.clear();
                })
                .then(function() {
                    m.chai.expect(observableLogs).to.deep.equal([
                        "setItem('test1', 'value1')",
                        "setItem('test2', 'value2')",
                        "setItem('test2', 'value2b')",
                        "setItem('test3', 'value3')",
                        // TODO: fix me
                        // 'clear()',
                    ]);
                    m.chai.expect(errorCallCount).to.equal(0);
                    m.chai.expect(completeCallCount).to.equal(0);
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
                .then(function() {
                    subscription.unsubscribe();
                    return localforage.setItem(
                        'notObservedKey',
                        'notObservedValue',
                    );
                })
                .then(function() {
                    return localforage.clear();
                })
                .then(function() {
                    m.chai
                        .expect(observableLogs)
                        .to.deep.equal([
                            "setItem('test1', 'value1')",
                            "setItem('test2', 'value2')",
                            "setItem('test2', 'value2b')",
                            "setItem('test2', 'value2b')",
                            "setItem('test3', 'value3')",
                            'clear()',
                            'clear()',
                        ]);
                    m.chai.expect(errorCallCount).to.equal(0);
                    m.chai.expect(completeCallCount).to.equal(0);
                });
        });
    });
});

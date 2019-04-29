import * as m from 'mochainon';

import * as localforage from 'localforage';
import '../';

import { formatChangeArg } from './utils/formatChangeArg';
const { expect } = m.chai;

describe('Observing keys', function() {
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
            .setItem('UserProfile', {
                UserName: 'user1',
                Password: '12345',
            })
            .then(() =>
                localforage.setItem('UserProfile', {
                    UserName: 'user1',
                    Password: '67890',
                }),
            )
            // this should not notify the subscribers
            .then(() =>
                localforage.setItem('UserProfile', {
                    UserName: 'user1',
                    Password: '67890',
                }),
            )
            .then(() => localforage.setItem('test1', 'value1'))
            .then(() => localforage.setItem('test2', 'value2'))
            .then(() => localforage.setItem('test2', 'value2b'))
            // this should not notify subscribers w/ changeDetection
            .then(() => localforage.setItem('test2', 'value2b'))
            .then(() => localforage.setItem('test3', 'value3'))
            .then(() => localforage.removeItem('test3'))
            .then(() => localforage.removeItem('test3'))
            .then(() => localforage.clear())
            // this should not notify subscribers w/ changeDetection
            .then(() => localforage.clear());

    describe('Given a simple observable & subscription w/ changeDetection', function() {
        beforeEach(function() {
            return localforage
                .ready()
                .then(() => localforage.clear())
                .then(() => {
                    const observable = localforage.newObservable({
                        key: 'UserProfile',
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
                    expect(observableLogs).to.deep.equal([
                        `setItem('UserProfile', '{"UserName":"user1","Password":"12345"}')`,
                        `setItem('UserProfile', '{"UserName":"user1","Password":"67890"}')`,
                        'clear()',
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
                        key: 'UserProfile',
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
                    expect(observableLogs).to.deep.equal([
                        `setItem('UserProfile', '{"UserName":"user1","Password":"12345"}')`,
                        `setItem('UserProfile', '{"UserName":"user1","Password":"67890"}')`,
                        `setItem('UserProfile', '{"UserName":"user1","Password":"67890"}')`,
                        'clear()',
                        'clear()',
                    ]);
                    expect(errorCallCount).to.equal(0);
                    expect(completeCallCount).to.equal(0);
                });
        });
    });
});

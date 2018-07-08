import * as m from 'mochainon';

import * as localforage from 'localforage';
import '../../';

describe('getItemObservable()', function() {
    it('should add the getItemObservable() method to localforage', function() {
        m.chai.expect(localforage.getItemObservable).to.be.a('function');
    });

    it('should be able to create a new observable', function() {
        m.chai
            .expect(() => localforage.getItemObservable('UserProfile'))
            .to.not.throw();
        m.chai
            .expect(localforage.getItemObservable('UserProfile'))
            .to.have.property('subscribe')
            .that.is.a('function');
    });

    describe('Given an item observable ', function() {
        let observable: Observable<LocalForageObservableChange>;
        let subscription: Subscription;
        let observableLogs: string[];
        let errorCallCount: number;
        let completeCallCount: number;

        beforeEach(function() {
            observableLogs = [];
            errorCallCount = 0;
            completeCallCount = 0;

            return localforage
                .ready()
                .then(() => localforage.clear())
                .then(() => {
                    observable = localforage.getItemObservable('UserProfile');
                });
        });

        it('should observe properly', function() {
            // add an initial value
            return localforage
                .setItem('UserProfile', {
                    UserName: 'user1',
                    Password: '0000',
                })
                .then(function() {
                    subscription = observable.subscribe({
                        next: (change: LocalForageObservableChange) =>
                            observableLogs.push(JSON.stringify(change)),
                        error: err => {
                            errorCallCount++;
                            console.error('Found an error!', err);
                        },
                        complete: () => completeCallCount++,
                    });
                })
                .then(function() {
                    return localforage.setItem('UserProfile', {
                        UserName: 'user1',
                        Password: '12345',
                    });
                })
                .then(function() {
                    return localforage.setItem('UserProfile', {
                        UserName: 'user1',
                        Password: '67890',
                    });
                })
                .then(function() {
                    // this should not notify the subscribers
                    return localforage.setItem('UserProfile', {
                        UserName: 'user1',
                        Password: '67890',
                    });
                })
                .then(function() {
                    return localforage.setItem('test1', 'value1');
                })
                .then(function() {
                    return localforage.setItem('test2', 'value2');
                })
                .then(function() {
                    return localforage.setItem('test2', 'value2b');
                })
                .then(function() {
                    // this should not notify the subscribers
                    return localforage.setItem('test2', 'value2b');
                })
                .then(function() {
                    return localforage.setItem('UserProfile', {
                        UserName: 'user1',
                        Password: '67891',
                    });
                })
                .then(function() {
                    return localforage.setItem('test3', 'value3');
                })
                .then(function() {
                    return localforage.clear();
                })
                .then(function() {
                    subscription.unsubscribe();
                    // this should not notify the subscribers
                    return localforage.setItem('UserProfile', {
                        UserName: 'user1',
                        Password: '67899',
                    });
                })
                .then(function() {
                    return localforage.clear();
                })
                .then(function() {
                    m.chai
                        .expect(observableLogs)
                        .to.deep.equal([
                            '{"UserName":"user1","Password":"0000"}',
                            '{"UserName":"user1","Password":"12345"}',
                            '{"UserName":"user1","Password":"67890"}',
                            '{"UserName":"user1","Password":"67891"}',
                        ]);
                    m.chai.expect(errorCallCount).to.equal(0);
                    m.chai.expect(completeCallCount).to.equal(0);
                });
        });
    });
});

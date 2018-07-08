import * as m from 'mochainon';

describe('First test', function() {
    it('works as expected', function() {
        return m.chai
            .expect(Promise.resolve(true))
            .to.eventually.deep.equal(true);
    });
});

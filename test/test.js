var assert = require('assert'),
		bk     = require('../src/butterknife.js');

describe('nodejs', function(){
	describe('#connection()', function(){
		it('should add the postgres connection string', function(){
			bk.connection('test')
			assert.equal('test', bk.connection())
		})
	})
})
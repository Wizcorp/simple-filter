var assert = require('assert'),
	fs = require('fs');

var Filter = require('..');

// get our test data
var data = JSON.parse(fs.readFileSync(__dirname + '/data.json'));

describe('simple-filter', function () {
	var filter;
	it ('take data as rows of objects', function () {
		filter = new Filter(data);
	});

	it ('can add indexes', function () {
		filter.addIndex('name', function (value) { return value.name; });
		filter.addIndex('forks', function (value) { return value.forks; });
		filter.addIndex('stars', function (value) { return value.stargazers_count; });
		filter.addIndex('updated', function (value) { return (new Date(value.updated_at)).getTime(); });
		filter.addIndex('fork', function (value) { return value.fork; });

		assert.equal(true, filter.hasIndex('name'));
		assert.equal(true, filter.hasIndex('forks'));
		assert.equal(true, filter.hasIndex('stars'));
		assert.equal(true, filter.hasIndex('updated'));
		assert.equal(true, filter.hasIndex('fork'));
	});

	it('can do equal filters', function () {
		assert.equal(true, filter.get({ name: "express" }).length);
	});

	it('can do comparison filters on numbers', function () {
		assert.equal(15, filter.get({ forks: '>=20' }).length);
	});

	it('can do "between" comparisons', function () {
		assert.equal(6, filter.get({ stars: [416, 703] }).length);
	});

	it('can filter on boolean true', function () {
		assert.equal(12, filter.get({ fork: true }).length);
	});

	it('can filter on boolean false', function () {
		assert.equal(48, filter.get({ fork: false }).length);
	});

	it('can do a comparison using a function', function () {
		// all repos whose last update was done in the morning between 8 and 12am in SF
		function morningUpdate(v) {
			var updH = (new Date(v)).getUTCHours();
			return updH > 16 && updH < 20;
		}
		assert.equal(2, filter.get({ updated: morningUpdate }).length);
	});
});
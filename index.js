var crossfilter = require('crossfilter').crossfilter || require('crossfilter');

/**
 * Create a filter instance, the filter object is made to be async-proof by only providing atomic
 * operations, if you need to do complexe grouping/cf stuff, you can call the variables in the
 * object, but doing as such is unsupported
 *
 * @param {Object[]} [data]    An array of objects containing data to be used for filtering
 * @param {Object}   [indexes] A map of indexes: function() that will be feed to the addIndex function
 * @constructor
 */
function Filter(data, indexes) {
	indexes = indexes || {};
	data = data || [];

	// the user can give use filters and add data later
	if (!Array.isArray(data)) {
		indexes = data;
		data = [];
	}

	// create our crossfilter
	this.cf = crossfilter(data);
	this.dimensions = {};

	// add any filter defined
	var indexNames = Object.keys(indexes);
	for (var i = 0; i < indexNames.length; i++) {
		this.addIndex(indexNames[i], indexes[indexNames[i]]);
	}
}

/**
 * Add a new index that can be used to filter get results, the function provided for the index will
 * be passed items from the data, it should return a scalar from that object that will be used for
 * indexing. For a given element, that function should always return the same data.
 *
 * @param {string}   name The index name
 * @param {Function} func The indexing function
 */
Filter.prototype.addIndex = function (name, func) {
	if (this.dimensions[name]) {
		// dispose of old dimension and replace it with this new one
		this.delIndex(name);
	}


	// store dimension
	this.dimensions[name] = this.cf.dimension(func);
};

/**
 * Delete an index from the filter, this index won't be query-able anymore
 *
 * @param {string} name The index to delete
 */
Filter.prototype.delIndex = function (name) {
	this.dimensions[name].dispose();
	delete this.dimensions[name];
};

/**
 * Whether an index exists for that name
 *
 * @param {string} name The index name
 *
 * @returns {boolean}
 */
Filter.prototype.hasIndex = function (name) {
	return !!this.dimensions[name];
};

/**
 * Add new records to the dataset
 *
 * @param {Object|Object[]} records Data to add to the dataset
 */
Filter.prototype.addRecords = function (records) {
	if (!Array.isArray(records)) {
		records = [records];
	}

	this.cf.add(records);
};

/**
 * Remove all rows from data that match the given filter
 *
 * @param {Object} filters   A map of index: value to filter the result with
 */
Filter.prototype.delRecords = function (filters) {
	filters = filters || {};

	// get every index names
	var indexNames = Object.keys(this.dimensions);

	// we need to reset the filters as removed data is based on matches
	for (var i = 0; i < indexNames.length; i++) {
		var index = indexNames[i];

		// either apply filters, or reset them
		if (filters[index]) {
			this.dimensions[index].filter(filters[index]);
		} else {
			this.dimensions[index].filterAll();
		}
	}

	this.cf.remove();
};

/**
 * Returns the number of records in the filter, independent of any filters.
 *
 * @returns {Number}
 */
Filter.prototype.size = function () {
	return this.cf.size();
};

// helper functions
var comparisonFunctions = {
	'<': function lessThan(b) { return function (a) { return a < b; }; },
	'>': function greaterThan(b) { return function (a) { return a > b; }; },
	'<=': function lessThanOrEqualTo(b) { return function (a) { return a <= b; }; },
	'>=': function greaterThanOrEqualTo(b) { return function (a) { return a >= b; }; }
}

/**
 * Get filtered data back, filters is a map referencing each index to filter on, and the filter value,
 * if the filter value is a scalar, then the operation assumes 'equal', if it is an array with 2 entries
 * then it assumes 'between', if it is a function, then it runs the function on each entry.
 * Indexes not referenced in this map will just not be filtered upon.
 *
 * @param {Object} filters   A map of index: value to filter the result with
 * @param {string} sortIndex It is possible to specify an index to sort the resulting dataset with.
 *                           By default will use the first available index.
 * @returns {Object[]}       Returns a copy of the result set, it is not a deep-copy so it should be
 *                           considered immutable.
 */
Filter.prototype.get = function (filters, sortIndex) {
	filters = filters || {};

	// get every index names
	var indexNames = Object.keys(this.dimensions);

	for (var i = 0; i < indexNames.length; i++) {
		var index = indexNames[i];

		// either apply filters, or reset them
		if (filters.hasOwnProperty(index)) {
			// support indexes in the form >=0, <0, etc...
			if (typeof filters[index] === 'string') {
				// check if we have any comparison operator in there (only for numbers)
				var matches;
				if ((matches = filters[index].match(/^([<>=]+)([0-9\.]+)$/)) !== null) {
					if (comparisonFunctions[matches[1]]) {
						filters[index] = comparisonFunctions[matches[1]](parseFloat(matches[2]));
					}
				}
			}

			this.dimensions[index].filter(filters[index]);
		} else {
			this.dimensions[index].filterAll();
		}
	}

	// get the sorting dimension, otherwise take the first filter defined
	var sortDimension = this.dimensions[sortIndex] || this.dimensions[indexNames[0]];

	// return the resulting dataset, sorted by sortIndex, from smallest to biggest value
	return sortDimension.bottom(Infinity);
};


// export class
exports = module.exports = Filter;
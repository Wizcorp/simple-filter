[![Build Status](https://travis-ci.org/christopherobin/simple-filter.png)](https://travis-ci.org/christopherobin/simple-filter)

# simple-filter

  A small wrapper around crossfilter to make querying simpler

## Installation

  Install with [component(1)](http://component.io):

    $ component install Wizcorp/simple-filter

## API

### Create a crossfilter

```javascript
var data = [{object}, {object}, etc...];
var indexes = {
	id: function (value) { return value.id }
};

// both values are optional
var filter = new Filter(data, indexes);
```

### addIndex(name, func)

Create an index `name` using function `func`.

```javascript
// create an index named name for the lowercase value of the name
filter.addIndex('name', function (value) { return value.name.toLowerCase(); });
```

### delIndex(name)

Delete index with given `name`.

```javascript
filter.delIndex('name');
```

### hasIndex(name)

Does index `name` exists.

```javascript
filter.delIndex('name');
```

### addRecords(data)

Add one or more values to the filter data

```javascript
filter.addRecords([{object1}, {object2}, etc...]);
```

### delRecords(filters)

Delete records based on given filter, see `get` for more details about filters

```javascript
// delete row with id "foobar"
filter.delRecords({ id: "foobar" });
// delete all data
filter.delRecords();
```

### get

Get records from the filter

```javascript
// add an index on name and age, and feed lots of lines containing value
var filter = new Filter(data);
filter.addIndex('name', function (value) { return value.name.toLowerCase(); });
filter.addIndex('age', function (value) { return value.age; });

// get all people that are 20 years old, sort by name
filter.get({ age: 20 }, ['name']);

// filters also support comparison operators (<, >, >= or <=) for numbers
// for example get all people under 18 years old
filter.get({ age: '<18' });

// or all the people between 20 and 30
filter.get({ age: [20, 30] });

// or all the people whose name start by "chris", sorted by age
filter.get({ name: function (v) { return (v.indexOf('chris') === 0); } }, ['age']);

```

### size()

Give the amount of records in the filter


## License

  MIT

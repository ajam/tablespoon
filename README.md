# Butter Knife

A wrapper around [node-postgres](https://github.com/brianc/node-postgres) to easily create and query a table from a local json or csv file.

## Usage

### Within Node.js

````
var bk = require('../src/butter-knife.js').connect('pg://postgres@localhost/');

var data = [
	{
		city: "New York",
		temp: [0,35],
		country: 'USA'
	},
	{
		city: 'Los Angeles',
		temp: [15,35],
		country: 'USA'
	},
	{
		city: 'Paris',
		temp: [2,33],
		country: 'France'
	},
	{
		city: 'Marseille',
		temp: [5,27],
		country: 'France'
	},
	{
		city: 'London',
		temp: [2,25],
		country: 'UK'
	}
]

bk.createTable('cities', data)

// Get the rows that don't have 15
bk.query('SELECT * FROM cities WHERE 15 != ALL (temp)', function(rows){
	console.log(rows)
	/*[
	  { uid: '1', city: 'New York',     temp: [ 0, 35 ], country: 'USA' },
	  { uid: '3', city: 'Paris',        temp: [ 2, 33 ], country: 'France' },
	  { uid: '4', city: 'Marseille',    temp: [ 5, 27 ], country: 'France' },
	  { uid: '5', city: 'London',       temp: [ 2, 25 ], country: 'UK' } ]*/
})
````

## Command line

````
butterknife IN_FILE -f (csv|json|tsv|psv|DELIMITER) -n TABLE_NAME -o OUT_FILE -q "QUERY" -p (json|csv) -s "SCHEMA"
````
All values are optional except for `IN_FILE`

If you don't specify a query, it will return the `CREATE TABLE` and `INSERT INTO` commands either to the terminal or to an output file specified through `-o`. 

If your file is `json`, `csv`, `tsv`, or `psv` (pipe-separated file), you do not need to specify a delimiter. If your file is in a different format, specify the delimiter as `-f`, e.g. for a a @-delimited file, write `-f @`.If you do not set a filetype, Butterknife will attempt to read the file extension.

If you don't specify a table name, `butter_knife` will be used by default.


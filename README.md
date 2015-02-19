# Tablespoon

Easily query spreadsheet-like or json data with SQLite or PostgreSQL. Built around[ node-postgres](https://github.com/brianc/node-postgres) and [node-sqlite3](https://github.com/mapbox/node-sqlite3).

### Installation

To install as a Node.js module
````
npm install tablespoon
````
To use Tablespoon's command line interface, install with the global flag

````
npm install tablespoon -g
````

If you want to use Tablespoon in both circumstances, run both commands.

### Documentation

Check out [the wiki](https://github.com/ajam/tablespoon/wiki) for the latest documentation and the [FAQ](https://github.com/ajam/tablespoon/wiki/Faq), which includes [helpful tips](https://github.com/ajam/tablespoon/wiki/Faq#wiki-how-do-i-convert-csv-tsv-or-some-other-data-format-into-json) on how to load in `csv` or `tsv` data into Node.js.

### Example usage

See more [examples](https://github.com/ajam/tablespoon/tree/master/examples).
````js
var ts = require('tablespoon.js').pgsql();

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

ts.createTable(data, 'cities')

// Get the rows that don't have 15
ts.query('SELECT * FROM cities WHERE 15 != ALL (temp)', function(rows){
	console.log(rows)
	/*{ 
	query: 'SELECT * FROM cities WHERE 15 != ALL (temp)',
  rows:
   [ { uid: '1', city: 'New York', temp: [0,35], country: 'USA' },
     { uid: '3', city: 'Paris', temp: [2,33], country: 'France' },
     { uid: '4', city: 'Marseille', temp: [5,27], country: 'France' },
     { uid: '5', city: 'London', temp: [2,25], country: 'UK' } ] }*/
})
````

### Used in

Analysis for [Nominated for the Oscars but failing the Bechdel sexism test](http://america.aljazeera.com/articles/2014/1/17/nominated-for-theoscarsbutfailingthebechdeltest.html) - Al Jazeera America

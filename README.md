# Butterknife

A [node-postgres](https://github.com/brianc/node-postgres) to easilly query json or csv data.

## Documentation

Check out [the wiki](https://github.com/ajam/butterknife/wiki) for the latest documentation.

## Example usage

````
var bk = require('../src/butter-knife.js').pgsql();

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

bk.createTable(data, 'cities')

// Get the rows that don't have 15
bk.query('SELECT * FROM cities WHERE 15 != ALL (temp)', function(rows){
	console.log(rows)
	/*{ 
	query: 'SELECT * FROM cities WHERE 15 != ALL (temp)',
  rows:
   [ { uid: '1', city: 'New York', temp: [Object], country: 'USA' },
     { uid: '3', city: 'Paris', temp: [Object], country: 'France' },
     { uid: '4', city: 'Marseille', temp: [Object], country: 'France' },
     { uid: '5', city: 'London', temp: [Object], country: 'UK' } ] }*/
})
````
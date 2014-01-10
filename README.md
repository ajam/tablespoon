# Butter Knife

A wrapper around [node-postgres](https://github.com/brianc/node-postgres) to easily create and query a table from a local json or csv file.

#### Usage

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
/*
[ { uid: '1', city: 'New York',     temp: [ 0, 35 ], country: 'USA' },
  { uid: '3', city: 'Paris',        temp: [ 2, 33 ], country: 'France' },
  { uid: '4', city: 'Marseille',    temp: [ 5, 27 ], country: 'France' },
  { uid: '5', city: 'London',       temp: [ 2, 25 ], country: 'UK' } ]*/
})
````
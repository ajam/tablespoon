var ts = require('../../src/tablespoon.js').pgsql('pg://postgres@localhost/');

var data = [
	{
		city: "New York",
		temp: null,
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
		temp: [2,25, 32],
		country: 'UK'
	}
]

// Define the table schema manually.
var schema_string = 'city TEXT, temp integer[], country TEXT';

ts.createTable(data, 'cities', schema_string)

// Get the rows that don't have 15
ts.query('SELECT * FROM cities WHERE 15 != ALL (temp)', function(result){
	console.log(result.query)
	console.log(result.rows)
	/*[
	  { uid: '1', city: 'New York',     temp: [ 0, 35 ], country: 'USA' },
	  { uid: '3', city: 'Paris',        temp: [ 2, 33 ], country: 'France' },
	  { uid: '4', city: 'Marseille',    temp: [ 5, 27 ], country: 'France' },
	  { uid: '5', city: 'London',       temp: [ 2, 25 ], country: 'UK' } ]*/
})

// Get the one that does
ts.query.each('SELECT * FROM cities WHERE 15 = ANY (temp)', function(row){
	console.log(row)
	/*
	SELECT * FROM cities WHERE 15 = ANY (temp)
	{ uid: '2',  city: 'Los Angeles',  temp: [ 15, 35 ],  country: 'USA' }*/

})
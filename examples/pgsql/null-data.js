var ts = require('../../src/tablespoon.js').pgsql('pg://postgres:5432@localhost');

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

ts.createTable(data, 'cities')

ts.query('SELECT * FROM cities', function(result){
	console.log(result.query)
	console.log(result.rows)
})


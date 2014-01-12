var bk = require('../src/butter-knife.js').connect('pg://postgres@localhost/');

var data = [
	{
		city: "New York",
		temp: null,
		country: 'USA'
	},
	{
		city: 'Los Angeles',
		temp: null,
		country: 'USA'
	},
	{
		city: 'Paris',
		temp: null,
		country: 'France'
	},
	{
		city: 'Marseille',
		temp: null,
		country: 'France'
	},
	{
		city: 'London',
		temp: null,
		country: 'UK'
	}
]

bk.createTable('cities', data)

bk.query('SELECT * FROM cities', function(rows){
	// console.log(rows)
})


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
})

// Get the one that does
bk.query.each('SELECT * FROM cities WHERE 15 = ANY (temp)', function(row, query){
	console.log(query)
	console.log(row)
})
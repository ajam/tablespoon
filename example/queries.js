var sequel = require('../sequel.js').connect('pg://mike@localhost/node');

var data = [
	{
		city: "New York's",
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

sequel.createTableSync('cities', data)

// Get the rows that don't have 15
sequel.query('SELECT * FROM cities WHERE 15 != ALL (temp)', function(rows){
	console.log(rows)
})

// Get the one that does
sequel.query.each('SELECT * FROM cities WHERE 15 = ANY (temp)', function(row){
	console.log(row)
})
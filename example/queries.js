var sequel = require('../sequel.js').connect('pg://mike@localhost/node');

var data = [
	{
		city: "New York's",
		temp: [0,35],
		countries: ['USA', 'John\'s']
	},
	{
		city: 'Los Angeles',
		temp: [15,35],
		countries: ['USA']
	},
	{
		city: 'Paris',
		temp: [2,33],
		countries: ['France']
	},
	{
		city: 'Marseille',
		temp: [5,27],
		countries: ['France']
	},
	{
		city: 'Donners\' Company',
		temp: [2,25],
		countries: ['UK']
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
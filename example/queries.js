var sequel = require('../sequel.js')

var data = [
	{
		city: 'New York',
		temp: [27,20],
		country: 'USA'
	},
	{
		city: 'Los Angeles',
		temp: [72,20],
		country: 'USA'
	},
	{
		city: 'Paris',
		temp: [34,20],
		country: 'France'
	},
	{
		city: 'Marseille',
		temp: [43,20],
		country: 'France'
	},
	{
		city: 'London',
		temp: [33,20],
		country: 'UK'
	}
]

sequel.createTableSync('cities', data)

sequel.query.each('SELECT * FROM cities', function(row){
	console.log(row)
})


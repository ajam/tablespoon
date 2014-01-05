var sequel = require('../sequel.js')

var data = [
	{
		city: 'New York',
		temp: {temp:[5,2]},
		country: 'USA'
	},
	{
		city: 'Los Angeles',
		temp: {temp:[5,2]},
		country: 'USA'
	},
	{
		city: 'Paris',
		temp: {temp:[5,2]},
		country: 'France'
	},
	{
		city: 'Marseille',
		temp: {temp:[5,2]},
		country: 'France'
	},
	{
		city: 'London',
		temp: {temp:[2,2]},
		country: 'UK'
	}
]

sequel.createTableSync('cities', data)

// sequel.query.each('SELECT * FROM cities WHERE 15 != ALL (temp)', function(row){
// 	console.log(row)
// })

sequel.query.each('SELECT * FROM cities', function(row){
	console.log(row)
})


// sequel.query.each('SELECT * FROM cities WHERE 15 = ANY (temp)', function(row){
// 	console.log(row)
// })


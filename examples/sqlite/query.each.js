var bk = require('../../src/butterknife.js').sqlite();

var data = [
	{
		city: 'New York',
		temp: 27.2,
		country: 'USA'
	},
	{
		city: 'Los Angeles',
		temp: 72,
		country: 'USA'
	},
	{
		city: 'Paris',
		temp: 34,
		country: 'France'
	},
	{
		city: 'Marseille',
		temp: 43,
		country: "France"
	},
	{
		city: "London",
		temp: 33,
		country: 'UK'
	}
]

bk.createTable(data, 'cities');


bk.query.each('SELECT * FROM cities', function(result){
	console.log(result)
});

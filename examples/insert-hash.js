var bk = require('../src/butterknife.js');

var data = [
	{
		city: "New York",
		temp: {
			low: 18,
			high: 95
		},
		country: 'USA'
	},
	{
		city: 'Los Angeles',
		temp: {
			low: 38,
			high: 103
		},
		country: 'USA'
	},
	{
		city: 'Paris',
		temp: {
			low: 25,
			high: 98
		},
		country: 'France'
	},
	{
		city: 'Marseille',
		temp: {
			low: 30,
			high: 98
		},
		country: 'France'
	},
	{
		city: 'London',
		temp: {
			low: 10,
			high: 90
		},
		country: 'UK'
	}
]

bk.verbose(true)
bk.createTable(data, 'cities')

// Get the row that has a low of 25
// Currently, type support within json is a bit weird
// And something you might have to work out on your pgsql end
// https://gist.github.com/tobyhede/2715918
bk.query("SELECT * FROM cities WHERE temp ->> 'low' = '25';", function(result){
	console.log(result)
	/*{ 
	query: 'SELECT * FROM cities WHERE temp ->> \'low\' = \'25\';',
  rows: [ { uid: '3', city: 'Paris', temp: [Object], country: 'France' } ] }*/
})
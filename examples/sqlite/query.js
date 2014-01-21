var bk = require('../../src/butterknife.js').sqlite();

var data = [
	{
		city: 'New York',
		temp: 27.2,
		country: 'USA'
	},
	{
		city: 'Los A\'ngeles',
		temp: 72,
		country: 'USA'
	},
	{
		city: 'Paris',
		temp: 34,
		country: 'F"rance'
	},
	{
		city: 'Marseille',
		temp: 43,
		country: "F'rance"
	},
	{
		city: "Lon\"don",
		temp: 33,
		country: 'UK'
	}
]

bk.createTable(data, 'cities');


bk.query('SELECT * FROM cities', function(result){
	console.log(result)
});

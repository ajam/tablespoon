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

bk.createTable(data, 'cities')

var queries = [
	'SELECT * FROM cities LIMIT 1',
	'SELECT * FROM cities LIMIT 1 OFFSET 1',
]

bk.queries.each(queries, function(result){
	console.log(result)
/*
{ query: 'SELECT * FROM cities LIMIT 1',
  rows: [ { uid: 1, city: 'New York', temp: 27.2, country: 'USA' } ] }
{ query: 'SELECT * FROM cities LIMIT 1 OFFSET 1',
  rows: [ { uid: 2, city: 'Los Angeles', temp: 72, country: 'USA' } ] }
*/
})


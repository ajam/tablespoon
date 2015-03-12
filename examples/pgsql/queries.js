var ts = require('../../src/tablespoon.js').pgsql('pg://postgres:5432@localhost');

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

ts.createTable(data, 'cities')

var queries = [
	'SELECT * FROM cities LIMIT 1',
	'SELECT * FROM cities LIMIT 1 OFFSET 1',
]

ts.queries(queries, function(result){
	console.log(result)
/*	[
  {
    "query": "SELECT * FROM cities LIMIT 1",
    "rows": [
      {
        "uid": "1",
        "city": "New York",
        "temp": [
          0,
          35
        ],
        "country": "USA"
      }
    ]
  },
  {
    "query": "SELECT * FROM cities LIMIT 1 OFFSET 1",
    "rows": [
      {
        "uid": "2",
        "city": "Los Angeles",
        "temp": [
          15,
          35
        ],
        "country": "USA"
      }
    ]
  }
]
*/
})


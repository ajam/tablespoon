var bk = require('../src/butterknife.js');

var data = [
	{
		city: "New York",
		temps: [{
			low: 18,
			high: 95
		},{
			low: 28,
			high: 85
		}],
		country: 'USA'
	},
	{
		city: 'Los Angeles',
		temps: [{
			low: 15,
			high: 85
		},{
			low: 33,
			high: 105
		}],
		country: 'USA'
	},
	{
		city: 'Paris',
		temps: [{
			low: 24,
			high: 87
		},{
			low: 12,
			high: 102
		}],
		country: 'France'
	},
	{
		city: 'Marseille',
		temps: [{
			low: 22,
			high: 102
		},{
			low: 28,
			high: 85
		}],
		country: 'France'
	},
	{
		city: 'London',
		temps: [{
			low: 28,
			high: 97
		},{
			low: 18,
			high: 72
		}],
		country: 'UK'
	}
]

bk.createTable(data, 'cities')

// Get all of the cities with a high of 72
bk.query("SELECT * FROM cities c, json_array_elements(c.temps) as temp_ranges WHERE temp_ranges ->> 'high' = '72';", function(result){
	console.log(result)
	/*{ 
	query: 'SELECT * FROM cities c, json_array_elements(c.temps) as temp_ranges WHERE temp_ranges ->> \'high\' = \'72\';',
  rows:
   [ { uid: '5',
       city: 'London',
       temps: [Object],
       country: 'UK',
       value: [Object] } ] }*/
})





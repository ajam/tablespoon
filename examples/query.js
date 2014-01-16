var bk = require('../src/butterknife.js');

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

bk.createTable(data, 'cities')

// Get the rows that don't have 15
bk.query('SELECT * FROM cities LIMIT 2 OFFSET 1', function(result){
	// console.log(result)
	/*[
	  { uid: '1', city: 'New York',     temp: [ 0, 35 ], country: 'USA' },
	  { uid: '3', city: 'Paris',        temp: [ 2, 33 ], country: 'France' },
	  { uid: '4', city: 'Marseille',    temp: [ 5, 27 ], country: 'France' },
	  { uid: '5', city: 'London',       temp: [ 2, 25 ], country: 'UK' } ]*/
})

// Get the one that does
bk.query.each('SELECT * FROM cities', function(row){
	console.log(row)
	
	// SELECT * FROM cities WHERE 15 = ANY (temp)
	// { uid: '2',  city: 'Los Angeles',  temp: [ 15, 35 ],  country: 'USA' }

})
var ts = require('../src/tablespoon.js')

var data = [
	{
		city: "New York",
		temp: null,
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
		temp: [2,25, 32],
		country: 'UK'
	}
]


var commands = ts.createTableCommands(data, 'cities');

console.log(commands)

/*
{ create: 'CREATE TEMP TABLE cities (uid BIGSERIAL PRIMARY KEY,city TEXT,temp NUMERIC[],country TEXT)',
  insert: 'INSERT INTO cities (city,temp,country) VALUES ($$New York$$,NULL,$$USA$$),($$Los Angeles$$,$${15,35}$$,$$USA$$),($$Paris$$,$${2,33}$$,$$France$$),($$Marseille$$,$${5,27}$$,$$France$$),($$London$$,$${2,25,32}$$,$$UK$$)' }
  */
var bk     = require('../src/butterknife.js'),
		colors = require('colors'),
		_      = require('underscore');

var data = {};
data.string_ = [{
	city: 'Los Angeles'
}]
data.numeric_ = [{
	temperature: 72.3
}]
data.boolean_ = [{
	awesome: true
}]
data.numeric_array_ = [{
	temperatures: [38, 103]
}]
data.text_array_ = [{
	landmarks: ['Getty', 'The 405']
}]
data.date_  = [{
	today: new Date()
}]
// data.json_ = [{
// 	restaurants: [{
// 		name: 'The Apple Pan',
// 		dish: 'Chocolate Cream Pie'
// 	}]
// }]
data.single_quotes_ = [{
	pastrami: "Nate'n'Als"
}]
data.escaped_single_quotes_ = [{
	pancakes: 'Dupar\'s'
}]
data.double_quotes_ = [{
	pastrami: 'Nate"n"Als'
}]
data.escaped_double_quotes_ = [{
	pancakes: "Dupar\"s"
}]
data.mixed_ = [
	{
		city: "New York",
		avg: 47,
		range: [0,35],
		landmarks: ["The Highline", "Empire State Building"],
		awesome: true
	},
	{
		city: 'Los Angeles',
		avg: 72,
		range: [15, 103],
		landmarks: ['Getty', 'The 405'],
		awesome: true
	}
]
// Skip to the next object if a field is null
data.null_ = [
	{
		city: null,
		avg: null,
		range: null,
		landmarks: null,
		awesome: null
	},
	{
		city: 'Los Angeles',
		avg: 72,
		range: [15, 103],
		landmarks: ['Getty', 'The 405'],
		awesome: true
	}
]
// Get the type from the next element in the arry if the first node is null
data.null_arr0_ = [
	{
		city: null,
		avg: null,
		range: [null, 102],
		landmarks: null,
		awesome: null
	},
	{
		city: 'Los Angeles',
		avg: 72,
		range: [null, 103],
		landmarks: ['Getty', 'The 405'],
		awesome: true
	}
]
// Skip to next object if an array is fully null
data.null_arr_ = [
	{
		city: null,
		avg: null,
		range: [null, null],
		landmarks: null,
		awesome: null
	},
	{
		city: 'Los Angeles',
		avg: 72,
		range: [15, 103],
		landmarks: ['Getty', 'The 405'],
		awesome: true
	}
]
// data.null_arr00_ = [
// 	{
// 		city: null,
// 		avg: null,
// 		range: [null, null],
// 		landmarks: null,
// 		awesome: null
// 	},
// 	{
// 		city: 'Los Angeles',
// 		avg: 72,
// 		range: [null, null],
// 		landmarks: ['Getty', 'The 405'],
// 		awesome: true
// 	}
// ]

data.null_arr01_ = [
	{
		city: null,
		avg: null,
		range: [null, null],
		landmarks: null,
		awesome: null
	},
	{
		city: 'Los Angeles',
		avg: 72,
		range: [null, 102],
		landmarks: ['Getty', 'The 405'],
		awesome: true
	}
]

function logResult(name, pass){
	if (pass){
		console.log(name.magenta)
	}else{
		console.error('Fail :('.red, name)
	}
}
function runTests(){
	_.each(tests, function(fn, name){
		fn(cb);
		function cb(pass){
			logResult(name, pass)
		}
	})
}

var tests = {};

// Test setting a table connection
tests.connection = function(cb){
	bk.connection('pg://postgres:5432@localhost');
	if (bk.connection() == 'pg://postgres:5432@localhost'){
		cb(true)
	}else{
		cb(false)
	}
}
tests.createTables = function(cb){
	_.each(data, function(datum, name){
		logResult(name, true)
		bk.createTable(datum, name)
	})
	cb(true)
}
tests.query = function(cb){
	bk.query('SELECT * FROM mixed_', function(result){
		// result.rows.forEach(function(row){	delete row.uid })
		// Add && _.isEqual(result.rows,data.mixed_ when merged https://github.com/brianc/node-postgres/pull/501
		if (result.query == 'SELECT * FROM mixed_'){
			cb(true)
		}else{
			cb(false)
		}
	})
}
tests.queryNull = function(cb){
	bk.query('SELECT * FROM null_', function(result){
		// result.rows.forEach(function(row){	delete row.uid })
		// Add && _.isEqual(result.rows,data.mixed_ when merged https://github.com/brianc/node-postgres/pull/501
		if (result.query == 'SELECT * FROM null_'){
			cb(true)
		}else{
			cb(false)
		}
	})
}
tests.queryNullArr0 = function(cb){
	bk.query('SELECT * FROM null_arr0_', function(result){
		// result.rows.forEach(function(row){	delete row.uid })
		// Add && _.isEqual(result.rows,data.mixed_ when merged https://github.com/brianc/node-postgres/pull/501
		if (result.query == 'SELECT * FROM null_arr0_'){
			cb(true)
		}else{
			cb(false)
		}
	})
}
tests.queryNullArr = function(cb){
	bk.query('SELECT * FROM null_arr_', function(result){
		console.log(result.rows)
		// result.rows.forEach(function(row){	delete row.uid })
		// Add && _.isEqual(result.rows,data.mixed_ when merged https://github.com/brianc/node-postgres/pull/501
		if (result.query == 'SELECT * FROM null_arr_'){
			cb(true)
		}else{
			cb(false)
		}
	})
}
tests.queryNullArr01 = function(cb){
	bk.query('SELECT * FROM null_arr01_', function(result){
		// result.rows.forEach(function(row){	delete row.uid })
		// Add && _.isEqual(result.rows,data.mixed_ when merged https://github.com/brianc/node-postgres/pull/501
		if (result.query == 'SELECT * FROM null_arr01_'){
			cb(true)
		}else{
			cb(false)
		}
	})
}
tests.queriesEach = function(cb){
	var queries = ['SELECT * FROM null_arr01_', 'SELECT * FROM null_arr_']
	bk.queries.each(queries, function(result){
		console.log(result)
	})
}

bk.verbose(true)
runTests()


var sqlite3 = require('sqlite3').verbose(),
		colors  = require('colors');

var db,
		connected = false,
		db_instance;

var helpers = {
	handleErr: function(err, msg, qt){
		var pos,
				err_text = 'Error in '.red + msg.red;
		if (err){ 
			console.error(err_text)	
			throw err
		}
	}
}

function connectToDb(){
	db = db || new sqlite3.Database(':memory:');
	return this
}

function createAndInsert(table_commands){
	createTable(table_commands.create)
	insertInto(table_commands.insert)
}

function createTable(create_commands){
	db_instance = db.serialize(function(){
		db.run(create_commands)
	})
}

function insertInto(insert_commands){
	db_instance = db.serialize(function(){
		db.run(insert_commands)
	})
}

function query(query_text, cb){
	db.all(query_text, function(err, result){
		var result_obj = {};
		helpers.handleErr(err, 'query', query_text);
		result_obj.query = query_text;
		result_obj.rows  = result;
		cb(result_obj);
	})
}


module.exports = {
	connectToDb: connectToDb,
	createTable: createTable,
	insertInto: insertInto,
	createAndInsert: createAndInsert,
	query: query
}


var sqlite3 = require('sqlite3').verbose(),
		colors  = require('colors');

var db,
		connected = false;

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
	console.log(table_commands)
	var db_instance;
	db_instance = db.serialize(function(){
	  db.run(table_commands.create);
	  db.run(table_commands.insert);
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
	createAndInsert: createAndInsert,
	query: query
}


var Client = require('pg').Client;
var colors = require('colors');


var client,
		err_preview_length = 100,
		connected = false;

var helpers = {
	handleErr: function(err, msg, qt){
		var pos,
				err_text = 'Error in '.red + msg.red;
		if (err){ 
			pos = Number(err.position);
			// Display the area where the query threw an error marked by a `^`. 
			// If the error occurs within the first fifty characters, make it start at the beginning of the string.
			if (qt) {err_text += ':\n'.red + qt.substr(Math.max(0, pos - err_preview_length), Math.min(pos, err_preview_length)) + '^'.magenta + qt.substr(pos, Math.min(qt.length - pos, err_preview_length))} 
			console.error(err_text)	
			throw err
		}
	}
}

function connectToDb(connection_string){
	client = client || new Client(connection_string);
	//disconnect client when all queries are finished
  client.on('drain', client.end.bind(client)); 
	client.connect(function(err){
  	helpers.handleErr(err, 'database connection');
	});
	connected = true;
	return client // Remove once client var handled better
}

function createAndInsert(table_commands){
	createTable(table_commands.create)
	insertInto(table_commands.insert)
}

function createTable(create_commands){
	client.query(create_commands, function(err, result){
  	helpers.handleErr(err, 'table creation', create_commands)
	});
}

function insertInto(insert_commands){
  client.query(insert_commands, function(err, result){
  	helpers.handleErr(err, 'row insertion', insert_commands)
  });
}

function query(query_text, cb){
	var result_obj = {}
  client.query(query_text, function(err, result){
  	helpers.handleErr(err, 'query', query_text)
  	result_obj.query = query_text;
  	result_obj.rows  = result.rows
  	cb(result_obj);
  })
}
function queries(query_texts, cb){
	var results = [],
			counter = 0;

	for (var i = 0; i < query_texts.length; i++){
		(function(query_text){
			var result_obj = {};
		  client.query(query_text, function(err, result){
		  	counter++;
		  	helpers.handleErr(err, 'query', query_text)
		  	result_obj.query = query_text;
		  	result_obj.rows = result.rows;
		  	results.push(result_obj);
		  	if (counter == query_texts.length){
			  	cb(results);
		  	}
		  })
		})(query_texts[i])
		
	}
}
query.each = function(query_text, cb){
	var query = client.query(query_text);
  query.on('row', function(row, result){
  	cb(row);
  })
}
queries.each = function(query_texts, cb){
	for (var i = 0; i < query_texts.length; i++){
		(function(query_text){
			var result_obj = {};
		  client.query(query_text, function(err, result){
		  	helpers.handleErr(err, 'query', query_text)
		  	result_obj.query = query_text;
		  	result_obj.rows = result.rows;
		  	cb(result_obj)
		  })
		})(query_texts[i])
		
	}
}
module.exports = {
	connectToDb: connectToDb,
	createTable: createTable,
	insertInto: insertInto,
	createAndInsert: createAndInsert,
	query: query,
	queries: queries,
}


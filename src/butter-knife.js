var _           = require('underscore'),
		Client      = require('pg').Client;

// TODO
// Allow for smarter schema discovery: if current is row has null in that column, go to the next one
// Only print `query` during .each on the first row, else print `''`
// Maybe print query in verbose mode or something to make syntax nicer on callback
// Put some defaults for finding where your pg server is located, default to postgres@localhost/butter_knife, then postgres@localhost/
// A method for just creating commands either to console or to file
// Allow for option that creates a non temp table, and drops each time

var client,
		tables = [],
		conString = "pg://default_user:5432@localhost/postgres",
		err_preview_length = 100;

var helpers = {
	sqlizeType: function(type, value, key){
		var err;
		if (type == 'string'){
			return 'text'
		} else if (type == 'number'){
			return 'integer'
		} else if (value == null){ 
			err = 'You have a null value in your sample data column "' + key + '", which makes it hard to know what type of sql column to make. Try manually defining your schema instead.'; 
			throw err + '\n{ ' + key + ': ' + value + ' }' ;
		} else if (type == 'object'){
			if (_.isArray(value)){
				if (_.isObject(value[0]))       { return 'json'   } // If the arry's first child is an object, assume that it's an array of objects and thus json.
				if (typeof value[0] == 'string'){ return 'text[]' } // If it's text, then assume it's a list of strings.
				return 'integer[]'                                  // Otherwise, assume it's a list of integers. Sorry, no mixed type support.
 			} else { return 'json' }                              // If it's not an array, then it's an object and will be interpreted as json.
		} else if (type == 'boolean'){
			return 'boolean'
		}
	},
	describeColumns: function(data){
		var columns = [];
		_.each(data[0], function(value, key){
			var row_info = key + ' ' + helpers.sqlizeType(typeof value, value, key);
			columns.push(row_info)
		});
		return columns.join(',');
	},
	prepValuesForInsert: function(holder, data_row, quote_char){
		var arr_holder; // In case your value is an array, you'll want to run this function recursively to properly quote its values.
		if (!quote_char) {quote_char = '$$'}
		_.values(data_row).forEach(function(value){
			if (_.isString(value)){
				// Add `E` to escape
				holder.push(quote_char + value + quote_char)
			} else if (_.isUndefined(value) || _.isNull(value) || _.isNaN(value)){
				holder.push('NULL')
			} else if (_.isNumber(value)){
				holder.push(value)
			} else if (_.isArray(value)){
				arr_holder = [];
				arr_holder = helpers.prepValuesForInsert(arr_holder, value, '"');
				holder.push(quote_char + "{" + arr_holder + "}" + quote_char);
			} else if (_.isObject(value)){
				holder.push(quote_char + JSON.stringify(value) + quote_char)
			} else if (_.isBoolean){
				holder.push(value)
			} else {
				console.log('ERROR uncaught datatype', value, 'is', typeof value)
			}
		})
		return holder.join(',');
	},
	assembleValueInsertString: function(table_name, data){
	  var stmt ='INSERT INTO ' + table_name + ' (' + _.keys(data[0]).join(',') + ') VALUES ',
	      val_arr = [];
		for (var i = 0; i < data.length; i++){
			val_arr.push('(' + helpers.prepValuesForInsert([], data[i]) + ')');
		}
		stmt += val_arr.join(',');
		return stmt;
	},
	handleErr: function(err, msg, qt){
		var pos,
				err_text = 'Error in ' + msg;
		if (err){ 
			pos = Number(err.position);
			if (qt) {err_text += ':\n' + qt.substr(Math.max(0, pos - err_preview_length), Math.min(pos, err_preview_length)) + '^' + qt.substr(pos, Math.min(qt.length - pos, err_preview_length)) + '\n\n'} // Display the area where the query threw an error marked by a `^`. If the error occurs within the first fifty characters, make it start at the beginning of the string.
			console.error(err_text, err)	
			throw err
		}
	}
}

function connectToDb(){
	client = client || new Client(conString);
  client.on('drain', client.end.bind(client)); //disconnect client when all queries are finished
	client.connect(function(err){
  	helpers.handleErr(err, 'database connection');
	});
}

function createTableCommands(table_name, table_data, table_schema, cb){
	var create_table_text = 'CREATE TEMP TABLE ' + table_name + ' (uid BIGSERIAL PRIMARY KEY,' + ((table_schema) ? table_schema : helpers.describeColumns(table_data)) + ')';
	client.query(create_table_text, function(err, result){
  	helpers.handleErr(err, 'table creation', create_table_text)
	});
	var stmt = helpers.assembleValueInsertString(table_name, table_data);
  client.query(stmt, function(err, result){
  	helpers.handleErr(err, 'row insertion', stmt)
  });
}

function createTable(table_name, table_data, table_schema){
	connectToDb();
	createTableCommands(table_name, table_data, table_schema);
}

function query(query_text, cb){
  client.query(query_text, function(err, result){
  	helpers.handleErr(err, 'query', query_text)
  	cb(result.rows, query_text);
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
  	cb(row, query_text);
  })
}



module.exports = {
	createTable: createTable,
	query: query,
	queries: queries,
	connect: function(connection_string){
		conString = connection_string;
		return this;
	},
	errLength: function(length){
		err_preview_length = length;
		return this
	}
}


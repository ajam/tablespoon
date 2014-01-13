var _           = require('underscore'),
		Client      = require('pg').Client;

// TODO
// Only print `query` during .each on the first row, else print `''`
// Maybe print query in verbose mode or something to make syntax nicer on callback
// Put some defaults for finding where your pg server is located, default to postgres@localhost/butter_knife, then postgres@localhost/
// A method for just just inserting a file into postgres through node and through command line, temp table and not temp table.
// Allow for option that creates a non temp table, and drops each time
// Test date type
// Make `bk.queries` example

var client,
		tables = [],
		conString = "pg://postgres:5432@localhost",
		err_preview_length = 100,
		table_type = 'TEMP ',
		connected = false;

var helpers = {
	sqlizeType: function(value, key, data, i){
		var err;
		if (_.isString(value)){
			return 'text'
		} else if (_.isNumber(value)){
			return 'integer'
		} else if (_.isArray(value)){
				if (_.isObject(value[0])) { return 'json'   }    // If the array's first child is an object, assume that it's an array of objects and thus json.
				if (_.isArray( value[0])) { return 'text[]' }    // If it's text, then assume it's a list of strings.
				if (_.isNumber(value[0])) { return 'integer[]' } // If it's a number then integers
				if (_.isDate(  value[0])) { return 'date[]' }    // If date then dates. Unclear if this works
		} else if (_.isBoolean(value)){
			return 'boolean'
		} else if (_.isObject(value)){
			return 'json'
		} else if (_.isDate(value)){
			return 'date'
		} else if ((_.isNull(value) || _.isUndefined(value)) ){ 
			if (i < data.length - 1 ){ return null } // If it's not the last row then continue processing other rows. Else...
			err = 'Your column "' + key + '" doesn\'t contain any values. Please include a value in at least one row. Or, manually define your schema instead.'; 
			throw err + '\n{ ' + key + ': ' + value + ' }';
		}
	},
	describeColumn: function(columns, data, i){
		_.each(data[i], function(value, key){
			if (!columns[key]){
				columns[key] = helpers.sqlizeType(value, key, data, i)
			}
		})
		return columns
	},
	describeColumns: function(data){
		var columns = {},
				i = 0;
		this.describeColumn(columns, data, i)
		// If there are null values for that object, then try the next object
		while (_.values(columns).indexOf(null) != -1){
			i++
			this.describeColumn(columns, data, i)
		}
		return columns
	},
	columnTypesToString: function(data){
		var columns = this.describeColumns(data),
				column_types = [];
		_.each(columns, function(value, key){
			column_types.push(key + ' ' + value)
		})
		return column_types.join(',')
	},
	prepValuesForInsert: function(holder, data_row, quote_char){
		var arr_holder; // In case your value is an array, run this function recursively to properly quote its values.
		if (!quote_char) {quote_char = '$$'}
		_.values(data_row).forEach(function(value){
			if (_.isString(value)){
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
			} // Insert date support here.
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

function connectToDb(connection_string){
	connection_string = connection_string || conString;
	client = client || new Client(connection_string);
  client.on('drain', client.end.bind(client)); //disconnect client when all queries are finished
	client.connect(function(err){
  	helpers.handleErr(err, 'database connection');
	});
	connected = true;
}

function createTableCommands(table_name, table_data, table_schema){
	var table_commands = {};
	table_commands.create = 'CREATE ' + table_type + 'TABLE ' + table_name + ' (uid BIGSERIAL PRIMARY KEY,' + ((table_schema) ? table_schema : helpers.columnTypesToString(table_data)) + ')';
	table_commands.insert = helpers.assembleValueInsertString(table_name, table_data);
	return table_commands;
}

function createAndInsert(table_commands){
	client.query(table_commands.create, function(err, result){
  	helpers.handleErr(err, 'table creation', table_commands.create)
	});
  client.query(table_commands.insert, function(err, result){
  	helpers.handleErr(err, 'row insertion', table_commands.insert)
  });
}

function createTable(table_name, table_data, table_schema){
	if (!connected) connectToDb();
	var table_commands = createTableCommands(table_name, table_data, table_schema);
	createAndInsert(table_commands);
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
  	cb(row, query_text);
  })
}

module.exports = {
	createTable: createTable,
	query: query,
	queries: queries,
	createTableCommands: createTableCommands,
	connect: function(connection_string){
		connectToDb(connection_string);
		return this;
	},
	errLength: function(length){
		err_preview_length = length;
		return this
	},
	temp: function(type){
		if (!type) table_type = '';
		return this
	}
}


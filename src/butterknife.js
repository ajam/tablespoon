var fs          = require('fs'),
		_           = require('underscore'),
		Client      = require('pg').Client;

var defaults =  JSON.parse( fs.readFileSync(__dirname + '/db_config.json') );

var client,
		tables = [],
		conString = defaults.connection,
		err_preview_length = defaults.err_len,
		table_name_default = defaults.temp_name,
		table_type = 'TEMP ',
		connected = false,
		verbose = false;

function reportMsg(msg){
	if(verbose){
		console.log(msg)
	}
}

var helpers = {
	sqlizeType: function(value, key, data, i, j, arr_type){
		var err,
				arr_type = arr_type || undefined;
		if (_.isString(value)){
			return 'text'
		} else if (_.isNumber(value)){
			return 'numeric'
		} else if (_.isArray(value)){
			while (!arr_type){
				arr_type = this.sqlizeType(value[j], key, data, i, j, arr_type)
				j++
				console.log(j)
				if (!arr_type && j == value.length) { console.log('report null'); return null } // If that was the last node in the array and it's still null, return null to skip to the next object
			}
			if (arr_type == 'json') return arr_type
			return arr_type + '[]'
		} else if (_.isBoolean(value)){
			return 'boolean'
		} else if (_.isDate(value)){
			return 'date'
		} else if (_.isObject(value)){
			return 'json'
		} else if ((_.isNull(value) || _.isUndefined(value)) ){ 
			if (i < data.length - 1 ) return null  // If it's not the last row then continue processing other rows. Else...
			err = 'Your column "' + key + '" doesn\'t contain any values. Please include a value in at least one row. Or, manually define your schema instead.'; 
			throw err + '\n{ ' + key + ': ' + value + ' }';
		}
	},
	describeColumn: function(columns, data, i){
		_.each(data[i], function(value, key){
			var j = 0;
			if (!columns[key]){
				columns[key] = helpers.sqlizeType(value, key, data, i, j)
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
			column_types.push(key + ' ' + value.toUpperCase())
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
	assembleValueInsertString: function(data, table_name){
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
			// Display the area where the query threw an error marked by a `^`. 
			// If the error occurs within the first fifty characters, make it start at the beginning of the string.
			if (qt) {err_text += ':\n' + qt.substr(Math.max(0, pos - err_preview_length), Math.min(pos, err_preview_length)) + '^' + qt.substr(pos, Math.min(qt.length - pos, err_preview_length)) + '\n\n'} 
			console.error(err_text, err)	
			throw err
		}
	}
}

function connectToDb(connection_string){
	conString = connection_string || conString;
	client = client || new Client(conString);
	//disconnect client when all queries are finished
  client.on('drain', client.end.bind(client)); 
	client.connect(function(err){
  	helpers.handleErr(err, 'database connection');
	});
	connected = true;
}

function createTableCommands(table_data, table_name, table_schema){
	table_name = table_name || table_name_default;
	var table_commands = {};
	table_commands.create = 'CREATE ' + table_type + 'TABLE ' + table_name + ' (uid BIGSERIAL PRIMARY KEY,' + ((table_schema) ? table_schema : helpers.columnTypesToString(table_data)) + ')';
	table_commands.insert = helpers.assembleValueInsertString(table_data, table_name);
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

function createTable(table_data, table_name, table_schema){
	if (!connected) connectToDb();
	var table_commands = createTableCommands(table_data, table_name, table_schema);
	reportMsg(table_commands)
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
	connection: function(connection_string){
		if (!arguments.length) return conString
		conString = connection_string;
		return this;
	},
	// On error, if you want to display more of the query text, you can set the number of characters here.
	errLength: function(length){
		if (!arguments.length) return err_preview_length
		err_preview_length = length;
		return this
	},
	temp: function(type){
		if (!arguments.length) table_type = '';
		return this
	},
	verbose: function(state){
		if (!arguments.length) return verbose
		verbose = state;
		return this
	}
}


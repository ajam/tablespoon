var _           = require('underscore'),
		Client      = require('pg').Client;

var client,
		tables = [],
		conString = "pg://default_user:5432@localhost/postgres";

var helpers = {
	sqlizeType: function(type, value){
		if (type == 'string'){
			return 'text'
		} else if (type == 'number'){
			return 'integer'
		} else if (type == 'object'){
			if (_.isArray(value)){
				if (_.isObject(value[0]))       { return 'json'   } // If the arry's first child is an object, assume that it's an array of objects and thus json.
				if (typeof value[0] == 'string'){ return 'text[]' } // If it's text, then assume it's a list of strings.
				return 'integer[]'                                  // Otherwise, assume it's a list of integers. Sorry, no mixed type support.
 			} else { return 'json' }                               // If it's not an array, then it's an object and will be interpreted as json.
		}
	},
	describeColumns: function(data){
		var columns = [];
		_.each(data[0], function(value, key){
			var row_info = key + ' ' + helpers.sqlizeType(typeof value, value);
			columns.push(row_info)
		});
		return columns.join(',');
	},
	prepValuesForInsert: function(holder, data_row, quote_char){
		var arr_holder = []; // In case your value is an array, you'll want to run this function recursively to properly quote its values.
		if (!quote_char) {quote_char = '\''}
		_.values(data_row).forEach(function(value){
			if (_.isString(value)){
				// Add `E` to escape
				holder.push('E' + quote_char + value.replace(/"/g, '\\\"').replace(/'/g, '\\\'') + quote_char)
			} else if (_.isUndefined(value) || _.isNull(value) || _.isNaN(value)){
				holder.push('NULL')
			} else if (_.isNumber(value)){
				holder.push(value)
			} else if (_.isArray(value)){
				arr_holder = helpers.prepValuesForInsert(arr_holder, value, '"');
				holder.push("'{" + arr_holder + "}'");
			} else if (_.isObject(value)){
				holder.push(quote_char + JSON.stringify(value) + quote_char)
			} else if (_.isBoolean){
				holder.push(value)
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
		var pos;
		if (err){ 
			pos = Number(err.position);
			if (qt) {qt = 'QUERY EXCERPT:\n' + qt.substr(Math.max(pos - 50), 50) + '^' + qt.substr(pos, 50)} // Display the area where the query threw an error marked by a `^`. If the error occurs within the first fifty characters, make it start at the beginning of the string.
			return console.error(qt,'\n\nError in ' + msg + ':', err)	
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

function createTableCommands(table_name, table_data, cb){
	var create_table_text = 'CREATE TEMP TABLE ' + table_name + ' (uid BIGSERIAL PRIMARY KEY,' + helpers.describeColumns(table_data) + ')';
	client.query(create_table_text, function(err, result){
  	helpers.handleErr(err, 'table creation', create_table_text)
	});
	var stmt = helpers.assembleValueInsertString(table_name, table_data);
  client.query(stmt, function(err, result){
  	helpers.handleErr(err, 'row insertion', stmt)
  });
}

function createTableSync(table_name, table_data){
	connectToDb();
	createTableCommands(table_name, table_data);
}

function query(query_text, cb){
  client.query(query_text, function(err, result){
  	helpers.handleErr(err, 'query "' + query_text + '"')
  	cb(result.rows);
  })
}
query.each = function(query_text, cb){
	var query = client.query(query_text);
  query.on('row', function(row, result){
  	cb(row);
  })
}



module.exports = {
	// createTable: createTable,
	createTableSync: createTableSync,
	query: query,
	connect: function(connection_string){
		conString = connection_string;
		return this;
	}
}


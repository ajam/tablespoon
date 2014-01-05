var _           = require('underscore'),
		Client      = require('pg').Client;

var client,
		tables = [],
		conString = "postgres://mike:5432@localhost/postgres";

var helpers = {
	sqlizeType: function(type, value){

		if (type == 'string'){
			return 'text'
		} else if (type == 'number'){
			return 'integer'
		} else if (type == 'object'){
			if (_.isArray(value)){
				if (_.isObject(value[0])){
					return 'json'
				}
				if (typeof value[0] == 'string'){
					console.log('text_arr')
					return 'text[]'
				}
					console.log('int_arr')
				return 'integer[]'
			}
		}
	},
	describeColumns: function(data){
		var columns = [];
		_.each(data[0], function(value, key){
			var row_info = key + ' ' + helpers.sqlizeType(typeof value, value);
			columns.push(row_info)
		});
		return columns.join(',')
	},
	prepValuesForInsert: function(holder, data_row, quote_char){
		if (!quote_char) {quote_char = '\''}
		_.values(data_row).forEach(function(value){
			if (typeof value == 'string'){
				holder.push(quote_char + value + quote_char)
			} else if (typeof value == 'number'){
				holder.push(value)
			} else if (_.isArray(value)){
				var arr_holder = []
				arr_holder = helpers.prepValuesForInsert(arr_holder, value, '"');
				holder.push("'{" + arr_holder + "}'");
			}
		})
		return holder.join(',')
	},
	assembleValueInsertString: function(table_name, data){
	  var stmt ='INSERT INTO ' + table_name + ' (' + _.keys(data[0]).join(',') + ') VALUES ';

	  var val_arr = [];
		for (var i = 0; i < data.length; i++){
			val_arr.push('(' + helpers.prepValuesForInsert([], data[i]) + ')');
		}
		stmt += val_arr.join(',');
		return stmt;
	}
}



function addTable(tn){
	tables.push(tn)
}

function connectToDb(){
	client = client || new Client('pg://mike:5432@localhost/postgres'); //will use defaults
  client.on('drain', client.end.bind(client)); //disconnect client when all queries are finished
	client.connect();
}

function handleError(err){
	if (err){ return console.error('Error:', err)	}
}



function createTableCommands(table_name, table_data, cb){
	client.query('CREATE TEMP TABLE ' + table_name + ' (uid BIGSERIAL PRIMARY KEY,' + helpers.describeColumns(table_data) + ')');

	var stmt = helpers.assembleValueInsertString(table_name, table_data);
  client.query(stmt)
}

function createTableSync(table_name, table_data){
	connectToDb();
	createTableCommands(table_name, table_data);
}

function query(query_text, cb){
  client.query(query_text, function(err, result){
  	handleError(err)
  	cb(result.rows)
  })
}
query.each = function(query_text, cb){
	var query = client.query(query_text);
  query.on('row', function(row, result){
  	cb(row)
  })
}



module.exports = {
	// createTable: createTable,
	createTableSync: createTableSync,
	query: query
}


var fs          = require('fs'),
		_           = require('underscore'),
		sqlite      = require('./sqlite.js'),
		pgsql       = require('./pgsql.js'),
		colors      = require('colors');

function loadConfig(){
	var user_config   = __dirname + '/config.json',
	    sample_config = __dirname + '/config.sample.json';
	if (fs.existsSync(user_config)){
		return fs.readFileSync(user_config)
	}else{
		return fs.readFileSync(sample_config)
	}
}

function reportMsg(msg){
	if(verbose){
		console.log(msg)
	}
}

var defaults =  JSON.parse( loadConfig() );

var client,
		tables = [],
		flavor = defaults.flavor,
		conString = defaults.connection,
		table_name_default = defaults.db_name,
		table_type = 'TEMP ',
		connected = false,
		verbose = false;

var helpers = {
	isHash: function(val){
		if (!_.isDate(val) && !_.isBoolean(val) && !_.isArray(val) && !_.isFunction(val) && _.isObject(val)){
			return true
		}else{
			return false
		}
	},
	sqlizeType: function(value, j, arr_type){
		var err,
				arr_type = arr_type || undefined;
		if (_.isString(value)){
			return 'text'
		} else if (_.isNumber(value)){
			return 'numeric'
		} else if (_.isArray(value)){
			while (!arr_type){
				arr_type = this.sqlizeType(value[j], j, arr_type)
				j++
				if (!arr_type && j == value.length) { return null } // If that was the last node in the array and it's still null, return null to skip to the next object
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
			return null
		}
	},
	describeColumn: function(columns, data, i){
		_.each(data[i], function(value, key){
			var j = 0;
			if (!columns[key]){
				columns[key] = helpers.sqlizeType(value, j)
			}
		})
		return columns
	},
	checkColumnsForNulls: function(cols){
		null_idx = _.values(cols).indexOf(null);
		if (null_idx != -1){
			var key = _.keys(cols)[null_idx];
			throw new Error('The column "' + key.magenta + '" doesn\'t contain any values. Please include a value in at least one row. Or, instead, manually define your schema.'); 
		}
		return true
	},
	describeColumns: function(data){
		var columns = {},
				i = 0,
				null_idx;
		this.describeColumn(columns, data, i)
		// If there are null values for that object, then try the next object until you run out of null or run out of objects to test
		while (_.contains(_.values(columns), null) && i < data.length){
			i++
			this.describeColumn(columns, data, i)
		}
		// If there is still a null value after the looping, it means one column doesn't have any value at all
		// Throw an error because we can't create the table without known the column types
		this.checkColumnsForNulls(columns);
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
	escapeField: function(value, quote_char){
		if (flavor == 'sqlite'){
			if (!quote_char) quote_char = "'"
			return quote_char + value.replace(/'/g, "''") + quote_char
		} else if (flavor == 'pgsql'){
			if (!quote_char) quote_char = "$$"
			return quote_char + value + quote_char
		}
	},
	prepValuesForInsert: function(holder, data_row, quote_char){
		var arr_holder, // In case your value is an array, run this function recursively to properly quote its values.
				test_val;
		_.values(data_row).forEach(function(value){
			if (_.isString(value)){
				holder.push(helpers.escapeField(value, quote_char))
			} else if (_.isUndefined(value) || _.isNull(value) || _.isNaN(value)){
				holder.push('NULL')
			} else if (_.isNumber(value)){
				holder.push(value)
			} else if (_.isArray(value)){
				test_val = value[0];
				// If it's not a hash then run the values recursively through this function to quote them according to their type
				// if it is a hash then just add that whole blob as stringified json
				if ( !helpers.isHash(test_val) ){
					arr_holder = [];
					arr_holder = helpers.prepValuesForInsert(arr_holder, value, '"');
					holder.push( helpers.escapeField("{" + arr_holder + "}") );
				}else{
					holder.push(helpers.escapeField(JSON.stringify(value), quote_char))
				}
			} else if (_.isBoolean(value)){
				holder.push(value)
			} else if (_.isObject(value)){
				holder.push(helpers.escapeField(JSON.stringify(value), quote_char))
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
	}
}

function setSqlite(connection_string){
	flavor = 'sqlite';
	if (!connection_string) connection_string = ':memory:';
	connectToDb(connection_string);
	return this;
}

function setPgsql(connection_string){
	flavor = 'pgsql';
	connectToDb(connection_string);
	return this;
}

function connectToDb(connection_string){
	conString = connection_string || conString;
	if (flavor == 'sqlite'){
		client = sqlite.connectToDb();
	} else if (flavor == 'pgsql'){
		client = pgsql.connectToDb(conString)
	}
	connected = true;
}

function createTableCommands(table_data, table_name, table_schema, permanent){
	setTableType(permanent);
	table_name = table_name || table_name_default;
	var table_commands = {};
	table_commands.create = 'CREATE ' + table_type + 'TABLE ' + table_name + ' (uid ' + ((flavor == 'sqlite') ? 'INTEGER' : 'BIGSERIAL') + ' PRIMARY KEY,' + ((table_schema) ? table_schema : helpers.columnTypesToString(table_data)) + ')';
	table_commands.insert = helpers.assembleValueInsertString(table_data, table_name);
	return table_commands;
}

function createAndInsert(table_commands){
	if (!connected) connectToDb();
	if (flavor == 'sqlite'){
		sqlite.createAndInsert(table_commands)
	} else if (flavor == 'pgsql'){
		pgsql.createAndInsert(table_commands);
	}
}

function createTable(table_data, table_name, table_schema, permanent){
	var table_commands = createTableCommands(table_data, table_name, table_schema, permanent);
	reportMsg(table_commands)
	if (flavor == 'sqlite'){
		sqlite.createTable(table_commands.create)
	} else if (flavor == 'pgsql'){
		pgsql.createTable(table_commands.create)
	}
}

function insertInto(table_data, table_name){
	var table_commands = createTableCommands(table_data, table_name);
	reportMsg(table_commands)
	if (flavor == 'sqlite'){
		sqlite.insertInto(table_commands.insert)
	} else if (flavor == 'pgsql'){
		pgsql.insertInto(table_commands.insert)
	}
}

function makeTableFromData(table_data, table_name, table_schema, permanent){
	var table_commands = createTableCommands(table_data, table_name, table_schema, permanent);
	reportMsg(table_commands)
	createAndInsert(table_commands);
}

function query(query_text, cb){
	if (!connected) connectToDb();
	if (flavor == 'sqlite'){
		sqlite.query(query_text, function(result){
			cb(result)
		})
	} else if (flavor == 'pgsql'){
		pgsql.query(query_text, cb)
	}
}
function queries(query_texts, cb){
	if (!connected) connectToDb();
	if (flavor == 'sqlite'){

	}else if (flavor == 'pgsql'){
		pgsql.queries(query_texts, cb)
	}
}
query.each = function(query_text, cb){
	if (!connected) connectToDb();
	if (flavor == 'sqlite'){

	}else if (flavor == 'pgsql'){
		pgsql.query.each(query_text, cb)
	}

}
queries.each = function(query_texts, cb){
	if (!connected) connectToDb();
	if (flavor == 'sqlite'){

	}else if (flavor == 'pgsql'){
		pgsql.queries.each(query_text, cb)
	}
}

// Module option setters and getters
function setTableType(permanent){
	if (!arguments.length) return table_type;
	if (permanent) { table_type = '' } else { table_type = 'TEMP ' };
	return this
}
// On error, if you want to display more of the query text, you can set the number of characters here.
function setErrLength(length){
	if (!arguments.length) return err_preview_length
	err_preview_length = length;
	return this
}
function setLogging(bool){
	if (!arguments.length) return verbose
	verbose = bool;
	return this
}
function getFlavor(){
	return flavor
}
function getConString(){
	return conString
}
function getTableName(){
	return table_name_default
}

module.exports = {
	sqlite: setSqlite,
	pgsql: setPgsql,
	createTable: makeTableFromData,
	createEmptyTable: createTable,
	insert: insertInto,
	query: query,
	queries: queries,
	createTableCommands: createTableCommands,
	temp: setTableType,
	verbose: setLogging,
	flavor: getFlavor,
	connection: getConString,
	tableName: getTableName
}


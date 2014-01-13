#!/usr/bin/env node

var fs = require('fs'),
		bk = require('../src/butterknife.js'),
		optimist = require('optimist'),
		dsv = require('dsv');

var argv = optimist
  .usage('Usage: butterknife -i IN_FILE -f (csv|json|tsv|psv|DELIMITER) -n TABLE_NAME -o OUT_FILE -q "QUERY" -p (json|csv) -s "SCHEMA"')
  .options('h', {
    alias: 'help',
    describe: 'Display help',
    default: false
  })
  .options('i', {
    alias: 'in_file',
    describe: 'Input file',
    default: false
  })
  .options('f', {
    alias: 'format',
    describe: 'Input file format',
    default: false
  })
  .options('n', {
    alias: 'name',
    describe: 'Table name',
    default: 'butter_knife'
  })
  // .options('m', {
  //   alias: 'mode',
  //   describe: 'Table mode, either temporary, `temp`, or permanent table, `perm`.',
  //   default: 'temp'
  // })
  .options('o', {
    alias: 'out',
    describe: 'Out file',
    default: false
  })
  .options('q', {
    alias: 'query',
    describe: 'Query text. Must be quoted',
    default: false
  })
  .options('p', {
    alias: 'output_format',
    describe: 'Format of output file, csv or json',
    default: 'json'
  })
  .options('s', {
    alias: 'schema',
    describe: 'Manually define a table schema. Must be quoted',
    default: null
  })
  .check(function(argv) {
    if ( (argv['i'] || argv['in_file']) && (argv.q  || argv['query'])) throw new Error('What do you want to do?');
  })
  .argv;

if (argv.h || argv.help) return optimist.showHelp();

var file_name    = argv['i'] || argv['in_file'],
 		in_file      = ((file_name) ? parseFile(fs.readFileSync('./' + file_name)) : false),
 		format       = argv.f  || argv['format'],
		table_name   = argv.n  || argv['name'],
		mode         = argv.m  || argv['mode'],
 		out_file     = argv.o  || argv['out'],
 		query_text   = argv.q  || argv['query'],
 		out_format   = argv.of || argv['out_format'],
 		schema       = argv.s  || argv['schema'];

function discernFormat(file_name){
	var name_arr = file_name.split('\.')
	format_name = name_arr[name_arr.length - 1];
	return format_name
}

function writeQuery(result){
	if (out_format == 'json'){
		fs.writeFileSync(out_file, JSON.stringify(result))
	} else if (out_format == 'csv'){
		fs.writeFileSync(out_file, dsv.csv.format(result))
	}
}

function parseDsv(delimit_char){
	var parser = dsv(delimit_char);
	return parser(in_file.toString())
}

function parseFile(in_file){
	if (!format) {format = discernFormat(file_name) }
	if (format == 'json'){
		in_file = JSON.parse(in_file)
	} else if (format == 'csv') {
		in_file = dsv.csv.parse(in_file.toString())
	} else if (format == 'tsv') {
		in_file = parseDsv('\t')
	} else if (format == 'psv') {
		in_file = parseDsv('|')
	} else {
		in_file = parseDsv(format)
	}
	return in_file
}


function queryDb(){
	if (in_file){
	// if (mode == 'perm') { bk.temp(false) }
		bk.createTable(table_name, in_file, schema)
	}else{
		bk.connect()
	}
	bk.query(query_text, function(result){
		if (!out_file){
			console.log(result)
		}else{
			writeQuery(result)
		}
	})
}

function writeCommands(){
	var commands_obj = bk.createTableCommands(table_name, in_file, schema),
	        commands = commands_obj.create + '; ' + commands_obj.insert;
	if (!out_file){
		console.log(commands)
	} else {
		console.log('Writing commands to "' + out_file + '"')
		fs.writeFileSync(out_file, commands)
	}
}

if (query_text){
	queryDb();
}else{
	writeCommands();
}





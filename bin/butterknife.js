#!/usr/bin/env node

var fs = require('fs'),
		bk = require('../src/butterknife.js'),
		optimist = require('optimist'),
		dsv = require('dsv'),
		exec = require('child_process').exec,
		sys = require('sys');

var argv = optimist
  .usage('Usage: butterknife IN_FILE -f (json|csv|dsv) -n TABLE_NAME -m (TEMP|PERM) -d (\'\t\'|\'|\') -o OUT_FILE -q \"QUERY\" -of (JSON|CSV)')
  .options('h', {
    alias: 'help',
    describe: 'Display help',
    default: false
  })
  .options('f', {
    alias: 'format',
    describe: 'Input file format',
    default: 'csv'
  })
  .options('n', {
    alias: 'name',
    describe: 'Table name',
    default: 'tbl'
  })
  .options('m', {
    alias: 'mode',
    describe: 'Table mode, either temporary (TEMP) or permanent table (PERM)',
    default: 'TEMP'
  })
  .options('d', {
    alias: 'delimiter',
    describe: 'If `dsv` is chosen, select your delimiter.',
    default: '|'
  })
  .options('o', {
    alias: 'out',
    describe: 'Out file',
    default: false
  })
  .options('q', {
    alias: 'query',
    describe: 'Query text',
    default: false
  })
  .options('of', {
    alias: 'out_format',
    describe: 'Format of output file, CSV or JSON',
    default: 'JSON'
  })
  .check(function(argv) {
    if (argv._.length < 1) throw new Error('IN_File must be specified.');
  })
  .argv;

if (argv.h || argv.help) return optimist.showHelp();

var in_file      = fs.readFileSync('./' + argv._[0]),
 		format       = argv.f || argv['format'],
		table_name   = argv.n || argv['name'],
		mode         = argv.m.toUpperCase() || argv['mode'.toUpperCase()],
 		delimiter    = argv.d || argv['delimiter'],
 		out_file     = argv.o || argv['out'],
 		query_text   = argv.q || argv['query'],
 		out_format   = argv.of || argv['out_format'],
 		parser;

if (format == 'json'){
	in_file = JSON.parse(in_file)
} else if (format == 'csv') {
	in_file = dsv.csv.parse(in_file.toString())
} else if (format == 'dsv') {
	parser  = dsv(delimiter);
	in_file = parser(in_file.toString());
}

if (mode == 'PERM') {
  bk.temp(false);
}

function writeQuery(result){
	out_format = out_format.toUpperCase()
	if (out_format == 'JSON'){
		fs.writeFileSync(out_file, JSON.stringify(result))
	} else if (out_format == 'CSV'){
		fs.writeFileSync(out_file, dsv.csv.format(result))
	}
}

var commands_obj,
		commands    

if (query_text){
	bk.createTable(table_name, in_file)
	bk.query(query_text, function(result){
		if (!out_file){
			console.log(result)
		}else{
			writeQuery(result)
		}
	})
}else{
	commands_obj = bk.createTableCommands(table_name, in_file);
	commands     = commands_obj.create + ' ' + commands_obj.insert;
	if (!out_file){
		console.log(commands)
	} else {
		console.log('Writing commands to "' + out_file + '"')
		fs.writeFileSync(out_file, commands)
	}
}





# Butterknife

A wrapper around [node-postgres](https://github.com/brianc/node-postgres) to easily create and query a table from a local json or csv file.

## Usage

### Within Node.js

````
var bk = require('../src/butter-knife.js').connection('pg://postgres@localhost/');

var data = [
	{
		city: "New York",
		temp: [0,35],
		country: 'USA'
	},
	{
		city: 'Los Angeles',
		temp: [15,35],
		country: 'USA'
	},
	{
		city: 'Paris',
		temp: [2,33],
		country: 'France'
	},
	{
		city: 'Marseille',
		temp: [5,27],
		country: 'France'
	},
	{
		city: 'London',
		temp: [2,25],
		country: 'UK'
	}
]

bk.createTable(data, 'cities')

// Get the rows that don't have 15
bk.query('SELECT * FROM cities WHERE 15 != ALL (temp)', function(rows){
	console.log(rows)
	/*[
	  { uid: '1', city: 'New York',     temp: [ 0, 35 ], country: 'USA' },
	  { uid: '3', city: 'Paris',        temp: [ 2, 33 ], country: 'France' },
	  { uid: '4', city: 'Marseille',    temp: [ 5, 27 ], country: 'France' },
	  { uid: '5', city: 'London',       temp: [ 2, 25 ], country: 'UK' } ]*/
})
````

#### Optional setup

Config options will be taken from `config.sample.json` and work out of the box with those settings. If you want, you can alter them by copying and renaming `config.sample.json` to `config.json`.

The options:

* `connection:` Database connection string. The location of your PostgreSQL database. [Read more about database connections](#about-database-connections). Defaults to `pg://postgres:5432@localhost/`.
* 'err_len:' The number of characters of your query to display before and after an error occurrs. Set to a higher number if you want to see more context around errors. The point of error will appear with a `^`. Defaults to `100`.
* 'db_name:' The name of the database, if none specified. Defaults to `bk`.

#### Methods

##### Table creation methods

__connection__ _.connection(dbConnectionString)_

Connects Butterknife to your PostgreSQL database. Connection defaults to `pg://postgres:5432@localhost/` and can be configured through `config.json`. [Read more about database connections](#about-database-connections).

__createTable__ _.createTable(dataobject, [tablename], [tableschema], [permanent])_

Syncronously creates a table in your PostgreSQL database. Optionally pass in a __tablename__ (default `bk`) or a __tableschema.__ By default, Butterknife will attempt to read the datatypes in your object. TODO Here's a list of supported datatypes and how they are mapped to SQL datatypes. By default, Butterknife will create a temporary table that exists only for this session. To instead create a permanent table, pass in `true` as boolean to __permanent__.

__createTableCommands__ _.createTableCommands(dataobject, [tablename], [tableschema], [permanent])_

Returns a json object with two keys `create` and `insert` that contain the sql commands to make the table from your data. This method does not actually create your table. Useful if you find datatypes or create and insert statements tedious. Used internally by `.createTable`.

__errLength__ _.errLength(integer)_

Also settable via `config.json`, this will set the number of characters of your query to display in an error message. The point of error will appear with a `^`. Useful if you want to debug an error without globally changing it for the whole module. Defaults to `100`.

##### Query methods

__query__ _.query(queryString, function)_

Queries the database and returns a json object with the query text and the resulting rows.

````
bk.query('SELECT * FROM cities LIMIT 2', function(result){
	console.log(result)
	/*
	{ query: 'SELECT * FROM cities LIMIT 2',
	  rows:
	   [ { uid: '1', city: 'New York', temp: [Object], country: 'USA' },
	     { uid: '2', city: 'Los Angeles', temp: [Object], country: 'USA' } 
     ] 
  }
  */
})
````

__query.each__ _.query.each(queryString, function)_

Same as `.query` except it returns the resulting rows one by one.

````
bk.query.each('SELECT * FROM cities LIMIT 2', function(row){
	console.log(row)
	/*
	{ uid: '1', city: 'New York', temp: [Object], country: 'USA' },
	{ uid: '2', city: 'Los Angeles', temp: [Object], country: 'USA' } 
  */
})
````

__queries__ _.queries(list, function)_

Takes a list of query strings, processes them synchronously and returns them in an array of objects. Each object has the same structure as the result object from `.query`

````
var queries = [
	'SELECT * FROM cities LIMIT 1',
	'SELECT * FROM cities LIMIT 1 OFFSET 1',
]
bk.queries(queries, function(result){
	console.log(result)
/*	[
  {
    "query": "SELECT * FROM cities LIMIT 1",
    "rows": [
      {
        "uid": "1",
        "city": "New York",
        "temp": [
          0,
          35
        ],
        "country": "USA"
      }
    ]
  },
  {
    "query": "SELECT * FROM cities LIMIT 1 OFFSET 1",
    "rows": [
      {
        "uid": "2",
        "city": "Los Angeles",
        "temp": [
          15,
          35
        ],
        "country": "USA"
      }
    ]
  }
]
*/
````

__queries.each__ _.queries.each(list, function)_

The same as `.queries` except the callback is invoked after each query is finished as opposed to waiting for them all to finish.

## Command line

````
butterknife -i IN_FILE 
	    -f (csv|json|tsv|psv|DELIMITER) 
	    -n TABLE_NAME 
	    -o OUT_FILE 
	    -q "QUERY" 
	    -s "SCHEMA 
	    -m (create)"
````

__Note: All commands on the database are run with `CREATE TEMP TABLE` so as not to alter your existing PostgreSQL tables.__ Only if you specify `-m create` will a table be added to your database outside of this query session. To delete a table, run `butterknife -q "DROP TABLE <table_name>;"`

### So you want to..

#### Print sql commands

* Specify the `IN_FILE` with `-i`. 

Optionally:

* Specify an input file format or custom delimeter with `-f`. If you don't, Butterknife will attempt to read the file extension -- supports `csv`, `json`, `tsv` and `psv` (pipe-separated values).
* Specify a table name with `-n`. Defaults to `bk` if nothing specified.
* Specify an output file with `-o`. If you don't, sql commands will print to the console.
* Specify a schema with `-s`. If you don't, Butterknife will attempt to read your schema from the specified input file.

#### Query a data file

* Specify the `IN_FILE` with `-i`. 
* Specify the query with `-q`, e.g. `-q "SELECT * FROM butterknife;"`

Optionally:

* Specify an input file format or custom delimeter with `-f`. If you don't, Butterknife will attempt to read the file extension -- supports `csv`, `json`, `tsv` and `psv` (pipe-separated values).
* Specify a table name with `-n`. Defaults to `bk` if nothing specified.
* Specify an output file with `-o`. Name must end in either `.csv` or `.json`. This extension will determine the format of your file. If `-o` not specified, your query result will print to the console.
* Specify a database connection with `-c`. Defaults to `pg://postgres:5432@localhost`. [Read more about database connections](#about-database-connections).


#### Create a table in your PostgreSQL database from a file, optionally querying it

* Specify the `IN_FILE` with `-i`.
* Specify the mode as `create` with `-m create`.

Optionally:

* Specify an input file format or custom delimeter with `-f`. If you don't, Butterknife will attempt to read the file extension -- supports `csv`, `json`, `tsv` and `psv` (pipe-separated values).
* Specify a table name with `-n`. Defaults to `bk` if nothing specified.
* Specify a schema with `-s`. If you don't, Butterknife will attempt to read your schema from the specified input file.
* Specify a query, see "Query an existing PostgresSQL table" for options.
* Specify a database connection with `-c`. Defaults to `pg://postgres:5432@localhost`. [Read more about database connections](#about-database-connections).

#### Query an existing PostgreSQL table

* Specify the query with `-q`, e.g. `-q "SELECT * FROM butterknife;"`

Optionally:

* Specify an output file with `-o`. Name must end in either `.csv` or `.json`. This extension will determine the format of your file. If `-o` not specified, your query result will print to the console.
* Specify a database connection with `-c`. Defaults to `pg://postgres:5432@localhost`. [Read more about database connections](#about-database-connections).


## About database connections

Butterknife defaults to the database at `pg://postgres:5432@localhost`, which gives it acess to the main database of your PostgreSQL installation. In order to better sandbox your Butterknife projects, you might want to create a separate database called `butterknife`. To do this, log into psql by running `psql` on the command line and run `CREATE DATABASE butterknife`. 

Then specify your default connection in `config.json` to `pg://postgres:5432@localhost/butterknife`. To override this, you can set `bk.connection(<new_connection_string>)` when using Butterknife through nodejs or through `-c <new_connection_string>` through the command line.

You could also obviously set up a different user as well if you don't want to give Butterknife root access. If you have a user called, `mike` that owns a database `butterknife`, your connection string would be `pg://mike:5432@localhost/butterknife`

## TODOs
* Support sqlite, allow that to be configured via `config.json` or through nodejs api.
* Tests for cli
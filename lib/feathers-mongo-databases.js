var async = require('async');

/**
 * A feathers service to manage CRUD on MongoDB databases.
 * Pass in a connected MongoClient and it will allow you to create,
 * read, update, and delete databases on the client.
 */
module.exports = function(db, scope) {

	var adminDB = db.admin();

	var dbService = {

		setup: function(app) {
			this.db = db;
			this.service = app.service.bind(app);
		},

		// Scope is either 'server' or 'database'.
		// If scope is server, use adminDB, otherwise, it's a single db.
		scope:scope,
		find: function(params, callback) {

			console.log('find');

			var dbList = [];

	  	// Async function to add stats to each db.
	  	function addStats(database, cb){
  			// If a databaseName is present, it's a single db.  No need to switch.
				var changeDB = database.databaseName ? database : db.db(database.name);

	  		// Get the stats
	  		changeDB.stats(function(err, stats){
	  			// Remove 1 from collection count, unless it's zero. Not sure why it's 1 off.
	  			if (stats.collections) {
		  			stats.collections--;
	  			}

	  			// Add the db name as the _id
	  			stats._id = stats.db;
	  			stats.name = stats.db;

	  			// Rename collections to avoid collisions on the client app.
	  			stats.collectionCount = stats.collections;
	  			delete stats.collections;
	  			// Add the stats to the corresponding database.
	  			dbList.push(stats);
		  		cb(null, database);
	  		});
	  	}

	  	// If scope is server, we have multiple database access.
			if (scope === 'server') {
				// Get a list of all databases on the server.
			  adminDB.listDatabases(function(err, dbs){

			  	async.each(dbs.databases, addStats, function(err){
		  	    if (err) {
		  	    	console.log(err);
		  	    	return callback(err);
		  	    } else {
		  	    	dbList.sort(function(a, b){
		  	    		return a.db.toLowerCase().localeCompare(b.db.toLowerCase());
		  	    	});
						  callback(null, dbList);
		  	    }
			  	});
			  });

			// We only have access to one database.
			} else {
				addStats(db, function(err){
					if (err) {
					  return callback(err);
					}
				  return callback(null, dbList);
				});
			}

		},

		create: function(data, params, callback) {
			if (!data.name) {
				return callback({error:'name is required'});
			}
			db.db(data.name);

			// Create dummy stats. Use the db name as the _id.
			data = {
				_id: data.name,
		    db: data.name,
		    objects: 0,
		    avgObjSize: 0,
		    dataSize: 0,
		    storageSize: 0,
		    numExtents: 0,
		    indexes: 0,
		    indexSize: 0,
		    fileSize: 0,
		    nsSizeMB: 0,
		    dataFileVersion: {},
		    ok: 1,
		    collectionCount: 0
		  };
			return callback(null, data);
		},

		update: function(id, data, params, callback) {
			console.log(data);
			callback(null, data);
		},

		remove: function(id, params, callback) {
			console.log(params);
			callback(null, id);
		}
	};

	return dbService;
};

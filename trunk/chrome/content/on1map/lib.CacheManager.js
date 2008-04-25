/* ****************************************************************************************************************************** */
function CacheManager(){
	/* A Namespace for cache stuff.
	Geocoding addresses to coordinates is expensive so the results are written to
	an internal database in key: value form where the address is the key and the value is a JSON object string.
	*/

	/* Thanks: http://simon-cozens.org/programmer/articles/xul-storage.pod
	 */
	 
	 this._conn = undefined;
}
CacheManager.prototype.getConn = function(){
	if (typeof(this._conn) === 'undefined'){
		var dserv = Components.classes["@mozilla.org/file/directory_service;1"]
		                      	.getService(Components.interfaces.nsIProperties);
		                      
		var storageService = Components.classes["@mozilla.org/storage/service;1"]
								.getService(Components.interfaces.mozIStorageService);
		 
		 // Here's where the file will end up in the profile directory
		 var usrfile = dserv.get("ProfD", Components.interfaces.nsIFile);
		 usrfile.append("on1map.db.sqlite");
		 	 
		// nsILocalFile extends nsIFile, the input into Storage Service Open Data Base call
		var ifile = Components.classes["@mozilla.org/file/local;1"]
								.createInstance(Components.interfaces.nsILocalFile);
		
		ifile.initWithFile( usrfile );
	 
		this._conn = storageService.openDatabase(ifile);
		
		// If this is the 1st run for this user, create the tables
		if (! this._conn.tableExists('app_cache')){
			this._conn.createTable('app_cache', ' name string not null primary key, value string not null ');
		}
	}
		
	return this._conn;
}
CacheManager.prototype.getItem = function( pKey){
	/* Args: pKey is case insensitive & trimmed of whitespace */
	var ret;
	var conn = this.getConn();
	pKey = $.trim( pKey.toUpperCase() );
	var statement = conn.createStatement("SELECT value FROM app_cache WHERE name = :name_param LIMIT 1");
	try {
		statement.bindUTF8StringParameter( statement.getParameterIndex(":name_param"), pKey );
		while (statement.executeStep()) {
 			ret = statement.getString(0);
		}
	} finally {
		statement.reset()
	}
	
	if( typeof (ret ) === 'undefined' ){
		throw 'Cache miss'
	}
	return ret;
}
CacheManager.prototype.setItem = function( pKey, pValue ){
	/* Args: pKey is case insensitive & trimmed of whitespace 
	 * 		 pValue is a string
	 */
	var conn = this.getConn();
	conn.beginTransactionAs( conn.TRANSACTION_DEFERRED );
	pKey = $.trim( pKey.toUpperCase() );
	
	var statement;
	try {
		statement = conn.createStatement("DELETE FROM app_cache WHERE name =  ?1 ");
		statement.bindStringParameter( 0,  pKey );
		statement.execute();
		statement = conn.createStatement("INSERT INTO app_cache (name, value) VALUES ( ?1 , ?2 ) ");
		statement.bindStringParameter( 0,  pKey );
		statement.bindStringParameter( 1, pValue );
		statement.execute();
	} catch(e){
		throw e
	}
	conn.commitTransaction();
}
CacheManager.prototype.delItem = function( pKey){
	/* Args: pKey is case insensitive & trimmed of whitespace 
	 * 		 pValue is a string
	 */
	var conn = this.getConn();
	conn.beginTransactionAs( conn.TRANSACTION_DEFERRED );
	pKey = $.trim( pKey.toUpperCase() );
	
	var statement;
	try {
		statement = conn.createStatement("DELETE FROM app_cache WHERE name =  ?1 ");
		statement.bindStringParameter( 0,  pKey );
		statement.execute();
	} catch(e){
		throw e
	}
	conn.commitTransaction();
}
CacheManager.prototype._checkKey = function( pKey ){
	if (pKey === undefined){ 
		throw 'CacheManager: key undefined'; 
	}
	if(typeof(pKey) === undefined){
		throw 'CacheManager: key undefined'; 
	}
	if(typeof(pKey) === undefined){
		throw 'CacheManager: key undefined'; 
	}
	if(typeof(pKey) === null){
		throw 'CacheManager: key null'; 
	}
	if(typeof(pKey) === ''){
		throw 'CacheManager: key empty string'; 
	}
	if(typeof(pKey) === undefined){
		throw 'CacheManager: key undefined'; 
	}
	
};
/*  Copyright (c) Greg Nicol 2008

	This file is part of Aliwal Geocoder.
	Aliwal Geocoder is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 2 of the License, or
	(at your option) any later version.
	
	Aliwal Geocoder is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.
	
	You should have received a copy of the GNU General Public License
	along with Aliwal Geocoder.  If not, see <http://www.gnu.org/licenses/>.
*/
function CacheManager(){
	/* A Namespace for cache stuff.
	 * Geocoding addresses to coordinates is expensive so the results are written to
	 * an internal database in key:value form where the address is the key and the value is a JSON object string.
	 * Thanks: http://simon-cozens.org/programmer/articles/xul-storage.pod
	 */
	 
	 this._conn = undefined;
}
CacheManager.prototype.getConn = function(){
	if (typeof(CacheManager.prototype._conn) === 'undefined'){
		try{
			jsdump('Creating CACHE Connection');
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
		 
			CacheManager.prototype._conn = storageService.openDatabase(ifile);
			
			// If this is the 1st run for this user, create the tables
			if (! CacheManager.prototype._conn.tableExists('app_cache')){
				CacheManager.prototype._conn.createTable('app_cache', ' name string not null primary key, value string not null ');
			}
		} catch(e){
			jsdump(e);
			throw e;
		}
	}
		
	return CacheManager.prototype._conn;
}
CacheManager.prototype.getItem = function( pKey){
	/* Args: pKey is case insensitive & trimmed of whitespace */
	this._checkKey( pKey );
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
	this._checkKey( pKey );
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
	/* Args: pKey is case insensitive. Leading and trailing whitespace is ignored.
	 */
	this._checkKey( pKey );
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
		throw 'CacheManager: key typeof undefined'; 
	}
	if(typeof(pKey) === null){
		throw 'CacheManager: key null'; 
	}
	if( $.trim(pKey) === ''){
		throw 'CacheManager: key empty string'; 
	}	
};
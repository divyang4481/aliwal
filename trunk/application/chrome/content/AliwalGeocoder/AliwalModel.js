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

function AliwalModel(){
	/** 
	 * The domain-specific representation of the information on which the application operates.
	 * i.e A collection of AliwalPlacemarks.
	 */

	// Private members
	var _pmarks = [];
	var _lc_cache; 				// a cache for labelCensus data
	var _ts_cache; 				// a cache for tagsetCensus data
	var _addedListeners = []; 	// Array of [pObj, pHandlerFunc] callbacks for when an AliwalPlacemark is added to the model
	var _geocodedListeners = [];// Array of [pObj, pHandlerFunc] callbacks for when an AliwalPlacemark is geocoded

	
	// Private method
	_fireAddedEvent = function( pPlacemark ){
		$.each(_addedListeners, function(idx, val_lnr){
			try{
				val_lnr[1].call(val_lnr[0], pPlacemark );
			} catch(e){
				// Ignore
			}
		});
	}

	// Privileged method
	this.addedListener = function(pObj, pHandlerFunc){
		/** 
		 * A barebones event registration for new Placemarks added to the model 
		 */
		_addedListeners.push( [pObj, pHandlerFunc] );
	}

	// Privileged method
	this.addPlacemark = function( pPlacemark ){
		/** 
		 * Add an AliwalPlacemark to the model
		 * Will also invalidate the caches so they are regenerated when next used.
		 * Privileged method
		 */
		_pmarks.push( pPlacemark );
		
		var undef;
		_lc_cache = undef;
		_ts_cache = undef;
	}
	
	// Privileged method
	this.labelCensus = function( pRegenerate ){
		/** 
		 * Returns a census of the pin labels aka column headings and caches results for future calls.
		 * Returned object is { labelname: count, ... }
		 * Privileged method  
		 */
		 if ( pRegenerate || typeof _lc_cache == 'undefined'){
		 	_lc_cache = new Object();
			 $.each(_pmarks, function(idx, placemark){
			 	$.each(placemark.getLabelledSet(), function( label_name, label_value){
			 		if ( typeof(_lc_cache[label_name]) === 'undefined' ){
			 			_lc_cache[label_name] = 1;	
			 		} else {
			 			_lc_cache[label_name]++;
			 		}
			 	});		 
			 });
		 };
		 return _lc_cache;
	}

	// Privileged method
	this.tagsetCensus = function( pRegenerate ){
		/** 
		 * Returns a census of tagsets and caches results for future calls.
		 * Returned object is { tagset: { tag: count}, ... }
		 * Privileged method
		 */
		if ( pRegenerate || typeof _ts_cache == 'undefined'){ 
			_ts_cache = new Object();
			$.each(_pmarks, function(idx, placemark){
				$.each(placemark.getTagsets(), function( key_tagset, val_tags){
					$.each(val_tags, function(idx, tag){
						if( typeof (_ts_cache[key_tagset]) === 'undefined'){ 
							_ts_cache[key_tagset] = {}; 
						};
						if( typeof (_ts_cache[key_tagset][tag]) === 'undefined'){ 
							_ts_cache[key_tagset][tag] = 1;
						} else {
							_ts_cache[key_tagset][tag]++;
						};
					});
				});
			});
		};
		return _ts_cache;
	}

	
	//Privileged method
	this.getGeocodedPlacemarks = function(){
		/**
		 * Map views can only handle geocoded placemarks
		 * This method returns an array of AliwalPlacemarks that DON'T need geocoding
		 */
		ret = new Array();
		$.each(_pmarks, function(idx, val_pm){
			if( val_pm.isGeocoded() ){
				ret.push(val_pm);
			}
		});
		return ret;
	}
		//Privileged method
	this.getUncodedPlacemarks = function(){
		/**
		 * Map views can only handle geocoded placemarks. 
		 * This mehtod returns and array of AliwalPlacemarks that need geocoding
		 */
		ret = new Array();
		$.each(_pmarks, function(idx, val_pm){
			if( !(val_pm.isGeocoded()) ){
				ret.push(val_pm);
			}
		});
		return ret;
	}
	
} //End of class


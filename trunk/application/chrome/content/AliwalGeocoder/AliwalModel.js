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

/**
 * @class
 * The domain-specific representation of the information on which the application operates.
 * i.e A collection of AliwalPlacemarks.
 */
function AliwalModel(){
	
	// Events	
	this.events = $({
	//  eventID:  'eventName' // Should match
		ModelPlacemarkAdded   : 'ModelPlacemarkAdded',
		ModelPlacemarkDeleted : 'ModelPlacemarkDeleted',
		ModelPlacemarkMoved   : 'ModelPlacemarkMoved',
		ModelPlacemarkGeocoded: 'ModelPlacemarkGeocoded'
    });

	// Private members
	var that = this;
	var _incOnly = 0;            // An increment only counter used to generate unique placemark ids
	var _pmarks = {};            // a hash of placemarks by their unique id.
	var _lc_cache;               // a cache for labelCensus data
	var _ts_cache;               // a cache for tagsetCensus data
	var _tsm_cache;              // a cache for tagset max counts data
	
	/** @private */
	var _nextUniqueID = function(){
		_incOnly++;
		return 'modelID_' + _incOnly;
	}
	
	// Privileged method
	this.addPlacemark = function( pPlacemark ){
		/** 
		 * Add an AliwalPlacemark to the model.
		 *
		 * Listens for AliwalPlacemarkMoved events from that placemark and 
		 * passes them on as ModelPlacemarkMoved events so that views don't have to listen to every marker.
		 * Will also invalidate the caches so they are regenerated when next used.
		 * Returns: A unique id string to address the placemark in the model.
		 * 
		 * Privileged method
		 */
		var _modelID = _nextUniqueID();
		_pmarks[ _modelID ] =  pPlacemark ;
		
		pPlacemark.events.bind( 'AliwalPlacemarkGeocoded', function( event, eventArg ){
			that.events.triggerHandler( that.events.attr('ModelPlacemarkGeocoded'), eventArg );
		});
		pPlacemark.events.bind( 'AliwalPlacemarkMoved', function( event, eventArg ){
			that.events.triggerHandler( that.events.attr('ModelPlacemarkMoved'), eventArg );
		});
		
		that.events.triggerHandler( that.events.attr('ModelPlacemarkAdded'), pPlacemark );
		
		var undef;
		_lc_cache = undef;
		_ts_cache = undef;
		
		return _modelID;
	}
	
	// Privileged method
	this.getPlacemark = function( pModelID ){
		return _pmarks[ pModelID ];
	}
	
	// Privileged method
	this.getPlacemarkIDs = function(){
		var retIDs = [];
		$.each(_pmarks, function(key_id, placemark){
			retIDs.push(key_id);
		});
		return retIDs;
	}
	
	// Privileged method
	this.delPlacemark = function( pModelID ){
		delete _pmarks[ pModelID ];
		that.events.triggerHandler( that.events.attr('ModelPlacemarkDeleted'), pModelID );
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
			 $.each(_pmarks, function(key_id, placemark){
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
	this.tagsetMaxTagCounts = function( pRegenerate ){
		/**
		 * Looking  across all Placemarks, returns the max number of tags in each tagset.
		 * Useful to know how many columns are needed when gridding tagset data
		 */
		if( pRegenerate || typeof _tsm_cache == 'undefined' ){
			_tsm_cache = new Object();
			$.each(_pmarks, function(key_id, placemark){
				$.each(placemark.getTagsets(), function(key_tagset, val_tags){
					if( typeof(_tsm_cache[key_tagset]) === 'undefined' ){
						_tsm_cache[key_tagset] = 0;
					};
					if ( val_tags.length > _tsm_cache[key_tagset] ){
						_tsm_cache[key_tagset] = val_tags.length;
					};
				});
			});
		}
		return _tsm_cache;
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
			$.each(_pmarks, function(key_id, placemark){
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
		var ret = new Array();
		$.each(_pmarks, function(key_id, val_pm){
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
		var ret = new Array();
		$.each(_pmarks, function(key_id, val_pm){
			if( !(val_pm.isGeocoded()) ){
				ret.push(val_pm);
			}
		});
		return ret;
	}
	
} //End of class


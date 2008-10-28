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
 * @fileOverview A collection of functions and objects to support the MVC pattern
 * @name AliwalMVC
 */

/**
 * @class 
 * An object to hold 1or more tagsets
 * { 'tagset_name', ['tag1','tag2','tag3'], ... } 
 */
function AliwalTagSet(){
}

/**
 * @class 
 * An object to hold label:data pairs
 * { 'label_name', 'label value', ...}
 */
function AliwalLabelledData(){
}

/**
 * @class 
 * An object for pin data.
 * Now emits jQuery events
 */
function AliwalPlacemark(){
	
	// Private members
	var that            	= this;
	var _labels 		= {};  	// type defn is AliwalLabelledData 
	var _tagsets 		= {}; 	// type defn is AliwalTagset
	var _latitude 		= null;  	
	var _longitude 		= null;
	var _geocodeAddress 	= null; // The address used for geocoding if lat & long not available
	var _geoHash; 			// Undefined
	
	// Events
	this.events = $({
	//  eventID:  'eventName' // Should match
		AliwalPlacemarkGeocoded : 'AliwalPlacemarkGeocoded',
		AliwalPlacemarkMoved    : 'AliwalPlacemarkMoved'
    });
    
	// Privileged method
	this.getLatitude = function(){
		return _latitude;
	};
	this.getLongitude = function(){
		return _longitude;
	};

	// Privileged method
	this.setLatitude = function(pLatitude){
		var wasGeocoded = this.isGeocoded();
		_latitude = pLatitude;
		if ( wasGeocoded ){
			that.events.triggerHandler( that.events.attr('AliwalPlacemarkMoved'), this );
		} else if( this.isGeocoded() ){
			that.events.triggerHandler( that.events.attr('AliwalPlacemarkGeocoded'), this );
		}
	};
	
	// Privileged method
	this.setLongitude = function(pLongitude){
		var wasGeocoded = this.isGeocoded();
		_longitude = pLongitude;
		if ( wasGeocoded ){
			that.events.triggerHandler( that.events.attr('AliwalPlacemarkMoved'), this );
		} else if( this.isGeocoded() ){
			that.events.triggerHandler( that.events.attr('AliwalPlacemarkGeocoded'), this );
		}
	};
	
	// Privileged method
	this.getGeocodeAddress = function(){
		return _geocodeAddress;
	};
	this.setGeocodeAddress = function(pGeocodeAddress){
		_geocodeAddress = pGeocodeAddress;
		that.events.triggerHandler( that.events.attr('AliwalPlacemarkMoved'), this );
	};
	
	// Privileged method
	this.addLabelledData = function( pLabel, pValue){
		/** 
		 * Set a label and it's value
		 */
		_labels[pLabel] = pValue;
	}
	
	// Privileged method
	this.getLabelledData = function( pLabel ){
		/** 
		 * Returns the value of a single labelled attribute 
		 */
		return _labels[ pLabel];
	}

	// Privileged method
	this.getLabelledSet = function(){
		/** 
		 * Returns an AliwalLabelledData() object 
		 */
		return _labels;
	}	
	// Privileged method
	this.addTag = function( pTagset, pTag){
		/** 
		 * Add a single tag. Not a tagset 
		 * ToDo: Needs duplicate handling
		 */
		if( !(_tagsets[pTagset] instanceof Array )){
			_tagsets[pTagset] = new Array();
		}
		_tagsets[pTagset].push(pTag);
	}
	
	// Privileged method
	this.getTagsets = function(){
		/** 
		 * Returns an AliwalTagset 
		 */
		return _tagsets;
	}

	// Privileged method
	// geohash.js
	// Geohash library for Javascript
	// (c) 2008 David Troy
	// Distributed under the MIT License
	this.geoHash = function( pRegenerate ){
		var BITS   = [16, 8, 4, 2, 1];
		var BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
		if(that.isGeocoded() ){
			if(pRegenerate || typeof _geoHash == 'undefined' ){
				var is_even=1;
				var i=0;
				var lat = []; var lon = [];
				var bit=0;
				var ch=0;
				var precision = 12;
				_geohash = "";

				lat[0] = -90.0; lat[1] = 90.0;
				lon[0] = -180.0; lon[1] = 180.0;

				while (_geohash.length < precision) {
					if (is_even) {
						mid = (lon[0] + lon[1]) / 2;
						if (that._longitude > mid) {
							ch |= BITS[bit];
							lon[0] = mid;
						} else
							lon[1] = mid;
					} else {
					mid = (lat[0] + lat[1]) / 2;
					if (that._latitude > mid) {
						ch |= BITS[bit];
						lat[0] = mid;
					} else
						lat[1] = mid;
					}

					is_even = !is_even;
					if (bit < 4)
						bit++;
					else {
						_geohash += BASE32[ch];
						bit = 0;
						ch = 0;
					}
				}
			}
			return _geohash;
		} else {
			throw 'geoHash() called on uncoded placemark';
		}
	}
}

// Public method
AliwalPlacemark.prototype.inBounds = function( pBounds){
	/** 
	 * Whether this placemark is inside pBounds.
	 * pBounds as from Yahoo map.getBoundsLatLon();
	 * Returns a boolean
	 */
	if (this.getLatitude() < pBounds.LatMax) {
		if (this.getLatitude() > pBounds.LatMin) {
		 	if (this.getLongitude() < pBounds.LonMax) {
		 		if (this.getLongitude() > pBounds.LonMin) {
					return true;
		 		}
		 	}
		}
	}
	return false;
}

// Public method
// ToDo: Make privieged and aware of edits to coords / geocoded address
AliwalPlacemark.prototype.isGeocoded = function(){
	/**
	 * Returns a boolean indicating whether there are valid latitude & longitude coordinates 
	 */
	if( !(isNaN(parseFloat(this.getLatitude()))) ){
		if( !(isNaN(parseFloat(this.getLongitude()))) ){
			if( (this.getLongitude() >= -180) && (this.getLongitude() <= 180) &&
				(this.getLatitude() >= -90 ) && (this.getLatitude() <= 90 )  ){
				return true;
			}
		}
	}
	
	return false;
}
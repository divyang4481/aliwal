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
 * Now emits yahoo events
 */
function AliwalPlacemark(){
	
	// Private members
	var _labels 		= {};  	// type defn is AliwalLabelledData 
	var _tagsets 		= {}; 	// type defn is AliwalTagset
	var _latitude 		= null;  	
	var _longitude 		= null;
	var _geocodeAddress = null; // The address used for geocoding if lat & long not available
	
	// Yahoo Events
	this.eventMoved = new YAHOO.util.CustomEvent("AliwalPlacemarkMoved", this); 
	
	// Privileged method
	this.getLatitude = function(){
		return _latitude;
	};
	this.setLatitude = function(pLatitude){
		_latitude = pLatitude;
		this.eventMoved.fire();
	};
	
	// Privileged method
	this.getLongitude = function(){
		return _longitude;
	};
	this.setLongitude = function(pLongitude){
		_longitude = pLongitude;
		this.eventMoved.fire();
	};
	
	// Privileged method
	this.getGeocodeAddress = function(){
		return _geocodeAddress;
	};
	this.setGeocodeAddress = function(pGeocodeAddress){
		_geocodeAddress = pGeocodeAddress;
		this.eventMoved.fire();
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
	this.geoHash = function(){
		// ToDo:
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
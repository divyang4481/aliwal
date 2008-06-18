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

EXPORTED_SYMBOLS = [ "xscopeNS" ]

var xscopeNS = {
	pinList 	: [],
	
	KML 		 : {},   // A KML DOM document
	pointMarkers : {},   // Hash of YMarker objects that are on the map, keyed by ymarker.id
	hiddenMarkers: {}, 	// Hash of hidden/filtered etc. markers
	errorMarkers : {}, 	// Hash of error markers.
	geoMarkers 	 : {}, 	// Hash of markers that need to be geocoded
	
	// Whole flags object should be passed because of pass by reference requirement
	flags		: { loadingData 			: false,
					scrollOnGeocodeSuccess 	: false,
					warnGeocodingError 		: true,
					warnPinCountError 		: true
				   } 
};

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
 * A map view - for the MVC pattern - that uses the Yahoo map API
 * Views AliwalPlacemark data on a Yahoo map.
 * Mapstraction not rich enough for current requirements
 * Creates the map markers and shuffles them between _hidMarkers & _visMarkers
 */
function AliwalViewYahoo( pAliwalModel, pDomMap ){

	// Private members
	var _dataModel = pAliwalModel;
	var _map;
	var _lastBounds;
	var _labelSel;
	var that = this;
						  // Hashes of YMarker objects with an additional member "placemark" of
						  // type AliwalPlacemark pointing back to the placemark the Marker represents.
						  // Addressed by the API assigned Marker.id 	
	var _hidMarkers = {}; // Markers not in bounds or filtered off of map.
	var _visMarkers = {}; // Markers that are currently visible, i.e. Not filtered and in map bounds.
	
	var _errPlacemarks = []; // Type: AliwalPlacemark. Special case for markers not yet geocoded.  
	
	var _filterTagsets = {}; // Type AliwalTagset 	
	
	// Yahoo Events
	this.eventDrawn             = new YAHOO.util.CustomEvent("ViewDrawn", this);
	this.eventPinDensityCeiling = new YAHOO.util.CustomEvent("ViewPinDensityCeiling", this);
	

	// Private method
	_buildPopupContents = function( pPlacemark ){
		/** 
		 * Build the contents of a marker popup window from an AliwalPlacemark
		 * returns html.
		 */
		var html;
	
		html = '<table class="marker_popup_table"><caption class="marker_popup_caption"></caption>';
		html += '<colgroup><col class="marker_popup_labelcol"/><col class="marker_popup_datacol"/></colgroup>';
		html += '<thead></thead><tfooter></tfooter><tbody class="marker_popup_tbody">';
		$.each( pPlacemark.getLabelledSet(), function(key_label, val_data){
			html += '<tr><th class="marker_popup_th">' + key_label + '&nbsp;</th>\n';
			html += '<td>' + val_data + '</td></tr>';
		});
		html += '</tbody></table>';	

		return html;
	}
	
	// Private method
	_isMarkerUnfiltered = function(pPlacemark, pFilterSets){
		/** 
		 * pFilterSets =    {  	'Tagset1': ['selected_filter1','selected_filter2','etc'],
		 * 						'Tagset2': ['another_selection1','another_selection2','etc'], 
		 * 					};
		 * Changed to AND tagsets but OR individual tags within a set
		 * If all tags present, the marker should, be shown so return true.
		 * Performance critical function.
		 */
		
		var tscount = 0;
		var foundOuter = true;
		var tsdata = pPlacemark.getTagsets(); // type is AliwalTagSet
		
		$.each(pFilterSets, function( filtagset, filtags ){
			tscount++;
			var foundInner = false;
			$.each(filtags, function(idx, itag ){
				if( typeof(tsdata[filtagset]) !== 'undefined'){
					if( $.inArray(itag, tsdata[filtagset]) >= 0 ){
						foundInner = true;
						return false ;// Found a tag for this set so break out of $.each(filtags, ...)
					}
				} else {
					return false; // marker doesn't have the necessary tagset, break out of $.each(filtags, ...)
				}
			});
			foundOuter = foundOuter && foundInner;
			return foundOuter; // Keep iterating through pFilterSets ?
		 });
		if(tscount === 0){
			// If there are no tagsets in the data, so there's no filtering
			return true;
		}
		//jsdump('Checking '+uneval(pFilterSets) +'\n against marker with tagdata: ' + uneval(pPlacemark.on1map_tagdata) + '\nreturning: ' + foundOuter );
		return foundOuter;
	}

	// Private method
	_drawMarkers = function( pBounds ){
		var visicount = 0;
		var errcount = 0;
		var totcount = 0;
		
		for( var idx in _errPlacemarks ){
			totcount++;
			// Run through _errPlacemarks to see if any are ready for promotion to Markers.
			if( _errPlacemarks[idx].isGeocoded() ){
				// Move them to _hidMarkers
				addPlacemark( _errPlacemarks[idx] );
				_errPlacemarks.splice(idx, 1); 
			}
		}
		
		for( var key in _visMarkers ){	
			if( _visMarkers[key].placemark.inBounds(pBounds)  
			  && _isMarkerUnfiltered(_visMarkers[key].placemark, _filterTagsets) ){
				// leave already visible,inBounds&unfiltered alone
				visicount++;
			} else {
				// Remove visible&(filtered or out of bounds ) to hidden
				//jsdump('Moving from visible to hidden: ' + _visMarkers[key].id );
				_hidMarkers[key] = _visMarkers[key];
				_map.removeOverlay(_visMarkers[key]);
				delete _visMarkers[key];
			}
		}
		try{	
			for( var key in _hidMarkers){
				if(    _hidMarkers[key].placemark.isGeocoded()  
			  		&& _hidMarkers[key].placemark.inBounds(pBounds) ){
					if( _isMarkerUnfiltered(_hidMarkers[key].placemark, _filterTagsets) ){
						if ( visicount < 200 ){
							//jsdump('Moving from hidden to visible: ' + _hidMarkers[key].id );
							visicount++;
							_visMarkers[key] = _hidMarkers[key];
							_map.addOverlay(_visMarkers[key]);
							delete _hidMarkers[key];	
						} else {
							throw 'Map density ceiling';
					 	}
					}
				}
			}
		} catch(e){
			that.eventPinDensityCeiling.fire();
			that.eventDrawn.fire();
		}
		that.eventDrawn.fire();
	}
	
	// Private method
	_setPinLabel = function( pMarker){
		if(!( _labelSel)){
			// Just use the 1st label for now
			var pml = _dataModel.labelCensus();
			for( _labelSel in pml ){
				break;
			}
		};
		var labelstr = '<div class="marker_label">' + pMarker.placemark.getLabelledData(_labelSel) + '</div>';
		pMarker.addAutoExpand(labelstr);
	}
	
	// Privileged method
	this.setPinLabels = function( pLabelAttrib ){
		/** 
		 * Takes a hash of enriched markers and sets their autoexpand / label to the
		 * AliwalPlacemark value named by pLabelAttrib
		 */
		_labelSel = pLabelAttrib;
		 
		$.each(_hidMarkers, function(key_id, val_marker){
			_setPinLabel(val_marker);
		});
		$.each(_visMarkers, function(key_id, val_marker){
			_setPinLabel(val_marker);
		});
	}
	
	//Privileged method
	this.addPlacemark = function( pPlacemark ){
		/** 
		 * Put an AliwalPlacemark into _hidMarkers.
		 * If it's missing coordinates, stick it into _errPlacemarks
		 */
		var geopoint;
		if( pPlacemark.isGeocoded() ) { 
			geopoint = new YGeoPoint( pPlacemark.getLatitude(), pPlacemark.getLongitude() );
			nm = new YMarker( geopoint );
			nm.placemark = pPlacemark;
			
			nm.smartWindowHtml = _buildPopupContents( pPlacemark );
			_hidMarkers[nm.id] = nm;

			// Sort out the marker popup window 				
			YEvent.Capture( nm, EventsList.MouseClick, function(){
					/* Scope of "this" will have changed to the YMarker object by the time this gets invoked. */
					this.openSmartWindow('<blink>Loading...</blink>');
					this.updateSmartWindow( this.smartWindowHtml );
			});
			
			// Sort out the marker hover label
			//_setPinLabel(nm); // This is now breaking the popup for no good reason. 

			  		
				
		} else {
			_errPlacemarks.push( pPlacemark );
		}
	}
	
	// Privileged method
	this.getCountVisiblePins = function(){
		 var ret = 0;
		 for(var m in _visMarkers){
		 	ret++;
		 }
		 return ret;
	}
	// Privileged method
	this.getCountHiddenPins = function(){
		/**
		 * Returns the number of Yahoo Markers not shown on the map, i.e out of bounds or filtered
		 */
		 var ret = 0;
		 for(var m in _hidMarkers){
		 	ret++;
		 }
		 return ret;
	}
	// Privileged method
	this.getCountErrorPins = function(){
		/**
		 * Return the number of AliwalPlacemarks that haven't been made into Markers and shown on 
		 * the map because of an error like missing coordinates. 
		 */
		return _errPlacemarks.length;
	}
	
	// Privileged method
	this.redraw = function(){
		/**
		 * A way for the controller to ask for a redraw
		 */
		_drawMarkers( _map.getBoundsLatLon() );
	}
	
	// Privileged method
	this.setFilterTagset = function( pAliwalTagset){
		/**
		 * Set the filters used to decide if a marker should be drawn.
		 * AliwalTagset members are named after the tagsets, their value is the array of selected tags 
		 * An empty array indicates a tagset with no selections. No tagsets implies no filtering at all.
		 */

		_filterTagsets = pAliwalTagset;
	}
		
	// Constructor
	_map = new YMap(document.getElementById(pDomMap));	// Will throw "YMap not defined" if internet not available.
														// ToDo: Catch and error msg, maybe alert('Check proxy settings');

	_map.addTypeControl(); 	
	_map.addZoomLong();    		
	_map.addPanControl();
	
	// It's important to center the map [some|any]where before adding any markers.
	var homeloc = new YGeoPoint(51.496439,-0.244269); //Goldhawk Road, London
	_map.drawZoomAndCenter( homeloc, 7);
	
	// Prime _hidMarkers from _dataModel ready for _drawMarkers
	$.each( _dataModel.getGeocodedPlacemarks(), function(idx, val_pm){
		try{
			that.addPlacemark( val_pm );
		} catch(e){
			throw e; 
			// ToDo:
			// Probably AliwalPlacemarks that are not yet geocoded
		}
	});

	_lastBounds = _map.getBoundsLatLon();
	_drawMarkers( _map.getBoundsLatLon() );
	
	// Capture events that require drawing
	YEvent.Capture(_map, EventsList.endMapDraw, function(resultObj) { 
		_drawMarkers( _map.getBoundsLatLon() );
	});
	YEvent.Capture(_map, EventsList.endPan, function(resultObj) { 
		_drawMarkers( _map.getBoundsLatLon() );
	});
	YEvent.Capture(_map, EventsList.endAutoPan, function(resultObj) { 
		var currb = _map.getBoundsLatLon();
		/* endAutoPan fires by popups even if the map hasn't moved when no need to redraw */
		if (uneval(_lastBounds) !== uneval(currb)){ 
			_drawMarkers( currb );
			_lastBounds = currb;
		}
	});
}

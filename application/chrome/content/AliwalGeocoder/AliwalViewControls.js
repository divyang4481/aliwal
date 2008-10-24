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
 * A view object - for the MVC pattern - that displays the tagset filters and pin label selector.
 * Creates a list box per tagset and one dropdown listbox for the label selector.
 */
AliwalViewControls = function(    pAliwalModel
								, pDivFilters
								, pDivPinLabel
								, pDivPinCounts
								, pDivPinCeiling
								, pDivGeocodingErr ){
	
	// Events
	this.events = $({
	//  eventID:  'eventName' // Should match
		ViewDrawn        : 'ViewDrawn',
		ViewLabelChange  : 'ViewLabelChange',
		ViewFilterChange : 'ViewFilterChange'
    });
	
	// Private members
	var _dataModel       = pAliwalModel;
	var _domFilters      = $( '#' + pDivFilters );
	var _domPinLabel     = $( '#' + pDivPinLabel );
	var _domPinCounts    = $( '#' + pDivPinCounts );
	var _domPinCeiling   = $( '#' + pDivPinCeiling );
	var _domGeocodingErr = $( '#' + pDivGeocodingErr );
	var tagsetnum = 0;
	var _feedbackPinCeiling;
	var _feedbackGeocodingErr;
	
	var that = this;
	
	// Private method
	_drawGeocodingErr = function(){
		_domGeocodingErr.empty();
		_domGeocodingErr.append( '<img id="img_feedback_geocoding_err" src="icons/geocoding_ok.png" />' );
		_feedbackGeocodingErr = $('#img_feedback_geocoding_err');
	};
	
	// Private method
	_drawPinCeiling = function(){
		_domPinCeiling.empty();
		_domPinCeiling.append( '<img id="img_feedback_pin_ceiling"   src="icons/pin_ceiling_ok.png" />' );
		_feedbackPinCeiling = $('#img_feedback_pin_ceiling');
	};
	
	
		 
	// Private method
	_drawPinLabelSelector = function(){
		/** Args: The string id of the div to draw the label selector in.
		 */
		var labelCensus = _dataModel.labelCensus();
		_domPinLabel.empty();
		var empty = true;
		var sel = '<SELECT id="sel_change_pin_label">';
		for( var lbl in labelCensus ){ // FOR ... IN iterates members
			sel += '<OPTION>'+lbl+'</OPTION>\n';
			empty = false;
		};
		sel += '</SELECT>';
		
		if(  empty ){
			_domPinLabel.append('<div class="warn">No data</div>');
		} else {
			_domPinLabel.append( sel );
		}
		$('#sel_change_pin_label').bind( 'change', function(){
			that.events.triggerHandler( that.events.attr('ViewLabelChange') );
		});
	};
	
	// Private method
	_drawTagsetFilters = function(){	
		var pinTagSets = _dataModel.tagsetCensus();
		var html = '<table id="tbl_filters"></table>';
		_domFilters.empty();
		_domFilters.append(html);
	
	 	var filcnt = 0;
		$.each( pinTagSets, function(tagset, tags){
			html = '<tr><td id="divFilter_' + filcnt + '"></td></tr>';
			$('#tbl_filters').append(html);
			_drawFilter('#divFilter_' + filcnt, tagset, pinTagSets );
			filcnt++;
		});
		$('.tagset_filter').bind('change', function(){
			that.events.triggerHandler( that.events.attr('ViewFilterChange') );
		});
	};
	
	// Private method
	_drawFilter = function( pDivId, pTag, pTagData ){
		/** Draws a filter for a tagset. Where to draw it is pDivId, which tagset is pTag.
		 */
		var div = $( pDivId );
		div.empty();
		var labl = '<label class="label_sub">' + pTag + '</label>';
		div.append(labl);
		
		var options = [];
		$.each( pTagData[pTag], function(key,val){
			options.push( '<OPTION value="'+key+'">'+key+'     ('+pTagData[pTag][key]+')</OPTION>\n');
		});
		options.sort();
		options.unshift('<OPTION class="tagset_selectany" SELECTED > --ANY-- </OPTION>\n');
		
		var sellen = 7;
		var sel = '<SELECT class="tagset_filter" tagset="'+pTag+'" id="sel_filter_' + tagsetnum + '" size="' + sellen + '" MULTIPLE>\n';
		$.each( options, function(idx, opt){
			sel += opt;
		});
		sel += '</SELECT>\n';
		div.append(sel);
		
		tagsetnum++;
	};
	
	//Privileged method
	this.drawPinCounts = function( pVisCount, pTotCount ){
		_domPinCounts.empty();
		_domPinCounts.append( '<label id="label_feedback_pincounts">' + pVisCount + ' / ' + pTotCount +'</label>' );
	};
	
	//Privileged method
	this.getPinLabel = function(){
		/**
		 * Returns the name of the pin label that should be displayed onMouseover 
		 */
		return $('#sel_change_pin_label').val(); 
	}
	
	// Privileged method
	this.getFilterTagset = function(){
		/** 
		 * Returns an AliwalTagset object of critia that can be applied to AliwalPlacemarks. 
		 * Must return an empty array for tagsets with no selections. No tagsets implies no filtering at all.
		 * Special case for options with class 'selectany'
		 */
		var ret = {};
		$('SELECT.tagset_filter').each(function(i,v){
			var tagset =  $(v).attr('tagset');
			ret[tagset] = new Array();
		});
		$('SELECT.tagset_filter').each(function(i,v){
			if( $(v).children('OPTION.tagset_selectany:selected').length > 0 ){
				// Remove the tagset all together so induce --ANY-- behaviour
					delete ret[ $(v).attr('tagset') ];
			} else {
				$(v).children('OPTION:selected').not('.tagset_selectany').each(function(ii,vv){
					ret[ $(v).attr('tagset') ].push( $(vv).val() );
				});
			}
		});
		
		return ret;
	}
	
	// Privileged method
	this.addPlacemark = function(pPlacemark){
		// ToDo: Update the controls if necessary
	}
	
	// Privileged method
	this.redraw = function(){
		
	}
	
	// Privileged method
	this.warningPinCeiling = function( pSet ){
		if(pSet){
			_feedbackPinCeiling.fadeOut('fast');
			_feedbackPinCeiling.attr('src','icons/pin_ceiling_warn.png');
			_feedbackPinCeiling.attr('title','Too many pins');
			_feedbackPinCeiling.fadeIn('slow');
			
			
		} else if ( _feedbackPinCeiling.attr('src') !== 'icons/pin_ceiling_ok.png' ){
			_feedbackPinCeiling.fadeOut('fast');
			_feedbackPinCeiling.attr('src','icons/pin_ceiling_ok.png');
			_feedbackPinCeiling.attr('title','Number of pins OK');
			_feedbackPinCeiling.fadeIn('slow');
		}
	}
	
	// Privileged method
	this.warningGeocodingError = function( pSet, pAddress ){
		if(pSet){
			_feedbackGeocodingErr.fadeOut('fast');
			_feedbackGeocodingErr.attr('src','icons/geocoding_warn.png');
			_feedbackGeocodingErr.attr('title','Geocoding errors');
			_feedbackGeocodingErr.fadeIn('slow');
		} else if ( _feedbackGeocodingErr.attr('src') !== 'icons/geocoding_ok.png' ){
			_feedbackGeocodingErr.fadeOut('fast');
			_feedbackGeocodingErr.attr('src','icons/geocoding_ok.png');
			_feedbackGeocodingErr.attr('title','Geocoding OK');
			_feedbackGeocodingErr.fadeIn('slow');
		}
	}

	/** @constructor
	 * No point triggering events here because nothing could be listening 
	 */
	
	_drawPinCeiling();
	_drawGeocodingErr();
	_drawPinLabelSelector();
	_drawTagsetFilters();
	
	// Listen for model ( jQuery ) events
	_dataModel.events.bind( 'ModelPlacemarkAdded', function(event, eventArg ){
	});
	_dataModel.events.bind( 'ModelPlacemarkGeocoded', function(event, eventArg ){  
	});
	_dataModel.events.bind( 'ModelPlacemarkMoved', function(event, eventArg ){ 
	});

}

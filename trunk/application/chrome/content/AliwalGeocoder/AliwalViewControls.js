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

AliwalViewControls = function( pAliwalModel, pDomFilters, pDomPinLabel ){
	/** A view object - for the MVC pattern - that displays the tagset filters and pin label selector.
	 * Creates a list box per tagset and one dropdown listbox for the label selector.
	 * @param pFilterCallback(AliwalTagset) will get triggered when the filter selection changes.
	 * @param pLabelCallback(pSelectedPinLabel) will get triggered when the pin label selector is changed.
	 */
	 
	// Private members
	var _dataModel = pAliwalModel;
	var tagsetnum = 0;
	var that = this;
		 
	// Private method
	_drawPinLabelSelector = function( pDivId, pLabelCensus ){
		/** Args: The string id of the div to draw the label selector in.
		 */
		var dd = $('#' + pDivId);
		dd.empty();
		var empty = true;
		var sel = '<SELECT id="sel_change_pin_label">';
		for( var lbl in pLabelCensus ){ // FOR ... IN iterates members
			sel += '<OPTION>'+lbl+'</OPTION>\n';
			empty = false;
		};
		sel += '</SELECT>';
		
		if(  empty ){
			dd.append('<div class="warn">No data</div>');
		} else {
			dd.append( sel );
		}
	}
	
	// Private method
	_drawTagsetFilter = function( pDivId, pTag, pTagData ){
		/** Draws a filter for a tagset. Where to draw it is pDivId, which tagset is pTag.
		 */
		var dd = $('#' + pDivId);
		dd.empty();
		var labl = '<label class="label_sub">' + pTag + '</label>';
		dd.append(labl);
		
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
		dd.append(sel);
		
		tagsetnum++;
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
		// ToDo: Updated the controls if necessary
		alert('ToDo');
	}
	
	// Privieged method
	this.redraw = function(){
		/**
		 * Not yet necessary, just here to match AliwalYahooView.
		 * ToDo.
		 */
	}
	
	// Privileged method
	this.bindLabelChange = function( pLabelCallback){
		/**
		 * Attach an event handler to the pin label selector
		 */ 
		$('#sel_change_pin_label').bind( 'change', function(e){
			pLabelCallback(this.value );
		});		
	}
	
	// Privileged method
	this.bindFilterChange = function( pFilterCallback){
		/**
		 * Attach an event handler to the filter stuff
		 */ 
		$('.tagset_filter').bind('change', function(e){
			pFilterCallback( that.getFilterTagset());
		});
	}
	
	
	// Constructor
	_drawPinLabelSelector('pin_label_selector', _dataModel.labelCensus() );
	
	var pinTagSets = _dataModel.tagsetCensus();
	var html = '<table id="tbl_filters"></table>';
	$("#div_filters").empty();
	$("#div_filters").append(html);

 	var filcnt = 0;
	$.each( pinTagSets, function(tagset, tags){
		html = '<tr><td id="divFilter_' + filcnt + '"></td></tr>';
		$('#tbl_filters').append(html);
		_drawTagsetFilter('divFilter_' + filcnt, tagset, pinTagSets );
		filcnt++;
	});

}

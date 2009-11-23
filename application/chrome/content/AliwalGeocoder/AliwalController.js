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
 * Processes and responds to events, typically user actions, and may invoke changes on the model
 */
function AliwalController( pAliwalModel ){
	
	// Private members
	var that = this;
	var _model = pAliwalModel;
	var _cacheMgr; // Initialized in constructor
	
	// Events
	this.events = $({
	//  eventID:  'eventName' // Should match
		ControllerGeocodeSuccess : 'ControllerGeocodeSuccess',
		ControllerGeocodeFail    : 'ControllerGeocodeFail',
		ControllerDataLoaded     : 'ControllerDataLoaded'
    });
	
	// Private method
	var _geocodeFromCache = function( pAliwalPlacemark ){
		/**
		 * Adds coordinates to pAliwalPlacemark if the geocodeAddress is in the cache.
		 * Throws 'cache MISS for address:'
		 */
		try{
			var cacheret = _cacheMgr.getItem( pAliwalPlacemark.getGeocodeAddress() );
			var lat = cacheret.split(',')[1];
			var lon = cacheret.split(',')[0];
			pAliwalPlacemark.setLatitude(lat);
			pAliwalPlacemark.setLongitude(lon);
			//console.log('cache HIT for address:\n' + pAliwalPlacemark.getGeocodeAddress() );
		}catch(e){
			// cache miss
			//console.log('cache MISS for address:\n' + pAliwalPlacemark.getGeocodeAddress() );
		}			
	};

	// Privileged method
	this.geocodePlacemark = function( pPlacemark ){
		/** 
		 * Take an AliwalPlacemark and set it's coordinates from the geocodeAddress.
		 * Uses an internal cache or failing that, the Yahoo REST API to do the geocoding. 
		 * Avoids Yahoo AJAX API / on marker geocoding because that breaks MVC.
		 */
		
		// Try the cache 1st
		try{
			_geocodeFromCache( pPlacemark);
		} catch(e){
			// Ignore Dummied out cache or cache miss exceptions
		}
		
		if( pPlacemark.isGeocoded() ){
			that.events.triggerHandler( that.events.attr('ControllerGeocodeSuccess'), pPlacemark );
		} else {
		// Cache failed, hit up the web
			var geocoder = new XMLHttpRequest();
			var url = 'http://local.yahooapis.com/MapsService/V1/geocode?' +
						'appid=TQBZw2PV34GYymqj0eHGSn32aSw7fyGL7wdA3Cs5QufCQY4Zy9qn1ZHzSepRxh2XKg--' + 
						'&location=' + pPlacemark.getGeocodeAddress() ;
						
			try {
				// Workaround cross domain safety net.
				// Thanks: http://www.captain.at/howto-ajax-permission-denied-xmlhttprequest.php
				netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
			} catch (e) {
				alert("Permission UniversalBrowserRead denied.");
			};
			         
			geocoder.onreadystatechange = function(response) { 
				if( geocoder.readyState == 4){
					if(  geocoder.status != 200 ){
						//console.log('eventGeocodeFail firing');
						that.events.triggerHandler( that.events.attr('ControllerGeocodeFail'), pPlacemark );
					} else {
						var xml = geocoder.responseXML.documentElement;
						/*
						return_location.street   = xml.getElementsByTagName('Address')[0].firstChild.nodeValue;
						return_location.locality = xml.getElementsByTagName('City'   )[0].firstChild.nodeValue;
						return_location.region   = xml.getElementsByTagName('State'  )[0].firstChild.nodeValue;
						return_location.country  = xml.getElementsByTagName('Country')[0].firstChild.nodeValue;
						*/
						pPlacemark.setLatitude ( xml.getElementsByTagName('Latitude' )[0].firstChild.nodeValue );
						pPlacemark.setLongitude( xml.getElementsByTagName('Longitude')[0].firstChild.nodeValue );
						that.events.triggerHandler( that.events.attr('ControllerGeocodeSuccess'), pPlacemark );
					}
				}	
			};
			
			geocoder.overrideMimeType('application/xml');	
			geocoder.open("GET", url, true);
			geocoder.send(null);
		}
	};
	
	// Privileged method
	this.loadDelimitedFile = function(pFile,pDelimiters,
														pIgnoreHeaderLines, pIgnoreFooterLines,
														pColHeadings, 
														pDataCols, pTagCols, pGeocodeAddressCols, pLonLatCols,
														pLoadHandler, pProgressHandler, pErrorHandler ){
	/** 
	 * Loads a CSV file, creating AliwalPlacemark objects  and adding them to the model.
	 * Requires security permission to get property XPCComponents.classes
	 */
		var headerline={};
		var dataline = {};
		var hasmore = true;
	
		//this.reCSV = /,(?=([^"]*"[^"]*")*(?![^"]*"))/g; 							// Thanks: http://blogs.infosupport.com/raimondb/archive/2005/04/27/199.aspx
		//this.reCSV = /,(?=([^\"]*\"[^\"]*\")*(?![^\"]*\"))/g;   					// Thanks: http://weblogs.asp.net/prieck/archive/2004/01/16/59457.aspx
		//this.reCSV = /("(?:[^"]|"")*"|[^",\r\n]*)(,|\r\n?|\n)?/g; 				// Thanks: http://www.bennadel.com/blog/978-Steven-Levithan-Rocks-Hardcore-Regular-Expression-Optimization-Case-Study-.htm
		//this.reCSV = /\G(,|\r?\n|\r|^)(?:"([^"]*+(?>""[^"]*+)*)"|([^",\r\n]*+))/g; // Thanks: http://www.bennadel.com/blog/978-Steven-Levithan-Rocks-Hardcore-Regular-Expression-Optimization-Case-Study-.htm
		var reCSV       = /"?,"?(?=(?:[^"]*"[^"]*")*(?![^"]*"))"?/g; 						//Thanks:http://rebelnation.com/
																					//Thanks: http://regexpal.com/
		/* OR together all of the delimiters with regex syntax */
		var ds = '';
		$.each(pDelimiters, function(idx, val){
			if(ds){
				ds +='|';
			}
			ds += val;
		});
		if(ds){
			ds = '(?:'+ds+')';
		} else{
			throw 'AliwalController.importDelimitedFile. Missing delimiters.\nAborting file import.'
		}
		
		var regex = new RegExp( '"?'+ds+'"?(?=(?:[^"]*"[^"]*")*(?![^"]*"))"?', 'g');
		try {
			var file = Components.classes["@mozilla.org/file/local;1"]
		                     .createInstance(Components.interfaces.nsILocalFile);
			file.initWithPath(pFile);
			// open an input stream from file
			var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
			                        .createInstance(Components.interfaces.nsIFileInputStream);
			istream.init(file, 0x01, 0444, 0);
			istream.QueryInterface(Components.interfaces.nsILineInputStream);
			for(var ign=0;ign<pIgnoreHeaderLines;ign++){
				hasmore = istream.readLine(headerline);
				if(!hasmore){
					break;
				}
			}	
			
			while(hasmore){
				var placemark = new AliwalPlacemark();
	
				hasmore = istream.readLine(dataline);
				// Split the line up
				linesplit = dataline.value.split( regex );
				
				// populate the placemark labels & values
				$.each( pDataCols, function(idx,colid){
					placemark.addLabelledData(pColHeadings[ colid ], linesplit[colid] );
				});
				
				// populate the placemark tagsets
				$.each( pTagCols, function(idx,colid){
					placemark.addTag( pColHeadings[ colid ], linesplit[colid] );				
				});
				
				// populate the placemark GeocodeAddress
				var addrstr = '';
				$.each( pGeocodeAddressCols, function(idx,colid){
					if(addrstr.length > 0){ addrstr += ', '; }
					addrstr += linesplit[colid];
				});
				if 	(addrstr){
					placemark.setGeocodeAddress( addrstr );
				}
			
				// Populate Longitude & Latitude
				
				if ( pLonLatCols.length === 2){
					if( !(isNaN(parseFloat(linesplit[pLonLatCols[0]])) || isNaN(parseFloat(linesplit[pLonLatCols[1]]))) ) {
						placemark.setLongitude ( linesplit[pLonLatCols[0]] );
						placemark.setLatitude  ( linesplit[pLonLatCols[1]] );
					} else {
						// ToDo
					}
				} else {
					// ToDo
				}
				
				if( !placemark.isGeocoded() ){
					// Coordinates are no good so geocode and then add to _model
					// ToDo: Geocoding failures ???
					this.geocodePlacemark( placemark );
				};
				_model.addPlacemark(placemark);
			};
			
			istream.close();		
			that.events.triggerHandler( that.events.attr('ControllerDataLoaded') );
		} catch(e){
			throw e;
		}
	};
	
	// Privileged method
	this.loadKMLFile = function(	pFile, 
									pLoadHandler, 
									pProgressHandler, 
									pErrorHandler ){
	/** 
	 * Loads a KML File, creating AliwalPlacemark objects and adding them to the model.
	 */
		var geocoder = new XMLHttpRequest();			
		geocoder.overrideMimeType('application/xml');	
		geocoder.onprogress = pProgressHandler;
		geocoder.onerror = pErrorHandler;
		geocoder.onload = pLoadHandler;
		geocoder.onreadystatechange = function (aEvt) {
			if (geocoder.readyState == 4) {
		    	if(geocoder.status == 200 || geocoder.status == 0){
					var xmlmarks = geocoder.responseXML.documentElement;
					$(xmlmarks).find('Placemark').each( function(key, xmark){
						var placemark = new AliwalPlacemark();
						placemark.setGeocodeAddress ( $(xmark).find('ExtendedData>GeocodeAddress:first').text() );
						
						// Remember KML points are Longitude,Latitude
						var tlat = $(xmark).find('Point>coordinates:first').text().split(',')[1];
						var tlon = $(xmark).find('Point>coordinates:first').text().split(',')[0];
						if( !(isNaN(parseFloat(tlat)) )){ placemark.setLatitude ( tlat); };
						if( !(isNaN(parseFloat(tlon)) )){ placemark.setLongitude( tlon); };
						
						$(xmark).find('ExtendedData>Data').each( function(key2, xele){
							var ll = $(xele).attr('name');
							var vv = $(xele).children('value:first').text();
							placemark.addLabelledData(ll, vv);
						});
						
						$(xmark).find('ExtendedData>TagSet').each( function(key3, xele){
							var ts = $(xele).attr('name');
							var tt = $(xele).children('Tag:first').text();
							placemark.addTag( ts, tt );
						});
						
						// WTF! JS says "(null >= -180 ) == true;"
						// so going with isNaN()s and nested ifs
						var doGeocode = true;
						if(! isNaN(parseFloat(placemark.getLatitude()))){
							if(! isNaN(parseFloat(placemark.getLongitude()))){
								if (placemark.getLongitude() >= -180){
									if (placemark.getLongitude() <= 180){
										if(placemark.getLatitude()  >= -90 ){
											if(placemark.getLatitude()  <= 90 ){
												// Coordinates look reasonable so just use them
												//console.log('AliwalController: Geocoding not necessary:\n' + uneval(placemark));
												doGeocode = false;
												//_model.addPlacemark(placemark);
											}
										}
									}
								}
							}
						}
						if(doGeocode){
							// Coordinates are no good so geocode and then add them to _model
							// ToDo: Geocoding failures ???
							that.geocodePlacemark( placemark );
						};
						_model.addPlacemark(placemark);
					});

					that.events.triggerHandler( that.events.attr('ControllerDataLoaded') );
				} else {
					//console.log('AliwalController: Error loading KML file');
					throw  'AliwalController: Error loading KML file.';
				}
			}
		};
		geocoder.open('GET', 'file://' + pFile, true);
		geocoder.send(null);
	};
	
	// Privileged method
	this.loadDefaultData = function(){
		/** 
		 * Load some dummy data into the model
		 */
		var fDelayed = function(){
			
			var x01 = new AliwalPlacemark();
			x01.addLabelledData("Pool", "John Charles Centre for Sport");
			x01.addLabelledData("Tel. #", "0113 2475222");
			x01.addLabelledData("Town", "Leeds");
			x01.addTag("Country", "England");
			x01.addTag("Pool Size", "Olympic");
			x01.addTag("Lane", "10 Lane");
			x01.addTag("Visted", "June");
			x01.setGeocodeAddress( "John Charles centre for sport, Middleton Grove, Leeds, LS11 5DJ" );
			_model.addPlacemark(x01);
			
			
			var x02 = new AliwalPlacemark();
			x02.addLabelledData("Pool", "Ponds Forge International Sports Centre");
			x02.addLabelledData("Tel. #", "01142233400");
			x02.addLabelledData("Town", "Sheffield");
			x02.addTag("Country", "England");
			x02.addTag("Pool Size", "Olympic");
			x02.addTag("Lane", "10 Lane");
			x02.addTag("Visted", "June");
			x02.addTag("Visted", "July");
			x02.setGeocodeAddress( "Ponds Forge International Sports Centre, Sheaf Street, Sheffield, S1 2BP" );
			_model.addPlacemark(x02);
			
			
			var x03 = new AliwalPlacemark();
			x03.addLabelledData("Pool", "Sunderland Aquatic Centre");
			x03.addLabelledData("Tel. #", "(0191) 520 5555");
			x03.addLabelledData("Town", "Sunderland");
			x03.addTag("Country", "England");
			x03.addTag("Pool Size", "Olympic");
			x03.addTag("Lane", "10 Lane");
			x03.addTag("Visted", "July");
			x03.addTag("Visted", "August");
			x03.setGeocodeAddress( "Sunderland City Council, Civic Centre, Burdon Road, Sunderland, SR2 7DN" );
			_model.addPlacemark(x03);
			
			
			var x04 = new AliwalPlacemark();
			x04.addLabelledData("Pool", "Aldershot Garrison Sports Centre");
			x04.addLabelledData("Tel. #", "01252 347724");
			x04.addLabelledData("Town", "Aldershot");
			x04.addTag("Country", "England");
			x04.addTag("Pool Size", "Regular");
			x04.addTag("Lane", "8 Lane");
			x04.setGeocodeAddress( "Princes Avenue, North Camp, Hampshire, Aldershot, GU11 2LQ" );
			_model.addPlacemark(x04);
			
			
			var x05 = new AliwalPlacemark();
			x05.addLabelledData("Pool", "University Of Bath Sports Training Village");
			x05.addLabelledData("Tel. #", "01225 386339");
			x05.addLabelledData("Town", "Bath");
			x05.addTag("Country", "England");
			x05.addTag("Pool Size", "Regular");
			x05.addTag("Lane", "8 Lane");
			x05.setGeocodeAddress( "University of Bath, Bath, BA2 7AY, UK" );
			_model.addPlacemark(x05);
			
			
			var x06 = new AliwalPlacemark();
			x06.addLabelledData("Pool", "Coventry Sports And Leisure Centre");
			x06.addLabelledData("Tel. #", "024 7625 2525");
			x06.addLabelledData("Town", "Coventry");
			x06.addTag("Country", "England");
			x06.addTag("Pool Size", "Regular");
			x06.addTag("Lane", "8 Lane");
			x06.setGeocodeAddress( "Fairfax Street, Coventry CV1 5RY" );
			_model.addPlacemark(x06);
			
			
			var x07 = new AliwalPlacemark();
			x07.addLabelledData("Pool", "K2 Centre");
			x07.addLabelledData("Tel. #", "01293 585300");
			x07.addLabelledData("Town", "Crawley");
			x07.addTag("Country", "England");
			x07.addTag("Pool Size", "Regular");
			x07.addTag("Lane", "8 Lane");
			x07.setGeocodeAddress( "K2 Crawley, Pease Pottage Hill, Crawley, RH11 9BQ" );
			_model.addPlacemark(x07);
			
			
			var x08 = new AliwalPlacemark();
			x08.addLabelledData("Pool", "Gurnell Leisure Centre");
			x08.addLabelledData("Tel. #", "020 8998 3241");
			x08.addLabelledData("Town", "Ealing");
			x08.addTag("Country", "England");
			x08.addTag("Pool Size", "Regular");
			x08.setGeocodeAddress( "Ruislip Road East, Ealing, London, W13 0AL" );
			_model.addPlacemark(x08);
			
			
			var x09 = new AliwalPlacemark();
			x09.addLabelledData("Pool", "Picton Leisure Centre");
			x09.addLabelledData("Tel. #", "+44 151 734 2294");
			x09.addLabelledData("Town", "Liverpool");
			x09.addTag("Country", "England");
			x09.addTag("Pool Size", "Regular");
			x09.addTag("Lane", "8 Lane");
			x09.setGeocodeAddress( "Wellington Road, Liverpool, L15 4LE" );
			_model.addPlacemark(x09);
			
			
			var x10 = new AliwalPlacemark();
			x10.addLabelledData("Pool", "London Fields Lido");
			x10.addLabelledData("Tel. #", "020 7254 9038");
			x10.addLabelledData("Town", "London Borough of Hackney");
			x10.addTag("Country", "England");
			x10.addTag("Pool Size", "Regular");
			x10.addTag("Lane", "8 Lane");
			x10.setGeocodeAddress( "London Fields Lido, London Fields Westside, E8 3EU" );
			_model.addPlacemark(x10);
			
			
			var x11 = new AliwalPlacemark();
			x11.addLabelledData("Pool", "Loughborough Pool");
			x11.addLabelledData("Tel. #", "01509 226200");
			x11.addLabelledData("Town", "Loughborough");
			x11.addTag("Country", "England");
			x11.addTag("Pool Size", "Regular");
			x11.addTag("Lane", "8 Lane");
			x11.setGeocodeAddress( "Sports Development Centre, Loughborough University, Leicestershire, LE11 3TU" );
			_model.addPlacemark(x11);
			
			
			var x12 = new AliwalPlacemark();
			x12.addLabelledData("Pool", "Manchester Aquatics Centre");
			x12.addLabelledData("Tel. #", "0161 275 9450");
			x12.addLabelledData("Town", "Manchester");
			x12.addTag("Country", "England");
			x12.addTag("Pool Size", "Regular");
			x12.addTag("Lane", "8 Lane");
			x12.setGeocodeAddress( "2 Booth Street East, Ardwick, Manchester, M13 9SS" );
			_model.addPlacemark(x12);
			
			
			var x13 = new AliwalPlacemark();
			x13.addLabelledData("Pool", "UEA Sports Centre");
			x13.addLabelledData("Tel. #", "(01603) 592398");
			x13.addLabelledData("Town", "Norwich");
			x13.addTag("Country", "England");
			x13.addTag("Pool Size", "Regular");
			x13.addTag("Lane", "8 Lane");
			x13.addTag("Visted", "March");
			x13.addTag("Visted", "June");
			x13.addTag("Visted", "August");
			
			x13.setGeocodeAddress( "UEA Sportspark, University of East Anglia, Norwich, Norfolk, NR4 7TJ" );
			_model.addPlacemark(x13);
			
			
			var x14 = new AliwalPlacemark();
			x14.addLabelledData("Pool", "Grand Central Pools");
			x14.addLabelledData("Tel. #", "0161 474 7766");
			x14.addLabelledData("Town", "Stockport");
			x14.addTag("Country", "England");
			x14.addTag("Pool Size", "Regular");
			x14.addTag("Lane", "8 Lane");
			x14.setGeocodeAddress( "12 Grand Central Square,, Wellington Road South,, Stockport,, SK1 3TA" );
			_model.addPlacemark(x14);
			
			
			var x15 = new AliwalPlacemark();
			x15.addLabelledData("Pool", "Millfield");
			x15.addLabelledData("Town", "Somerset");
			x15.addTag("Country", "England");
			x15.addTag("Pool Size", "Regular");
			x15.addTag("Lane", "8 Lane");
			x15.setGeocodeAddress("Butleigh Road, Somerset, BA16 0YD")
			_model.addPlacemark(x15);
			
			
			var x16 = new AliwalPlacemark();
			x16.addLabelledData("Pool", "Wigan International Pool");
			x16.addLabelledData("Tel. #", "01942 243345");
			x16.addLabelledData("Town", "Wigan");
			x16.addTag("Country", "England");
			x16.addTag("Pool Size", "Regular");
			x16.addTag("Lane", "8 Lane");
			x16.setGeocodeAddress( "Library St, Wigan, WN1 1NN" );
			_model.addPlacemark(x16);
			
			
			var x17 = new AliwalPlacemark();
			x17.addLabelledData("Pool", "The Dollan Aqua Centre");
			x17.addLabelledData("Tel. #", "+44 (1355) 260000");
			x17.addLabelledData("Town", "East Kilbride");
			x17.addTag("Country", "Scotland");
			x17.addTag("Pool Size", "Regular");
			x17.addTag("Lane", "6 Lane");
			x17.setGeocodeAddress( "Town Centre Park, Brouster Hill, East Kilbride, South Lanarkshire, G74 1AF, Scotland" );
			_model.addPlacemark(x17);
			
			
			var x18 = new AliwalPlacemark();
			x18.addLabelledData("Pool", "Royal Commonwealth Pool");
			x18.addLabelledData("Tel. #", "0131 667 7211");
			x18.addLabelledData("Town", "Edinburgh");
			x18.addTag("Country", "Scotland");
			x18.addTag("Pool Size", "Regular");
			x18.addTag("Lane", "8 Lane");
			x18.setGeocodeAddress( "Royal Commonwealth Pool, 21 Dalkeith Road, Edinburgh EH16 5BB" );
			_model.addPlacemark(x18);
			
			
			var x19 = new AliwalPlacemark();
			x19.addLabelledData("Pool", "Robertson Trust Swimming Pool");
			x19.addLabelledData("Tel. #", "(01786) 466500");
			x19.addLabelledData("Town", "Stirling");
			x19.addTag("Country", "Scotland");
			x19.addTag("Pool Size", "Regular");
			x19.addTag("Lane", "8 Lane");
			x19.addTag("Visted", "January");
			x19.addTag("Visted", "February");
			x19.addTag("Visted", "March");
			x19.setGeocodeAddress( "University of Stirling, Stirling , Scotland , FK9 4LA, UK" );
			_model.addPlacemark(x19);
			
			
			var x20 = new AliwalPlacemark();
			x20.addLabelledData("Pool", "Wales National Pool");
			x20.addLabelledData("Tel. #", "01792 513513");
			x20.addLabelledData("Town", "Swansea");
			x20.addTag("Country", "Wales");
			x20.addTag("Pool Size", "Regular");
			x20.addTag("Lane", "8 Lane");
			x20.addTag("Visted", "April");
			x20.addTag("Visted", "May");
			x20.addTag("Visted", "June");
			x20.setGeocodeAddress( "Wales National Pool Swansea, Sketty Lane, Swansea, SA2 8QG" );
			_model.addPlacemark(x20);
			
			that.events.triggerHandler( that.events.attr('ControllerDataLoaded') );
		};
		window.setTimeout(fDelayed, 111 );
	};
	 
	/** @constructor 
	 */
	try{
		_cacheMgr = new CacheManager();
	} catch(e){
		// If AliwalController is created by a browser hosted test page ( as opposed to an XUL app host )
		// then the cache isn't available but shouldn't throw fatal errors. 
		_cacheMgr = { getItem: function(pIgnored){throw 'Dummied out cache'} };
	}
}	











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
 * @file 
 * Wrapping the module import up like this means that HTML pages can be tested 
 * outside of the XUL application & browser.
 */ 

try{
	// Load an emtpy set of symbols that will be used to share data between the XUL & HTML scopes
	Components.utils.import("resource://app/modules/xscope.jsm");
} catch(e) {
	alert('Falling back to DEMO mode because\ncould not import module xscope.jsm.');
	// ********************************* START OF FAKE JSM **********************************************
	var xscopeNS = {
		// Whole flags object should be passed because of pass by reference requirement
		flags	    : { loadingData 	       : false, 
				scrollOnGeocodeSuccess : false,
				warnGeocodingError     : true,
				warnPinCountError      : true
			      },
		acontroller : {},
		amodel      : {}
	};
	
   
	// To allow XMLHttpRequests for geocding when run as local file.
	// Works around cross domain scripting constraints
	try {
		netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
	} catch (e) {
		alert("Permission UniversalBrowserRead denied.");
	}

	var fEmpty = function(){};
	
	xscopeNS.amodel = new AliwalModel();
	xscopeNS.acontroller = new AliwalController( xscopeNS.amodel );
	
	xscopeNS.acontroller.loadDefaultData();
}

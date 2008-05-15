EXPORTED_SYMBOLS = [ "xscopeNS" ]

var xscopeNS = {
	pinList 	: [],
	
	KML 		: {},   // A KML DOM document
	domMarkers  : {},   // Hash of YMarker objects that are on the map, keyed by ymarker.id
	hiddenMarkers: {}, 	// Hash of hidden/filtered etc. markers
	
	flags		: { loadingData : false,
					warnGeocodingError: true,
					warnPinCountError: true} // Whole flags object should be passed because of pass by reference requirement
};

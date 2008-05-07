EXPORTED_SYMBOLS = [ "xscopeNS" ]

var xscopeNS = {
	pinList 	: [],
	pinItems 	: {},	// A census of the labels found on pins and count of pins with that data item
	pinTagSets 	: {},   // A census of Tagsets, their tags and the count of pins with that tag.
	
	KML 		: {},   // A KML DOM document
	domMarkers  : {},   // Hash of YMarker objects that are on the map, keyed by ymarker.id
	hiddenMarkers: {}, 	// Hash of hidden/filtered etc. markers
	
	flags		: {loadingData : false} // Whole flags object should be passed because of pass by reference requirement
};

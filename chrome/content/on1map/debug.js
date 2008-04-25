function jsdump(str){    
	Components.classes["@mozilla.org/consoleservice;1"]
			.getService(Components.interfaces.nsIConsoleService).logStringMessage(str);
}
  
  
function load(pFile,pDestPinList,pDestPinItems,pDestPinTagSets){
	
	var parseErrorLog = [];
	var	that = this, 
		numm = 0, 
		characterData = "",
		pinListBuffer = [];  //Pins come from the XML into here, get enriched by fnPinStackCallback and then moved back to pDestPinList.
		
	var fnPinStackCallback = (function (pOp){
		if (pOp === "PUSH"){
			jsdump('typeof(that) = :' + typeof(that) );
			while (pinListBuffer.length){          
				// This should only iterate once but too be sure.
				var latest = pinListBuffer.pop();
				that._enrichFromCache(latest);
				that.pDestPinList.push(latest);
			}
    	}
	});  	

	function _handleCharacterData(){      
		if (characterData != ""){          
			_fullCharacterDataReceived(characterData);
		}
		characterData = "";
	};
	
	function _fullCharacterDataReceived(fullCharacterData){      
		_mychars = "" + fullCharacterData;
	};
	
	function do_parse_check(aCondition,aMsg){      
		jsdump(aMsg);
		if (! aCondition){          
			parseErrorLog[parseErrorLog.length] = aMsg;
		}
    };
    
	var contentHandler = {
		_mychars : "", 
		_elementStack : [], 
		_Placemark : {}, 
		_lastDataKey : "", 
		_currTagSetName :"",
		_pinList : pinListBuffer,
		_pinItems : pDestPinItems,		
		_pinTagSets : pDestPinTagSets,
		_fnPinStackCallback : fnPinStackCallback,
		
		startDocument : (function (){
			_handleCharacterData();
			jsdump("startDocument");
		}), 
		
		endDocument : (function (){
			_handleCharacterData();
			jsdump("endDocument");
		}), 
	
		startElement : (function (uri,localName,qName,attributes){
			_handleCharacterData();
			
			var attrs = [];
			for (var i = 0;i < attributes.length;i++){
				attrs.push(attributes.getQName(i) + "='" + attributes.getValue(i) + "'");
			}
			jsdump("startElement: namespace='" + uri + "', localName='" + localName + "', qName='" + qName + "', attributes={" + attrs.join(",") + "}");
		
		    //place startElement event handling code below this line
			this._elementStack.push( qName );
			switch( qName ){
				case 'Document':
					break;
				case 'name':
					break;
				case 'Placemark':
					this._Placemark = new Object();
					break;
				case 'ExtendedData':
					this._Placemark.ExtendedData = new Object();
					break;
				case 'Data': 
					for (var i = 0;i < attributes.length;i++){
						if(attributes.getQName(i) === 'name'){
							this._lastDataKey = attributes.getValue(i);
							break;
						}
					}
					if (typeof (this._pinItems[ this._lastDataKey ]) === 'undefined' ){
						this._pinItems[ this._lastDataKey ] = 1; //Initialize the counter
					} else {
						this._pinItems[ this._lastDataKey ]++;
					}
					break;
				case 'value': 
					break;
				case 'TagSet':
					for (var i = 0;i < attributes.length;i++){
						if(attributes.getQName(i) === 'name'){
							this._currTagSetName = attributes.getValue(i);
							break;
						}
					}
					if( typeof(this._Placemark.ExtendedData[ this._currTagSetName ]) === 'undefined' ){
						this._Placemark.ExtendedData[ this._currTagSetName ] = new Array();
					}
					if ( typeof(this._pinTagSets[ this._currTagSetName ]) === 'undefined' ){
						this._pinTagSets[ this._currTagSetName ] = new Object();
					}
					break;
				case 'Tag':
					break;
				case 'Point':
					this._Placemark.Point = new Object();
					break;
				case 'coordinates':
					break;
				case 'GeocodeAddress':
					break;
				case 'kml':
					break;
				default:
					break;
			}
		}), 
		
		endElement : (function (uri,localName,qName){
		    _handleCharacterData();
		
		    //place endElement event handling code below this line
			switch( qName ){
				case 'Document':
					break;
				case 'name':
					if ( !this._Placemark['name']){
						this._Placemark['name'] = ''+this._mychars;
					}
					break;
				case 'Placemark':
					this._pinList.push( this._Placemark );
					this._fnPinStackCallback('PUSH');
					break;
				case 'ExtendedData':
					break;
				case 'Data': 
					break;
				case 'value': 
					this._Placemark.ExtendedData[this._lastDataKey] = this._mychars;
					break;
				case 'TagSet': ;
					break;
				case 'Tag':
					var tagname = this._mychars;
					this._Placemark.ExtendedData[ this._currTagSetName].push( tagname);
					if (typeof (this._pinTagSets[ this._currTagSetName ][tagname]) === 'undefined' ){
						this._pinTagSets[ this._currTagSetName ][tagname] = 1;
					} else {
						this._pinTagSets[ this._currTagSetName ][tagname]++;
					}
					break;
				case 'Point': ;
					break;
				case 'coordinates':
					this._Placemark.Point.coordinates = this._mychars;
					break;
				case 'GeocodeAddress':
					this._Placemark.ExtendedData['GeocodeAddress'] = this._mychars;
					break;
				case 'kml':
					break;
				default:
					break;
			}
		
			this._elementStack.pop();
			// Just to be safe, swallow the characters.
			this._mychars = '';

			jsdump("endElement: namespace='" + uri + "', localName='" + localName + "', qName='" + qName + "'");
		}), 
		
		characters : (function (value){
			this.characterData += value;
		}), 
		
		processingInstruction : (function (target,data){
			_handleCharacterData();
			jsdump("processingInstruction: target='" + target + "', data='" + data + "'");
		}), 
		
		ignorableWhitespace : (function (whitespace){
			_handleCharacterData();
		}), 
		
		startPrefixMapping : (function (prefix,uri){
			_handleCharacterData();	
		}), 
		
		endPrefixMapping : (function (prefix){
			_handleCharacterData();
		}), 
		
		QueryInterface : (function (iid){
			if (! iid.equals(Components.interfaces.nsISupports) && ! iid.equals(Components.interfaces.nsISAXContentHandler)){
				throw Components.results.NS_ERROR_NO_INTERFACE;
			}
			return this;
		})
	};


        var lexicalHandler = {comment : (function ()
{
  function comment(aContents){    }
  return comment;
}
)(), startDTD : (function ()
{
  function startDTD(aName,aPublicId,aSystemId){    do_parse_check(aName, "Missing DTD name");
  }
  return startDTD;
}
)(), endDTD : (function ()
{
  function endDTD(){    }
  return endDTD;
}
)(), startCDATA : (function ()
{
  function startCDATA(){    }
  return startCDATA;
}
)(), endCDATA : (function ()
{
  function endCDATA(){    }
  return endCDATA;
}
)(), startEntity : (function ()
{
  function startEntity(aName){    do_parse_check(aName, "Missing entity name (startEntity)");
  }
  return startEntity;
}
)(), endEntity : (function ()
{
  function endEntity(aName){    do_parse_check(aName, "Missing entity name (endEntity)");
  }
  return endEntity;
}
)()};
        var dtdHandler = {notationDecl : (function ()
{
  function notationDecl(aName,aPublicId,aSystemId){    do_parse_check(aName, "Missing notation name");
  }
  return notationDecl;
}
)(), unparsedEntityDecl : (function ()
{
  function unparsedEntityDecl(aName,aPublicId,aSystemId,aNotationName){    do_parse_check(aName, "Missing entity name (unparsedEntityDecl)");
  }
  return unparsedEntityDecl;
}
)()};
        var errorHandler = {error : (function ()
{
  function error(aLocator,aError){    do_parse_check(! aError, "XML error");
  }
  return error;
}
)(), fatalError : (function ()
{
  function fatalError(aLocator,aError){    do_parse_check(! aError, "XML fatal error");
  }
  return fatalError;
}
)(), ignorableWarning : (function ()
{
  function ignorableWarning(aLocator,aError){    do_parse_check(! aError, "XML ignorable warning");
  }
  return ignorableWarning;
}
)()};


    try{        
        var nsIDOMNode = Components.interfaces.nsIDOMNode;
        var nsISAXXMLReader = Components.interfaces.nsISAXXMLReader;
        var saxReader = Components.classes["@mozilla.org/saxparser/xmlreader;1"].createInstance(nsISAXXMLReader);
        try{            saxReader.setFeature("http://xml.org/sax/features/namespace-prefixes", true);
            saxReader.setFeature("http://xml.org/sax/features/namespace", true);
          }
        catch (e)
          {}

        saxReader.contentHandler = contentHandler;
        saxReader.lexicalHandler = lexicalHandler;
        saxReader.dtdHandler = dtdHandler;
        saxReader.errorHandler = errorHandler;
        var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath("/Users/greg/Projects/on1map/src/mk005/example-data-49.o1m");
        var filestream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
        filestream.init(file, 1, 292, 0);
        var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
        var pump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
        var uri = ioService.newFileURI(file);
        var channel = ioService.newChannelFromURI(uri, null, null);
        var StreamChunkSize = 1024;
        var streamListener = new StreamListener(saxReader, channel);
        saxReader.parseAsync(null);
        pump.init(filestream, - 1, - 1, StreamChunkSize, 1, false);
        pump.asyncRead(streamListener, null);
      }
    catch (e){
    	jsdump(e);
      }
    
    return parseErrorLog;
  }
  function Prog(){    function onProgress(){      return true;
    }
    onProgress:
    {}
  }
  function StreamListener(reader,channel){    
  	this.reader = reader;
    this.channel = channel;
  }
StreamListener.prototype = {
	reader : null, 
	onStartRequest : (function (request,context){
	  	jsdump("streamListener.onstartRequest\n");
	  	this.reader.onStartRequest(this.channel, context);
	}), 
	onDataAvailable : (function (request,context,input,offset,count){
  		jsdump("offset: " + offset + ", count: " + count + "\n");
  		this.reader.onDataAvailable(this.channel, context, input, offset, count);
	}), 
	onStopRequest : (function (request,context,status){
		jsdump('StreamListener.onStopRequest()');
  		this.reader.onStopRequest(this.channel, context, status);
	})
};
  

  
  $(document).ready((function ()
{
  var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
  file.initWithPath("/Users/greg/Projects/on1map/src/mk005/example-data-49.o1m");
  var xscopeNS = {};
  xscopeNS.pinList = [], xscopeNS.pinItems = {}, xscopeNS.pinTagSets = {};
  load(file, xscopeNS.pinList, xscopeNS.pinItems, xscopeNS.pinTagSets);
}
));
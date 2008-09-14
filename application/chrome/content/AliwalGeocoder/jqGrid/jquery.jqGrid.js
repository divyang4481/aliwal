// we make it simple as possible
function jqGridInclude()
{
    var pathtojsfiles = "jqGrid/js/"; // need to be ajusted
    // if you do not want some module to be included
    // set include to false.
    // by default all modules are included.
    var minver = false;
    var modules = [
        { include: true, incfile:'grid.base.js',minfile: 'min/grid.base-min.js'}, // jqGrid base
        { include: true, incfile:'grid.formedit.js',minfile: 'min/grid.formedit-min.js' }, // jqGrid Form editing
        { include: true, incfile:'grid.inlinedit.js',minfile: 'min/grid.inlinedit-min.js' }, // jqGrid inline editing
        { include: true, incfile:'grid.subgrid.js',minfile: 'min/grid.subgrid-min.js'}, //jqGrid subgrid
        { include: true, incfile:'grid.custom.js',minfile: 'min/grid.custom-min.js'}, //jqGrid custom
        { include: true, incfile:'grid.postext.js',minfile: 'min/grid.postext-min.js'} //jqGrid postext
    ];
    for(var i=0;i<modules.length; i++)
    {
        if(modules[i].include == true) {
        	if (minver != true) IncludeJavaScript(pathtojsfiles+modules[i].incfile);
        	else IncludeJavaScript(pathtojsfiles+modules[i].minfile);
        }
    }
    function IncludeJavaScript(jsFile)
    {
		var fileref=document.createElement('script');
		fileref.setAttribute("type","text/javascript");
		fileref.setAttribute("src", jsFile);
		document.getElementsByTagName("head")[0].appendChild(fileref);
    }
}

jqGridInclude();
/* Thanks: Copied from firefox 3 beta 5 ./browser/preferences/connection.js 
 */
//@line 38 "/builds/tinderbox/Fx-Mozilla1.9-Release/Darwin_8.8.4_Depend/mozilla/browser/components/preferences/connection.js"

var gConnectionsDialog = {
  beforeAccept: function ()
  {
    var proxyTypePref = document.getElementById("network.proxy.type");
    if (proxyTypePref.value == 2) {
      this.doAutoconfigURLFixup();
      return true;
    }

    if (proxyTypePref.value != 1)
      return true;

    var httpProxyURLPref = document.getElementById("network.proxy.http");
    var httpProxyPortPref = document.getElementById("network.proxy.http_port");
    var noProxiesPref = document.getElementById("network.proxy.no_proxies_on");
    noProxiesPref.value = noProxiesPref.value.replace(/[;]/g,',');
    
    return true;
  },

  checkForSystemProxy: function ()
  {
    if ("@mozilla.org/system-proxy-settings;1" in Components.classes)
      document.getElementById("systemPref").removeAttribute("hidden");
  },
  
  proxyTypeChanged: function ()
  {
    var proxyTypePref = document.getElementById("network.proxy.type");
    
    // Update http
    var httpProxyURLPref = document.getElementById("network.proxy.http");
    httpProxyURLPref.disabled = proxyTypePref.value != 1;
    var httpProxyPortPref = document.getElementById("network.proxy.http_port");
    httpProxyPortPref.disabled = proxyTypePref.value != 1;
    
    var noProxiesPref = document.getElementById("network.proxy.no_proxies_on");
    noProxiesPref.disabled = proxyTypePref.value != 1;
    
    var autoconfigURLPref = document.getElementById("network.proxy.autoconfig_url");
    autoconfigURLPref.disabled = proxyTypePref.value != 2;

    this.updateReloadButton();
  },

  updateReloadButton: function ()
  {
    // Disable the "Reload PAC" button if the selected proxy type is not PAC or
    // if the current value of the PAC textbox does not match the value stored
    // in prefs.  Likewise, disable the reload button if PAC is not configured
    // in prefs.

    var typedURL = document.getElementById("networkProxyAutoconfigURL").value;
    var proxyTypeCur = document.getElementById("network.proxy.type").value;

    var prefs =
        Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefBranch);
    var pacURL = prefs.getCharPref("network.proxy.autoconfig_url");
    var proxyType = prefs.getIntPref("network.proxy.type");

    var disableReloadPref =
        document.getElementById("pref.advanced.proxies.disable_button.reload");
    disableReloadPref.disabled =
        (proxyTypeCur != 2 || proxyType != 2 || typedURL != pacURL);
  },
  
  readProxyType: function ()
  {
    this.proxyTypeChanged();
    return undefined;
  },
  
  reloadPAC: function ()
  {
    Components.classes["@mozilla.org/network/protocol-proxy-service;1"].
        getService().reloadPAC();
  },
  
  doAutoconfigURLFixup: function ()
  {
    var autoURL = document.getElementById("networkProxyAutoconfigURL");
    var autoURLPref = document.getElementById("network.proxy.autoconfig_url");
    var URIFixup = Components.classes["@mozilla.org/docshell/urifixup;1"]
                             .getService(Components.interfaces.nsIURIFixup);
    try {
      autoURLPref.value = autoURL.value = URIFixup.createFixupURI(autoURL.value, 0).spec;
    } catch(ex) {}
  }
  
};

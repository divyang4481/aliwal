function drawLabelSelector( pContainerId, pLabels){
	alert('in');
	
	var ml = document.createElement("menulist");
  	ml.setAttribute("label","Select pin label");
  	
  	var mp = document.createElement('menupopup');

  	for (var idx = 0, ll = pLabels.length; idx < ll; idx++ ){
  		alert('still going');
  		var mi = document.createElement('menuitem');
  		mi.setAttribute('label', pLabels[idx] );
  		if (idx === 0) {
  			mi.setAttribute('selected', 'true');
  		}
  		mp.appendChild(mi);
  	}
  	ml.appendChild(mp);
  	var dest = document.getElementById( pContainerId );
	dest.appendChild(ml);
	alert('out');
}

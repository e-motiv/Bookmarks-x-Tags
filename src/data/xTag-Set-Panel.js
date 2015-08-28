/* Variables and EVENTS */
var out			= document.getElementById("userMsg");

var okBut		= document.getElementById("ok");
okBut		.addEventListener('click', readTableEmit, false);

var cancelBut	= document.getElementById("cancel");
cancelBut	.addEventListener('click', cancel, false);

var upBut 		= document.getElementById("up");
upBut		.addEventListener('click', function(e) { upDown(e, 1); }, false);

var downBut 	= document.getElementById("down");
downBut		.addEventListener('click', function(e) { 	upDown(e, 0); }, false);

var delBut		= document.getElementById("delete");
delBut		.addEventListener('click', deleteTableRow, false);

var addBut		= document.getElementById("addTag");
addBut		.addEventListener('click', checkThenAddRow, false);

var labelEdit	= document.getElementById("edit-label");
labelEdit	.addEventListener('keyup', onkeyup, false);
var tagsEdit	= document.getElementById("edit-tags");
tagsEdit	.addEventListener('keyup', onkeyup, false);

var insertHere		= document.getElementById("insertHere");
var sampleTagRow	= insertHere.getElementsByClassName("tagRow")[0];


/*FUNCTIONS*/
function tellUser(text) {
	out.style.visibility="visible";
	out.innerHTML+=(out.innerHTML.length?'<br>':'')+text;
}

function cancel(e) {
	addon.port.emit("hide", false);	
}
function onkeyup(e) {
	if (e.keyCode == 13) 
		checkThenAddRow(e);
}

function checkThenAddRow(e) {
	if (!tagsEdit.value.length) {
		tellUser("Please add some xTags in the right text box.")
	} else if (!labelEdit.value.length) {
		tellUser("Please add a label for the xTags in the left text box.")
	} else {
		addTableRow(e)
	}
}

var hili = null;
function rowClicked(e) {
	if (hili)
		hili.classList.remove("highlight");
	hili=e.currentTarget;
	hili.classList.add("highlight"); 
}

function upDown(e, dir) {
	var target = false;
	var resultNode;
	
	if (dir) {
		target = hili.previousSibling;
		if (target && target.nodeName=="TR")
			resultNode = hili.parentNode.insertBefore(hili, target);
		
	}
	else {
		target = hili.nextSibling;
		if (target && target.nodeName=="TR")	 
			resultNode = hili.parentNode.insertBefore(target,hili);		
	}
}


//Remove and store example row from html file
var sampleTagRow=sampleTagRow.parentNode.removeChild(sampleTagRow);
function addTableRow(e) {
	
	//from preferences or from button?
	var tags	= e.tags?e.tags.join():tagsEdit.value;
	var label	= e.tags?e.label:labelEdit.value;
	//Clone example node, change html and add to table
	var newRow = sampleTagRow.cloneNode(true);	
	newRow.innerHTML=newRow.innerHTML.replace('xxLabelxx', label).replace('xxTagsxx', tags);
	if(e.order) {
//		console.log(e.order);
		newRow.getElementsByTagName('option')[e.order].selected= 'selected';
	}
	newRow = insertHere.appendChild(newRow);
	
	if (insertHere.contains(newRow)) {
		labelEdit.value = '';
		tagsEdit.value = '';
		labelEdit.focus();
		return true;
	}
	tellUser('adding Row failed');
	return false;
}
function deleteTableRow(e) {
	hili.remove();
	//remove references to remove from memory
	hili=null;  
}


function buildTable(prefs) {
	var win=true;

	if (!Array.isArray(prefs)) return false;
	
	// Build table from settings
	prefs.forEach(function(tag, i) {
		win=win && addTableRow(tag);		
	})
	if (!win) {
		tellUser("Bug: Build table failed.");
	}
}


function readTableEmit(e) {
	var win=true;
	var newPrefs = new Array();
	

		if (insertHere.hasChildNodes()) {
		var children = insertHere.getElementsByClassName('tagRow');

		for ( var i=0; i<children.length; i++) {
			try {
				var o = children[i].getElementsByClassName('xOrder')[0].firstChild;
				var tagsN = children[i].getElementsByClassName('xTags')[0].textContent.split(',');

				tagsN.forEach(function(s, i, a){a[i]=s.trim()});
				newPrefs
						.push({
							label : children[i].getElementsByClassName('xLabel')[0].textContent,
							tags : tagsN,
							order : o.options[o.selectedIndex].value
						});
			} catch (e) {
//				console.log(e);
				win = false;
			}
		}
	}
	if (win) { // settings
		addon.port.emit("hide", newPrefs);
	} else {
		tellUser("At least one xTag definition failed to be recognized. Please check the table");
	}
}

//Get Initial preferences from main script
addon.port.on("pref-start", function(prefs) {
	buildTable(prefs);
});
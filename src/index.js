/*  XTAGS BUTTONS 
 *
 * License: Reuse only without modifying the next two lines
 * author: Ruben, e-motiv.net
 * link: http://attic.e-motiv.net
 */

const { BxTagButton } = require('./lib/BxTagButton');

const { XPCOMUtils } = require("resource://gre/modules/XPCOMUtils.jsm", this);
const { PlacesUtils } = require("resource://gre/modules/PlacesUtils.jsm");	

// Is there no require option here Erik? (for Ci.nsINavBookmarkObserver)
var {Ci} = require("chrome");

const { CustomizableUI } = require("resource:///modules/CustomizableUI.jsm");

// A map to be able to destroy all our buttons
// TODO: Should be done in module and just keep array with ids here, or no array and have a destroyAll function in module too
let buttons = new Map(); // WeakMap not working right ad hoc


exports.onUnload = function() {    console.log("Addon unloading");
    destroyTagButs();
}

function destroyTagButs() {
	if (buttons.size) {
		for (var [k,] of buttons) {
			k.dispose();
			buttons.delete(k);
		}	
	}	
}
function destroyAndRebuildTagButs(config) {	//console.log("Destroying and rebuilding xTags - START");	//console.log(config);
	
	destroyTagButs();
	
	if (!Array.isArray(config)) return false;

	var butPosArr = new Array();
	
	config.forEach(function(tagOpt, i){		//console.log(i, tagOpt.label);
				
				var but = BxTagButton({
					id: 	i,
					label:	tagOpt.label,
					tags:	tagOpt.tags,
					order:	tagOpt.order
				});
				// Add to our map
				buttons.set(but,i);
				//To order later
				butPosArr[i]=CustomizableUI.getPlacementOfWidget(but.id).position;
		
	});
	//Sorting
	butPosArr.sort(sortInt);
	buttons.forEach(function(i, but){		//console.log(i, but.node.label, typeof butPosArr[i]);
		CustomizableUI.moveWidgetWithinArea(but.id, butPosArr[i]);
	});
// console.log("Destroying and Rebuilding xTags - STOP");
}
//javascript needs this to sort numerically
function sortInt(a,b) {
    return a - b;
}

function rebuildTagButs() {
	if (buttons.size) {
		for (var [k,] of buttons) {
			k.removemenuitems();
			k.getBms();
		}	
	} else  return false;
}


/* GET & SET PREFERENCES */
// Note:Preferences changed listener shouldn't be needed since we allow only by
// our own button and we could also get loop
const myPref = require("sdk/simple-prefs");
let xTagsPref;

var notifications = require("sdk/notifications");
try {
	xTagsPref = JSON.parse(myPref.prefs.xTags);
} catch (e) {
	console.error("xTag preference is corrupt.");
	// Doesn't work yet for some reason
	notifications.notify({
	  title: "xTag preference corrupt",
	  text: "xTag preference is corrupt.",
	  data: "xTag preference is corrupt. (Check in your about:config and reset it, but be carefull and you will lose all xTag definitions.)",
	  iconURL: "./tag48.png"
	});
}

// CONFIGURATION BUTTON
var setBut = require("sdk/ui/button/action").ActionButton({
	id: "settingsButton",
	label: "BTag X",
	icon: {
	  "16": "./tag-lines16.png",
	  "32": "./tag-lines32.png",
	  "48": "./tag-lines48.png"
	},
	onClick: showPanel
});


//CONFIGURATION BUTTON CONTEXT-MENU

const utils				= require('sdk/window/utils');
const window			= utils.getMostRecentBrowserWindow();
const doc				= window.document;
const XUL_NS			= 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
const { id: addonID }	= require('sdk/self');
const cleanSelfId=addonID.toLowerCase().replace(/[^a-z0-9_]/g, '-');
const { getNodeView }	= require("sdk/view/core");

let setButNode = getNodeView(setBut);

let	ButContext = doc.createElementNS(XUL_NS,'menupopup');
let ButCtId= cleanSelfId + '-settingsButton-context';
ButContext.setAttribute("id",ButCtId);
doc.getElementById("mainPopupSet").appendChild(ButContext);


/* CREATE MAIN BUTTON CONTEXT-MENU */
[
["Follow me, buttons!",	btFollow,	"f"	],
[],
["Test",				btTest,	"t"	],
].forEach(function(miDef){
	if(miDef.length==0) {
		var mi = doc.createElementNS(XUL_NS,'menuseparator');
	} else {
		var mi = doc.createElementNS(XUL_NS,'menuitem');
//		mi.setAttribute		('id',			MICtId+"-"+miDef[0]	);
		mi.setAttribute		('label',		miDef[0]			);
//		mi.setAttribute		('class',		"menuitem-iconic"	);	//for icons to the left
		mi.doThis			=				miDef[1];
		mi.addEventListener	('command',		doBContextDummy		);
		mi.setAttribute		('accesskey',	miDef[2]			);
	}
	ButContext.appendChild(mi);
});

//Here is the context magic
setButNode.setAttribute('context', ButCtId);

function doBContextDummy(e) {		//	console.log(e);
	e.target.doThis.call(e.target.parentNode.triggerNode);
}

function btFollow() { 				//console.log(this);
	var myArea = CustomizableUI.getPlacementOfWidget(setButNode.id).area;
	buttons.forEach(function(i, but){		//console.log(i, but.node.label, typeof butPosArr[i]);
		CustomizableUI.addWidgetToArea(but.id, myArea);
	});
};

function btTest() { 				//console.log("This is a test");
	notifications.notify({
		  title: "This is a test",
		  text: "It really is!",
		  iconURL: "./tag48.png"
		});
}



function showPanel(state) {
	xtagSetPanel.show();
}

destroyAndRebuildTagButs(xTagsPref);


/* CREATE CONFIGURATION BUTTON WITH PANEL */
var xtagSetPanel = require("sdk/panel").Panel({
	width: 640,
	height: 400,
	contentURL: "./xTag-Set-Panel.html"
});


function savePrefs(prefs) {
	myPref.prefs.xTags=JSON.stringify(prefs);
}

// Hide panel when ready save settings when necessary
xtagSetPanel.port.on("hide", function (prefs) {
	xtagSetPanel.hide();
	if (prefs) {
		savePrefs(prefs);
		xTagsPref = prefs; // For updating when bookmarks changed
		destroyAndRebuildTagButs(prefs);
	}
});

// Pass existing preferences to contentscript
xtagSetPanel.port.emit("pref-start", xTagsPref);

// Listening for bookmark changes via nsINavBookmarkObserver to update tags

let isBatch = false;

function tagsChanged(uri) {
	var newtags = PlacesUtils.tagging.getTagsForURI(uri);
	if (newtags.length) {
		for (var [k,] of buttons) {
			if	(k.tags.every(function (v) { //If all necessary tags
					if (newtags.indexOf(v) >= 0)	return true;
					})
				) {
				console.log("Relevant Bm added. Refreshing x Tag.", uri);
				k.removemenuitems();
				k.getBms();
			}
		};	            	
	};
}

//tags are also generating these events, right? Right.
//And together witht he fact that creating or modifying a bookmark with multiple tags generatesa batch this is hard logic!!
//for the moment
var bmListener = {
        onBeginUpdateBatch: function() {							console.log("onBeginUpdateBatch");
        	isBatch = true;
        },
        
        onEndUpdateBatch: function() {									console.log("onEndUpdateBatch");
        	isBatch = false;
        	rebuildTagButs();
        },
        
        //adding an item with multiple tags will always trigger a batch
        // will not trigger if tag added to bookmark, but will trigger when new tag created
        onItemAdded:	function(bId, fldr, i, type, uri, title) {		console.log("onItemAdded", bId, fldr, i, type, uri, title);        	
        	//if new tag has been created, nothing to do 
        	if (isBatch || (fldr == PlacesUtils.tagsFolderId && type == PlacesUtils.bookmarks.TYPE_FOLDER) ) return;
        	//otherwise chack for which tags it has gotten and reorder!
        	tagsChanged(uri);
        },
        
        //CHECKED - WORKS
        //Also triggers when a tag is removed from a bookmark, but buggy. https://bugzilla.mozilla.org/show_bug.cgi?id=1176338
        onItemRemoved:	function(bId, fldr, i, type) {				console.log("onItemRemoved", bId, type, fldr);
        	if (isBatch) return; //we can already remove the bookmark, but what if it is a tag?
        	if (fldr == PlacesUtils.tagsFolderId && type == PlacesUtils.bookmarks.TYPE_FOLDER) return;
       		var itemGone;
        	for (var [k,] of buttons) {
        		if (itemGone = k.hasBmId(bId))	{					//console.log("Removing menuitem", bId, type, fldr);
        			itemGone.remove();
        		}
        	};
        }, 
        // if bId in menuitems
        onItemChanged:	function(bId, prop, an, nV, lM, type, prnt) {		console.log("onItemChanged", bId, prop, an, "nv:"+nV, lM, type, prnt);
	        if (isBatch) return;
	        if (prop == "title" && PlacesUtils.tagging._tagFolders[bId]) {	console.log("tag name changed");
	        	tagsChanged(uri);
	        } 
	        //if tags added
	        else if (prop=="tags") {			        					console.log("tags of bookmark changed");
		        //TODO: Could be done smarter, but aNewValue is empty - https://bugzilla.mozilla.org/show_bug.cgi?id=1175888
	        	//Also: if multiple tags are added, multiple onItemChanged are triggered. https://bugzilla.mozilla.org/show_bug.cgi?id=1176332
		        rebuildTagButs(); //temporary!
	        //if tags removed or other changes
	        } else {
	        	for (var [k,] of buttons) {
	        		if (k.hasBmId(bId))	{
	        			k.removemenuitems();
	        			k.getBms();
	        		}
	        	};}
        },
        
        QueryInterface: XPCOMUtils.generateQI([Ci.nsINavBookmarkObserver])
};
PlacesUtils.bookmarks.addObserver(bmListener, false);

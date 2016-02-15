
// Listening for bookmark changes via nsINavBookmarkObserver to update tags

let isBatch = false;

function rebuildTagButs() {
	if (buttons.size) {
		for (var [k,] of buttons) {
			k.removemenuitems();
			k.getBms();
		}	
	} else  return false;
}


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


NEWER:
	/*Not really needed, since onItemChanged will handle a new bookmark WITH tags
	onItemAdded:	function(bId, parentId, i, type, uri, title) {		
		console.log("onItemAdded", "bId:"+bId,"parentId:"+parentId, "index:"+i, "type:"+type, "uri:"+uri, "title:"+title);
		// if non-existing tag has been created, do nothing (tagsFolderId = 4 / TYPE_FOLDER = 2)
		if (parentId == PlacesUtils.tagsFolderId && type == PlacesUtils.bookmarks.TYPE_FOLDER ) return;
		// otherwise chack for which tags it has gotten and reorder!
		checkNewTags(uri);
    }, */
    
    /* Buggy implementation: use onitemchanged for now
     * onItemRemoved:	function(bId, parentId, index, type) {				console.log("onItemRemoved", "bId:"+bId,"parentId:"+parentId, "type:"+type);
		// if tag has been removed, nothing to do
		//if (type != PlacesUtils.bookmarks.TYPE_BOOKMARK ) return;
	     		
    }, */
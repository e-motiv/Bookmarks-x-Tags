function bmEdit(bmItem) {						console.log("bmEdit", bmItem.bmId);//,bmItem
	// NEW WAY VERY OBSCURE	*/
	//var bm = yield bmSvc.fetch({ url:  bmItem.value});
	//var guid = yield PlacesUtils.promiseItemGuid(bmItem.bmId);

	Task.spawn(function* () {
	    let node = yield PlacesUIUtils.fetchNodeLike({ url: bmItem.value });
	    if (!node)
	        return;
		PlacesUIUtils.showBookmarkDialog({	action: "edit", 
		                                  		node
		                                   }, window.top);
		return;
	}).catch(Cu.reportError);

	//let Bnode = yield PlacesUIUtils.fetchNodeLike({ url:  bmItem.value}); 
	//console.log(Bnode);
	/*if (Bnode) {
		  console.log("Dialog calling");
	    PlacesUIUtils.showBookmarkDialog({	action: "edit", 
	                                     	Bnode
	                                     }, window.top);
	    return;
		console.log(Bnode);
	  } else {
		  console.log("Dialog failed");
	  }
	//NEW WAY "WORKAROUND" working, but not well
	OR node= PlacesUtils.promiseBookmarksTree(bGuid)   // PlacesUtils.getMostRecentBookmarkForURI //PromiseItemGuid(itemid)
	
		let Bnode = yield PlacesUIUtils.fetchNodeLike({ url:  bmItem.value}); 
		PlacesUIUtils.showBookmarkDialog({ 
			action: "edit",
			node: {itemId:bmItem.bmId, title:bmItem.label, uri: bmItem.value} //,type:0,  title, , bookmarkGuid: "0EP3gZaSYFXe"
			//, hiddenRows: ["folderPicker"]
		}, window.top);*/

}
/*
 * This javascript is a backup of code already created for 2 problems to do with "area"
 * 1. Since this addon uses buttons from the sdk, the default area is AREA_NAVBAR and cannot be changed unless with a CustomizeUI listener that will change this after it has been created (or other event).
 * 2. It would be nice that all the xTag Buttons follow the Settingsbutton in the same area.
 */


//TODO in main: only create tags button after this settings button is created, so they can follow on the same area

//Alternative to code below: use the event (data) from button view and views.get(id).area

const { Cu } = require('chrome');
const { CustomizableUI } = Cu.import('resource:///modules/CustomizableUI.jsm', {});


//We have to make a listener to override button view defaultArea
const someListener = {
	area: AREA_BOOKMARKS,
	onWidgetAdded: function(aWidgetId, aArea, aPosition)  {
//		console.log(aWidgetId, aArea, aPosition);
		// if is settingsBut store the area // make sure setBut is created first
		if (aWidgetId=setBut.id)
			this.area = aArea;
		// if not change the area
		else
			CustomizableUI.addWidgetToArea(aWidgetId, this.area);
	}
}
CustomizableUI.addListener(someListener);
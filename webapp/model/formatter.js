sap.ui.define([], function () {
	"use strict";
	return {
		abilityStatus: function (sStatus) {
			var resourceBundle = this.getView().getModel("i18n").getResourceBundle();
			switch (sStatus) {
				case "1":
					return resourceBundle.getText("abilityTrue");
				case "0":
				    return resourceBundle.getText("abilityFalse");
				default:
					return sStatus;
			}
		}
	};
});
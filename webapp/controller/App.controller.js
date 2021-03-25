sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter"
], function (Controller,JSONModel,Filter) {
	"use strict";

	return Controller.extend("mms_template.controller.View1", {
	
		onInit: function () {
		var emailModel =new JSONModel();
		
		emailModel.setData({
				"EmailsSet":
						[{
							"EmailId": "10",
							"Ability": "Not available",
							"MMSID": "Unknown",
							"Status": "Unknown",
							"SentOn":"not sent",
							"ApprovedOn":"not approved",
							"Validity": "No"
						}, {
							"EmailId": "20",
							"Ability": "Available",
							"MMSID": "MMS_20",
							"Status": "sent",
							"SentOn":"14.03.2021",
							"ApprovedOn":"not approved",
							"Validity": "No"
						}, {	
							"EmailId": "30",
							"Ability": "Available",
							"MMSID": "MMS_30",
							"Status": "Approved",
							"SentOn":"04.03.2021",
							"ApprovedOn":"14.03.2021",
							"Validity": "Ok"
							
						},{
							"EmailId": "50",
							"Ability": "Available",
							"MMSID": "MMS_50",
							"Status": "Sent",
							"SentOn":"04.03.2021",
							"ApprovedOn":"not approved",
							"Validity": "No"
						},  {
							"EmailId": "60",
							"Ability": "Available",
							"MMSID": "MMS_60",
							"Status": "Approved",
							"SentOn":"04.02.2021",
							"ApprovedOn":"24.02.2021",
							"Validity": "outdated"
						}]
			});

	//	emailModel.loadData("model/email.json");
	    this.getView().setModel(emailModel);
	},
		/**
		 * Event handler for the Save template button. Will send the
		 * email content to CPI and change Tencent status to initil
		 * value Sent
		 * @public
		 */
		onSaveTemplate: function(){
			
		},
		/**
		 * Event handler for the Check status button. Will call CBO to get 
		 * actual Tencent status (from Sent to Aprooved) and update UI
		 * @public
		 */
		onCheckStatus: function(){
			
		},
		/**
		 * Event handler for the Search feild. Will seach data by Email ID
		 * @public
		 */
		onSearch: function(oEvent){
			
		}
	
	
	/*  Quick search by status 
		_mFilters: {
			Cheap: [new Filter("Price", "LT", 100)],
			Moderate: [new Filter("Price", "BT", 100, 1000)],
			Expensive: [new Filter("Price", "GT", 1000)]
		},
		onQuickFilter: function (oEvent) {
			var sKey = oEvent.getParameter("key");
			var oFilter = this._mFilters[sKey];
			var oBinding = this._oTable.getBinding("items");

			oBinding.filter(oFilter);
		}
		*/
	});

});
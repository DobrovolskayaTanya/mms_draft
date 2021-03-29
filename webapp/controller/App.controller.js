sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
//	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller,  Filter, MessageToast, FilterOperator ) {
	"use strict";
	
	var defaultSearchParam = "Search by Message ID";
	
	var messagesModel = new sap.ui.model.json.JSONModel();
	
	var messagesResults = [];
	var statusesResults = [];
	var mappedResults = [];

	return Controller.extend("mms_template.controller.App", {

		onInit: function () {
	    
		this.getView().setModel(messagesModel);		//setting main model
		this.loadMessages();
			
		//var messagesModel =new JSONModel();
		/* Test data
		messagesModel.setData({
				"messagesSet":
						[{
							"EmailId": "10",
							"EmailName":"AW20_GL_H_LNY_Gifting_3_Main_W442021",
							"Ability": "Not available",
							"MMSID": "Unknown",
							"Status": "Unknown",
							"SentOn":"not sent"
						}, {
							"EmailId": "20",
							"EmailName":"AW20_GL_H_LNY_Gifting_3_Main_W442021",
							"Ability": "Available",
							"MMSID": "MMS_20",
							"Status": "sent",
							"SentOn":"14.03.2021"
						}, {	
							"EmailId": "30",
							"EmailName":"AW20_GL_H_LNY_Gifting_3_Main_W442021",
							"Ability": "Available",
							"MMSID": "MMS_30",
							"Status": "Approved",
							"SentOn":"04.03.2021"
						},{
							"EmailId": "50",
							"Ability": "Available",
							"EmailName":"AW20_GL_H_LNY_Gifting_3_Main_W442021",
							"MMSID": "MMS_50",
							"Status": "Sent",
							"SentOn":"04.03.2021"
						},  {
							"EmailId": "60",
							"Ability": "Available",
							"EmailName":"AW20_GL_H_LNY_Gifting_3_Main_W442021",
							"MMSID": "MMS_60",
							"Status": "Approved",
							"SentOn":"04.02.2021"
						}]
			});

	//	emailModel.loadData("model/email.json");
	*/
	},
		loadMessages: function(){
			var oView = this.getView();
			oView.setBusy(true);
			var sUrl = "/API_MKT_CAMPAIGN_MESSAGE_SRV/Messages/";
			var oParams ={
				$format: "json",
				$top: "20",
				$orderby: "LastChangeDateTime desc",
				$filter: "MessageTypeName eq 'Email'",
				$inlinecount: "allpages"
			};
			var self = this;
			
			$.get(sUrl,oParams)
				.done(function(results){
					oView.setBusy(false);
					self._mapResults(results);
					
				})
				.fail(function(err){
					oView.setBusy(false);
					if(err !== undefined){
						var oErrorResponse =$.parseJSON(err.responseText);
						sap.m.MessageToast.show(oErrorResponse.message, {
							duration: 6000
						});
					} else {
						sap.m.MessageToast.show("Unknown error!");
					}
				});
		},
		/**
		 * Function for mapping messages from API_MKT_CAMPAIGN_MESSAGE_SRV
		 * and statuses from CBO
		 * @private
		 */
		_mapResults: function(results){
			var oModel = this.getView().getModel();
			for(var i = 0; i < results.d.results.length; i++){
				var MessageUUID = results.d.results[i].MessageUUID,
				EmailId = results.d.results[i].Message,
				EmailName = results.d.results[i].MessageName;
				
			messagesResults.push({
				EmailId: EmailId,
				EmailName: EmailName,
				});	
			}
		oModel.setProperty("/messagesSet",messagesResults);
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
		 * Event handler for the Check status button. Will call CBO to get 
		 * actual Tencent status (from Sent to Aprooved) and update UI
		 * @public
		 */
		onCheckSAbility:function(){
			
		},
		/**
		 * Event handler for the Search feild. Will seach data by Email ID
		 * @public
		 */
		onSearchMessages: function(oEvent){
	       	// build filter array
	       	var oBinding = this.byId("table").getBinding("items");

          //  var searchStr = this.byId("searchField").getValue();
            
			var aFilter = [];
			var sQuery = oEvent.getParameter("query");
			if (sQuery) {
				aFilter.push(new sap.ui.model.Filter("EmailId", sap.ui.model.FilterOperator.Contains, sQuery));
			}

			// filter binding
			/*
			var oList = this.byId("table");
			var oBinding = oList.getBinding("items");
			*/
			oBinding.filter(aFilter,"Application");
		    
			
		},
		
		
	
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
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
//	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"../model/formatter"
], function (Controller,  Filter, MessageToast, FilterOperator, formatter  ) {
	"use strict";
	
	var countMessages,
		countLoaded = 100;
	
	var messagesModel = new sap.ui.model.json.JSONModel();
	
	var messagesResults = [];
	var templatesResults = [];
	var mappedResults = [];

	return Controller.extend("mms_template.controller.App", {
		formatter: formatter,
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
				$top: "100",
				$orderby: "Message desc",
				$filter: "MessageTypeName eq 'Email'",
				$inlinecount: "allpages"
			};
			var self = this;
			
			$.get(sUrl, oParams)
				.done(function(results){
					oView.setBusy(false);
					self._mapResults(results);
					countMessages = results.d.__count;
					self.getView().getModel().setProperty("/countMessages", countMessages);
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
		 * and information from CBO
		 * @private
		 */
		_mapResults: function(results){
			var oModel = this.getView().getModel();
			templatesResults = this._getTemplateInfo();
			for(var i = 0; i < results.d.results.length; i++){
				var MessageUUID = results.d.results[i].MessageUUID,
				EmailId = results.d.results[i].Message,
				EmailName = results.d.results[i].MessageName;
				
			messagesResults.push({
				MessageUUID: MessageUUID,
				EmailId: EmailId,
				EmailName: EmailName,
				Ability: "unknown",
		 		MMSID: "unknown",
		 		Status: "unknown"
		 //		SentOn:"not sent"
				});	
			}
	    // create transorm array templatesResults to have the first
		mappedResults = messagesResults.map(x => Object.assign(x, templatesResults.find(y => y.MessageUUID === x.MessageUUID)));	
	//	console.log(mappedResults);	
		oModel.setProperty("/messagesSet",mappedResults);
		},
		/**
		 * Function to get template information from CBO for messages
		 *  @private
		 */
		 _getTemplateInfo: function(){
		 	var templates = [];
		 	var	resultTemplates = [];
		// 	const keys = ["MessageUUID","MessageID","AbilityforTemplate","TencentID","TencentStatus","SentDate"];
		 	
		 	/*
		 	var	templates  = [{
		 		MessageUUID: "42010a05-507a-1eeb-a3c4-fcc321784c86",
		 		MessageID: 625,
		 		Ability: true,
		 		MMSID: 11,
		 		Status: "sent",
		 		SentOn: new Date()
		 	},
		 	{
		 		MessageUUID: "42010a05-507a-1edb-a38e-97e59fa0bdaa",
		 		MessageID: 623,
		 		Ability: true,
		 		MMSID: 12,
		 		Status: "Provider1 OK, Provider2 NO, Provider3 OK",
		 		SentOn: new Date()
		 	}];
		 	*/
		 	// for test purposes sample data
		 
		//  to be deveelop when CBO is created
		 	var oView =this.getView();
		 	oView.setBusy(true);
		 	
		 	var sUrl = "/YY1_TENCENT_TEMPLATE_CDS/YY1_TENCENT_TEMPLATE/";
		 	var self =this;
		 
		 	var oSettings = {
				"url": sUrl,
				"method": "GET",
				"dataType": "json",
				"async": false,
				"contentType": "application/json"
			};
		 	$.ajax(oSettings)
		 		.done(function(results){
		 			oView.setBusy(false);
		 			resultTemplates = results.d.results;    // array of records from CBO to confirm path
		 		})
		 		.fail(function(err){
		 			oView.setBusy(false);
		 			if (err !== undefined) {
						var oErrorResponse = $.parseJSON(err.responseText);
						sap.m.MessageToast.show(oErrorResponse.message, {
							duration: 6000
						});
					} else {
						sap.m.MessageToast.show("Unknown error!");
					}
		 		});
		 		
		 	for(var i = 0; i < resultTemplates.length; i++){
		 	    var MessageUUID = resultTemplates[i].MessageUUID,
		 	    MessageID = resultTemplates[i].MessageID,
		 	    AbilityforTemplate = resultTemplates[i].AbilityforTemplate,
		 	    TencentID = resultTemplates[i].TencentID,
		 	    TencentStatus = resultTemplates[i].TencentStatus,
		 	    SentDate = this._formatDateValue(resultTemplates[i].SentDate);
		 	    
		     templates.push({
		 	    	MessageUUID: MessageUUID,
					EmailId: MessageID,
					Ability: AbilityforTemplate,
			 		MMSID: TencentID,
			 		Status: TencentStatus,
			 		SentOn: new Date(SentDate)
		 	    });
		 	}
		 	/* properties in object  in the wrong order. Try use Map???
		 	for(var i = 0; i < resultTemplates.length; i++){
		 	    let templ =  Object.entries(resultTemplates[i]).filter(([key,value])=>keys.includes(key));
		 	    templates.push(Object.fromEntries(templ));
		 	}
		 	*/
		 		return templates;
		 },
		/**
		 * Function to format date  from CBO for UI
	 	*/
		_formatDateValue: function (sDate) {
			if (sDate) {
				var oDate = sDate.slice(6, sDate.length - 2);
			return Number(oDate);
		
			} else {
				return null;
			}
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
	       
	       	var oBinding = this.byId("table").getBinding("items");
			var aFilter = [];
			var sQuery = oEvent.getParameter("query");
			if (sQuery) {
				aFilter.push(new sap.ui.model.Filter("EmailId", sap.ui.model.FilterOperator.EQ, sQuery));
			}
			oBinding.filter(aFilter,"Application");
		},
		
		
	

	});

});
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
//	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
//	"sap/ui/core/Fragment",
	"sap/ui/model/Sorter",
	"../model/formatter"
], function (Controller, MessageToast, Filter, FilterOperator, Sorter, formatter  ) {
	"use strict";
	
	var countMessages,
	    sMessageUUID,
		sMessageID,
	    aTextBlockContentString,
		countLoaded = 100; 
	var defaultSearchParam = "EmailId";
	
	var messagesModel = new sap.ui.model.json.JSONModel();
	//for sorting
	var oJSONData = {
		busy : false,
		order : 0
	};
	var orderModel =  new sap.ui.model.json.JSONModel(oJSONData);
	
	var messagesResults = [];
	var templatesResults = [];
	var mappedResults = [];
	var	aMessageBlocks = [];
	
	return Controller.extend("mms_template.controller.App", {
		formatter: formatter,
		onInit: function () {
	    
		this.getView().setModel(messagesModel);		//setting main model
		this.getView().setModel(orderModel, "orderModel"); //setting model for sorter
		this.loadMessages();
	//	this._formatDateForUpsert();
//		this._getMessageStatus();
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
		/*
			SAP Marketing allows to retrieve maximum of 100 messages per call.
			Therefore, the app is loading top 100 messages and then proceeds on calling next 100 if there are > 100 messages, and so on.
		*/
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
					
					var loadBatches = countMessages/countLoaded;
					for(var j = 1; j<loadBatches; j++){
						self._loadMessagesAdd(j);
					}
				})
				.fail(function(err){
					oView.setBusy(false);
					if(err !== undefined){
						var oErrorResponse = err.responseText;
						sap.m.MessageToast.show(" ERROR Description " + oErrorResponse, {
							duration: 7000,
							width:"20em"
						});
					} else {
						sap.m.MessageToast.show("Unknown error. Turn to the support team!");
					}
				});
		},
		/**
		 * Function which is called to load all messages if their number > 100
		 * */
		
		_loadMessagesAdd: function(iteration){
			 var oView  = this.getView();
			 oView.setBusy(true);
			 var self = this;
			 
			 $.ajax({
			 	url: "/API_MKT_CAMPAIGN_MESSAGE_SRV/Messages/?%24format=json&%24skip=" + countLoaded * iteration +
					"&%24top=100&%24orderby=LastChangeDateTime+desc&%24filter=MessageTypeName+eq+%27Email%27&%24inlinecount=allpages",
				type: "get",
				async: false,
				success: function(results){
					oView.setBusy(false);
					self._mapResults(results);
				},
				error: function(){
					oView.setBusy(false);
					if (err !== undefined) {
						var oErrorResponse = err.responseText;
						sap.m.MessageToast.show(" ERROR Description " + oErrorResponse, {
							duration: 7000,
							width:"20em"
						});
					} else {
						sap.m.MessageToast.show("Unknown error. Turn to the support team!");
					}
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
						var oErrorResponse = err.responseText;
						sap.m.MessageToast.show(" ERROR Description " + oErrorResponse, {
							duration: 7000,
							width:"20em"
						});
					} else {
						sap.m.MessageToast.show("Unknown error. Turn to the support team!");
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
		 * Event handler for the Snd template button. Will send the
		 * email content to CPI and change Tencent status to initil
		 * value Sent
		 * @public
		 */
		onSendTemplate: function(){
			var selectedRow,
				tMessageUUID,
			    tMessageID,
			    tAbilityforTemplate,
			    tEmailName,    // from Mkt API
				tencentId,     // from CPI API response
				contentHTMLString,  //from Mkt API
				templateImage,      //parse HTML string from Mkt API
				templateString,     //parse HTML string from Mkt API
				emailTitle;         //from Mkt API

		
			var aContext = this.byId("table").getSelectedContexts();
				aContext.forEach(function(element){
					selectedRow = element.getObject();
					tMessageUUID = selectedRow.MessageUUID;
			    	tMessageID = selectedRow.EmailId; 
			    	tEmailName = selectedRow.EmailName;
			    	tAbilityforTemplate = selectedRow.Ability;
				});
			
			if(aContext.length===0){
				sap.m.MessageToast.show(" Select an email message" , {
							duration: 3000				
						});
			}else if(tAbilityforTemplate !== "1"){				
				sap.m.MessageToast.show("This email is not compatable to be an Tencent template" , {
							duration: 3000
						});
			}else {
				var oView = this.getView();
				// call MKT by MessageGUID and get
				var oParams = {
					$format: "json",
					$expand: "MessageBlockContents"
				};

				var sUrl = "/API_MKT_CAMPAIGN_MESSAGE_SRV/MessageContents(MessageUUID=guid'" + tMessageUUID + "',LanguageCode='ZH')/MessageBlocks";
		//		var self = this;
			var that = this;
		 	oView.setBusy(true);
		// to get Email name		
				$.get(sUrl,oParams)
					.done(function(results){
						oView.setBusy(false);
						var tMessageBlocks = results.d.results;
						    [0,1].forEach(function(i){
						    	switch(tMessageBlocks[i].BlockType){
						    		case 'TEXT':
							    		contentHTMLString = tMessageBlocks[i].MessageBlockContents.results[0].BlockContentHTMLString;
							    		console.log( "HTML "+contentHTMLString);
							    		var text = contentHTMLString.replace(/<[^>]*>/g,"");
							    	//	var image = contentHTMLString.match(/<img .*?>/g); 
							    		var src = contentHTMLString.match(/\bsrc\=\"(.*?)\"/g);
							    		var href = contentHTMLString.match(/\bhref\=\"(.*?)\"/g);
							    	//	var link = contentHTMLString.match(/<a .*?>/g);
							    	
							    		console.log( "Text "+text);
							    	//	console.log( "Link  "+link);
							    	//	console.log( "Image "+image);
							    		console.log( "Src "+src);
							    		console.log( "Href "+href);
							    		break;
						    		case'SUBJECT':
										emailTitle = tMessageBlocks[i].MessageBlockContents.results[0].BlockContentHTMLString;
										console.log("Subject" +emailTitle);
										break;
						    		}
						   });
					contentHTMLString = "<img src=%27http://s7g10.scene7.com/is/image/BurberryTest/D66D0AA8-1A94-41C0-8545-A8C5A68CC670?$BBY_V2_B_1X1$%27 alt=%274080008_BLACK_COM_SL_3_FALSE.jpg%27  title=%274080008_BLACK_COM_SL_3_FALSE.jpg%27 style=%27opacity: 1;%27 data-sap-hpa-ceimo-image=%27SMOImage%27 data-sap-hpa-ceimo-image-type=%27Static%27 data-sap-hpa-ceimo-image-id=%2716191729918701338%27 /> <br />点击下方的下载按键<br /> <a rel=%27noopener%27 href=%27http://www.google.com%27 target=%27_blank%27 title=%27精品之作, 专属为你%27 data-sap-hpa-ceimo-link-type=%27Static%27 data-sap-hpa-ceimo-link-outboundid=%27X%27 data-sap-hpa-ceimo-link-utm=%27X%27 data-sap-hpa-ceimo-link-trackable=%27X%27 data-sap-hpa-ceimo-link-id=%2716191730884801417%27> 精品之作, 专属为你</a>"	   
					
				
					// function to form TemplateText and cut image	
					
					
					
					//Check contentHTMLString is not empty	   
					// POST Tencent statuses with content and within it PUT/UPDATE Tencent Status and ID in CBO
/*				   var oPayload  = {
		 	//		"TemplateName":"Email",
		 			"TemplateName": tEmailName,
			//		"TemplateTitle":"感谢您的订阅Burberry", 
			    	"TemplateTitle": emailTitle, 
					"TemplateSign":"Burberry",
					"TemplateText":"精品之作 敬邀悦享 Burberry 独家壁纸 cn.burberry.com 敬邀悦享", 
				//	"TemplateText": templateString, 	
					"TemplateImage":"http://s7g10.scene7.com/is/image/BurberryTest/D66D0AA8-1A94-41C0-8545-A8C5A68CC670?$BBY_V2_B_1X1$"
				//	"TemplateImage": templateImage
		 		};
		 		console.log("Paylod POST for CPI/Tencent " + oPayload);
		 		var sUrl = "/API_CPI_TENCENT/CreateTemplate";
				var oSettings = {
						"url": sUrl,
						"method" : "POST",
						"dataType":"json",
						"contentType":"application/JSON",
						"data" : JSON.stringify(oPayload)
					};
					
				$.ajax(oSettings)
					.done(function(results,textStatus, XMLHttpRequest){
					oView.setBusy(false);
					tencentId = results.Response.Data?.InstanceId;
				if(tencentId === undefined || tencentId === '0'){
				 	sap.m.MessageToast.show("Tencent MMS Template is not created.\n Try again.", {
						duration: 500
						});
				 }else{
					sap.m.MessageToast.show("Post done" + tencentId, {
						duration: 500
						});
					console.log("Tensent ID" + tencentId);
						
				//PUT the tencent status to CBO
				// update Tencent ID and TencentStatus in CBO
		     	var sUrl = "/YY1_TENCENT_TEMPLATE_CDS/YY1_TENCENT_TEMPLATE?%24filter=MessageUUID+eq+'" + tMessageUUID + "'";
					var oSettings = {
					"url": sUrl,
					"method": "GET", 
				 	"headers": {
						"X-CSRF-Token": "Fetch"
					},
					"dataType": "json",
					"contentType": "application/json"
				};
	
				$.ajax(oSettings)
				.done(function(results, textStatus, XMLHttpRequest){
					var token = XMLHttpRequest.getResponseHeader('X-CSRF-Token');
					var sapUUID = results.d.results[0].SAP_UUID;
					var sDate = new Date();
			    	var sentDate = that._formatDateForUpsert(sDate);
				
 			       var sUrlToInsert = "/YY1_TENCENT_TEMPLATE_CDS/YY1_TENCENT_TEMPLATE(guid'"+sapUUID+"')";
				   var tencentIdString = tencentId.toString();
				   var oPayload = {
							 		"MessageUUID": tMessageUUID,
								    "MessageID": tMessageID,
								    "TencentID": tencentIdString,
								    "AbilityforTemplate":"1",
								    "TencentStatus": "created",
								    "SentDate":sentDate            
							 	    };
					console.log("Paylod PUT for CBO" + oPayload);
					
					var oSettingsToInsert = {
						"url": sUrlToInsert,
						"method" : "PUT",
						"headers": {
							"X-CSRF-Token": token
						},
						"dataType":"json",
						"contentType":"application/JSON",
						"data" : JSON.stringify(oPayload)
					};
						$.ajax(oSettingsToInsert)
							.done(function(results,textStatus, XMLHttpRequest){
								oView.setBusy(false);
								sap.m.MessageToast.show("TencentID was updated " + tencentId, {
											duration: 4000
										});
							})
							.fail(function(err){
								if (err !== undefined) {
									oView.setBusy(false);
									var oErrorResponse = err.responseText;
										sap.m.MessageToast.show(" ERROR Description " + oErrorResponse, {
											duration: 6000
										});
									} else {
										sap.m.MessageToast.show("Unknown error!");
									}
							});
					
				})	
		 		.fail(function(err){
						if (err !== undefined) {
								var oErrorResponse = err.responseText;
								sap.m.MessageToast.show(" ERROR Description " + oErrorResponse, {
								duration: 6000
									});
						} else {
							sap.m.MessageToast.show("Unknown error!");
						}
				});
				}// end PUT the tencent status to CBO	
				})	
		 		.fail(function(err){
						if (err !== undefined) {
								var oErrorResponse = err.responseText;
								sap.m.MessageToast.show(" ERROR Description " + oErrorResponse, {
								duration: 6000
									});
						} else {
							sap.m.MessageToast.show("Unknown error!");
						}
			        	}); //end fail POST CreateTemplate
*/			        	
					})  //done  get MessageContents 
					.fail(function(err){
						if (err !== undefined) {
							oView.setBusy(false);
							var oErrorResponse = err.responseText;
							sap.m.MessageToast.show(" ERROR Description " + oErrorResponse, {
								duration: 6000
							});
						} else {
							sap.m.MessageToast.show("Unknown error. Turn to the support team!");
						}
					});

			} //else
		},
	
		/**
		 * Event handler for the Check status button. Will call CBO to get 
		 * actual Tencent status (from Sent to Aprooved) and update UI
		 * @public
		 */
		onCheckStatus: function(oEvent){
				var selectedRow,
				tMessageUUID,
			    tMessageID,
				tTencentId,     // from CPI API response
				tTencentStatus,
				newTencentStatus;
			//	var newTencentStatus = "gmcc OK, unicom OK, cdma OK";
		        var providerStatuses = [];
		        var statusesInfo = [];
		   //     var concatStatuses;
			var aContext = this.byId("table").getSelectedContexts();
				aContext.forEach(function(element){
					selectedRow = element.getObject();
					tMessageUUID = selectedRow.MessageUUID;
			    	tMessageID = selectedRow.EmailId;
			    	tTencentId = selectedRow.MMSID;
			    	tTencentStatus = selectedRow.Status;
				});
			
			if(aContext.length===0){
				sap.m.MessageToast.show(" Select an email message" , {
							duration: 3000				
						});
			}else if(tTencentStatus === "unknown"){				
				sap.m.MessageToast.show("Email is not sent. Send  an email for template creation" , {
							duration: 3000
						});
			}else {
			// call CPI API GetTemplateStatus to get Operator statuses
				var oView = this.getView();
		 		oView.setBusy(true);
		 		var that = this;
		 	    var oPayload = {
		 	    	"TemplateId" : tTencentId
		  	    };
		 		var sUrl = "/API_CPI_TENCENT/GetTemplateStatus";
				var oSettings = {
						"url": sUrl,
						"method" : "PUT",
						"dataType":"json",
						"contentType":"application/JSON",
						"data" : JSON.stringify(oPayload)
					};
					
				$.ajax(oSettings)
					.done(function(results,textStatus, XMLHttpRequest){
					oView.setBusy(false)
					var tencentStatus = results.Response.Data?.Status;
					if (tencentStatus === '0' || tencentStatus === undefined){
						newTencentStatus = tTencentStatus;
						sap.m.MessageToast.show("Template is under review.\n Check later.", {
							duration: 2000
						});
					}else{
					statusesInfo = results.Response.Data?.StatusInfo;
					//replase State code by OK/No/Unreviewed
					console.log(statusesInfo.length);
					   var providerStatuses = statusesInfo.map( function( el ){ 
					   	        if(el.State === 1){
					   	        	el.State="OK"
					   	        }else if(el.State === 0){
					   	        	el.State="NO"
					   	        }else{
					   	        	el.State="Unreviewed"
					   	        }
                                return el.Operator + " " +el.State; 
                               });
                       newTencentStatus =  providerStatuses.join(",");      
					   console.log(newTencentStatus);
				       sap.m.MessageToast.show("New tencent status\n" + newTencentStatus, {
							duration: 600
						});
					} //end else if status received	
				
					
				//PUT the tencent status to CBO
		     	var sUrl = "/YY1_TENCENT_TEMPLATE_CDS/YY1_TENCENT_TEMPLATE?%24filter=MessageUUID+eq+'" + tMessageUUID + "'";
					var oSettings = {
					"url": sUrl,
					"method": "GET", 
				 	"headers": {
						"X-CSRF-Token": "Fetch"
					},
					"dataType": "json",
					"contentType": "application/json"
				};
			
				$.ajax(oSettings)
				.done(function(results, textStatus, XMLHttpRequest){
					var token = XMLHttpRequest.getResponseHeader('X-CSRF-Token');
					var sapUUID = results.d.results[0].SAP_UUID;
					var sDate = new Date();
			    	var sentDate = that._formatDateForUpsert(sDate);
				
 			       var sUrlToInsert = "/YY1_TENCENT_TEMPLATE_CDS/YY1_TENCENT_TEMPLATE(guid'"+sapUUID+"')";
				 
				   var oPayload = {
							 		"MessageUUID": tMessageUUID,
								    "MessageID": tMessageID,
								    "TencentID": tTencentId,
								    "AbilityforTemplate":"1",
								    "TencentStatus": newTencentStatus,
								    "SentDate":sentDate            
							 	    };
					var oSettingsToInsert = {
						"url": sUrlToInsert,
						"method" : "PUT",
						"headers": {
							"X-CSRF-Token": token
						},
						"dataType":"json",
						"contentType":"application/JSON",
						"data" : JSON.stringify(oPayload)
					};
						$.ajax(oSettingsToInsert)
							.done(function(results,textStatus, XMLHttpRequest){
								oView.setBusy(false);
								sap.m.MessageToast.show("Tencent Status was updated " + newTencentStatus, {
											duration: 3000
										});
							})
							.fail(function(err){
								if (err !== undefined) {
									oView.setBusy(false);
									var oErrorResponse = err.responseText;
										sap.m.MessageToast.show(" ERROR Description " + oErrorResponse, {
											duration: 6000
										});
									} else {
										sap.m.MessageToast.show("Unknown error!");
									}
							});
				})	
				
		 		.fail(function(err){
						if (err !== undefined) {
							oView.setBusy(false);
								var oErrorResponse = err.responseText;
								sap.m.MessageToast.show(" ERROR Description " + oErrorResponse, {
								duration: 6000
									});
						} else {
							sap.m.MessageToast.show("Unknown error!");
						}
				})
		})
				// end PUT the tencent status to CBO	
		 		.fail(function(err){
						if (err !== undefined) {
							    oView.setBusy(false);
								var oErrorResponse = err.responseText;
								sap.m.MessageToast.show(" ERROR Description " + oErrorResponse, {
								duration: 6000
									});
						} else {
							sap.m.MessageToast.show("Unknown error!");
						}
				});
			
			} //end else if tTensect status not unknown
			
		},
		/**
		 * Event handler for the Check status button. Will call CBO to get 
		 * actual Tencent status (from Sent to Aprooved) and update UI
		 * @public
		 */
	
		onCheckAbility:function(oEvent){
			var aContext = this.byId("table").getSelectedContexts();
			if(aContext.length===0){
				sap.m.MessageToast.show(" Select an email message" , {
							duration: 3000,
							width:"20em"
						});
			}else{
			
			/*	
			for(var i = 0; i<aContext.length; i++ ){
				var selectedRow = aContext[i].getObject();
				sMessageUUID = selectedRow.MessageUUID;
		    	sMessageID = selectedRow.EmailId; 
		    	console.log("MessageID" + sMessageID + "and UUID" + sMessageUUID,  this);
		    		this._getMessageStatus(sMessageUUID, sMessageID);
			}
			*/
			var that = this;
			aContext.forEach(function(element){
				var selectedRow = element.getObject();
				sMessageUUID = selectedRow.MessageUUID;
		    	sMessageID = selectedRow.EmailId; 
		    //	console.log("MessageID" + sMessageID + "and UUID" + sMessageUUID, this, );
		    	// pass  sMessageUUID And 	 sMessageID as params for all functions
			that._getMessageStatus(sMessageUUID, sMessageID);
			})
			
		    	
			}
			
			/*
			1.  Get GUID from event
			2. Call /API_MKT_CAMPAIGN_MESSAGE_SRV/Messages(guid'42010a05-507a-1edb-97fc-94e2d6378287')//MessageContents and check MessageStatus 
			if MessageStatus !== 20(Released) -> NOT Message "Email is not released"
			else step 3
			3. Call /API_MKT_CAMPAIGN_MESSAGE_SRV/MessageContents(MessageUUID=guid'42010a05-507a-1edb-97fc-94e2d6378287',LanguageCode='EN')
			/MessageBlocks
			and check that contains only One Block Type Text
			if (False) - > Message "Only one Text is allowed. Check message content"
			else  - step 4
			4. Call  /API_MKT_CAMPAIGN_MESSAGE_SRV/Blocks(guid'42010a05-507a-1edb-97fc-9607290d6287')/MessageBlockContents
			in property "BlockContentHTMLString" -  check that contains only one image or one link.
			if(False) -> Message "Message can contain only one Image or link. Check the email content"
			else  -  > Message - can be template. POST to CBO - Availability - 1. 
			*/
		},
		/**
		 * Function to get Message status
		 * @private
		 */
		 _getMessageStatus: function(sMessageUUID,sMessageID){
		 		var oView = this.getView();
				var oParams = {
					$expand: "MessageContents",
					$format: "json"
				};
                
				//var sUrl = "/API_MKT_CAMPAIGN_MESSAGE_SRV/Messages(guid'" + sMessageUUID + "')";
				var sUrl = "/API_MKT_CAMPAIGN_MESSAGE_SRV/Messages(guid'" + sMessageUUID + "')";
				var self = this;
				
				$.get(sUrl, oParams)
					.done(function(results){
							var sMessageStatus = results.d.MessageStatus;
							if(sMessageStatus !== "20"){
								sap.m.MessageToast.show("Email is not released. \n Please, release the email.", {
								duration: 4000,
								width:"20em"
								});
							} else{
								// function to count blocks and check their content
								self._checkBlocksNumberAndContent(sMessageUUID,sMessageID);
							
							}
						
					})
					.fail(function(err){
							if (err !== undefined) {
							var oErrorResponse = err.responseText;
							sap.m.MessageToast.show(" ERROR Description \n" + oErrorResponse, {
								duration: 6000,
								width:"20em"
							});
						} else {
							sap.m.MessageToast.show("Unknown error. Turn to the support team!");
						}
					});
		 },
		/**
		 * Function to get number and type of blocks in the email
		 * @private
		 */
		 _checkBlocksNumberAndContent: function(sMessageUUID,sMessageID){
		 		var oView = this.getView();
		 		oView.setBusy(true);
		 		
				var oParams = {
					$format: "json",
					$expand: "MessageBlockContents"
				};

				var sUrl = "/API_MKT_CAMPAIGN_MESSAGE_SRV/MessageContents(MessageUUID=guid'" + sMessageUUID + "',LanguageCode='ZH')/MessageBlocks";
				var self = this;
				
				$.get(sUrl,oParams)
					.done(function(results){
						oView.setBusy(false);
						aMessageBlocks = results.d.results;
			// check it is not empty.Translated on Chinese			
						if(aMessageBlocks.length === 2){
						   // for (var i = 0; aMessageBlocks.length-1; i++){
						   [0,1].forEach(function(i){
						    	if(aMessageBlocks[i].BlockType === "TEXT"){
						    		aTextBlockContentString = aMessageBlocks[i].MessageBlockContents.results[0].BlockContentHTMLString;
						    		if(aTextBlockContentString.length > 1){
						    		    self._checkContentString(aTextBlockContentString,sMessageUUID,sMessageID);
						    		}else{
						    			self._sendAbilityStatus("0", "NO",sMessageUUID,sMessageID);
						    			sap.m.MessageToast.show("Type of block has to be TEXT", {
											duration: 6000,
											width:"20em"
										});
						    		}
						    	}
						   });
						   // 	}
						}else{
							oView.setBusy(false);
							self._sendAbilityStatus("0", "NO",sMessageUUID,sMessageID);
							sap.m.MessageToast.show("Email has to contain only one Text block", {
							duration: 6000,
							width:"20em"
							});
						}
					})
					.fail(function(err){
						if (err !== undefined) {
							var oErrorResponse = err.responseText;
							sap.m.MessageToast.show(" ERROR Description " + oErrorResponse, {
								duration: 6000
							});
						} else {
							sap.m.MessageToast.show("Unknown error. Turn to the support team!");
						}
					});
		 },
		 /**
		 * Function to check if email contains more than 1 image or 1 link
		 * @private
		 * Example string
		 * "Message with empty subject and two images<img src="http://s7g10.scene7.com/is/image/BurberryTest/05C0B8AB-737E-4FFB-8F45-084943E2F96C?$BBY_V2_B_4X3$" alt="77777771_black3P_pt=sl_3P_23.jpg" title="77777771_black3P_pt=sl_3P_23.jpg" style="opacity: 1;" data-sap-hpa-ceimo-image="SMOImage" data-sap-hpa-ceimo-image-type="Static" data-sap-hpa-ceimo-image-id="16177142219601539" /><img src="http://s7g10.scene7.com/is/image/BurberryTest/42371C70-DF3E-4A57-99D0-4B83F138C3C4?$BBY_V2_B_4X3$" alt="45533011_black_pt=sl_5.jpg" title="45533011_black_pt=sl_5.jpg" style="opacity: 1;" data-sap-hpa-ceimo-image="SMOImage" data-sap-hpa-ceimo-image-type="Static" data-sap-hpa-ceimo-image-id="16177142459331634" />"
		 */
		 _checkContentString:function(oContentString,sMessageUUID,sMessageID){
		 	const imageStr = "<img";
		 	const linkStr = "href=";
		 	let countImage = 0;
			let countLink = 0;
			let isTemplateAvailable = false;   // Block scope. Check that is cleaned before next run
		    //find and count occurrences of Image -> Substring <img src=	
		    countImage = this.countOccurances(oContentString,imageStr);
		     //find and count occurrences of Link -> Substring href=
		    countLink = this.countOccurances(oContentString,linkStr);
		    if(countImage <= 1 && countLink <= 1){
		    	isTemplateAvailable = true;
		    	console.log("isTemplateAvailable" +isTemplateAvailable);
		    	console.log("countImage" +countImage+ "countLink"+ countLink);
		    }else{
		    	console.log("isTemplateAvailable" +isTemplateAvailable);
		    	console.log("countImage" +countImage+ "countLink"+ countLink);
		    	sap.m.MessageToast.show(" Email can contain one image or one link.\n Number of images is " + countImage +"\n Number of links is " + countLink,{
								duration: 5000
							});
		    }
		    // post Ability status to CBO
		  	if(isTemplateAvailable){
				this._sendAbilityStatus("1", "YES",sMessageUUID,sMessageID);
			}else{
				this._sendAbilityStatus("0", "NO",sMessageUUID,sMessageID);
			}
		  },
		/**
		 * Function to count occurance of substring in the string
		 * @private
		 */
		 countOccurances: function(oString,oSubString){
		 	return oString.split(oSubString).length - 1;
		 },
		 /**
		 * Function to sent ability to be Tencent template status to  CBO
		 * Function Import Sap_upsert is used to update data
		 * @private
		 */
		 _sendAbilityStatus: function(abilityFlag, postMessage,sMessageUUID,sMessageID){
		 		var oView = this.getView();
		 		oView.setBusy(true);
		 		
		 		var sUrl = "/YY1_TENCENT_TEMPLATE_CDS/YY1_TENCENT_TEMPLATE/";
				var oSettings = {
					"url": sUrl,
					"method": "GET", 
				 	"headers": {
						"X-CSRF-Token": "Fetch"
					},
					"dataType": "json",
					"contentType": "application/json"
				};
				var that = this;
				$.ajax(oSettings)
				.done(function(results, textStatus, XMLHttpRequest){
					this.token =XMLHttpRequest.getResponseHeader('X-CSRF-Token');
					var sDate = new Date();
			    	var sentDate = that._formatDateForUpsert(sDate);
				  // var sUrlToInsert = "/YY1_TENCENT_TEMPLATE_CDS/YY1_TENCENT_TEMPLATE/";
				   var sUrlToInsert = "/YY1_TENCENT_TEMPLATE_CDS/YY1_TENCENT_TEMPLATESap_upsert?MessageUUID='"+ sMessageUUID +"'&MessageID="+ sMessageID+
				   "&AbilityforTemplate="+abilityFlag+"&TencentID='unknown'&TencentStatus='unknown'&SentDate=datetime'"+sentDate+"'";
				  // "&AbilityforTemplate="+abilityFlag+"&TencentID='unknown'&TencentStatus='unknown'&SentDate=datetime'1970-01-01T00:00'";  // url for Sap_upsert
				/*
				   var oPayload = {
							 		"MessageUUID": sMessageUUID ,
							 	    "MessageID": sMessageID,
					                "AbilityforTemplate": abilityFlag                
							 	    };
				*/
					// commented for POST 
					/*
					var oSettingsToInsert ={
						"url": sUrlToInsert,
						"method" : "POST",
						"headers": {
							"X-CSRF-Token": this.token
						},
						"dataType":"json",
						"contentType":"application/JSON",
						"data": JSON.stringify(oPayload)
					};
					*/
					var oSettingsToInsert = {
						"url": sUrlToInsert,
						"method" : "POST",
						"headers": {
							"X-CSRF-Token": this.token
						},
					//	"data" : $.param(oPayload)
					
					/*	"data":$.param({ "MessageUUID": "\'42010a05-507a-1edb-a2fb-77f58cbad3b1\'", "MessageID" : "621",
							"AbilityforTemplate":"0", "TencentID":"\'unknown\'", "TencentStatus":"\'unknown\'",
							"SentDate": "datetime\'1970-01-01T00:00\'"
							*/
					//	}) 
					};
					
						$.ajax(oSettingsToInsert)
							.done(function(results,textStatus, XMLHttpRequest){
								oView.setBusy(false);
								sap.m.MessageToast.show(postMessage, {
											duration: 500
										});
							})
							.fail(function(err){
								if (err !== undefined) {
									oView.setBusy(false);
									var oErrorResponse = err.responseText;
										sap.m.MessageToast.show(" ERROR Description " + oErrorResponse, {
											duration: 6000
										});
									} else {
										sap.m.MessageToast.show("Unknown error!");
									}
							});
					
				})	
		 		.fail(function(err){
						if (err !== undefined) {
								var oErrorResponse = err.responseText;
								sap.m.MessageToast.show(" ERROR Description " + oErrorResponse, {
								duration: 6000
									});
						} else {
							sap.m.MessageToast.show("Unknown error!");
						}
				});
		 	
		 },
		/**
		 * Format Date for sap upsert
		 * @private
		 */
		 _formatDateForUpsert: function(sDate){
		 //	var d = new Date();
			var d = new Date(sDate.getTime() - 3000000);
			var dateForUpsert = d.getFullYear().toString()+"-"+((d.getMonth()+1).toString().length==2?(d.getMonth()+1).toString():"0"+(d.getMonth()+1).toString())+"-"+(d.getDate().toString().length==2?d.getDate().toString():"0"+d.getDate().toString())+"T"+(d.getHours().toString().length==2?d.getHours().toString():"0"+d.getHours().toString())+":"+((parseInt(d.getMinutes()/5)*5).toString().length==2?(parseInt(d.getMinutes()/5)*5).toString():"0"+(parseInt(d.getMinutes()/5)*5).toString())+":00";
			return dateForUpsert;
		},
		 /**
		 * CONFIGURE SEARCH
		 */
		 openConfigureSearchDialog: function(){
		 	var oDialog;
		 	if(!oDialog){
		 		oDialog = this._getConfigureSearchDialog();
		 	}
		 	oDialog.open();
		 },
		 
		 closeConfigureSearchDialog: function(){
		 	var oDialog;
		 	if(!oDialog){
		 		oDialog = this._getConfigureSearchDialog();
		 	}
		 	oDialog.close();
		 },
		 
		 _getConfigureSearchDialog: function () {
		 		if(!this._oConfigureSearchDialog){
		 			this._oConfigureSearchDialog = sap.ui.xmlfragment(this.getView().getId(), "mms_template.view.ConfigureSearch", this);
		 			this.getView().addDependent(this._oConfigureSearchDialog);
		 		}
		 		return this._oConfigureSearchDialog;
		},
		
		setSearchParameter: function(){
			var selectedButtonIndex = this.byId("SearchGroup").getSelectedIndex();
			if (selectedButtonIndex === 0){
				defaultSearchParam = "EmailName";
				this.byId("searchField").setPlaceholder("Search by Message Name");
			} else {
				defaultSearchParam = "EmailId";
				this.byId("searchField").setPlaceholder("Search by Message Id");
			}
			this.closeConfigureSearchDialog();
		},
		/**
		 * Event handler for the Search feild. 
		 * @public
		 */
		onSearchMessages: function(oEvent){
	       
	       	var oBinding = this.byId("table").getBinding("items");
			var aFilter = [];
			var sQuery = oEvent.getParameter("query");
			if (sQuery) {
				if(defaultSearchParam === "EmailId"){
					aFilter.push(new sap.ui.model.Filter(defaultSearchParam, sap.ui.model.FilterOperator.EQ, sQuery));
				}else{
					aFilter.push(new sap.ui.model.Filter(defaultSearchParam, sap.ui.model.FilterOperator.Contains, sQuery));
				}
			}
			oBinding.filter(aFilter,"Application");
		},
		/**
		 * Event handler for the Sort button.
		 * @public
		 */
		 onSort: function(){
		 	var oView = this.getView(),
			 	aStates = ["desc", "asc"],
			 	aStateTextIds = ["sortDescending","sortAscending"],
			 	iOrder = oView.getModel("orderModel").getProperty("/order");
			 	
			iOrder = (iOrder +1) % aStates.length;
			var sOrder = aStates[iOrder];
			
			oView.getModel("orderModel").setProperty("/order", iOrder);
			oView.byId("table").getBinding("items").sort(sOrder && new Sorter("EmailId", sOrder==="desc"));
		 }
		
	

	});

});
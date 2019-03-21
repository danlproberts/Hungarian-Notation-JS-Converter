sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/table/SortOrder",
	"sap/ui/model/FilterOperator",
	"testwebapptestWebApp/util/usefulFunctions"
], function(UIComponent, Controller, JSONModel, MessageToast, Filter, Sorter, SortOrder, FilterOperator, usefulFunctions) {
	"use strict";

	return Controller.extend("testwebapptestWebApp.controller.View1", {

		onInit: function() {
            UIComponent.getRouterFor(this).getRoute("main").attachMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function(oEvent) {

            //Set Model for input fields
			var oInitFields = {Title: "", Duedate: null};
			var oInitAdds = new JSONModel(initFields);
			this.getView().setModel(oInitAdds, "addFields");

			//Set switch state model
			var oMyStateModel = new JSONModel({
				"state": true,
				"creator": "Daniel Roberts"
			})
			this.getView().setModel(oMyStateModel, "oMyStateModel");

			this.firstTimeFilter();
		},

		onBeforeRendering: function() {

		},

		reApplyMyFilter: function(sorter=[]) {

			//Gathering Switch State
			var ftrSwtch = this.getView().getModel("myStateModel"),
				state = ftrSwtch.getData().state;
			
			//Loading local dataStore.json
			
			var dsData = this.getView().getModel("dataStore").getData();

			var aFilter = [new Filter("Deleted", FilterOperator.EQ, "false")];
		
			if (state) {
				aFilter.push(new Filter("Listname", FilterOperator.EQ, dsData.Listname));
				
			} else {

			}

			this.refreshTable(aFilter, sorter);
	
		},

		refreshTable: function(filter=[new Filter("Deleted", FilterOperator.EQ, "false")], sorter=[]) {			

			this.getView().getModel().read(usefulFunctions.returnPath(), {
				sorters: sorter,
				filters : filter,
				success: function(data){
					console.log(data);
					var oMyModel = new JSONModel(data);
					this.getView().setModel(oMyModel, "myItems");
					
				}.bind(this),
				error: function(oError) {
					console.log(oError);
				}
			})		

		},

		navToTaskDetails: function(oEvent){

			//Retrieving row on button location
			var eventBC = oEvent.getSource().getBindingContext("myItems"),
				sObject = eventBC.getObject(),
				itemId = sObject.Id;

			UIComponent.getRouterFor(this).navTo("taskDetails", {
				"itemId" : itemId,
				"model" : sObject
			})
		},

		onPressAdd: function(oEvent) {

			var oToday = new Date(),
				oData = this.getView().getModel(),
				dataStore = this.getView().getModel("dataStore").getData(),
				itemCreator = this.getView().getModel("myStateModel").getData();

			//Retrieving input and removing it from input box
			var newItem = this.getView().getModel("addFields").getProperty("/Title");
			if (newItem === "") {
				newItem = "New Item";
			}

			//Retrieving inputted date or generating today's date if blank, then removing it from the field
			var newDate = this.getView().getModel("addFields").getProperty("/Duedate");
			if (newDate === null) {
				newDate = new Date();
			}
						
			//Generating new item for output array
			var oNewBlob = {
				Title: newItem,
				Description: "Edit Description",
				Duedate: newDate,
				Assignedto: "",
				Listname: dataStore.Listname,
				Createdby: itemCreator.creator
			};

			//Pushing new item into the array - CREATE METHOD
			this.getView().getModel().create(usefulFunctions.returnPath(), oNewBlob, {
				success: function () {
					this.getView().getModel("addFields").setData({Title: "", Duedate: null});		
					this.reApplyMyFilter();
				}.bind(this), 
				error: function (oError) {
					console.log(oError);
				}
			})
			
			//Refocusing user input to title box
			this.getView().byId("inputBox").focus();
		},

		onPressEdit: function(oEvent) {

			//Retrieving row on button location
			var eventBC = oEvent.getSource().getBindingContext("myItems");
			var sObject = eventBC.getObject();

			//Initilise fragment
			this.returnEditFragment();

			var oFragData = new JSONModel(sObject);
			this._editFrag.setModel(oFragData, "fragModel");
			this._editFrag.open();
		},

		onPressInfo: function(oEvent) {

			this.returnInfoFragment();
			
			this._infoFrag.open();
		},
		
		returnEditFragment: function() {

			if (!this._editFrag) {
				this._editFrag = sap.ui.xmlfragment(this.getView().getId(), "testwebapptestWebApp.view.fragments.EditView1", this);
				this.getView().addDependent(this._editFrag, this);
			}

			return this._editFrag

		},

		returnInfoFragment: function() {

			if (!this._infoFrag) {
				this._infoFrag = sap.ui.xmlfragment(this.getView().getId(), "testwebapptestWebApp.view.fragments.InfoView1", this);
				this.getView().addDependent(this._infoFrag, this);
			}

			return this._infoFrag

		},

		returnSortFragment: function() {

			if (!this._sortFrag) {
				this._sortFrag = sap.ui.xmlfragment(this.getView().getId(), "testwebapptestWebApp.view.fragments.SortView1", this);
				this.getView().addDependent(this._sortFrag, this);
			}

			return this._sortFrag

		},

		onPressSort: function(oEvent) {

			this.returnSortFragment()

			if (!this._sortFrag.getModel("sortModel")) {

				var oSortData = new JSONModel({
					"sorting" : false,
					"sortType": "asc",
					"sortField": "Title",
					"sortBool": false
				})

				this._sortFrag.setModel(oSortData, "sortModel")

				console.log("Model Created!")

			}
			
			
			this._sortFrag.open()		

		},

		onSortFieldChange: function(oEvent) {
			
			var sortData = this._sortFrag.getModel("sortModel").getData()

			sortData.sortField = oEvent.getParameter("item").getProperty("key")

		},

		onSortTypeChange: function(oEvent) {
			
			var sortData = this._sortFrag.getModel("sortModel").getData()

			sortData.sortType = oEvent.getParameter("item").getProperty("key")

		},

		onPressSortSaveGW: function() {
			
			var oDialog = this._sortFrag,
				oModel = oDialog.getModel("sortModel"),
				sortData = oModel.getData();

			sortData.sortBool = (sortData.sortType === "desc") ? true : false;

			var sortSorter = [new Sorter(sortData.sortField, sortData.sortBool)];

			this.reApplyMyFilter(sortSorter);

			oDialog.close();

		},

		onPressSortSaveLocal: function() {
			
			var oDialog = this._sortFrag,
				oModel = oDialog.getModel("sortModel"),
				sortData = oModel.getData();

			sortData.sortBool = (sortData.sortType === "desc") ? true : false;

			var oTable = this.getView().byId("mainTable");

			var oBinding = oTable.getBinding("items"),
				aSorters = [];

			aSorters.push(new Sorter(sortData.sortField, sortData.sortBool));

			// apply the selected sort and group settings
			oBinding.sort(aSorters);

			var sSortDirection = sortData.sortBool ? "descending" : "ascending"
			console.log("Sorting by '" + sortData.sortField + "' in " + sSortDirection + " order");

			oDialog.close();

		},

		returnSortTableItems: function(data, sortField, sortDesc=false) {
			
			data.results.sort(
				function(a, b) {
					if (!sortDesc) {
						
						if (typeof(a[sortField]) === "string") {

							return a[sortField].localeCompare(b[sortField])

						} else {

							return a[sortField] - b[sortField];

						}						
					} else {

						if (typeof(a[sortField]) === "string") {

							return b[sortField].localeCompare(a[sortField])

						} else {

							return b[sortField] - a[sortField];

						}						
					}
				}
			);

			return data

		},

		onPressSaveDialog: function() {
			
			var oDialog = this._editFrag,
				oModel = oDialog.getModel("fragModel"),
				oData = oModel.getData(),
				line = oData.Id;

			//Update Method here!
			this.getView().getModel().update(usefulFunctions.returnPath(line), oData, {
				success: function () {		
					this.reApplyMyFilter();
				}.bind(this), 
				error: function (oError) {
					console.log(oError);
				}
			})

			//oDialog.close();

			var sMsg = "Item Saved";
			MessageToast.show(sMsg);
		},

		onPressCloseDialog: function() {

			if (this._editFrag) {
				this._editFrag.close();
			}

			if (this._infoFrag) {
				this._infoFrag.close();
			}

			if (this._sortFrag) {
				this._sortFrag.close();
			}
			
		},

		onPressRemove: function(oEvent) {

			//Retrieving row on button location
			var eventBC = oEvent.getSource().getBindingContext("myItems");
			var sObject = eventBC.getObject();

			//Confirm removal
			var oSource = oEvent.getSource();
			
			if (oSource.getProperty("type") === "Reject") {

				oSource.setProperty("text", "Confirm?");
				oSource.setProperty("type", "Accept");				

			} else {

				this.removeMain(sObject);

				oSource.setProperty("text", "Remove");
				oSource.setProperty("type", "Reject");

			}

		},

		removeMain: function(sObject) {

			
			var line = sObject.Id;

			//Removing row from table data and setting at model - REMOVE method here!
			this.getView().getModel().remove(usefulFunctions.returnPath(line), {
				success: function () {		
					this.reApplyMyFilter();
				}.bind(this), 
				error: function (oError) {
					console.log(oError);
				}
			})

			var sMsg = "Line " + line + " Removed";
			MessageToast.show(sMsg);

		},

		editSaveFocus: function() {
			this.getView().byId("editSave").focus();
		},

		firstTimeFilter: function() {

			//Gathering Switch State
			var ftrSwtch = this.getView().getModel("myStateModel"),
				state = ftrSwtch.getData().state;

			//Loading local dataStore.json
			this.getOwnerComponent().getModel("dataStore").attachRequestCompleted(function(oEvent) {
				var dsData = oEvent.getSource().getData();

				var aFilter = [new Filter("Deleted", FilterOperator.EQ, "false")];
			
				if (state) {
					aFilter.push(new Filter("Listname", FilterOperator.EQ, dsData.Listname));
					
				} else {

				}

				this.refreshTable(aFilter);

			}.bind(this));

		},

		onAfterRendering: function() {
					
		}
	});
});
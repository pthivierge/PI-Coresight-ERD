"use strict";
(function () { // wrapping all the code in an auto-executing function is good practice, it avoids spreading global variables everywhere... 

    /*
        Copyright 2015 Patrice Thivierge Fortin, OSIsoft LLC
    
        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at
    
        http://www.apache.org/licenses/LICENSE-2.0
    
        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        See the License for the specific language governing permissions and
        limitations under the License.
    */

    // CONSTANTS
    // You will need to change these settings for your environment

    //AF_ELEMENTS_PATH determines the rooth path from wich the tree will be built
    var AF_ELEMENTS_PATH = '\\\\MEGATRON\\NuGreen\\NuGreen';

    // PI_WEB_API_URL determines what is the path to PI web API
    var PI_WEB_API_URL = 'https://megatron/piwebapi/';

    var PI_CORESIGHT_URL = 'http://megatron/Coresight/';

    var USE_LOCAL_STORAGE = true;

 


    // Application startup

    // CREATES THE ANGULAR APPLICATIONS
    var app = angular.module('app', [

          // Angular modules (services and factories)
          // you need to add a javascript package to support them
          //'ngRoute',
          'ngStorage',
          //'ngTable',
          'ui.bootstrap',

          // Custom modules 
          'angularBootstrapNavTree'

          // 3rd Party Modules
         // 'chart.js'
    ]);


    // DEFINES THE ANGULAR CONTROLLER THAT WILL KEEP TRACK OF OUR TREE
    app.controller('treeCtrl', treeCtrl);
    treeCtrl.$inject = ["$scope", "piWebApiHttpService", "$localStorage", "$sce", "$http", "$uibModal"]; // this technique, using inject, make sure that the js will work even if it is minified later on.
    function treeCtrl($scope, piWebApiHttpService, $localStorage, $sce, $http, $uibModal) {
        

        function init() {

            // scope variables initialization
            $scope.elements_tree = {};                                               // this object is a reference to the abn-tree.  it allows to controll it programmatically.
            $scope.currentIframePage = $sce.trustAsResourceUrl('no-selection.html'); // page that is displayed by the iframe
            /*
                Note:
                currentIframePage need to be set using the $sce.trustAsResourceUrl.  This is related to security.
            */

            // initializes the piWebApiHttpService by setting the url of pi web api as well as the authentication setting
            piWebApiHttpService.SetPIWebAPIServiceUrl(PI_WEB_API_URL);
            piWebApiHttpService.SetAPIAuthentication("Kerberos", "", "");

            // fills the combo box
            populateDisplaySelection();

            // if local storage is used, the AF Data will not be re-queried to build the tree each time page is refreshed.
            if (USE_LOCAL_STORAGE) {
                // initializes the localstorage if it does not exist
                $scope.$storage = $localStorage.$default({
                    treeData: [],
                    selectedDisplay:{}
                });

                $scope.$storage = $localStorage;
                $scope.treeData = $scope.$storage.treeData;
                $scope.selectedDisplay = $scope.$storage.selectedDisplay;


                // setting the display select in the combo box
                // todo fix this code ... should not be so hard!!
                // need to implement a generic way to make init... 
                if ($scope.selectedDisplay.DisplayName === undefined) {
                    $scope.selectedDisplay = $scope.displays[0];
                } else {
                    for (var i=0;i< $scope.displays.length;i++) {
                        if ($scope.displays[i].DisplayName === $scope.selectedDisplay.DisplayName) {
                            $scope.selectedDisplay = $scope.displays[i];
                        }
                    }
                }

                for (var i = 0; i < $scope.treeData.length; i++) {
                    resetSelection($scope.treeData[i]);
                }

                if ($scope.$storage.selectedNode !== undefined)
                    nodeSelected($scope.$storage.selectedNode);

            } else {
                $scope.treeData = [];
                $scope.selectedDisplay = $scope.displays[0];
            }

            // will make the call to refresh the tree only if cache is empty or if USE_LOCAL_STORAGE is set to false.
            if ($scope.treeData.length === 0) {
                // make the web api call to get the root element - once the call has succeeded, the tree will start to build
                console.log("calling PI Web API to build tree information");
                piWebApiHttpService.GetElementsByPath(AF_ELEMENTS_PATH)
                    .then(buildTree)
                    .catch(function (e) {
                        console.error('Error when trying to initialize the tree. See error content for details.', e);
                    });
            }
        }

        //--------------------------------------------------------
        // fills the Displays to show combo box
        // you must provide valid ids.
        //--------------------------------------------------------
        function populateDisplaySelection() {
            $scope.displays = [];

            // here you can add the ERD Displays that are available in your system
            // when the display is selected, the selected element will show this display.
            $scope.displays.push(createDisplay("adhoc", 0)); // adhoc has a special treatment in the code, it does not require an id. you should not remove this line.
            $scope.displays.push(createDisplay("Boilers", 10003));

        }

        //--------------------------------------------------------
        // build the tree
        //--------------------------------------------------------
        function buildTree(response) {

            // parent node is the element that was specified
            var rootElement = response.data;

            // creates the first node object that will be the root of the tree
            var root = createTreeItem(rootElement);

            // add all childs
            addTreeChildren(root)
                .finally(function () {
                    $scope.treeData.push(root);
                });
        }

        //--------------------------------------------------------
        // recursive function to get tree childs
        //--------------------------------------------------------
        function addTreeChildren(parent) {

            return piWebApiHttpService.query(parent.data.Links.Elements)
                .then(function (response) {

                    var elements = response.data.Items;

                    // for every child, children will be added.
                    for (var i = 0; i < elements.length; i++) {
                        var node = createTreeItem(elements[i]);
                        addTreeChildren(node);
                        parent.children.push(node);
                    }


                });
        }

        //--------------------------------------------------------
        // creates a node item for the tree
        //--------------------------------------------------------
        function createTreeItem(element) {
            var treeItem = {
                label: element.Name,
                data: element,
                children: []
            }

            return treeItem;
        }

        //--------------------------------------------------------
        // resets the tree selection when page is loaded
        //--------------------------------------------------------
        function resetSelection(node) {

            if (node.selected !== undefined) {
                node.selected = false;
            }

            if (node.children !== undefined && node.children.length > 0) {
                for (var i = 0; i < node.children.length; i++) {
                    resetSelection(node.children[i]);
                }
            }
        }

        //--------------------------------------------------------
        // called when a node is selected on the tree
        //--------------------------------------------------------
        function nodeSelected(node) {
          
            // stores current selections, if browser is refreshed, last content will be displayed again
            $scope.$storage.selectedNode = node;
            $scope.$storage.selectedDisplay = $scope.selectedDisplay;

            var elementPath = node.data.Path;
           
            var uri = "";
            if ($scope.selectedDisplay.DisplayId <= 0) {

                // if you want the adhoc display to work in chrome, you'll need to comment out the last part. Not sure what is the problem is...
                //  + "&hidetoolbar&redirect=true&mode=kiosk";
                uri = "#/Displays/AdHoc?DataItems=" + elementPath + "&hidetoolbar&redirect=true&mode=kiosk";
            }
            else {
                uri = "#/PBDisplays/" + $scope.selectedDisplay.DisplayId + "?CurrentElement=" + elementPath + "&hidetoolbar&redirect=true";
            }


            var newUrl = PI_CORESIGHT_URL + uri;
            console.log(newUrl);
            $scope.currentIframePage = $sce.trustAsResourceUrl(newUrl);


        }
        $scope.nodeSelected = nodeSelected; // makes this function visible to the controller in the html page.

        //--------------------------------------------------------
        // creates a display object
        //--------------------------------------------------------
        function createDisplay(name, id) {
            var display = {};
            display.DisplayName = name;
            display.DisplayId = id;
            return display;
        }

        $scope.openConfiguration = function () {

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'modal.html',
                controller: 'modalConfigCtrl',
                size: 'lg',
                resolve: {
                    items: function () {
                        return 'hey this is selected';
                    }
                }
            });

            modalInstance.result
                .then(null)
                .catch(function () {console.info('Modal dismissed at: ' + new Date());
            });
        };


        init();
    }

    // controller for the modal configuration window
    angular.module('app').controller('modalConfigCtrl',modalConfigCtrl);
    modalConfigCtrl.$inject = ['$scope', '$uibModalInstance', "$localStorage", "items"];
    function modalConfigCtrl($scope, $uibModalInstance, $localStorage, items) {

        $scope.selectedDisplay = items;

        $scope.ok = function () {
            $uibModalInstance.close();
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    };

})();
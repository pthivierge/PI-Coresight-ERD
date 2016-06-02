## PI-Coresight-ERD
An html and javascript file that use PI Web API to demonstrate how to build a web Element Relative Display.

This project consist in an html page that contains:

- A treeview at the left, to select an element.  elements are loaded in the tree by using PI Web API.
- An Iframe, to display PI Coresight Page
- A combobox / select, to choose what is the PI Coresight Display that will be displayed when clicking on a node.

Depending on the type of display selected, the page that is showed when an element is selected can be either
- A Coresight AdHoc Display
- A Coresight ProcessBook Display




The html layout is a very simple, it uses **fixed** divs.  Fixed means that element is relative to the browser window. So the relevant part of the css is as follow:

e.g. if you want to make the side bar larger, you'd need to increase #side-bar and #side-bar-status width and and decrease #content width.

	#side-bar {
	    position: fixed;
	    width: 15%;
	    height: 90%;
	}
		
	
	#side-bar-status {
	    position: fixed;
	    height: 10%;
	    width: 15%;
	    top: 90%;
	}
	
	#content > iframe {
	    left: 15%;
	    width: 85%;
	    height: 100%;
	    min-height: 100%;
	} 




**[Screenshots][1]**


### Getting Started

This project is created with a visual studio solution.  There is nothing compiled, it is just to make use of IIS express that is bundled with visual studio.  This makes things easier when using JavaScript that needs to make use of files served by a web server.  The environment is also convenient to use.

### constants in script.js

At the top of the file, you will find constants that you need to change, make sure you set them to fit your environment: 

    var AF_ELEMENTS_PATH = '\\\\MEGATRON\\NuGreen\\NuGreen';

    var PI_WEB_API_URL = 'https://megatron/piwebapi/';

    var PI_CORESIGHT_URL = 'http://megatron/Coresight/';

    var USE_LOCAL_STORAGE = true;


###Available displays

Make sure you also look at the method **populateDisplaySelection** to add Displays you need to be available.

        function populateDisplaySelection() {
            $scope.displays = [];

            // here you can add the ERD Displays that are available in your system
            // when the display is selected, the selected element will show this display.
            $scope.displays.push(createDisplay("adhoc", 0));
            $scope.displays.push(createDisplay("Boilers", 10003));

        }

##License

Copyright 2016 Patrice Thivierge Fortin 

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.


[1]:https://github.com/pthivierge/PI-Coresight-ERD/wiki
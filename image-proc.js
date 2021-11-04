/*
	This is the Script File containing the liquify, swirl, and color pick tools

	It also contains auxillary functions to aid in making them work

	This code was made using source code from:
		geek_office_dog@blog (their hello swirl and hello swirl 2 tutorials)
			links - https://geekofficedog.blogspot.com/2015/01/liquify-effect-hello-swirl-2.html?m=1
							https://geekofficedog.blogspot.com/2013/04/hello-swirl-swirl-effect-tutorial-in.html?m=1
		mozilla.org (their pixel manip tutorial)
			link - https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
*/

/*
	this function is used to set the intensity of the tool
	it is called by the button in the html file
*/
function setEffectIntensity(intensity) {
    effectIntensity = (intensity / 10.0);
}

/*
	This function onloads an image to the canvas using a preset from the directory
	it is called upon website execution

	The function could be improved by adding a fit to screen portion
*/
function onloadImage(file) {
	var img; //the image object

	img = new Image();
	img.src = file;

	img.onload = function() {
		 //setting the canvas dimensions to the image
		canvas.width = img.width;
		canvas.height = img.height;

		//drawing the image
		context2d.drawImage(img, 0, 0);
		//setting the image data into the buffer that will be draw everytime there is a modification
		currentBuffer = context2d.getImageData(0, 0, img.width, img.height);
	}
}
/*
	This function is similar to the onloadImage function
	the difference comes from the fact that the files are uploaded
	the function is called by the html file

	again, could be improved by fitting to the screen
*/
function loadImage(src){
  //prevent any non-image file type from being read.
  if(!src.type.match(/image.*/)){
    console.log("The dropped file is not an image: ", src.type); //output to the console (inspect element)
    return;
  }

  //create our FileReader and run the results through the render function.
  var reader = new FileReader();
  reader.onload = function(e) {
      var image = new Image();
			//similar concept to the onload function
      image.onload = function() {
            // Adjust canvas size to the image dimensions
            canvas.width = image.width;
            canvas.height = image.height;

            //save a copy of loaded pixels
            context2d.drawImage(image, 0, 0);
            currentBuffer = context2d.getImageData(0, 0, image.width, image.height);
      }
      image.src = e.target.result;
  };
  reader.readAsDataURL(src);
}

/*
	This group of function are the event handlers
	They all mostly do the same thing but for different events

	check individual comments for more information
*/
function onMouseOut(event) {
    if (!currentBuffer) { //if the buffer doesnt have a value exit
        return;
    }
    drawBuffer(); //otherwise update the buffer
}
function onMouseWheel(event) {
    if (!currentBuffer) { //no value, exit
        return;
    }

    if (event.wheelDelta) { //change in mousewheel (for chrome)
        console.log(event.wheelDelta);    
        switch (event.wheelDelta) {
					//add size depending on speed
            case  150: toolRadious += 1; break;
            //case  240: toolRadious += 2; break;
					//remove size depending on speed
            case -150: toolRadious -= 1; break;
            //case -240: toolRadious -= 2; break;
        }
    } else if (event.detail) { //for other browser
        if (event.detail < 0) {
            toolRadious += 1;
        } else {
            toolRadious -= 1;
        }
    }

		//checking the tool bounds
    if (toolRadious < MIN_TOOL_RADIOUS) {
        toolRadious = MIN_TOOL_RADIOUS;
    }
    if (toolRadious > MAX_TOOL_RADIOUS) {
        toolRadious = MAX_TOOL_RADIOUS;
    }

		//we have to draw the tool on the canvas
    drawTool(event.clientX, event.clientY);
}
function onMouseMove(event) {
    if (!currentBuffer) { //no value, exit
        return;
    }
    if(toolID == 3) { //checking if we are in color pick mode
			//if we are we have to update the hovered color
			//we also need to draw the tool
      drawTool(event.clientX, event.clientY, pick(event));
    } else {
      drawTool(event.clientX, event.clientY, '#000000')
    }
}
function onMouseDown(event) {
    if (!currentBuffer) { //no value, exit
        return;
    }

    var rect = canvas.getBoundingClientRect(); //check within the bounds of the canvas
    var x = (event.clientX - rect.left) | 0;
    var y = (event.clientY - rect.top) | 0;
    console.log(x, y); //we send a log of the clicked pixel to the console

		/*
			it might be better to do a switch here
			we essentially are checking which tool is active
			I think this could be optimized by using an array of bools
			we'd need to know how many tools we have for that though
		*/
    switch(toolID) {
        case 0:
            break;
        case 1:
            swirl(currentBuffer, x, y, toolRadious);
            break;
        case 2: 
            liquify(currentBuffer, x, y, toolRadious);
            break;
        case 3:
            var picked = pick(event);
            pickedColor.style.background = picked;
            pickedColor.textContent = picked;
            break;
        default:
            system.log("ERROR: toolID has invalid value.");
    }
    /*if(doLiquify && !doSwirl && !doColorPick) {
      liquify(currentBuffer, x, y, toolRadious);
    } else if(!doLiquify && doSwirl && !doColorPick) {
      swirl(currentBuffer, x, y, toolRadious);
    } else if(!doLiquify && !doSwirl && doColorPick) {
      var picked = pick(event);
      pickedColor.style.background = picked;
      pickedColor.textContent = picked;
    }*/
    drawBuffer(); //upadte the image
}


//This next set are concerned with drawing
/*
	This function draws the tool based on the mouse pos
	it also has a rgba value input for the color picker

	there may be a more efficient way to handle this drawing part though
*/
function drawTool(clientX, clientY, hovered) {
    var rect = canvas.getBoundingClientRect(); //checking if within canvas
    var x = clientX - rect.left;
    var y = clientY - rect.top;

    drawBuffer(); //we update the image

    if(toolID != 3) { //if we are not color picking
			//we draw a circle centered on the mouse
			context2d.beginPath();
      context2d.arc(x, y, toolRadious, 0, 2 * Math.PI, false);
      context2d.lineWidth = 1;
      context2d.strokeStyle = '#0000fa';
      context2d.closePath();
      context2d.stroke();
    } else { //if we are color picking
			//we draw an offset circle with a larger stroke and filled with the color hovered
			context2d.beginPath();
      context2d.arc(x + 20, y - 20, 20, 0, 2 * Math.PI, false);
      context2d.lineWidth = 5;
      context2d.strokeStyle = '#0000fa';
			context2d.fillStyle = hovered;
      context2d.closePath();
			context2d.fill();
      context2d.stroke();
    }
}
function drawBuffer() {
    context2d.putImageData(currentBuffer, 0, 0); //put the image data on the canvas
}

//This renders the 'imageData' parameter into the canvas
function drawPixels(canvasId, imageData) {
    var context2d = getContext2d(canvasId);
    context2d.putImageData(imageData, 0, 0);
}

/*
	Copy the pixels of the 'srcPixels' ImageData parameter
	into the 'dstPixels' parameter
*/
function copyImageData(srcPixels, dstPixels, width, height) {
    var x, y, position;
		//we literally copy each individual picture
    for (y = 0; y < height; ++y) {
        for (x = 0; x < width; ++x) {
            position = y * width + x;
            position *= 4;
            dstPixels[position + 0] = srcPixels[position + 0];
            dstPixels[position + 1] = srcPixels[position + 1];
            dstPixels[position + 2] = srcPixels[position + 2];
            dstPixels[position + 3] = srcPixels[position + 3];
        }
    }
}
/*
	This function creates an object that contains the dimesntions of imgData
	it prepares that object for copying and such
*/
function createCompatibleImageData(imgData) {
    return context2d.createImageData(imgData.width, imgData.height);
}
/*
	These are the tools and features of the program

	liquify: a tool that creates a bubbly effect on the brush
		we should try making it able to be dragged
	swirl: this tool literally swirls a portion of the image
	pick: this is the color pick tool
*/
function liquify(sourceImgData, x, y, radious) {
    var sourcePosition, destPosition;

    var destImgData = createCompatibleImageData(sourceImgData);
    var srcPixels = sourceImgData.data;
    var dstPixels = destImgData.data;

    var width = sourceImgData.width;
    var height = sourceImgData.height;

    var centerX = x;
    var centerY = y;

    var radiousSquared = radious * radious;

    copyImageData(srcPixels, dstPixels, width, height);

    var r, alpha, angle, degrees, delayBetweenFrames;
    var sourcePosition, destPosition;
    var newX, newY;
    var k, pos0, pos1, pos2, pos3;
    var componentX0, componentX1;
    var deltaX, deltaY;
    var x0, xf, y0, yf;
    var interpolationFactor;
    var finalPixelComponent;
    var offsetX, offsetY;
    var x, y;

    //iterate over the interest square region
    for (y = -radious; y < radious; ++y) {
        for (x = -radious; x < radious; ++x) {
            //check if the pixel is inside the effect circle
            if (x * x + y * y <= radiousSquared) {
                offsetX = x + centerX;
                offsetY = y + centerY;
                //check if pixels lies inside the image region
                if (offsetX < 0 || offsetX >= width || offsetY < 0 || offsetY >= height) {
                    continue;
                }

                //get the pixel array position
                destPosition = offsetY * width + offsetX;
                destPosition *= 4;

                //Transform the pixel Cartesian coordinates (x, y) to polar coordinates (r, alpha)
                r = Math.sqrt(x * x + y * y);
                alpha = Math.atan2(y, x);

                //converting from radians to degrees
                degrees = (alpha * 180.0) / Math.PI;

                //Calculate the interpolation factor
                interpolationFactor = r / radious;

                //Do the interpolation (this is the liquify formula)
                r = interpolationFactor * r + (1.0 - interpolationFactor) * effectIntensity * Math.sqrt(r);

                //Transform back from polar coordinates to Cartesian
                alpha = (degrees * Math.PI) / 180.0;
                newY = r * Math.sin(alpha);
                newX = r * Math.cos(alpha);

                offsetX = newX + centerX;
                offsetY = newY + centerY;

                if (offsetX < 0 || offsetX >= width || offsetY < 0 || offsetY >= height) {
                    continue;
                }

								/*
                	Calculate the (x, y) coordinates of the transformation and keep
                	the fractional  in the delta variables
								*/
                x0 = Math.floor(newX);
                xf = x0 + 1;
                y0 = Math.floor(newY);
                yf = y0 + 1;
                deltaX = newX - x0;
                deltaY = newY - y0;

                //Calculate the array position for the pixels (x, y), (x + 1, y), (x, y + 1) and (x + 1, y + 1)
                pos0 = ((y0 + centerY) * width + x0 + centerX) * 4;
                pos1 = ((y0 + centerY) * width + xf + centerX) * 4;
                pos2 = ((yf + centerY) * width + x0 + centerX) * 4;
                pos3 = ((yf + centerY) * width + xf + centerX) * 4;

                //Do the bilinear interpolation thing for every component of the pixel
                for (k = 0; k < 4; ++k) {
                    //Interpolate the pixels (x, y) and (x + 1, y)
                    componentX0 = (srcPixels[pos1 + k] - srcPixels[pos0 + k]) * deltaX + srcPixels[pos0 + k];
                    //Interpolate the pixels immediately below of (x, y), those are (x, y + 1) and (x + 1, y + 1)
                    componentX1 = (srcPixels[pos3 + k] - srcPixels[pos2 + k]) * deltaX + srcPixels[pos2 + k];
                    //Interpolate again the interpolated components
                    finalPixelComponent = (componentX1 - componentX0) * deltaY + componentX0;
                    //Set the pixel in the image buffer but first check if it lies between 0 and 255, if not, clamp it to that range
                    dstPixels[destPosition + k] = finalPixelComponent > 255 ? 255 : (finalPixelComponent < 0 ? 0 : finalPixelComponent);
                }
            }
        }
    }

    copyImageData(dstPixels, srcPixels, width, height);
}
function swirl(sourceImgData, x, y, radious) {
  var sourcePosition, destPosition;

  var destImgData = createCompatibleImageData(sourceImgData);
  var srcPixels = sourceImgData.data;
  var dstPixels = destImgData.data;

  var width = sourceImgData.width;
  var height = sourceImgData.height;

  var centerX = x;
  var centerY = y;

  var radiousSquared = radious * radious;

  copyImageData(srcPixels, dstPixels, width, height);

  var r, alpha, angle, degrees, delayBetweenFrames;
  var sourcePosition, destPosition;
  var newX, newY;
  var k, pos0, pos1, pos2, pos3;
  var componentX0, componentX1;
  var deltaX, deltaY;
  var x0, xf, y0, yf;
  var interpolationFactor;
  var finalPixelComponent;
  var offsetX, offsetY;
  var x, y, i;

  for(i = 0; i < 30; ++i) {
    //Iterate over the interest square region
    for (y = -radious; y < radious; ++y) {
      for (x = -radious; x < radious; ++x) {
        //Check if the pixel is inside the effect circle
        if (x * x + y * y <= radiousSquared) {
          offsetX = x + centerX;
          offsetY = y + centerY;
          //Check if pixels lies inside the image region
          if (offsetX < 0 || offsetX >= width || offsetY < 0 || offsetY >= height) {
              continue;
          }

          //Get the pixel array position
          destPosition = offsetY * width + offsetX;
          destPosition *= 4;

          //Transform the pixel Cartesian coordinates (x, y) to polar coordinates (r, alpha)
          r = Math.sqrt(x * x + y * y);
          alpha = Math.atan2(y, x);

          //converting radians to degrees
          degrees = (alpha * 180.0) / Math.PI;
					//add a change based on the distance from the center (this is the swirl formula)
          degrees += r * i * (effectIntensity / 20);

          //Transform back from polar coordinates to Cartesian
          alpha = (degrees * Math.PI) / 180.0;
          newY = r * Math.sin(alpha);
          newX = r * Math.cos(alpha);

          offsetX = newX + centerX;
          offsetY = newY + centerY;

          if (offsetX < 0 || offsetX >= width || offsetY < 0 || offsetY >= height) {
              continue;
          }

          //Calculate the (x, y) coordinates of the transformation and keep
          //the fractional  in the delta variables
          x0 = Math.floor(newX);
          xf = x0 + 1;
          y0 = Math.floor(newY);
          yf = y0 + 1;
          deltaX = newX - x0;
          deltaY = newY - y0;

          //Calculate the array position for the pixels (x, y), (x + 1, y), (x, y + 1) and (x + 1, y + 1)
          pos0 = ((y0 + centerY) * width + x0 + centerX) * 4;
          pos1 = ((y0 + centerY) * width + xf + centerX) * 4;
          pos2 = ((yf + centerY) * width + x0 + centerX) * 4;
          pos3 = ((yf + centerY) * width + xf + centerX) * 4;

          //Do the bilinear interpolation thing for every component of the pixel
          for (k = 0; k < 4; ++k) {
              //Interpolate the pixels (x, y) and (x + 1, y)
              componentX0 = (srcPixels[pos1 + k] - srcPixels[pos0 + k]) * deltaX + srcPixels[pos0 + k];
              //Interpolate the pixels immediately below of (x, y), those are (x, y + 1) and (x + 1, y + 1)
              componentX1 = (srcPixels[pos3 + k] - srcPixels[pos2 + k]) * deltaX + srcPixels[pos2 + k];
              //Interpolate again the interpolated components
              finalPixelComponent = (componentX1 - componentX0) * deltaY + componentX0;
              //Set the pixel in the image buffer but first check if it lies between 0 and 255, if not, clamp it to that range
              dstPixels[destPosition + k] = finalPixelComponent > 255 ? 255 : (finalPixelComponent < 0 ? 0 : finalPixelComponent);
          }
        }
      }
    }
  }

  copyImageData(dstPixels, srcPixels, width, height);
}
function pick(event) {
	//grab the mouse position
	var x = event.layerX;
	var y = event.layerY;
	var pixel = context2d.getImageData(x, y, 1, 1); //we then grab a single pixel of data
  var data = pixel.data;

	const rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`; //we convert the data to a string
  return rgba; //return the rgba string usable in all instances where CSS would be used (can also convert to hex)
}

/*
	These next few functions just toggle the tools
    If the selected tool is current active (toolID is equal to the ID of the tool we are toggling) turn it off, and set tool to none (toolID = 0)
    (none == 0, swirl == 1, liquify == 2, clor pick ==2)
    If tthe selected tool is equal to anything else, switch to the new tool. (set toolID to the ID of the tool we are toggling)
	These are called by their respective buttons in the html file
*/
function swirlToggle() { toolID = toolID == 1 ? 0 : 1; }
function liquifyToggle() { toolID = toolID == 2 ? 0 : 2; }
function colorPickToggle() { toolID = toolID == 3 ? 0 : 3; }

/*
	this function just returns a random string containg a path to an image file

	called at the start of the program to grab a preset
*/
function randomPreset() {
	var option = Math.floor(Math.random() * 4);
	if (option == 0)
		return 'Presets/Cat.jpg';
	if (option == 1)
		return 'Presets/CATT.jpg';
	if (option == 2)
		return 'Presets/earth.png';
    if (option == 3)
        return 'Presets/monalisa.jpg'
}
/*
    this function is called when the the filter button is pressed
    It uses input from the four sliders next to the button to apply a filter.
*/
function colorFilter() {
    var red = document.getElementById('redS').value;
    var green = document.getElementById('greenS').value;
    var blue = document.getElementById('blueS').value;
    var opacity = document.getElementById('opS').value / 100.0;

    var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
		data[i] = opacity * red + (1 - opacity) * data[i];
		data[i + 1] = opacity * green + (1 - opacity) * data[i + 1];
		data[i + 2] = opacity * blue + (1 - opacity) * data[i + 2];
	}
    currentBuffer = imageData;
    drawBuffer();
}

var effectIntensity; //setting the default effectIntensity
var canvasId = 'canvas1'; //this is the canvas ID
var currentBuffer;
var toolRadious = 30; //default tool radius
var canvas = document.getElementById(canvasId); //we are just grabbing canvas based on ID
var context2d = canvas.getContext('2d'); //grabbing the context
const MIN_TOOL_RADIOUS = 10; //setting min tool size
const MAX_TOOL_RADIOUS = 80; //setting the max tool size

/*
	This is a cell that holds the picked color

	we can modify this so that we can display the current color for when we add a brush tool
*/
var pickedColor = document.getElementById('selected-color');
//these are the tool bools
var toolID = 0; //no tool = 0, swirl = 1, liquify = 2, colorPick = 3, further tools could be added on this way
//var doSwirl = false, doLiquify = false, doColorPick = false;

setEffectIntensity(40); //this is the default effectIntensity

//setting the initial image
var imgSrc = randomPreset();
onloadImage(imgSrc);

/*
	This is the event listener that calls the functions for events
*/
if (canvas.addEventListener) {
    canvas.addEventListener('mousemove', onMouseMove, false);
    canvas.addEventListener('mouseout', onMouseOut, false);
    canvas.addEventListener('mousewheel', onMouseWheel, false);
    canvas.addEventListener('DOMMouseScroll', onMouseWheel, false);
    canvas.addEventListener('mousedown', onMouseDown, false);
}

/*
	This is the Script File containing the liquify, swirl, and color pick tools
	It also contains auxillary functions to aid in making them work
	This code was made using source code from:
		geek_office_dog@blog (their hello swirl and hello swirl 2 tutorials)
			links - https://geekofficedog.blogspot.com/2015/01/liquify-effect-hello-swirl-2.html?m=1
							https://geekofficedog.blogspot.com/2013/04/hello-swirl-swirl-effect-tutorial-in.html?m=1
		mozilla.org (their pixel manip tutorial)
			link - https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
        ie.nitk.ac.in (for brightness and conrast algorithms)
            link - https://ie.nitk.ac.in/blog/2020/01/19/algorithms-for-adjusting-brightness-and-contrast-of-an-image/
        tannerhelland.com (for warmth)
            link - https://tannerhelland.com/2014/07/01/simple-algorithms-adjusting-image-temperature-tint.html
        alienryderflex.com (for saturation)
            link - http://alienryderflex.com/saturation.html
        for converting hexadecimal string to {r,g,b}
            from - https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
        for bilinear resizing algorithm
            https://chao-ji.github.io/jekyll/update/2018/07/19/BilinearResize.html
*/

/*
  This class is used to keep track of the mouse's previous position for brush drawing
*/
class BrushCache {
  x;
  y;
}

class Change {
    constructor() {
        this.list = new Array();
        this.it = 0;
    }
    Add(image) { //do Add(image) when you want to save a change made by a function. When index isn't newest change, delete all changes after that
        this.list.splice(this.it);
        this.list.push(image);
        this.it++; //console.log(this.list);
    }
    Update() { //called when you want to update canvas to this.list[this.it] (most recent change)
        let image = this.list[this.it - 1];
        canvas.width = image.width;
        canvas.height = image.height;
        context2d.drawImage(image, 0, 0);
        currentBuffer = context2d.getImageData(0, 0, image.width, image.height);
    }
    Reset() {
        this.it = 1;
        this.list.splice(1);
        this.Update()
    }
    Empty() { //empty change and reset it
        this.it = 0;
        this.list.splice(0);
    }
    Undo() { //moves it to previous change
        if(this.it > 1) {
            this.it--;
        }
        this.Update()
    }
    Redo() { //moves it to next change
        if(this.it < this.list.length) {
            this.it++;
        }
        this.Update();
    }
}

//This function tests an image's size against the size of the page.
//If the image is in bounds, do nothing,
//otherwise, call billinear_resize function with new sizes multiplied by multi
//multi, being the largest number that the image can be scaled by such that it fits in the bounds
function shrinkToBounds() {
    const max = .45; //max portion of window that image can take up
    if(canvas.height < window.screen.height * max && canvas.width < window.screen.width * max)
        return;
    let multi = -1;
    if(canvas.height / window.screen.height > canvas.width / window.screen.width)
        multi = window.screen.height * max / canvas.height;
    else
        multi = window.screen.width * max / canvas.width;

    bilinear_resize(canvas.height * multi, canvas.width * multi); //console.log(canvas.height * multi, canvas.width * multi);
}

//Based on code from - https://chao-ji.github.io/jekyll/update/2018/07/19/BilinearResize.html
//resizes image in canvas to height,width using bilinear interpolation
function bilinear_resize(height, width) {
    var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    var resized = context2d.createImageData(width, height);
    const rData = resized.data;

    var x_ratio = 0, y_ratio = 0;
    if(width > 1)
        x_ratio = (imageData.width - 1) / (width - 1);
    if(height > 1)
        y_ratio = (imageData.height - 1) / (height - 1);

    for(let y = 0; y < height; ++y) {
        for(let x = 0; x < width; ++x) {
            let x_l = Math.floor(x_ratio * x);
            let y_l = Math.floor(y_ratio * y);
            let x_h = Math.ceil(x_ratio * x);
            let y_h = Math.ceil(y_ratio * y);

            let x_weight = (x_ratio * x) - x_l;
            let y_weight = (y_ratio * y) - y_l;

            let a = getPixel(x_l, y_l, imageData.width);
            a = [data[a[0]], data[a[1]], data[a[2]], data[a[3]]];
            let b = getPixel(x_h, y_l, imageData.width);
            b = [data[b[0]], data[b[1]], data[b[2]], data[b[3]]];
            let c = getPixel(x_l, y_h, imageData.width);
            c = [data[c[0]], data[c[1]], data[c[2]], data[c[3]]];
            let d = getPixel(x_h, y_h, imageData.width);
            d = [data[d[0]], data[d[1]], data[d[2]], data[d[3]]];

            let pixel = [
                a[0] * (1 - x_weight) * (1 - y_weight) +
                b[0] * x_weight * (1 - y_weight) +
                c[0] * (1 - x_weight) * y_weight +
                d[0] * x_weight * y_weight,
                
                a[1] * (1 - x_weight) * (1 - y_weight) +
                b[1] * x_weight * (1 - y_weight) +
                c[1] * (1 - x_weight) * y_weight +
                d[1] * x_weight * y_weight,

                a[2] * (1 - x_weight) * (1 - y_weight) +
                b[2] * x_weight * (1 - y_weight) +
                c[2] * (1 - x_weight) * y_weight +
                d[2] * x_weight * y_weight,
                    
                a[3] * (1 - x_weight) * (1 - y_weight) +
                b[3] * x_weight * (1 - y_weight) +
                c[3] * (1 - x_weight) * y_weight +
                d[3] * x_weight * y_weight,
            ];
            let newPixel = getPixel(x, y, resized.width)[0];
            [rData[newPixel], rData[newPixel + 1], rData[newPixel + 2], rData[newPixel + 3]]
            =
            [pixel[0], pixel[1], pixel[2], pixel[3]];
        }
    }
    canvas.width = resized.width; canvas.height = resized.height;
    currentBuffer = resized;
    drawBuffer();
    var image = new Image(); image.src = canvas.toDataURL();
    C.Add(image);
}
/*
	This function onloads an image to the canvas using a preset from the directory
	it is called upon website execution
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

        shrinkToBounds();

        C.Empty();
        C.Add(img);
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
    if(!src.files[0].type.match(/image.*/)){
        console.log("The dropped file is not an image: ", src.files[0].type); //output to the console (inspect element)
	      scr.value = "";
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
            context2d.drawImage(image, 0, 0);
            currentBuffer = context2d.getImageData(0, 0, image.width, image.height);

            shrinkToBounds();

            C.Empty();
            C.Add(image);

            //save a copy of loaded pixels
            
        }
        image.onerror = function() {
            alert('Not a valid image.');
            console.log("The dropped file is not an image");
        };
        image.src = e.target.result;
        src.value = "";
    };
    reader.readAsDataURL(src.files[0]);
}
//    This function downloads the current image.
function download() {
    window.open(canvas.toDataURL('image/png'));
    var gh = canvas.toDataURL('png');

    var a  = document.createElement('a');
    a.href = gh;
    a.download = 'image.png';

    a.click()
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
    else if(mouse_down) {
        validToolSet = new Set([toolID.LIQUIFY, toolID.SWIRL, toolID.BRUSH]); //this is the set of IDs of tools that use mouseOut
        if(!validToolSet.has(active_tool))
            return;

        mouse_down = false;
        if(active_tool == toolID.BRUSH) {
          var rect = canvas.getBoundingClientRect(); //check within the bounds of the canvas
          var x = (event.clientX - rect.left) | 0;
          var y = (event.clientY - rect.top) | 0;
          brush(x, y);
        }

        drawBuffer(); //otherwise update the buffer
        var image = new Image(); image.src = canvas.toDataURL();
        C.Add(image);
    }
    else {
        drawBuffer();
    }
}

function onMouseWheel(event) {
    if (!currentBuffer || mouse_down) { //if currentBuffer has no value or mouse is down (like if we are drawing) do nothing
        return;
    }

    if (event.wheelDelta) { //change in mousewheel (for chrome)
        //console.log(event.wheelDelta);
        if (event.wheelDelta < 0) {
            toolRadious -= 1;
        }
        else {
            toolRadious += 1;
        }
    } else if (event.detail) { //for other browser
        if (event.detail < 0) {
            toolRadious += 1;
        } else {
            toolRadious -= 1;
        }
    }

		//checking the tool bounds
    toolRadInBounds();


		//we have to draw the tool on the canvas
    drawTool(event.clientX, event.clientY);
}

function toolRadInBounds() {
    if(active_tool == toolID.BRUSH && active_brush == brushSet.PENCIL) {
      if (toolRadious < MIN_PENCIL_RADIOUS) {
          toolRadious = MIN_PENCIL_RADIOUS;
      }
      if (toolRadious > MAX_PENCIL_RADIOUS) {
          toolRadious = MAX_PENCIL_RADIOUS;
      }
    } else if(active_tool == toolID.BRUSH && active_brush == brushSet.PEN) {
      if (toolRadious < MIN_PEN_RADIOUS) {
          toolRadious = MIN_PEN_RADIOUS;
      }
      if (toolRadious > MAX_PEN_RADIOUS) {
          toolRadious = MAX_PEN_RADIOUS;
      }
    } else {
      if (toolRadious < MIN_TOOL_RADIOUS) {
          toolRadious = MIN_TOOL_RADIOUS;
      }
      if (toolRadious > MAX_TOOL_RADIOUS) {
          toolRadious = MAX_TOOL_RADIOUS;
      }
    }
}

function onMouseMove(event) {
    if (!currentBuffer) { //no value, exit
        return;
    }

    var rect = canvas.getBoundingClientRect(); //check within the bounds of the canvas
    var x = (event.clientX - rect.left) | 0;
    var y = (event.clientY - rect.top) | 0;

    if(active_tool == toolID.PICK) { //checking if we are in color pick mode
		//if we are we have to update the hovered color
		//we also need to draw the tool
        drawTool(event.clientX, event.clientY, pick(event));
    } else if(mouse_down) {
        switch (active_tool) {
        case toolID.NONE:
            break;
        case toolID.LIQUIFY:
            liquify(currentBuffer, x, y, toolRadious);
            //console.log(x, y); //we send a log of the clicked pixel to the console
            drawBuffer(); //upadte the image

            break;
        case toolID.BRUSH:
            brush(x, y, toolRadious);
            //console.log(x, y); //we send a log of the clicked pixel to the console
            brushCache.x = x;
            brushCache.y = y;
            drawBuffer();
            break;
        /*default:
            console.log("ERROR: toolID has invalid value.");*/
        }
    } else {
        drawTool(event.clientX, event.clientY, '#000000');
    }
}
function onMouseDown(event) {
    if (!currentBuffer) { //no value, exit
        return;
    }
    mouse_down = true;
    var rect = canvas.getBoundingClientRect(); //check within the bounds of the canvas
    var x = (event.clientX - rect.left) | 0;
    var y = (event.clientY - rect.top) | 0;
    //console.log(x, y); //we send a log of the clicked pixel to the console

		/*
			it might be better to do a switch here
			we essentially are checking which tool is active
			I think this could be optimized by using an array of bools
			we'd need to know how many tools we have for that though
		*/
    switch(active_tool) {
        case toolID.NONE:
            break;
        case toolID.SWIRL:
            swirl(currentBuffer, x, y, toolRadious);
            break;
        case toolID.LIQUIFY:
            liquify(currentBuffer, x, y, toolRadious);
            break;
        case toolID.PICK:
            var picked = pick(event);
            pickedColor.style.background = picked;
            pickedColor.textContent = picked;
            //the following code sets the text to white if the color is dark or black if the color is bright;
            let rgb = hexToRgb(picked); //get [red, green, blue]
            let brightness = (.89 * rgb.r + 1.77 * rgb.g + .33* rgb.b) / 765; //console.log(brightness);//get ratio of brightness (0 is dark, 1 is bright)
            var textColor = "#FFFFFF"; //default text color is white
            if (brightness > .5)
                textColor = "#000000"; //if color is bright, set color to black
                
            document.getElementById("selected-color").style.color = textColor;
            break;
        case toolID.BRUSH:
            brushCache.x = x;
            brushCache.y = y;
            break;
        default:
            console.log("ERROR: toolID invalid value: " + active_tool);
    }
    drawBuffer(); //upadte the image
}
function onMouseUp(event) {
    mouse_down = false;
    validToolSet = new Set([toolID.LIQUIFY, toolID.SWIRL, toolID.BRUSH]); //this is the set of IDs of tools that use mouseOut
    if(!validToolSet.has(active_tool))
        return;
    var image = new Image(); image.src = canvas.toDataURL();
    C.Add(image);
}

//This next set are concerned with drawing
/*
	This function draws the tool based on the mouse pos
	it also has a rgba value input for the color picker
	there may be a more efficient way to handle this drawing part though
*/
function drawTool(clientX, clientY, hovered) {
    var rect = canvas.getBoundingClientRect(); //checking if within canvas
    var x = clientX - rect.left; //console.log(x);
    var y = clientY - rect.top; //console.log(y);

    drawBuffer(); //we update the image

    if(active_tool == toolID.BRUSH) { //draw for brush
        if(active_brush == brushSet.PENCIL || active_brush == brushSet.MARKER) {
	        context2d.beginPath();
            context2d.arc(x, y, toolRadious, 0, 2 * Math.PI, false);
            context2d.lineWidth = 1;
            context2d.strokeStyle = '#0000fa';
            context2d.closePath();
            context2d.stroke();
        }
        else if(active_brush == brushSet.PEN) {
        
            context2d.beginPath();
            context2d.moveTo(x + toolRadious, y + toolRadious);
            context2d.strokeStyle = '#0000fa';
            context2d.lineWidth = 1;
            context2d.lineTo(x - toolRadious, y - toolRadious);
            context2d.stroke();
        }
        else if(active_brush == brushSet.PEARL || active_brush == brushSet.HATCH) {
            context2d.beginPath();
            context2d.arc(x, y, 3, 0, 2 * Math.PI, false);
            context2d.lineWidth = 1;
            context2d.strokeStyle = '#0000fa';
            context2d.closePath();
            context2d.stroke();
        }
    } else if (active_tool == toolID.PICK){ //if we are color picking
			//we draw an offset circle with a larger stroke and filled with the color hovered
	    context2d.beginPath();
        context2d.arc(x + 20, y - 20, 20, 0, 2 * Math.PI, false);
        context2d.lineWidth = 5;
        context2d.strokeStyle = '#0000fa';
	    context2d.fillStyle = hovered;
        context2d.closePath();
	    context2d.fill();
        context2d.stroke();
    } else if(active_tool == toolID.SWIRL || active_tool == toolID.LIQUIFY){ //other tool which is allowed (swirld or liquify)
        context2d.beginPath();
        context2d.arc(x, y, toolRadious, 0, 2 * Math.PI, false);
        context2d.lineWidth = 1;
        context2d.strokeStyle = '#0000fa';
        context2d.closePath();
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
  Here is an enumeration of the tools!
  As more tools get added, please add them to this enum!
*/
const toolID = {
  NONE: 0,
  SWIRL: 1,
  LIQUIFY: 2,
  PICK: 3,
  FILTER: 4,
  BRUSH: 5,
}
/*
  Here is an enumeration of the brushes!
  As more brushes get added, please add them to this enum!
*/
const brushSet = {
  NONE: 0,
  PENCIL: 1,
  MARKER: 2,
  PEARL: 3,
  WIGGLE: 4,
  PEN: 5,
  HATCH: 6,
  SPRAY: 7,
}

/*
	These next function just toggles the tools
    If the selected tool is current active (toolID is equal to the ID of the tool we are toggling) turn it off, and set tool to none (toolID = 0)
    (none == 0, swirl == 1, liquify == 2, clor pick == 3)
    If the selected tool is equal to anything else, switch to the new tool. (set toolID to the ID of the tool we are toggling)
	These are called by their respective buttons in the html file
*/
function toggleTool(ID) {
    active_tool = active_tool == ID ? toolID.NONE : ID;
}
function setBrush(ID) {
    if(active_brush == ID && active_tool == toolID.BRUSH) {
        active_brush = brushSet.NONE;
        active_tool = toolID.NONE;
        return;
    }
    active_tool = toolID.BRUSH;
    active_brush = ID;
}


/*
	this function is used to set the intensity of the tool
	it is called by the button in the html file
*/
function setSwirlIntensity(intensity) {
    swirlIntensity = (intensity / 10.0);
}
function setLiquifyIntensity(intensity) {
    liquifyIntensity = (intensity / 10.0);
}
/*
    this function is called when the the filter button is pressed
    It uses input from the four sliders next to the button to apply a filter.
*/
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(red, green, blue) {
    return "#" + ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1);
}

//for color values. If a color value would go out of bounds, it instead hits a min of 0 or max of 255
function truncate(input) {
    if(input < 0) {return 0;}
    if(input > 255) {return 255;}
    return input;
}
/*
  this function does a really rudementary linear interpolation because I dunno how to do that yet
  the lerp function returns a position based on a ratio and distance
*/
function lerp(init, final, ratio) {
  return init + (final - init) * ratio
}
function rgbaToStrokeStyle(r,g,b,a) {
  return "rgba(" + r + "," + g + "," + b + "," + a + ")";
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
                r = interpolationFactor * r + (1.0 - interpolationFactor) * liquifyIntensity * Math.sqrt(r);

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

var swirlDirection = 1;
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
          degrees += swirlDirection * (radious - r) * i * (swirlIntensity / 20);

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

	//const rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`; //we convert the data to a string
    const rgba = rgbToHex(data[0], data[1], data[2]);
  return rgba; //return the rgba string usable in all instances where CSS would be used (can also convert to hex)
}

function colorFilter() {
    var color = hexToRgb(document.getElementById('sColor').value);
    var opacity = parseInt(document.getElementById('opS').value) / 100.0;

    var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
		data[i] = opacity * color.r + (1 - opacity) * data[i];
		data[i + 1] = opacity * color.g + (1 - opacity) * data[i + 1];
		data[i + 2] = opacity * color.b + (1 - opacity) * data[i + 2];
	}
    currentBuffer = imageData;
    drawBuffer();
    var image = new Image(); image.src = canvas.toDataURL();
    C.Add(image);
}

function brush(x, y, radious) {
    //this function just switches between the brush aux functions
    //console.log(active_brush);
    var color = hexToRgb(document.getElementById('bColor').value);
    switch(active_brush) {
      case brushSet.MARKER:
        var opacity = parseInt(document.getElementById('opB').value) / 250.0; //100% opacity is 25% alpha
        break;
      case brushSet.PEARL:
        var opacity = parseInt(document.getElementById('opC').value) / 100;
        break;
      case brushSet.HATCH:
        var opacity = parseInt(document.getElementById('opD').value) / 250.0; //100% opacity is 10% alpha
        break;
      default:
        var opacity = 1;
    } var strokeStyle = rgbaToStrokeStyle(color.r, color.g, color.b, opacity);

    switch (active_brush) {
    case brushSet.PENCIL:
        pencil(x, y, radious, strokeStyle);
        break;
    case brushSet.MARKER:
        marker(x, y, radious, strokeStyle);
        break;
    case brushSet.PEARL:
        pearl(x, y, strokeStyle);
        break;
    case brushSet.PEN:
        pen(x, y, radious, strokeStyle);
        break;
    case brushSet.HATCH:
        hatching(x, y, strokeStyle);
        break;
    default:
        console.log("ERROR: brushSet has invalid value.")
    }

    //updating the buffer because otherwise it won't draw!
    currentBuffer = context2d.getImageData(0, 0, canvas.width, canvas.height);
}

function pencil(x, y, radious, style) {
    //drawing the lines
    context2d.beginPath();
    context2d.moveTo(brushCache.x, brushCache.y);
    context2d.strokeStyle = style; //i want the color to match the pickedColor essentially
    context2d.lineWidth = 2 * radious; //this is the tool's diameter
    context2d.lineCap = "round";
    context2d.lineJoin = "round";
    context2d.lineTo(x, y);
    context2d.stroke();
}

function marker(x, y, radious, style) {
  //drawing the circles
    context2d.beginPath();
    context2d.arc(x, y, radious, 0, 2 * Math.PI, false); //draw circles on the mouse
    context2d.fillStyle = style; //i want the color to match the pickedColor essentially
    context2d.closePath();
    context2d.fill();
}

function pearl(x, y, style) {
    distance = Math.sqrt(Math.pow(x - brushCache.x, 2) + Math.pow(y - brushCache.y, 2));
    midX = (x + brushCache.x) / 2;
    midY = (y + brushCache.y) / 2;

    //drawing the cirlces
    context2d.beginPath();
    context2d.arc(midX, midY, distance, 0, 2 * Math.PI, false); //draw circles in the mid point of currPos and prevPos
    context2d.fillStyle = style; //i want the color to match the pickedColor essentially
    context2d.closePath();
    context2d.fill();
}

function pen(x, y, radious, style) {
  const lerps = 16; //lerps are linear interpolations, so this is the amount of them we are doing

  for(let i = 0; i < lerps; ++i) {
    //finding the lerp distances so that the pen looks more fluid
    const lerpX = lerp(x, brushCache.x, i / lerps);
    const lerpY = lerp(y, brushCache.y, i / lerps);

    //drawing the lines
    context2d.beginPath();
    context2d.moveTo(lerpX + radious, lerpY + radious);
    context2d.strokeStyle = style;
    context2d.lineWidth = 1;
    context2d.lineTo(lerpX - radious, lerpY - radious);
    context2d.stroke();
  }
}

function hatching(x, y, style) {
  let speed = Math.abs(x - brushCache.x) + Math.abs(y - brushCache.y); //the speed determines the size

  const lerps = 16; //lerps are linear interpolations, so this is the amount of them we are doing

  for(let i = 0; i < lerps; ++i) {
    //finding the lerp distances so that the pen looks more fluid
    const lerpX = lerp(x, brushCache.x, i / lerps);
    const lerpY = lerp(y, brushCache.y, i / lerps);

    //drawing the lines
    context2d.beginPath();
    context2d.moveTo(lerpX - (y - brushCache.y), lerpY - (x - brushCache.x));
    context2d.strokeStyle = style; //i want the color to match the pickedColor essentially
    context2d.lineWidth = 1;
    context2d.lineTo(lerpX + (y - brushCache.y), lerpY + (x - brushCache.x));
    context2d.stroke();
  }
}

//called from brightness button, brightness val is controlled by briS slider
//adds some constant brightness to r,g,b values.
//from - https://ie.nitk.ac.in/blog/2020/01/19/algorithms-for-adjusting-brightness-and-contrast-of-an-image/
function brightness() {
    var brightness = parseInt(document.getElementById('briS').value);
    var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
		data[i] = truncate(data[i] +  brightness);
	    data[i + 1] = truncate(data[i + 1] + brightness);
        data[i + 2] = truncate(data[i + 2] + brightness);
	}
    currentBuffer = imageData;
    drawBuffer();
    var image = new Image(); image.src = canvas.toDataURL();
    C.Add(image);
}
//called from contrast button, contrast val is controlled by conS slider
//modifies r, g, and b values with given contrast value. positive values increase contrast, negatives decrease contrast.
//from - https://ie.nitk.ac.in/blog/2020/01/19/algorithms-for-adjusting-brightness-and-contrast-of-an-image/
function contrast() {
    var contrast = parseInt(document.getElementById('conS').value);
    contrast = (259 * (255 + contrast)) / (255 * (259 - contrast));
    var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
		data[i] = truncate(contrast * (data[i] - 128) + 128);
	    data[i + 1] = truncate(contrast * (data[i + 1] - 128) + 128);
        data[i + 2] = truncate(contrast * (data[i + 2] - 128) + 128);
	}
    currentBuffer = imageData;
    drawBuffer();
    var image = new Image(); image.src = canvas.toDataURL();
    C.Add(image);
}
//called from warmth button, warmth val is controlled by warS slider
//increases r and decreases b by 'warmth' value. Positives values warm image, negative cool image
//from - https://tannerhelland.com/2014/07/01/simple-algorithms-adjusting-image-temperature-tint.html
function warmth() {
    var warmth = parseInt(document.getElementById('warS').value);
    var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
		data[i] = truncate(data[i] + warmth);
        data[i + 2] = truncate(data[i + 2] - warmth);
	}
    currentBuffer = imageData;
    drawBuffer();
    var image = new Image(); image.src = canvas.toDataURL();
    C.Add(image);
}
//called from tint button, tint val is controlled by tinS slider
//increases g by tint value. Positives values tint (green), negative values de-tint (megenta)
//from - https://tannerhelland.com/2014/07/01/simple-algorithms-adjusting-image-temperature-tint.html
function tint() {
    var tint = parseInt(document.getElementById('tinS').value);
    var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
		data[i + 1] = truncate(data[i + 1] + tint);
	}
    currentBuffer = imageData;
    drawBuffer();
    var image = new Image(); image.src = canvas.toDataURL();
    C.Add(image);
}
//called by saturation button, saturation val is controlled by satS slider
//modifies r,g,b values with given saturation value. 0 is greyscale, 1 is no change, 2 is double contrast
//from - http://alienryderflex.com/saturation.html
function saturation() {
    var saturation = parseInt(document.getElementById('satS').value) / 10;
    var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
        var P = Math.sqrt(data[i] * data[i] * .299 + data[i + 1] * data[i + 1] * .587 + data[i + 2] * data[i + 2] * .114);
		data[i] = P + (data[i] - P) * saturation;
	    data[i + 1] = P + (data[i + 1] - P) * saturation;
        data[i + 2] = P + (data[i + 2] - P) * saturation;
	}
    currentBuffer = imageData;
    drawBuffer();
    var image = new Image(); image.src = canvas.toDataURL();
    C.Add(image);
}


//this functions flip the image by iterating through each pixel, and swapping that pixel with the pixel accros the axis (x or y) depending on whether direction is 'horizontal' or 'vertical'
function flipI(direction) {
    var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    switch(direction) {
    case 'h':
        for (var y = 0; y < imageData.height; y += 1) {
            for (var x = 0; x < Math.floor(imageData.width / 2); x += 1) {
                var left = getPixel(x, y, imageData.width); //left pixel data
                var right = getPixel(imageData.width - x, y, imageData.width); //pixel data on right
                //swap left and right pixel data
                [data[left[0]], data[left[1]], data[left[2]], data[left[3]], data[right[0]], data[right[1]], data[right[2]], data[right[3]]]
                =
                [data[right[0]], data[right[1]], data[right[2]], data[right[3]], data[left[0]], data[left[1]], data[left[2]], data[left[3]]];
            }
        }
        break;
    case 'v':
        for (var x = 0; x < imageData.width; x += 1) {
            for (var y = 0; y < Math.floor(imageData.height / 2); y += 1) {
                var top = getPixel(x, y, imageData.width); //top pixel data
                var bot = getPixel(x, imageData.height - y, imageData.width); //bottom pixel data
                //swap top and bot pixel data
                [data[top[0]], data[top[1]], data[top[2]], data[top[3]], data[bot[0]], data[bot[1]], data[bot[2]], data[bot[3]]]
                =
                [data[bot[0]], data[bot[1]], data[bot[2]], data[bot[3]], data[top[0]], data[top[1]], data[top[2]], data[top[3]]];
            }
        }
        break;
    default:
        console.log("ERROR: INVALID FLIP AXIS CALLED");
        return;
    }
    currentBuffer = imageData;
    drawBuffer();
    var image = new Image(); image.src = canvas.toDataURL();
    C.Add(image);
}

function rotate(degree) {
    var swapWH = (degree != 180); //if degree is 180, don't swap, otherwise, swap height and width
    var oldImageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
    const oldData = oldImageData.data;

    var newImageData; //new canvas size depends on degree of rotation
    if(swapWH) { newImageData = context2d.createImageData(canvas.height, canvas.width); } //if degree is 90 or -90, swap width and height
    else { newImageData = context2d.createImageData(canvas.width, canvas.height); } //if degree is 180, don't swap width and height'
    //console.log(swapWH);
    const newData = newImageData.data;

    for (var y = 0; y < oldImageData.height; y += 1) {
        for (var x = 0; x < oldImageData.width; x += 1)
        {
            var pre = getPixel(x, y, oldImageData.width); // pixel data from old image
            switch(degree) {
            case 90:
                var post = getPixel(Math.abs(y - oldImageData.height), x, newImageData.width); // pixel data from new image
                break;
            case -90:
                var post = getPixel(y, Math.abs(x - oldImageData.width), newImageData.width); // pixel data from new image
                break;
            case 180:
                var post = getPixel(oldImageData.width - x, oldImageData.height - y, newImageData.width);
                break;
            default:
               console.log("ERROR: INVALID ROTATE CALLED");
               return;
           }
           //swap them, moving the old pixels to their respective location in the new image
           [newData[post[0]], newData[post[1]], newData[post[2]], newData[post[3]]]
                =
           [oldData[pre[0]], oldData[pre[1]], oldData[pre[2]], oldData[pre[3]]];
        }
    }
    if(swapWH) { [canvas.width, canvas.height] = [canvas.height, canvas.width]; } //swap width and height of image if degree is 90 or -90
    currentBuffer = newImageData;
    drawBuffer(); //apply new image
    var image = new Image(); image.src = canvas.toDataURL();
    C.Add(image);
}

//gets pixelData give a distance x from the left, a distance y from the top, and a width of width. Returns data in form of [red, green, blue, alpha]
function getPixel(x, y, width) {
    var red = y * (width * 4) + x * 4;
    return [red, red + 1, red + 2, red + 3];
}

/*
	this function just returns a random string containg a path to an image file
	called at the start of the program to grab a preset
*/
function randomPreset() {
    var options = ['Presets/Cat.jpg', 'Presets/earth.png', 'Presets/monalisa.jpg'];
    var ran = Math.floor(Math.random() * options.length);
    return options[ran];
}

function toggleMenu(ID) {
    toolRadInBounds();
    var markermenu = document.getElementById("markermenu");
    var pearlmenu = document.getElementById("pearlmenu");
    var hatchmenu = document.getElementById("hatchmenu");
    switch (ID) {
        case brushSet.MARKER:
            if (markermenu.style.display == "none") {
                markermenu.style.display = "block";
                pearlmenu.style.display = "none";
                hatchmenu.style.display = "none";
                } else {
                    markermenu.style.display = "none";
                }
            break;
        case brushSet.PEARL:
            if (pearlmenu.style.display == "none") {
                pearlmenu.style.display = "block";
                markermenu.style.display = "none";
                hatchmenu.style.display = "none";
            } else {
                pearlmenu.style.display = "none";
            }
            break;
        case brushSet.HATCH:
            if (hatchmenu.style.display == "none") {
                hatchmenu.style.display = "block";
                pearlmenu.style.display = "none";
                markermenu.style.display = "none";
            } else {
                hatchmenu.style.display = "none";
            }
            break;
        default:
            hatchmenu.style.display = "none";
            pearlmenu.style.display = "none";
            markermenu.style.display = "none";
    }
}

let C = new Change();

const MIN_TOOL_RADIOUS = 10; //setting min tool size
const MAX_TOOL_RADIOUS = 80; //setting the max tool size
const MIN_PENCIL_RADIOUS = 1;
const MAX_PENCIL_RADIOUS = 10;
const MIN_PEN_RADIOUS = 5;
const MAX_PEN_RADIOUS = 25;
var toolRadious = 30; //default tool radius

var swirlIntensity;
var liquifyIntensity;
var canvasId = 'canvas1'; //this is the canvas ID
var currentBuffer;
var canvas = document.getElementById(canvasId); //we are just grabbing canvas based on ID
var context2d = canvas.getContext('2d'); //grabbing the context
var mouse_down = false; //this is a bool for dragging!
var brushCache = new BrushCache();
var flip = 0;


/*
	This is a cell that holds the picked color
	we can modify this so that we can display the current color for when we add a brush tool
*/
var pickedColor = document.getElementById('selected-color');
var active_tool = toolID.NONE; //this is the active tool variable, set it using the enum created
var active_brush = brushSet.NONE; //this is the active brush variable, set it using the enum created

setSwirlIntensity(40); //this is the default effectIntensity
setLiquifyIntensity(40);

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
    canvas.addEventListener('mouseup', onMouseUp, false);
}
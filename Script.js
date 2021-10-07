function drawImage(image, canvas, context) { 
	var tempH = image.height; var tempW =  image.width;

	var maxH = .5; var maxW = .75;

	if(tempH > maxH * window.screen.height) {
		var mult = maxH * window.screen.height / tempH; 
		tempH *= mult; tempW *= mult;
	}
	if(tempW > maxW * window.screen.width) {
		var mult = maxW * window.screen.width / tempW; 
		tempH *= mult; tempW *= mult;
	}
	canvas.height = tempH;
	canvas.width = tempW;
	context.drawImage(image, 0, 0, tempW, tempH); //this is the actual function that sets the canvas to a new src
}
//The above function keeps the max height of the image 50% of the screen, and the max width 75% of the screen.
//This is not our final UI design, but without this, the image might be very small or very largee.

var canvas = document.getElementById("tutorial");
var context = canvas.getContext('2d');
//these are both needed for canvas functions

var image = new Image(); //create new image
var option = Math.floor(Math.random() * 3);
if (option == 0)
image.src = 'Presets/Cat.jpg';
if (option == 1)
image.src = 'Presets/coolcat.jpg';
if (option == 2)
image.src = 'Presets/earth.png';
//this is a system of randomally choosing a default image, as a placeholder for future methods.
//this is also an example of how to choose an image from file

image.onload = function() {
	drawImage(image, canvas, context);
}
//drawImage function is called when image.src is changed, but after it is loaded, which uses context.drawImage(...) to set the canvas to the image

let imageInput = document.getElementById('imgUp'); //this is the file that a user uploads.

imageInput.addEventListener('change', function(e) { //on file change/ file upload
	let imageFile = e.target.files[0]; //e.target.files[0] is the usable file data
	var reader = new FileReader();
	reader.readAsDataURL(imageFile); //readAsDataUrl is a function of a reader object, so we need one.
	reader.onloadend = function (e) {
		image.src = e.target.result; //I think e is the file data, but I don't fully understand this.
		drawImage(image, canvas, context)
	}
});
//this function is used to take file from upload and 
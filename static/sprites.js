/*function loadFile(src, callback) {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			callback(this.responseText);
		}
	};
	xhttp.open("GET", src, true);
	xhttp.send();
}

function loadSpritesheet(src, callback){
	loadFile(src, function(response){
		var data = JSON.parse(response);
		var subdata = JSON.parse(data.piskel.layers[0])
		var url = subdata.chunks[0].base64PNG;
		var img = new Image();
		var spritesheet = {
			fps: data.piskel.fps,
			frames: subdata.frameCount,
			width: data.piskel.width,
			height: data.piskel.height,
			image: img
		};
		img.onload = function(){
			callback(spritesheet);
		};
		img.src = url;
	});
}*/

function loadSpritesheet(src){ // Synchronous... I'm so naughty!
	// Load file
	var request = new XMLHttpRequest();
	request.open('GET', src, false);  // `false` makes the request synchronous
	request.send(null);
	
	var data = JSON.parse(request.responseText);
	var subdata = JSON.parse(data.piskel.layers[0])
	var url = subdata.chunks[0].base64PNG;
	var img = new Image();
	var spritesheet = {
		fps: data.piskel.fps,
		frames: subdata.frameCount,
		width: data.piskel.width,
		height: data.piskel.height,
		image: img
	};
	/*img.onload = function(){
		callback(spritesheet);
	};*/
	img.src = url;
	return spritesheet;
}
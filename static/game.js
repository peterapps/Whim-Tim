function startGame(character){
	var socket = io();
	var player_id = false;
	var characters = ["Peter", "Tim", "Eason", "Ricky"];
	var spritesheets = {};
	var animations = ["Running", "Standing", "Jumping", "Punching", "Kicking"];
	for (var i = 0; i < characters.length; i++){
		var name = characters[i];
		var spritesheet = {};
		for (var j = 0; j < animations.length; j++){
			var animation = animations[j];
			spritesheet[animation] = loadSpritesheet('/static/sprites/' + name + ' ' + animation + '.piskel');
		}
		spritesheets[name] = spritesheet;
	}
	console.log(spritesheets);
	var stage_img = new Image();
	stage_img.onload = function(){
	
	};
	stage_img.src = "/static/log.png";

	socket.on('message', function(data) {
		console.log(data);
		player_id = socket.io.engine.id;
	});

	var movement = {
		up: false,
		down: false,
		left: false,
		right: false
	}
	document.addEventListener('keydown', function(event) {
		switch (event.keyCode) {
			case 65: // A
				movement.left = true;
				break;
			case 87: // W
				movement.up = true;
				break;
			case 68: // D
				movement.right = true;
				break;
			case 83: // S
				movement.down = true;
				break;
			case 32: // SPACE
				movement.attack = true;
		}
	});
	document.addEventListener('keyup', function(event) {
		switch (event.keyCode) {
			case 65: // A
				movement.left = false;
				break;
			case 87: // W
				movement.up = false;
				break;
			case 68: // D
				movement.right = false;
				break;
			case 83: // S
				movement.down = false;
				break;
			case 32: // SPACE
				movement.attack = false;
		}
	});
	socket.emit('new player',character);
	setInterval(function() {
		socket.emit('movement', movement);
	}, 1000 / 60);

	var canvas = document.getElementById('canvas');
	canvas.width = 1280;
	canvas.height = 720;
	var ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;
	function strokeFill(txt, x, y){
		ctx.fillText(txt, x, y);
		ctx.strokeText(txt, x, y);
	}

	// Stage
	var stage = {};
	socket.on('stage_info', function(data){
		stage = data;
	});

	socket.on('state', function(players) {
		// Drawing
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		// Draw stage
		/*ctx.fillStyle = stage.color;
		ctx.fillRect(stage.x, stage.y, stage.width, stage.height);*/
		ctx.drawImage(stage_img, stage.x, stage.y);
		// For drawing the scores
		var num_players = Object.keys(players).length;
		ctx.font = "68px Impact";
		ctx.textBaseline = "top";
		ctx.textAlign = "center";
		var scoreboard_w = canvas.width - 200;
		// Draw players
		for (var id in players) {
			var player = players[id];
			/*ctx.fillStyle = player.color;
			ctx.fillRect(player.x, player.y, player.width, player.height);
			ctx.fillStyle = "gray";
			var eyeX = player.x + player.width - 5;
			if (player.direction == -1) eyeX = player.x;
			ctx.fillRect(eyeX, player.y + 5, 5, 5);*/
			var sprite = spritesheets[player.character.name][player.animation];
			var img = sprite.image;
			var sx = player.frame * sprite.width;
			var sy = 0;
			var sw = sprite.width;
			var sh = sprite.height;
			var x = player.x;
			if (player.direction == -1){
				ctx.scale(-1, 1);
				x = -player.x - player.width;
			}
			ctx.drawImage(img, sx, sy, sw, sh, x, player.y, player.width, player.height);
			if (player.direction == -1) ctx.scale(-1, 1);
		
			// Draw scores
			ctx.fillStyle = "white";
			ctx.lineWidth = 2;
			ctx.strokeStyle = player.color;
			var x_shift = (canvas.width/2 - scoreboard_w/2) + scoreboard_w * (player.num / num_players);
			ctx.font = "64px Bangers";
			strokeFill("P" + player.num, x_shift, 5);
			ctx.font = "32px Bangers";
			strokeFill(Math.round(player.damage) + "%", x_shift, 5 + 64 + 5);
			strokeFill("-" + player.deaths, x_shift, 5 + 64 + 5 + 32);
		}
		// Me!
		var me = players[player_id];
		if (me) {
			/*ctx.strokeRect(me.x - 5, me.y - 5, me.width + 10, me.height + 10);
			ctx.textBaseline = "top";
			ctx.textAlign = "left";*/
			//ctx.fillStyle = me.color;
			//ctx.fillText("You are player " + me.num, 5, 5);
		}
	});
}
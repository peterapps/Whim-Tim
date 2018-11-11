// Characters
var fs = require('fs');

var characters = {
	Peter: {name: "Peter", strength: 10, jumps: 2, jumpStrength: 7, speed: 5, accel: 1, defense: 0.1}, // Average character
	Eason: {name: "Eason", strength: 5, jumps: 3, jumpStrength: 10, speed: 8, accel: 2, defense: 0.1}, // More speed, less attack
	Ricky: {name: "Ricky", strength: 15, jumps: 1, jumpStrength: 8.5, speed: 5, accel: 1, defense: 0.05}, // More attack, less defense
	Tim: {name: "Tim", strength: 10, jumps: 2, jumpStrength: 7, speed: 3, accel: 0.8, defense: 0.2} // More defense, less speed
};

// Load spritesheets
var animations = ["Running", "Standing", "Jumping", "Punching", "Kicking"];
for (var i in characters){
	characters[i].spritesheet = {};
	for (var j = 0; j < animations.length; j++){
		var animation = animations[j];
		var data = JSON.parse(fs.readFileSync(__dirname + '/static/sprites/' + characters[i].name + ' ' + animation + '.piskel'));//, 'utf8'));
		var subdata = JSON.parse(data.piskel.layers[0])
		var url = subdata.chunks[0].base64PNG;
		characters[i].spritesheet[animation] = {
			fps: data.piskel.fps,
			frames: subdata.frameCount,
			width: data.piskel.width,
			height: data.piskel.height,
			src: url
		};
	}
}

// Constants
var GRAVITY = -0.25;
var FRICTION = 0.5;

// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
	// Routing
	app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(5000, "0.0.0.0", function() {
	console.log('Starting server on port 5000');
});

var canvas = {width: 1280, height: 720};
var stage = {color: "brown", width: 1000, height: 100};
stage.x = canvas.width/2 - stage.width/2;
stage.y = canvas.height - stage.height - 20;
var spawns = [stage.x + 100, stage.x + stage.width - 100, stage.x + 300, stage.x + stage.width - 300];

// Add the WebSocket handlers
io.on('connection', function(socket) {
	socket.emit('stage_info', stage);
});

setInterval(function() {
	io.sockets.emit('message', 'Connected.');
}, 1000);
var colors = ["red", "blue", "green", "yellow", "purple", "pink"];
var players = {};
io.on('connection', function(socket) {
	socket.on('disconnect', function() {
		// Remove disconnected player
		delete players[socket.id];
	});
	socket.on('new player', function(character) {
		var num_players = Object.keys(players).length;
		players[socket.id] = {
			x: spawns[num_players],
			y: stage.y - 200,
			width: 4.5 * characters[character].spritesheet.Standing.width, // 20
			height: 4.5 * characters[character].spritesheet.Standing.height, // 100
			vx: 0,
			vy: 0,
			ax: 0,
			ay: GRAVITY,
			jumps: 0,
			jumpCD: 0, // jump cooldown timer
			attackCD: 0, // attack cooldown timer,
			attacking: false,
			direction: 1,
			damage: 0,
			stunned: false,
			stunnedCD: 0, // stun timer
			color: colors[num_players],
			num: num_players + 1,
			character: characters[character],
			frame: 0,
			frameTimer: 0,
			animation: "Standing",
			prevAnim: "Standing",
			deaths: 0
		};
	});
	socket.on('movement', function(data) {
		var player = players[socket.id] || {};
		if (!player.stunned){ // Can only move if not stunned
			if (data.left && !data.right) {
				player.ax = -player.character.accel;
				player.direction = -1;
				player.animation = "Running";
				if (player.vx < -player.character.speed) player.vx = -player.character.speed;
			} else if (data.right && !data.left) {
				player.ax = player.character.accel;
				player.direction = 1;
				player.animation = "Running";
				if (player.vx > player.character.speed) player.vx = player.character.speed;
			} else if (Math.abs(player.vx) >= FRICTION) {
				player.ax = -Math.sign(player.vx) * FRICTION; // Friction
				player.animation = "Standing";
			} else {
				player.ax = 0;
				player.vx = 0;
				player.animation = "Standing";
			}
			if (player.attacking) player.animation = "Punching";
		
			if (data.up && player.jumps < player.character.jumps) {
				// Only up to two jumps
				var currentTime = (new Date()).getTime();
				var t = currentTime - player.jumpCD;
				if (t > 200){
					player.jumpCD = currentTime;
					player.vy = player.character.jumpStrength;
					player.jumps++;
				}
			}
			if (data.attack){
				var currentTime = (new Date()).getTime();
				var t = currentTime - player.attackCD;
				if (t > 500){
					player.attackCD = currentTime;
					player.animation = "Punching";
					player.attacking = true;
					// Implement attack code
					for (var i in players){
						if (i != socket.id){
							var other = players[i];
							var range = 0;
							if (
								(player.direction == 1 && player.x + player.width + range >= other.x) || // Player is facing the right
								(player.direction == -1 && other.x + other.width + range >= player.x) // Player is facing the left
							){
								var speed_multiplier = 0.08 * Math.sqrt(player.vx * player.vx + player.vy * player.vy);
								other.damage += player.character.strength * (1 + speed_multiplier) * (1 - other.character.defense);
								other.vx = 10 * player.direction + (0.2 * other.damage);
								other.stunned = true;
								other.stunnedCD = currentTime;
							}
						}
					}
				}
			}
		}
		/*if (data.down) {
			player.y += 5;
		}*/
	});
});
setInterval(function() {
	var currentTime = (new Date()).getTime();
	// Move the characters according to their velocities
	for (i in players){
		var player = players[i];
		if (player.jumps > 0) player.animation = "Jumping";
		if (currentTime - player.frameTimer > 1000 / player.character.spritesheet[player.animation].fps){
			player.frameTimer = currentTime;
			player.frame++;
			if (player.frame >= player.character.spritesheet[player.animation].frames) {
				player.frame = 0;
				if (player.animation == "Punching") player.attacking = false;
			}
		}
		// Controls
		player.x += player.vx;
		player.y -= player.vy;
		// Horizontal acceleration and gravity
		player.vx += player.ax;
		player.vy += player.ay;
		// Collision with stage
		var y_thresh = 20;
		var pos2 = {y: player.y - (player.vy  + player.ay)};
		if (player.x + player.width > stage.x && player.x < stage.x + stage.width && pos2.y + player.height - y_thresh > stage.y && pos2.y + player.height + y_thresh < stage.y + stage.height/2) {
			player.vy = 0;
			player.y = stage.y - player.height + y_thresh;
			player.jumps = 0;
		}
		if (player.stunned){
			var t = currentTime - player.stunnedCD;
			player.vx -= Math.sign(player.vx) * FRICTION;
			if (Math.abs(player.vx) < FRICTION){
				player.vx = 0;
				player.ax = 0;
			}
			if (t > 500){
				player.stunned = false;
			}
			//io.sockets.send("Pos: " + player.x + "\t\tVel: " + player.vx + "\t\tAccel: " + player.ax);
		}
		if (player.prevAnim != player.animation){
			player.frame = 0;
			player.prevAnim = player.animation;
		}
		if (player.y > canvas.height){
			// Died! Must respawn
			player.deaths++;
			player.damage = 0;
			player.x = canvas.width/2 - player.width/2;
			player.y = 200;
			player.vx = 0;
			player.vy = 0;
			player.ax = 0;
		}
	}
	// Send the update
	io.sockets.emit('state', players);
}, 1000 / 60);
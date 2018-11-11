var stats = document.getElementById("stats");

var fields = {"Strength": 1, "Speed": 1, "Defense": 1};

for (var field in fields){
	var p = document.createElement("p");
	p.innerHTML = field;
	stats.appendChild(p);
	var div = document.createElement("div");
	div.className = "barDiv";
	var bar = document.createElement("div");
	bar.className = "bar";
	bar.id = "bar-" + field;
	div.appendChild(bar);
	stats.appendChild(div);
}

var animation_ids = [];
function animateBar(field, target){
	var bar = document.getElementById("bar-" + field);
	var init = fields[field];
	fields[field] = target;
	var current = init;
	var id = setInterval(frame, 10);
	animation_ids.push(id);
	function frame(){
		if (Math.sign(current - target) == Math.sign(target - init) || Math.abs(current - target) <= 0.15){
			bar.style.width = target + "%";
			clearInterval(id);
		} else {
			var error = target - current;
			current += error * 0.05;
			bar.style.width = current + "%";
		}
	}
}

// Characters
var characters = {
	Peter: {name: "Peter", strength: 10, jumps: 2, jumpStrength: 7, speed: 5, accel: 1, defense: 0.1}, // Average character
	Eason: {name: "Eason", strength: 5, jumps: 3, jumpStrength: 10, speed: 8, accel: 2, defense: 0.1}, // More speed, less attack
	Ricky: {name: "Ricky", strength: 15, jumps: 1, jumpStrength: 8.5, speed: 5, accel: 1, defense: 0.05}, // More attack, less defense
	Tim: {name: "Tim", strength: 10, jumps: 2, jumpStrength: 7, speed: 3, accel: 0.8, defense: 0.2} // More defense, less speed
};

function calculate_metrics(c){
	var strength = c.strength;
	var speed = c.speed + c.accel + 0.2 * (c.jumps * c.jumpStrength);
	var defense = c.defense;
	return [strength, speed, defense];
}

var metrics = {};
var maxes = [0, 0, 0];
for (var i in characters){
	var m = calculate_metrics(characters[i]);
	for (var j = 0; j < m.length; j++) maxes[j] = Math.max(maxes[j],m[j]);
	metrics[i] = m;
}
for (var i = 0; i < maxes.length; i++) maxes[i] *= 1.05;

var chars = document.getElementsByClassName("char");
var selected = false;
var btn = document.getElementById("connect");
for (var i = 0; i < chars.length; i++){
	var el = chars[i];
	el.addEventListener("mouseover", function(){
		if (!selected){
			document.getElementById("name").innerHTML = "Stats - " + this.innerText;
			for (var i = 0; i < animation_ids.length; i++) clearInterval(animation_ids[i]);
			animation_ids = [];
			var m = metrics[this.innerText];
			animateBar("Strength", 100 * m[0] / maxes[0]);
			animateBar("Speed", 100 * m[1] / maxes[1]);
			animateBar("Defense", 100 * m[2] / maxes[2]);
		}
	}, false);
	el.addEventListener("click", function(){
		if (selected == this.innerText){ // Already selected, let's unselect
			selected = false;
			btn.style.display = "none";
			this.className = "char";
		} else {
			selected = this.innerText;
			btn.style.display = "inline";
			btn.innerHTML = "Play as " + selected;
			for (var j = 0; j < chars.length; j++) chars[j].className = "char";
			this.className = "char active";
		}
	}, false);
}
btn.addEventListener("click", function(){
	document.getElementById("chooser").style.display = "none";
	document.getElementById("canvas").style.display = "block";
	startGame(selected);
}, false);
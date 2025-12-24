/* Good Email, Bad Email */
/* Inspired by https://openprocessing.org/sketch/1866771 */

let instructions = 'Main droite pour contrôler le vaisseau, SPACE pour tirer';

let badThings, ship, lasers, particles, gameOverFrame;
let goodThings;
let generalSpeed = 0;

let boolLeft = false;
let boolRight = false;
let boolUp = false;

let margin = 40;
let boolGameOver = false;
let boolGoodHit = false;
let score = 0;

// Variables pour la webcam et handPose
let video = null;
let handPose;
let hands = [];

function setup() {
	new Canvas(600, 600);
	displayMode('maxed');//, 'pixelated');
	allSprites.autoDraw = false; // Désactiver le dessin automatique des sprites

	// Initialiser la webcam avec gestion d'erreur
	console.log('Initialisation de la webcam...');
	video = createCapture(VIDEO);
	video.hide();

	// Charger handPose une fois la vidéo créée
	setTimeout(() => {
		console.log('Chargement de HandPose...');
		handPose = ml5.handPose(modelReady);
	}, 1000);

	ship = new Sprite(0, 0, 15);
	ship.image = 'assets/asteroids_ship0001.png';
	ship.addAni('default', 'assets/asteroids_ship0001.png', 7);
	ship.addAni('thrust', 'assets/asteroids_ship0002.png', 7);
	ship.rotationDrag = 1;
	// ship.debug = true;

	lasers = new Group();
	lasers.image = 'assets/asteroids_bullet.png';
	lasers.debug = true;

	particles = new Group();
	particles.image = 'assets/asteroids_particle.png';

	badThings = new Group();
	for (let i = 0; i < 2; i++) {
		badThings.addAni('a' + i, 'assets/badThing' + i + '.png');
	}

	goodThings = new Group();
	for (let i = 0; i < 2; i++) {
		goodThings.addAni('a' + i, 'assets/goodThing' + i + '.png');
	}

	ship.overlaps(lasers);
	lasers.collides(badThings, badThingHit);
	ship.collides(badThings, badThingCollision);

	lasers.collides(goodThings, goodThingHit);
	ship.collides(goodThings, goodThingCollision);
	startNewGame();
}

function startNewGame() {
	ship.x = canvas.hw;
	ship.y = canvas.hh;
	ship.rotation = random(360);
	ship.speed = 0;
	ship.visible = true;
	ship.rotationSpeed = 0;
	generalSpeed = 0;
	score = 0;

	particles.removeAll();

	badThings.removeAll();
	for (let i = 0; i < 8; i++) {
		let ang = random(360);
		let px = canvas.hw + 1000 * cos(ang);
		let py = canvas.hh + 1000 * sin(ang);
		createBadThing(px, py);
	}
	goodThings.removeAll();
	for (let i = 0; i < 2; i++) {
		let ang = random(360);
		let px = canvas.hw + 1000 * cos(ang);
		let py = canvas.hh + 1000 * sin(ang);
		createGoodThing(px, py);
	}
	gameOverFrame = 0;
	boolGoodHit = false;
}

let goodMessage = 0;

// Callback quand le modèle est chargé
function modelReady() {
	console.log('HandPose model loaded!');
	// Démarrer la détection des mains
	handPose.detectStart(video, gotHands);
}

// Callback function for when handPose outputs data
function gotHands(results) {
	// Save the output to the hands variable
	hands = results;
}

// Fonction pour dessiner un cercle au centre de la main gauche
function drawHand() {
	if (hands.length === 0) return;

	// Calculer le scale pour adapter les coordonnées
	let scale = max(width / video.width, height / video.height);
	let w = video.width * scale;
	let h = video.height * scale;
	let offsetX = (width - w) / 2;
	let offsetY = (height - h) / 2;

	// Chercher la main gauche
	for (let hand of hands) {
		if (hand.handedness === "Left") {
			// Calculer le centre de gravité de tous les keypoints
			let sumX = 0;
			let sumY = 0;
			let count = hand.keypoints.length;
			
			for (let keypoint of hand.keypoints) {
				sumX += keypoint.x;
				sumY += keypoint.y;
			}
			
			let centerX = sumX / count;
			let centerY = sumY / count;
			
			// Adapter les coordonnées au canvas
			let x = (video.width - centerX) * scale + offsetX;
			let y = centerY * scale + offsetY;
			
			// Dessiner un cercle au centre
			fill(0, 255, 0);
			noStroke();
			circle(x, y, 30);
			
			// Détecter la proximité des bords
			let thresholdX = width * 0.15; // Seuil horizontal à 15%
			let thresholdY = height * 0.15; // Seuil vertical à 15%
			let message = "";
			
			// Vérifier bord droit
			if (width - x < thresholdX) {
				message = "Je tourne à droite";
				boolRight = true;
			}
			else boolRight = false;

			// Vérifier bord gauche
			if (x < thresholdX) {
				message = "Je tourne à gauche";
				boolLeft = true;
			}
			else boolLeft = false;
			
			// Vérifier bord haut
			if (y < thresholdY) {
				message = "J'avance";
				boolUp = true;
			}
			else boolUp = false;
			
			// Afficher le message s'il y en a un
			if (message !== "") {
				fill(255, 255, 255);
				textAlign('center');
				textSize(16);
				text(message, x, y + 50);
			}
			
			break; // Une seule main gauche
		}
	}
}


function draw() {
	background(50);

	// Dessiner la webcam en fond si elle est prête
	if (video) {
		push();
		// Couvrir tout le canvas, quitte à rogner la vidéo
		let scale = max(width / video.width, height / video.height);
		let w = video.width * scale;
		let h = video.height * scale;
		let x = (width - w) / 2;
		let y = (height - h) / 2;
		image(video, x, y, w, h);
		pop();
		
		// Ajouter un filtre sombre par-dessus
		fill(0, 0, 0, 200); // Noir avec opacité 150 (0-255)
		noStroke();
		rect(0, 0, width, height);
	}

	// Dessiner la main droite par-dessus la webcam
	drawHand();

	for (let s of allSprites) {
		if (s.x < -margin) s.x = canvas.w + margin;
		if (s.x > canvas.w + margin) s.x = -margin;
		if (s.y < -margin) s.y = canvas.h + margin;
		if (s.y > canvas.h + margin) s.y = -margin;
	}

	// if (kb.pressing('left')) ship.rotation -= 5;
	if (boolLeft) ship.rotation -= 1;
	// if (kb.pressing('right')) ship.rotation += 5;
	if (boolRight) ship.rotation += 1;
	// if (kb.pressing('up')) {
	if (boolUp) {
		// https://p5play.org/learn/sprite.html?page=10
		ship.bearing = ship.rotation;
		ship.applyForce(0.15);
		ship.ani = 'thrust';
	} else {
		ship.ani = 'default';
	}

	// Move towards the center for the ship
	let dir = createVector(ship.x, ship.y);
	dir.sub(createVector(canvas.hw, canvas.hh));
	dir.setMag(-0.1);
	ship.bearing = dir.heading() * 180;
	ship.applyForce(dir);

	if (mouse.presses() || kb.presses(' ') || kb.presses('k')) {
		let laser = new lasers.Sprite(ship.x, ship.y);
		laser.direction = ship.rotation;
		laser.speed = ship.speed + 10;
		laser.life = 30;
	}

	if (random() < 0.005) {
		let ang = random(360);
		let px = canvas.hw + 1000 * cos(ang);
		let py = canvas.hh + 1000 * sin(ang);
		if (random() < 0.8) {
			createBadThing(px, py);
		}
		else {
			createGoodThing(px, py);
		}
		generalSpeed += 0.03;
	}

	// Dessiner les sprites manuellement
	allSprites.draw();

	// Dessiner les textes par-dessus les sprites
	fill(255);
	textAlign('center');
	textSize(20);
	text(instructions, canvas.hw, 20);
	// Afficher le score
	text('Score: ' + score, canvas.hw, canvas.h - 20);

	if (goodMessage > 0) {
		textAlign('center');
		textSize(25);
		text('Good for your health!', canvas.hw, canvas.hh - 50);
		goodMessage--;
	}

	if (boolGoodHit) {
		if (particles.length === 0)
			boolGoodHit = false;
		else {
			textAlign('center');
			textSize(25);
			text('Oh no, you just hit a good thing!', canvas.hw, canvas.hh - 50);
		}
	}

	if (boolGameOver && particles.length === 0) {
		textAlign('center');
		textSize(25);
		text('Game Over, SPACE pour relancer', canvas.hw, canvas.hh - 50);
		noLoop();
	}

}

function createBadThing(x, y) {
	let imgNum = round(random(0, 1));
	let a = new badThings.Sprite('a' + imgNum, x, y);
	let s = random(0.15, 0.35);
	a.scale = s;
	a.diameter = 250 * s; // Le collider s'adapte au scale
	a.collider = 'dynamic';
	a.mass = 2;
	a.direction = random(360);
	a.speed = random(0.4, 0.6) + generalSpeed;
	a.rotationSpeed = random(-1, 1);
	// a.debug = true; // uncomment to see the colliders
	return a;
}

function createGoodThing(x, y) {
	let imgNum = round(random(0, 1));
	let a = new goodThings.Sprite('a' + imgNum, x, y);
	let s = random(0.15, 0.35);
	a.scale = s;
	a.diameter = 250 * s; // Le collider s'adapte au scale
	a.mass = 2;
	a.direction = random(360);
	a.speed = random(0.4, 0.6) + generalSpeed;
	a.rotationSpeed = random(-1, 1);
	// a.debug = true; // uncomment to see the colliders
	return a;
}

function badThingHit(bullet, badThing) {
	// Ne pas compter les collisions en dehors du canvas visible
	if (badThing.x < 0 || badThing.x > canvas.w || badThing.y < 0 || badThing.y > canvas.h) {
		return;
	}
	for (let i = 0; i < 10; i++) {
		// bullet shards particle effect
		let p = new particles.Sprite(bullet.x, bullet.y);
		p.direction = random(360);
		p.speed = random(3, 5);
		p.life = 15;
	}
	bullet.remove();
	badThing.remove();
	score += 1; // Ajouter des points
}

function goodThingCollision(ship, goodThing) {
	for (let i = 0; i < 5; i++) {
		// bullet shards particle effect
		let p = new particles.Sprite(goodThing.x, goodThing.y);
		p.direction = random(360);
		p.speed = random(3, 5);
		p.life = 15;
	}
	goodThing.remove();
	goodMessage = 30;
	score += 1; // Ajouter un point
}

async function goodThingHit(bullet, goodThing) {
	// Ne pas compter les collisions en dehors du canvas visible
	if (goodThing.x < 0 || goodThing.x > canvas.w || goodThing.y < 0 || goodThing.y > canvas.h) {
		return;
	}
	for (let i = 0; i < 50; i++) {
		// bullet shards particle effect
		let p = new particles.Sprite(ship.x, ship.y);
		p.direction = random(360);
		p.speed = random(3, 5);
		p.life = 120;
	}
	ship.visible = false;
	boolGameOver = true;
	boolGoodHit = true;
}

async function badThingCollision(ship, badThing) {
	for (let i = 0; i < 15; i++) {
		// bullet shards particle effect
		let p = new particles.Sprite(ship.x, ship.y);
		p.direction = random(360);
		p.speed = random(3, 5);
		p.life = 30;
	}
	ship.visible = false;
	boolGameOver = true;
}

function keyPressed() {

	if (boolGameOver && kb.presses('space')) {
		boolGameOver = false;
		loop();
		startNewGame();
	}
}

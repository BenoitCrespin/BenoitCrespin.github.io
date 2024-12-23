/* Good Email, Bad Email */
/* Inspired by https://openprocessing.org/sketch/1866771 */

let instructions = 'WASD or arrows to turn, Space to shoot';

let badEmails, ship, lasers, particles, gameOverFrame;
let goodEmails;
let generalSpeed = 0;

let margin = 40;
let boolGameOver = false;
let boolGoodHit = false;

function preload() {
	ship = new Sprite(0, 0, 20);
	ship.image = 'assets/asteroids_ship0001.png';
	ship.addAni('default', 'assets/asteroids_ship0001.png', 7);
	ship.addAni('thrust', 'assets/asteroids_ship0002.png', 7);
	ship.rotationDrag = 1;

	lasers = new Group();
	lasers.image = 'assets/asteroids_bullet.png';

	particles = new Group();
	particles.image = 'assets/asteroids_particle.png';

	badEmails = new Group();
	for (let i = 0; i < 3; i++) {
		badEmails.addAni('a' + i, 'assets/badEmail' + i + '.png');
	}

	goodEmails = new Group();
	for (let i = 0; i < 2; i++) {
		goodEmails.addAni('a' + i, 'assets/goodEmail' + i + '.png');
	}
}

function setup() {
	new Canvas(600, 600);
	displayMode('maxed');//, 'pixelated');

	ship.overlaps(lasers);
	lasers.collides(badEmails, badEmailHit);
	ship.collides(badEmails, badEmailCollision);

	lasers.collides(goodEmails, goodEmailHit);
	ship.collides(goodEmails, goodEmailCollision);

	startNewGame();
}

function startNewGame() {
	ship.x = canvas.hw;
	ship.y = canvas.hh;
	ship.rotation = 0;
	ship.speed = 0;
	ship.visible = true;
	ship.rotationSpeed = 0;
	generalSpeed = 0;

	particles.removeAll();

	badEmails.removeAll();
	for (let i = 0; i < 8; i++) {
		let ang = random(360);
		let px = canvas.hw + 1000 * cos(ang);
		let py = canvas.hh + 1000 * sin(ang);
		createBadEmail(px, py);
	}
	goodEmails.removeAll();
	for (let i = 0; i < 3; i++) {
		let ang = random(360);
		let px = canvas.hw + 1000 * cos(ang);
		let py = canvas.hh + 1000 * sin(ang);
		createGoodEmail(px, py);
	}
	gameOverFrame = 0;
	boolGoodHit = false;
}

let goodMessage = 0;

function draw() {
	background(0);
	fill(255);
	textSize(20);
	textAlign('center');
	text(instructions, canvas.hw, 20);

	if (goodMessage > 0) {
		textSize(25);
		text('Good Email!', canvas.hw, canvas.hh - 50);
		goodMessage--;
	}

	for (let s of allSprites) {
		if (s.x < -margin) s.x = canvas.w + margin;
		if (s.x > canvas.w + margin) s.x = -margin;
		if (s.y < -margin) s.y = canvas.h + margin;
		if (s.y > canvas.h + margin) s.y = -margin;
	}

	if (kb.pressing('left')) ship.rotation -= 5;
	if (kb.pressing('right')) ship.rotation += 5;
	if (kb.pressing('up')) {
		// https://p5play.org/learn/sprite.html?page=10
		ship.bearing = ship.rotation;
		ship.applyForce(0.5);
		ship.ani = 'thrust';
	} else {
		ship.ani = 'default';
	}

	if (mouse.presses() || kb.presses(' ') || kb.presses('k')) {
		let laser = new lasers.Sprite(ship.x, ship.y);
		laser.direction = ship.rotation;
		laser.speed = ship.speed + 10;
		laser.life = 30;
	}

	// if (!badEmails.length) {
	// 	textSize(25);
	// 	text('You won, Espace pour recommencer!', canvas.hw, canvas.hh - 50);
	// 	noLoop();
	// 	boolGameOver = true;
	// }
	if (random() < 0.005) {
		let ang = random(360);
		let px = canvas.hw + 1000 * cos(ang);
		let py = canvas.hh + 1000 * sin(ang);
		if (random() < 0.8) {
			createBadEmail(px, py);
		}
		else {
			createGoodEmail(px, py);
		}
		generalSpeed += 0.3;
	}

	if (boolGoodHit) {
		if (particles.length === 0)
			boolGoodHit = false;
		else {
			textSize(25);
			text('Oh no, you just hit a Good Email!', canvas.hw, canvas.hh - 50);
		}
	}

	if (boolGameOver && particles.length === 0) {
		textSize(25);
		text('Game Over, Enter to restart', canvas.hw, canvas.hh - 50);
		noLoop();
	}

}

function createBadEmail(x, y) {
	let imgNum = round(random(0, 2));
	let a = new badEmails.Sprite('a' + imgNum, x, y, 70);
	a.scale = random(1.2, 1.4);
	a.mass = 2;
	a.direction = random(360);
	a.speed = random(0.4, 0.6) + generalSpeed;
	a.rotationSpeed = random(-1, 1);
	//a.debug = true; // uncomment to see the colliders
	return a;
}

function createGoodEmail(x, y) {
	let imgNum = round(random(0, 1));
	let a = new goodEmails.Sprite('a' + imgNum, x, y, 70);
	a.scale = random(1.2, 1.4);
	a.mass = 2;
	a.direction = random(360);
	a.speed = random(0.4, 0.6) + generalSpeed;
	a.rotationSpeed = random(-1, 1);
	//a.debug = true; // uncomment to see the colliders
	return a;
}

function badEmailHit(bullet, badEmail) {
	for (let i = 0; i < 10; i++) {
		// bullet shards particle effect
		let p = new particles.Sprite(bullet.x, bullet.y);
		p.direction = random(360);
		p.speed = random(3, 5);
		p.life = 15;
	}
	bullet.remove();
	badEmail.remove();
}

function goodEmailCollision(ship, goodEmail) {
	for (let i = 0; i < 5; i++) {
		// bullet shards particle effect
		let p = new particles.Sprite(goodEmail.x, goodEmail.y);
		p.direction = random(360);
		p.speed = random(3, 5);
		p.life = 15;
	}
	goodEmail.remove();
	goodMessage = 30;
}

async function goodEmailHit(bullet, goodEmail) {
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

async function badEmailCollision(ship, badEmail) {
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

	if (boolGameOver && kb.presses('enter')) {
		boolGameOver = false;
		loop();
		startNewGame();
	}
}

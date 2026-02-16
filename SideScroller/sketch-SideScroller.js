// https://refybe.com/fr/games/side-scroller

const speed = 4;
const hauteurSol = 300;
const appGoldRock = 80;  // Fréquence d'apparition en frames

createCanvas();
world.gravity.y = 10;

let perso = new Sprite();
perso.addAni('./assets/cloud_breathing1.webp', 9);
perso.x = 200;
perso.y = halfHeight;
perso.physics = DYNAMIC;
perso.diameter = perso.width * 2.5;

let groundCollider = new Sprite();
groundCollider.x = halfWidth;
groundCollider.y = height - 50;
groundCollider.width = width;
groundCollider.visible = false;
groundCollider.physics = STATIC;

let bushImages = [];
let activeBushes = [];
let bushesInitialized = false;

let goldImg, rockImg, promoImg;
let activeItems = [];  // Sprites gold et rock
let frameCounter = 0;
let goldCount = 0;  // Compteur de gold collectés
let flashEffect = 0;  // Durée de l'effet de clignotement
let animatingGolds = [];  // Pièces d'or en cours d'animation après collecte
let gameOver = false;  // État de victoire

let mountainImg, mountainScale = 0.5, mountainAjustY = 372;
let mountain = {};

// Précharger les images de buissons
preload = function () {
	for (let i = 1; i <= 4; i++) {
		bushImages.push(loadImage(`./assets/bush${i}.png`));
	}
	
	// Précharger les images gold et rock
	goldImg = loadImage('./assets/gold.png');
	rockImg = loadImage('./assets/rock.png');
	promoImg = loadImage('./assets/code-promo.avif');
	mountainImg = loadImage('./assets/mountain.png');
};

function spawnBush(startX = null) {
	let bushNumber = floor(random(0, 4));  // Index entre 0 et 3
	let img = bushImages[bushNumber];
	let scale = random(0.2, 0.4);  // Facteur de réduction
	let bushWidth = img.width * scale;
	let bushHeight = img.height * scale;
	
	// Le pied de l'arbre doit être entre (height - hauteurSol) et (height - hauteurSol/2)
	let piedY = random(100, hauteurSol - 100);
	let bushY = height - piedY - bushHeight;  // Position Y du haut de l'image
	
	let newBush = {
		img: img,
		width: bushWidth,
		height: bushHeight,
		x: startX !== null ? startX : width + 50,  // Position de départ
		y: bushY,  // Position verticale du buisson
	};
	activeBushes.push(newBush);  // Ajouter le nouveau buisson à la liste des buissons actifs

	// Trier la liste par y décroissant
	activeBushes.sort((a, b) => b.y - a.y);
}

function update() {
	// Initialiser l'objet mountain au premier frame (après le chargement de l'image)
	if (!mountain.img) {
		
		mountain = {
			img: mountainImg,
			x: random(width),
			width: mountainImg.width * mountainScale,
			height: mountainImg.height * mountainScale
		};
	}
	
	// Vérifier si on a atteint 5 pièces
	if (goldCount >= 5) {
		gameOver = true;
	}
	
	// Si le jeu est terminé, afficher l'écran de victoire
	if (gameOver) {
		background('skyblue');
		
		// Afficher l'image code-promo au centre
		let imgWidth = 800;
		let imgHeight = promoImg.height * (imgWidth / promoImg.width);
		image(promoImg, halfWidth - imgWidth/2, halfHeight - imgHeight/2, imgWidth, imgHeight);
		
		// Texte clignotant "CONGRATULATIONS"
		if (frameCount % 30 < 15) {  // Clignote toutes les 30 frames
			fill(255, 215, 0);  // Couleur or
			stroke(0);
			strokeWeight(3);
			textAlign(CENTER);
			textSize(60);
			text('CONGRATULATIONS', halfWidth, height - 120);
		}
		
		// Texte "Click to replay"
		fill(255);
		strokeWeight(2);
		textSize(30);
		text('Click to replay', halfWidth, height - 60);
		noStroke();
		
		// Permettre de rejouer
		if (mouse.presses()) {
			// Réinitialiser le jeu
			goldCount = 0;
			gameOver = false;
			activeItems = [];
			animatingGolds = [];
			activeBushes = [];
			bushesInitialized = false;
			frameCounter = 0;
			flashEffect = 0;
			perso.x = 200;
			perso.y = halfHeight;
			perso.vel.y = 0;
		}
		return;  // Ne pas exécuter le reste de la fonction update
	}
	
	// Initialiser les arbres au premier frame
	if (!bushesInitialized) {
		for (let i = 0; i < 5; i++) {
			spawnBush(random(0, width));
		}
		bushesInitialized = true;
	}
	
	background('skyblue');

	// Sol décoratif vert (sans collision)
	fill('green');
	noStroke();
	rect(0, height - hauteurSol, width, hauteurSol);

	// Dessiner la montagne en arrière-plan
	image(mountain.img, mountain.x, height - hauteurSol - mountainAjustY, mountain.width, mountain.height);
	// Faire bouger la montagne lentement pour créer un effet de parallaxe
	mountain.x -= speed * 0.5;  // Vitesse de déplacement de la montagne (plus lente que les buissons)
	if (mountain.x <= -450) {
		mountain.x = width + 50;  // Réinitialiser la position de la montagne pour une boucle infinie
	}

	// Ombre sous le personnage
	let groundY = height - 50;  // Position du sol visuel
	let distance = groundY - perso.y;  // Distance entre le personnage et le sol
	let shadowSize = map(distance, 0, height / 2, 150, 0);  // Taille de l'ombre inversement proportionnelle à la distance
	shadowSize = constrain(shadowSize, 0, 150);  // Limiter la taille
	fill(0, 0, 0, shadowSize);  // Noir semi-transparent
	ellipse(perso.x, groundY - 10, shadowSize, shadowSize * 0.5);  // Ombre elliptique

	// Afficher le compteur de gold en haut au centre
	fill(255);  // Blanc
	stroke(0);  // Contour noir
	strokeWeight(3);
	textAlign(CENTER);
	textSize(50);
	text(goldCount + '/5', halfWidth, 80);
	noStroke();

	textAlign(CENTER);
	textSize(20);
	text('click to jump!', halfWidth, halfHeight - 100);

	// Mettre en pause l'animation pendant le saut
	if (perso.y >= height - 150) {
		perso.ani.stop();  // Animation active en l'air
	} else {
		perso.ani.play();  // Animation en pause au sol
	}

	// Gérer l'effet de clignotement quand on touche un rock
	if (flashEffect > 0) {
		flashEffect--;
		// Créer un effet de clignotement rapide en alternant visible/invisible
		if (flashEffect % 4 < 2) {
			perso.opacity = 0;  // Invisible
		} else {
			perso.opacity = 255;  // Visible
		}
	} else {
		perso.opacity = 255;  // Opacité normale
	}

	if (mouse.presses()) perso.vel.y = -10;

	// Afficher les buissons actifs et les déplacer vers la gauche
	for (let i = activeBushes.length - 1; i >= 0; i--) {
		let bush = activeBushes[i];
		bush.x -= speed;  // Vitesse de déplacement des buissons

		if (bush.x < -bush.width) {
			activeBushes.splice(i, 1);  // Retirer le buisson une fois hors de l'écran
		}
		else {
			// Dessiner le buisson comme élément de décor
			image(bush.img, bush.x, bush.y, bush.width, bush.height);
		}
	}

	// Générer de nouveaux buissons aléatoirement
	if (random() < 0.025) {  // Probabilité de génération d'un buisson
		spawnBush();
	}

	// Gérer les items gold et rock
	frameCounter++;
	if (frameCounter >= appGoldRock) {
		frameCounter = 0;
		// Apparition aléatoire: parfois rien, parfois gold, parfois rock
		let randomChoice = random();
		if (randomChoice > 0.3) {  // 70% de chance qu'un item apparaisse
			let img = randomChoice > 0.65 ? goldImg : rockImg;
			let itemType = randomChoice > 0.65 ? 'gold' : 'rock';
			let scale = 0.2;
			
			let newItem = {
				x: width + 50,
				y: height - scale*img.height - 50,
				img: img,
				width: img.width * scale,
				height: img.height * scale,
				itemType: itemType
			};
			
			activeItems.push(newItem);
		}
	}
	
	// Gérer le déplacement, l'affichage et les collisions des items
	for (let i = activeItems.length - 1; i >= 0; i--) {
		let item = activeItems[i];
		
		// Déplacer l'item manuellement
		item.x -= speed;
		
		// Dessiner l'item
		image(item.img, item.x, item.y, item.width, item.height);
		
		// Vérifier collision avec le perso (distance simple)
		let distX = abs(item.x + item.width/3 - perso.x);
		let distY = abs(item.y + item.height/3 - perso.y);
		let minDist = (item.width + perso.diameter) / 3;
		
		if (distX < minDist && distY < minDist) {
			// Collision détectée
			if (item.itemType === 'gold') {
				goldCount++;  // Incrémenter le compteur si c'est un gold
				// Démarrer l'animation de collecte
				animatingGolds.push({
					x: item.x,
					y: item.y,
					img: item.img,
					width: item.width,
					height: item.height,
					alpha: 255,
					animFrame: 0,
					zigzagOffset: 0
				});
			} else if (item.itemType === 'rock') {
				goldCount = 0;  // Remettre le compteur à 0 si c'est un rock
				flashEffect = 30;  // Déclencher l'effet de clignotement (30 frames)
			}
			activeItems.splice(i, 1);
			continue;
		}
		
		// Supprimer si hors de l'écran
		if (item.x < -item.width) {
			activeItems.splice(i, 1);
		}
	}

	// Animer les pièces d'or collectées
	for (let i = animatingGolds.length - 1; i >= 0; i--) {
		let gold = animatingGolds[i];
		gold.animFrame++;
		
		// Monter
		gold.y -= 3;
		
		// Zigzag (mouvement horizontal sinusoïdal)
		gold.zigzagOffset = sin(gold.animFrame * 0.3) * 20;
		
		// Rapetisser progressivement
		gold.width *= 0.95;
		gold.height *= 0.95;
		
		// Disparaître progressivement
		gold.alpha -= 12;
		
		// Dessiner la pièce avec transparence
		push();
		tint(255, gold.alpha);
		image(gold.img, gold.x + gold.zigzagOffset, gold.y, gold.width, gold.height);
		pop();
		
		// Supprimer si l'animation est terminée (complètement transparent ou trop petit)
		if (gold.alpha <= 0 || gold.animFrame > 25) {
			animatingGolds.splice(i, 1);
		}
	}

}

const speed = 5;
const probaNouvelleTuile = 0.04; // Probabilité d'apparition d'une nouvelle tuile à chaque frame
const maxScore = 10;
const maxTime = 20; // Durée maximale du jeu en secondes

let canvasWidth, canvasHeight;
let tileHeight, tileWidth;
let tiles = [];
let scorePopups = [];
let score = 0;
let timer = maxTime;
let startTime;
let gameWon = false;
let gameLost = false;

function setup() {
  startTime = millis();
  // Déterminer la taille du canvas selon le type d'appareil
  if (windowWidth <= 768) {
    // Mode mobile
    canvasWidth = 352;
    canvasHeight = 469;
  } else {
    // Mode desktop
    canvasWidth = 560;
    canvasHeight = 560;
  }
  tileWidth = (canvasWidth / 4) - 15;
  tileHeight = canvasHeight / 3;

  // Créer le canvas et le placer dans le conteneur
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('canvas-container');
}

function addTile(position) {
  let xPosition = position === 'left' ? canvasWidth / 4 - 15: position === 'center' ? canvasWidth / 2 : 15 + 3 * canvasWidth / 4;
  // Vérifier si une tuile existe déjà à cette position pour éviter les collisions
  for (let tile of tiles) {
    if (tile.x === xPosition && tile.y < tileHeight) {
      return; // Ne pas ajouter une nouvelle tuile si une tuile existe déjà à cette position
    }
  }

  tiles.push({
    x: xPosition,
    y: -tileHeight,
    color: random() > 0.5 ? color(240, 10, 20) : color(10, 240, 15),
    myTime: random(1000) // Temps aléatoire pour l'animation de croissance
  });

  strokeWeight(0);
}

function draw() {
  background(220, 55);

  // Si le jeu est gagné, afficher l'écran de victoire
  if (gameWon) {
    background(220);
    fill(10, 240, 15);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("Congratulations!", canvasWidth / 2, canvasHeight / 3);
    
    fill(0);
    textSize(18);
    text("You have won a promo code", canvasWidth / 2, canvasHeight / 2 - 40);
    text("to use for future purchases", canvasWidth / 2, canvasHeight / 2 - 15);
    text("on our platform:", canvasWidth / 2, canvasHeight / 2 + 10);
    
    fill(10, 240, 15);
    textSize(28);
    textStyle(BOLD);
    text("RBF-9815", canvasWidth / 2, canvasHeight / 2 + 50);
    
    fill(0);
    textSize(16);
    textStyle(NORMAL);
    text("Click to restart the game", canvasWidth / 2, canvasHeight * 2 / 3 + 20);
    return;
  }

  // Si le jeu est perdu, afficher l'écran de défaite
  if (gameLost) {
    background(220);
    fill(240, 10, 20);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("Oh no,", canvasWidth / 2, canvasHeight / 3);
    
    fill(0);
    textSize(20);
    text("you did not get enough", canvasWidth / 2, canvasHeight / 2 - 20);
    text("green tiles :-(", canvasWidth / 2, canvasHeight / 2 + 10);
    
    fill(0);
    textSize(16);
    text("Click to restart the game", canvasWidth / 2, canvasHeight * 2 / 3 + 20);
    return;
  }

  // Déterminer aléatoirement si on ajoute une tuile à gauche, au centre ou à droite
  if (random() < probaNouvelleTuile) { // Ajustez la probabilité d'apparition des tuiles  
    let rand = random();
    if (rand < 0.33) {
      addTile('left');
    } else if (rand < 0.66) {
      addTile('center');
    } else {
      addTile('right');
    }
  }

  // Déplacer les tuiles vers le bas et les dessiner
  for (let i = tiles.length - 1; i >= 0; i--) {
    let tile = tiles[i];
    tile.y += speed;

    // Dessiner la tuile
    let growFactor = 1 + cos(tile.myTime) * 0.1; // Légère oscillation de la taille
    tile.myTime += 0.05; // Incrémenter le temps pour l'animation de croissance
    let currentTileWidth = tileWidth * growFactor;
    let currentTileHeight = tileHeight * growFactor;
    fill(tile.color);
    rect(tile.x - currentTileWidth / 2, tile.y, currentTileWidth, currentTileHeight, 10);

    // Supprimer la tuile si elle sort du canvas
    if (tile.y > canvasHeight) {
      tiles.splice(i, 1);
    }
    else if (mouseIsPressed && mouseY > tile.y && mouseY < tile.y + currentTileHeight && 
        mouseX > tile.x - currentTileWidth / 2 && mouseX < tile.x + currentTileWidth / 2) {
      // Créer une popup de score
      let isRed = tile.color.levels[0] > 200;
      scorePopups.push({
        x: tile.x,
        y: tile.y + currentTileHeight / 2,
        value: isRed ? -1 : 1,
        color: isRed ? color(240, 10, 20) : color(10, 240, 15),
        opacity: 255,
        life: 0
      });
      
      tiles.splice(i, 1);
      if (isRed) { // Tuile rouge
        score = max(0, score - 1);
      } else { // Tuile verte
        score++;
      }
    }
  }

  // Vérifier si le joueur a gagné (après la boucle des tuiles)
  if (score >= maxScore && !gameWon) {
    gameWon = true;
    tiles = []; // Vider toutes les tuiles
    scorePopups = []; // Vider toutes les popups
    return; // Sortir immédiatement pour afficher l'écran de victoire
  }

  // Animer et afficher les popups de score
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    let popup = scorePopups[i];
    
    // Faire remonter la popup
    popup.y -= 2;
    popup.life += 1;
    
    // Diminuer l'opacité
    popup.opacity = map(popup.life, 0, 30, 255, 0);
    
    // Dessiner le disque de fond
    fill(popup.color.levels[0], popup.color.levels[1], popup.color.levels[2], popup.opacity);
    circle(popup.x, popup.y, 40);
    
    // Dessiner le texte
    fill(255, popup.opacity);
    textSize(20);
    textAlign(CENTER, CENTER);
    text(popup.value > 0 ? '+1' : '-1', popup.x, popup.y);
    
    // Supprimer la popup si elle est complètement transparente
    if (popup.opacity <= 0) {
      scorePopups.splice(i, 1);
    }
  }

  // Afficher le score en haut à gauche
  fill(0);
  textSize(24);
  textAlign(LEFT, TOP);
  text(`Score: ${score}/${maxScore}`, 10, 10);
  textAlign(RIGHT, TOP);
  text(`Time: ${timer}s`, canvasWidth - 10, 10);
  timer = max(0, maxTime - floor((millis() - startTime) / 1000)); // Mettre à jour le timer
  
  // Vérifier si le timer est écoulé (seulement si le joueur n'a pas gagné)
  if (timer === 0 && !gameWon && score < maxScore) {
    gameLost = true;
    tiles = []; // Vider toutes les tuiles
    scorePopups = []; // Vider toutes les popups
  }
} 

function mousePressed() {
  // Redémarrer le jeu si le joueur a gagné ou perdu et clique
  if (gameWon || gameLost) {
    gameWon = false;
    gameLost = false;
    score = 0;
    tiles = [];
    scorePopups = [];
    startTime = millis();
    timer = maxTime;
  }
}
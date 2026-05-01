// Paramètres de simulation (modifiables via GUI)
const params = {
  N_PARTICLES: 500,
  GRAVITY: 0.01,
  GRAVITY_SIZE_FACTOR: 0.3, // Facteur multiplicateur de gravité selon taille (0 = indépendant, 1.0 = linéaire)
  PARTICLE_VELOCITY_LIMIT: 1, // Vitesse max des particules/sédiments
  BUBBLE_VELOCITY_LIMIT: 3, // Vitesse max des bulles
  NOISE_MAGNITUDE: 0.5,
  SIDE_BOTTOM: 100,
  ROTATION_FORCE: 0.15,
  DEPOSITION_PROB: 0.05,
  VELOCITY_THRESHOLD: 0.5,
  COLLISION_RADIUS: 30,
  PARTICLE_SIZE_MIN: 1,
  PARTICLE_SIZE_MAX: 9,
  VERTICAL_MODULATION_MIN: 0.3,
  VERTICAL_MODULATION_MAX: 1.5,
  ADHESION_FACTOR_MIN: 0.3,
  ADHESION_FACTOR_MAX: 2.0,
  // Vortex 1 (sens horaire)
  VORTEX1_CENTER_X: 310,
  VORTEX1_CENTER_Y: 400,
  VORTEX1_WIDTH: 364,
  VORTEX1_HEIGHT: 450,
  // Vortex 2 (sens anti-horaire)
  VORTEX2_CENTER_X: 700,
  VORTEX2_CENTER_Y: 400,
  VORTEX2_WIDTH: 364,
  VORTEX2_HEIGHT: 450,
  // Germination
  GERMINATION_PROB: 0.3, // Probabilité de germination par frame
  GERMINATION_PARTICLES_MIN: 200, // Nombre minimum de particules actives
  GERMINATION_PARTICLES_MAX: 800, // Nombre maximum de particules actives
  // Agrégation
  AGGREGATION_PROB: 0.001, // Probabilité d'agrégation lors d'une collision
  AGGREGATION_MAX_SIZE: 60, // Taille maximale des agrégats
  AGGREGATION_VELOCITY_FACTOR: 1.0, // Facteur de réduction selon vitesse relative
  // Fragmentation
  FRAGMENTATION_PROB: 0.001, // Probabilité de base de fragmentation par frame
  FRAGMENTATION_SIZE_MIN: 15, // Taille minimale pour fragmenter
  FRAGMENTATION_NUM_MIN: 2, // Nombre minimum de fragments
  FRAGMENTATION_NUM_MAX: 4, // Nombre maximum de fragments
  FRAGMENTATION_VELOCITY_THRESHOLD: 1.5, // Vitesse augmentant la fragmentation
  // Système de cooldown
  COOLDOWN_FRAMES: 30, // Nombre de frames avant de pouvoir agréger/fragmenter après un événement
  // Cisaillement (shear)
  SHEAR_CENTER_STRENGTH: 1.5, // Intensité du cisaillement au centre (entre vortex)
  SHEAR_EDGE_STRENGTH: 1.2, // Intensité du cisaillement aux bords des vortex
  // Bulles
  BUBBLE_GENERATION_PROB: 0.35, // Probabilité de génération de bulle par bulleur par frame
  BUBBLE_SIZE_MIN: 15, // Taille minimale des bulles
  BUBBLE_SIZE_MAX: 30, // Taille maximale des bulles
  BUBBLE_BUOYANCY_FACTOR: 1.0, // Facteur multiplicateur de la force de flottabilité
  BUBBLE_SPACING: 100, // Espacement des bulleurs de part et d'autre du centre (w/2)
  // Interception (capture par les bulles)
  CAPTURE_PROB: 0.5, // Probabilité de capture d'une particule par une bulle
  // Affichage
  SHOW_DEPOSITED: true // Afficher les particules déposées
};

let particles = [];
let depositedParticles = []; // Particules déposées (sorties de la simulation)
let capturedParticles = []; // Particules capturées par les bulles (en cours de remontée)
let bubbles = []; // Bulles remontant
let vortices = [];
let gui;
let isRunning = false; // État de la simulation
let stats = {
  activeParticles: 0,
  capturedParticles: 0,
  depositedParticles: 0,
  totalParticles: 0,
  bubbles: 0,
  // Distribution par classe de taille (bins)
  sizeClass1: 0, // 1-3 px
  sizeClass2: 0, // 3-5 px
  sizeClass3: 0, // 5-7 px
  sizeClass4: 0  // 7+ px
};

function setup() {
  createCanvas(1000, 600);
  background(220);
  
  // Définir les deux ellipses de rotation
  vortices = [
    {
      center: createVector(params.VORTEX1_CENTER_X, params.VORTEX1_CENTER_Y),
      width: params.VORTEX1_WIDTH,
      height: params.VORTEX1_HEIGHT,
      clockwise: true  // sens trigo (anti-horaire) à gauche
    },
    {
      center: createVector(params.VORTEX2_CENTER_X, params.VORTEX2_CENTER_Y),
      width: params.VORTEX2_WIDTH,
      height: params.VORTEX2_HEIGHT,
      clockwise: false  // sens horaire à droite
    }
  ];
  
  for (let i = 0; i < params.N_PARTICLES; i++) {
    particles.push({
      pos: createVector(random(width), random(height)),
      size: random(params.PARTICLE_SIZE_MIN, params.PARTICLE_SIZE_MAX),
      vel: createVector(0, 0),
      deposited: false,
      cooldown: 0 // Cooldown pour éviter agrégation/fragmentation immédiate
    });
  }
  
  // Créer l'interface GUI
  gui = new lil.GUI();
  gui.title('Paramètres de simulation');
  
  // Bouton Play/Stop en haut
  const controls = {
    playStop: () => {
      isRunning = !isRunning;
      playStopController.name(isRunning ? '⏸️ Pause' : '▶️ Play');
    }
  };
  const playStopController = gui.add(controls, 'playStop').name('▶️ Play');
  
  // Statistiques
  const folderStats = gui.addFolder('Statistiques');
  folderStats.add(stats, 'activeParticles').name('Particules actives').listen().disable();
  folderStats.add(stats, 'capturedParticles').name('S_interception').listen().disable();
  folderStats.add(stats, 'depositedParticles').name('S_dépôt').listen().disable();
  folderStats.add(stats, 'totalParticles').name('Total particules').listen().disable();
  folderStats.add(stats, 'bubbles').name('Bulles').listen().disable();
  
  const folderSizeDistrib = folderStats.addFolder('Distribution n(V)');
  folderSizeDistrib.add(stats, 'sizeClass1').name('1-3 px').listen().disable();
  folderSizeDistrib.add(stats, 'sizeClass2').name('3-5 px').listen().disable();
  folderSizeDistrib.add(stats, 'sizeClass3').name('5-7 px').listen().disable();
  folderSizeDistrib.add(stats, 'sizeClass4').name('7+ px').listen().disable();
  folderSizeDistrib.close();
  
  folderStats.open();
  
  const folderDisplay = gui.addFolder('Affichage');
  folderDisplay.add(params, 'SHOW_DEPOSITED').name('Afficher déposées');
  folderDisplay.open();
  
  const folderParticles = gui.addFolder('Particules');
  folderParticles.add(params, 'N_PARTICLES', 10, 500, 10).name('Nombre');
  folderParticles.add(params, 'PARTICLE_SIZE_MIN', 1, 10, 0.5).name('Taille min');
  folderParticles.add(params, 'PARTICLE_SIZE_MAX', 10, 50, 1).name('Taille max');
  folderParticles.close();
  
  const folderPhysics = gui.addFolder('Physique');
  folderPhysics.add(params, 'GRAVITY', 0, 0.1, 0.001).name('Gravité');
  folderPhysics.add(params, 'GRAVITY_SIZE_FACTOR', 0, 3, 0.1).name('Exposant taille/gravité');
  folderPhysics.add(params, 'PARTICLE_VELOCITY_LIMIT', 0.5, 10, 0.1).name('V. max particules');
  folderPhysics.add(params, 'BUBBLE_VELOCITY_LIMIT', 0.5, 10, 0.1).name('V. max bulles');
  folderPhysics.add(params, 'NOISE_MAGNITUDE', 0, 2, 0.05).name('Bruit');
  folderPhysics.close();
  
  const folderRotation = gui.addFolder('Rotation');
  folderRotation.add(params, 'ROTATION_FORCE', 0, 1, 0.01).name('Force rotation');
  folderRotation.add(params, 'VERTICAL_MODULATION_MIN', 0, 1, 0.05).name('Modulation min');
  folderRotation.add(params, 'VERTICAL_MODULATION_MAX', 1, 3, 0.1).name('Modulation max');
  folderRotation.close();
  
  const folderDeposition = gui.addFolder('Dépôt');
  folderDeposition.add(params, 'DEPOSITION_PROB', 0, 0.5, 0.01).name('Probabilité');
  folderDeposition.add(params, 'VELOCITY_THRESHOLD', 0, 2, 0.1).name('Seuil vitesse');
  folderDeposition.add(params, 'ADHESION_FACTOR_MIN', 0, 2, 0.1).name('Adhésion min');
  folderDeposition.add(params, 'ADHESION_FACTOR_MAX', 0.5, 5, 0.1).name('Adhésion max');
  folderDeposition.close();
  
  const folderGeometry = gui.addFolder('Géométrie');
  folderGeometry.add(params, 'SIDE_BOTTOM', 0, 300, 10).name('Largeur bords').onChange(() => syncVortexToBubbles());
  folderGeometry.add(params, 'COLLISION_RADIUS', 10, 100, 5).name('Rayon collision');
  folderGeometry.close();
  
  const folderVortices = gui.addFolder('Vortex');
  
  const folderVortex1 = folderVortices.addFolder('Vortex 1 (anti-horaire)');
  folderVortex1.add(params, 'VORTEX1_CENTER_X', 0, 1000, 10).name('Centre X').onChange(() => updateVortices()).listen();
  folderVortex1.add(params, 'VORTEX1_CENTER_Y', 0, 600, 10).name('Centre Y').onChange(() => updateVortices());
  folderVortex1.add(params, 'VORTEX1_WIDTH', 50, 800, 10).name('Largeur').onChange(() => updateVortices()).listen();
  folderVortex1.add(params, 'VORTEX1_HEIGHT', 50, 800, 10).name('Hauteur').onChange(() => updateVortices());
  folderVortex1.close();
  
  const folderVortex2 = folderVortices.addFolder('Vortex 2 (horaire)');
  folderVortex2.add(params, 'VORTEX2_CENTER_X', 0, 1000, 10).name('Centre X').onChange(() => updateVortices()).listen();
  folderVortex2.add(params, 'VORTEX2_CENTER_Y', 0, 600, 10).name('Centre Y').onChange(() => updateVortices());
  folderVortex2.add(params, 'VORTEX2_WIDTH', 50, 800, 10).name('Largeur').onChange(() => updateVortices()).listen();
  folderVortex2.add(params, 'VORTEX2_HEIGHT', 50, 800, 10).name('Hauteur').onChange(() => updateVortices());
  folderVortex2.close();
  
  folderVortices.close();
  
  const folderGermination = gui.addFolder('Germination');
  folderGermination.add(params, 'GERMINATION_PROB', 0, 1.0, 0.01).name('Probabilité');
  folderGermination.add(params, 'GERMINATION_PARTICLES_MIN', 0, 1500, 10).name('Nb particules min');
  folderGermination.add(params, 'GERMINATION_PARTICLES_MAX', 10, 3000, 10).name('Nb particules max');
  folderGermination.close();
  
  const folderAggregation = gui.addFolder('Agrégation');
  folderAggregation.add(params, 'AGGREGATION_PROB', 0, 1, 0.01).name('Probabilité');
  folderAggregation.add(params, 'AGGREGATION_MAX_SIZE', 20, 200, 5).name('Taille max');
  folderAggregation.add(params, 'AGGREGATION_VELOCITY_FACTOR', 0, 2, 0.1).name('Facteur vitesse');
  folderAggregation.close();
  
  const folderFragmentation = gui.addFolder('Fragmentation');
  folderFragmentation.add(params, 'FRAGMENTATION_PROB', 0, 0.01, 0.0001).name('Probabilité');
  folderFragmentation.add(params, 'FRAGMENTATION_SIZE_MIN', 5, 50, 1).name('Taille min');
  folderFragmentation.add(params, 'FRAGMENTATION_NUM_MIN', 2, 5, 1).name('Nb fragments min');
  folderFragmentation.add(params, 'FRAGMENTATION_NUM_MAX', 2, 10, 1).name('Nb fragments max');
  folderFragmentation.add(params, 'FRAGMENTATION_VELOCITY_THRESHOLD', 0, 5, 0.1).name('Seuil vitesse');
  folderFragmentation.add(params, 'COOLDOWN_FRAMES', 0, 120, 5).name('Cooldown (frames)');
  folderFragmentation.close();
  
  const folderShear = gui.addFolder('⚡ Cisaillement');
  folderShear.add(params, 'SHEAR_CENTER_STRENGTH', 1.0, 3.0, 0.1).name('Force centre');
  folderShear.add(params, 'SHEAR_EDGE_STRENGTH', 1.0, 3.0, 0.1).name('Force bords');
  folderShear.close();
  
  const folderBubbles = gui.addFolder('Bulles');
  folderBubbles.add(params, 'BUBBLE_GENERATION_PROB', 0, 0.5, 0.01).name('Probabilité');
  folderBubbles.add(params, 'BUBBLE_SIZE_MIN', 15, 20, 1).name('Taille min');
  folderBubbles.add(params, 'BUBBLE_SIZE_MAX', 20, 50, 1).name('Taille max');
  folderBubbles.add(params, 'BUBBLE_BUOYANCY_FACTOR', 0.1, 3, 0.1).name('Facteur flottabilité');
  folderBubbles.add(params, 'BUBBLE_SPACING', 10, 300, 10).name('Espacement bulleurs').onChange(() => syncVortexToBubbles());
  folderBubbles.add(params, 'CAPTURE_PROB', 0, 1, 0.01).name('Prob. capture');
  folderBubbles.close();
  
  // Initialiser la position des vortex en fonction des bulleurs
  syncVortexToBubbles();
  
  gui.add({ reset: resetSimulation }, 'reset').name('🔄 Réinitialiser');
}

function resetSimulation() {
  // Réinitialiser les tableaux
  particles = [];
  depositedParticles = [];
  capturedParticles = [];
  bubbles = [];
  
  // Recréer les particules initiales
  for (let i = 0; i < params.N_PARTICLES; i++) {
    particles.push({
      pos: createVector(random(width), random(height)),
      size: random(params.PARTICLE_SIZE_MIN, params.PARTICLE_SIZE_MAX),
      vel: createVector(0, 0),
      deposited: false,
      cooldown: 0
    });
  }
}

function updateVortices() {
  // Mettre à jour les vortices en temps réel
  vortices[0].center.set(params.VORTEX1_CENTER_X, params.VORTEX1_CENTER_Y);
  vortices[0].width = params.VORTEX1_WIDTH;
  vortices[0].height = params.VORTEX1_HEIGHT;
  
  vortices[1].center.set(params.VORTEX2_CENTER_X, params.VORTEX2_CENTER_Y);
  vortices[1].width = params.VORTEX2_WIDTH;
  vortices[1].height = params.VORTEX2_HEIGHT;
}

function syncVortexToBubbles() {
  // Synchroniser les centres X et largeurs des vortex avec les positions des bulleurs
  let bulleurGauche = width / 2 - params.BUBBLE_SPACING;
  let bulleurDroit = width / 2 + params.BUBBLE_SPACING;
  let bordGauche = params.SIDE_BOTTOM;
  let bordDroit = width - params.SIDE_BOTTOM;
  
  // Vortex 1 (gauche): entre bord gauche et colonne de bulles gauche
  params.VORTEX1_CENTER_X = (bordGauche + bulleurGauche) / 2 + 40; // Décalage de 20px vers la droite pour mieux couvrir la zone
  params.VORTEX1_WIDTH = (bulleurGauche - bordGauche) * 1.15;
  
  // Vortex 2 (droite): entre colonne de bulles droite et bord droit
  params.VORTEX2_CENTER_X = (bulleurDroit + bordDroit) / 2 - 40; // Décalage de 20px vers la gauche
  params.VORTEX2_WIDTH = (bordDroit - bulleurDroit) * 1.15;
  
  updateVortices();
}

function calculateShearStress(particle) {
  // Calcule le cisaillement total subi par une particule
  // Facteur multiplicatif : 1.0 = pas de cisaillement, > 1.0 = cisaillement augmenté
  
  let shearFactor = 1.0;
  
  // 1. Cisaillement inter-vortex (zone centrale)
  // Plus on est proche du centre (x = width/2), plus le cisaillement est fort
  let distToCenter = abs(particle.pos.x - width / 2);
  let centerZoneWidth = 100; // Zone de cisaillement maximal au centre
  if (distToCenter < centerZoneWidth) {
    let centerShear = map(distToCenter, 0, centerZoneWidth, params.SHEAR_CENTER_STRENGTH, 1.0);
    shearFactor *= centerShear;
  }
  
  // 2. Cisaillement aux bords des vortex
  // Vérifier la distance normalisée à chaque vortex
  for (let vortex of vortices) {
    let toCenter = p5.Vector.sub(particle.pos, vortex.center);
    let a = vortex.width / 2;
    let b = vortex.height / 2;
    let normalizedDist = (toCenter.x * toCenter.x) / (a * a) + (toCenter.y * toCenter.y) / (b * b);
    
    // Cisaillement maximal à la frontière du vortex (normalizedDist ≈ 0.8 à 1.2)
    if (normalizedDist > 0.7 && normalizedDist < 1.3) {
      let edgeProximity = 1.0 - abs(normalizedDist - 1.0); // 1.0 = exactement au bord
      let edgeShear = 1.0 + (params.SHEAR_EDGE_STRENGTH - 1.0) * edgeProximity;
      shearFactor *= edgeShear;
    }
  }
  
  return shearFactor;
}

function applyRotationForce(particle, vortex) {
  let toCenter = p5.Vector.sub(particle.pos, vortex.center);
  
  // Vérifier si la particule est dans la zone d'influence de l'ellipse
  // Distance normalisée : (dx/a)² + (dy/b)² <= 1
  let a = vortex.width / 2;
  let b = vortex.height / 2;
  let normalizedDist = (toCenter.x * toCenter.x) / (a * a) + (toCenter.y * toCenter.y) / (b * b);
  
  // N'appliquer la force que si on est dans l'ellipse
  if (normalizedDist > 1) {
    return;
  }
  
  let rotationForce;
  
  if (vortex.clockwise) {
    // Sens horaire
    rotationForce = createVector(toCenter.y, -toCenter.x);
  } else {
    // Sens anti-horaire
    rotationForce = createVector(-toCenter.y, toCenter.x);
  }
  
  rotationForce.normalize();
  
  // Moduler la force selon la position verticale
  // Plus fort en bas (toCenter.y > 0), plus faible en haut (toCenter.y < 0)
  let verticalFactor = map(toCenter.y, -b, b, params.VERTICAL_MODULATION_MIN, params.VERTICAL_MODULATION_MAX);
  verticalFactor = constrain(verticalFactor, params.VERTICAL_MODULATION_MIN, params.VERTICAL_MODULATION_MAX);
  
  rotationForce.mult(params.ROTATION_FORCE * verticalFactor);
  particle.vel.add(rotationForce);
}

function hasCollision(particle, metricTree) {
  // Vérifier si la particule a des voisins dans le rayon de collision
  let neighbors = metricTree.findNearestWithinRadius(particle, params.COLLISION_RADIUS);
  if (neighbors) {
    for (let other of neighbors) {
      if (other === particle) continue;
      if (other.deposited) continue;
      
      let distance = dist(particle.pos.x, particle.pos.y, other.pos.x, other.pos.y);
      if (distance < params.COLLISION_RADIUS) {
        return true;
      }
    }
  }
  return false;
}

function getCollidingParticle(particle, metricTree, particleArray) {
  // Retourner la première particule en collision avec la particule donnée
  let neighbors = metricTree.findNearestWithinRadius(particle, params.COLLISION_RADIUS);
  if (neighbors) {
    for (let other of neighbors) {
      if (other === particle) continue;
      if (other.deposited) continue;
      
      let distance = dist(particle.pos.x, particle.pos.y, other.pos.x, other.pos.y);
      if (distance < params.COLLISION_RADIUS) {
        return other;
      }
    }
  }
  return null;
}

function aggregateParticles(p1, p2) {
  // Fusionner deux particules en conservant volume, masse et quantité de mouvement
  // Volume (en 2D, on travaille avec des rayons, mais physiquement c'est des sphères 3D)
  // V = 4/3 * π * r³ donc r³ = r1³ + r2³
  let r1 = p1.size / 2;
  let r2 = p2.size / 2;
  let r_new = Math.pow(Math.pow(r1, 3) + Math.pow(r2, 3), 1/3);
  
  // Position : centre de masse pondéré par volume (∝ r³)
  let vol1 = Math.pow(r1, 3);
  let vol2 = Math.pow(r2, 3);
  let totalVol = vol1 + vol2;
  
  let newPos = createVector(
    (p1.pos.x * vol1 + p2.pos.x * vol2) / totalVol,
    (p1.pos.y * vol1 + p2.pos.y * vol2) / totalVol
  );
  
  // Vitesse : conservation de la quantité de mouvement (m*v)
  let newVel = createVector(
    (p1.vel.x * vol1 + p2.vel.x * vol2) / totalVol,
    (p1.vel.y * vol1 + p2.vel.y * vol2) / totalVol
  );
  
  return {
    pos: newPos,
    size: r_new * 2,
    vel: newVel,
    deposited: false,
    cooldown: params.COOLDOWN_FRAMES // Cooldown après agrégation
  };
}

function fragmentParticle(particle) {
  // Fragmenter une particule en plusieurs morceaux
  let numFragments = floor(random(params.FRAGMENTATION_NUM_MIN, params.FRAGMENTATION_NUM_MAX + 1));
  let fragments = [];
  
  let r_parent = particle.size / 2;
  let vol_parent = Math.pow(r_parent, 3);
  let r_min = params.PARTICLE_SIZE_MIN / 2;
  let vol_min = Math.pow(r_min, 3);
  
  // Vérifier que la particule peut être fragmentée en morceaux acceptables
  // Volume minimum total nécessaire pour créer numFragments particules viables
  let minTotalVolume = vol_min * numFragments;
  if (vol_parent < minTotalVolume) {
    // Pas assez de volume, ne pas fragmenter
    return [];
  }
  
  // Générer des volumes aléatoires qui somment au volume parent
  let volumes = [];
  let totalRandom = 0;
  for (let i = 0; i < numFragments; i++) {
    let randVol = random(0.1, 1);
    volumes.push(randVol);
    totalRandom += randVol;
  }
  
  // Normaliser pour conserver le volume total et vérifier les tailles
  for (let i = 0; i < numFragments; i++) {
    let vol_fragment = vol_parent * (volumes[i] / totalRandom);
    let r_fragment = Math.pow(vol_fragment, 1/3);
    let size_fragment = r_fragment * 2;
    
    // Ne créer le fragment que s'il est assez gros
    if (size_fragment < params.PARTICLE_SIZE_MIN) {
      continue; // Ignorer ce fragment trop petit
    }
    
    // Position : légèrement décalée autour du parent
    let angle = random(TWO_PI);
    let offset = random(r_parent * 0.5, r_parent * 1.5); // Plus d'écartement
    let fragPos = createVector(
      particle.pos.x + cos(angle) * offset,
      particle.pos.y + sin(angle) * offset
    );
    
    // Vitesse : hérite de la vitesse parent + composante aléatoire plus forte
    let fragVel = particle.vel.copy();
    fragVel.add(createVector(random(-1, 1), random(-1, 1))); // Plus de vitesse initiale
    
    fragments.push({
      pos: fragPos,
      size: size_fragment,
      vel: fragVel,
      deposited: false,
      cooldown: params.COOLDOWN_FRAMES // Cooldown après fragmentation
    });
  }
  
  return fragments;
}

function hasCollisionBruteForce(particle, allParticles) {
  for (let other of allParticles) {
    if (other === particle) continue;
    if (other.deposited) continue;
    
    let distance = dist(particle.pos.x, particle.pos.y, other.pos.x, other.pos.y);
    if (distance < params.COLLISION_RADIUS) {
      return true;
    }
  }
  return false;
}

function checkBoundaries(p) {
  let canDeposit = false;
  
  // Bord gauche oblique : de (0,0) à (SIDE_BOTTOM, height)
  let leftBoundary = params.SIDE_BOTTOM * p.pos.y / height;
  if (p.pos.x < leftBoundary) {
    p.pos.x = leftBoundary;
    canDeposit = true; // Peut adhérer sur le côté
  }
  
  // Bord droit oblique : de (width, 0) à (width - SIDE_BOTTOM, height)
  let rightBoundary = width - params.SIDE_BOTTOM * p.pos.y / height;
  if (p.pos.x > rightBoundary) {
    p.pos.x = rightBoundary;
    canDeposit = true; // Peut adhérer sur le côté
  }
  
  // Bord haut : rebond simple, pas de dépôt
  if (p.pos.y < 0) {
    p.pos.y = 0;
    p.vel.y = 0;
    // canDeposit reste false
  }
  
  // Bord bas : peut adhérer
  if (p.pos.y > height) {
    p.pos.y = height;
    canDeposit = true;
  }
  
  // Tester le dépôt uniquement sur les bords où c'est permis
  if (canDeposit && !p.deposited) {
    let speed = p.vel.mag();
    
    // Facteur de taille : petites particules adhèrent plus facilement
    // map(size, min, max, facteur_max, facteur_min)
    let sizeFactor = map(p.size, params.PARTICLE_SIZE_MIN, params.PARTICLE_SIZE_MAX, params.ADHESION_FACTOR_MAX, params.ADHESION_FACTOR_MIN);
    sizeFactor = constrain(sizeFactor, params.ADHESION_FACTOR_MIN, params.ADHESION_FACTOR_MAX);
    
    // Probabilité de dépôt diminue avec la vitesse, augmente pour petites particules
    let depositionProb = params.DEPOSITION_PROB * sizeFactor * (1 - min(speed / params.VELOCITY_THRESHOLD, 1));
    
    if (random() < depositionProb) {
      p.deposited = true;
      p.vel.set(0, 0);
    } else {
      // Rebond : inverser composante de vitesse normale
      p.vel.x = 0;
    }
  }
}

function draw() {
  background(230, 85, 84);
  
  // Mettre à jour les statistiques
  stats.activeParticles = particles.length;
  stats.capturedParticles = capturedParticles.length;
  stats.depositedParticles = depositedParticles.length;
  stats.totalParticles = particles.length + capturedParticles.length + depositedParticles.length;
  stats.bubbles = bubbles.length;
  
  // Calculer la distribution par classe de taille (particules déposées = résultat du traitement)
  stats.sizeClass1 = 0;
  stats.sizeClass2 = 0;
  stats.sizeClass3 = 0;
  stats.sizeClass4 = 0;
  
  for (let p of depositedParticles) {
    if (p.size < 3) stats.sizeClass1++;
    else if (p.size < 5) stats.sizeClass2++;
    else if (p.size < 7) stats.sizeClass3++;
    else stats.sizeClass4++;
  }
  
  // Dessiner les bords obliques
  stroke(0);
  strokeWeight(2);
  noFill();
  beginShape();
  vertex(0, 0);
  vertex(width, 0);
  vertex(width - params.SIDE_BOTTOM, height);
  vertex(params.SIDE_BOTTOM, height);
  endShape(CLOSE);
  
  // Dessiner les ellipses de rotation (visualisation)
  stroke(146, 0, 0);
  strokeWeight(1);
  noFill();
  for (let vortex of vortices) {
    ellipse(vortex.center.x, vortex.center.y, vortex.width, vortex.height);
  }
  
  // Dessiner les positions des bulleurs
  let bulleur1_x = width / 2 - params.BUBBLE_SPACING;
  let bulleur2_x = width / 2 + params.BUBBLE_SPACING;
  fill(100, 200, 255, 150);
  noStroke();
  ellipse(bulleur1_x, height - 5, 15, 15);
  ellipse(bulleur2_x, height - 5, 15, 15);

  // Mise à jour de la simulation uniquement si elle est en cours
  if (isRunning) {
    // Génération de bulles aux deux bulleurs
    let bulleur1_x = width / 2 - params.BUBBLE_SPACING;
    let bulleur2_x = width / 2 + params.BUBBLE_SPACING;
    
    // Bulleur 1
    if (random() < params.BUBBLE_GENERATION_PROB) {
      bubbles.push({
        pos: createVector(bulleur1_x + random(-5, 5), height),
        size: random(params.BUBBLE_SIZE_MIN, params.BUBBLE_SIZE_MAX),
        vel: createVector(random(-0.3, 0.3), 0) // Vitesse horizontale initiale aléatoire
      });
    }
    
    // Bulleur 2
    if (random() < params.BUBBLE_GENERATION_PROB) {
      bubbles.push({
        pos: createVector(bulleur2_x + random(-5, 5), height),
        size: random(params.BUBBLE_SIZE_MIN, params.BUBBLE_SIZE_MAX),
        vel: createVector(random(-0.3, 0.3), 0) // Vitesse horizontale initiale aléatoire
      });
    }
    
    // Mise à jour des bulles
    for (let i = bubbles.length - 1; i >= 0; i--) {
      let b = bubbles[i];
      
      // Force de flottabilité (remonte) - dépend de ROTATION_FORCE
      let buoyancy = -params.ROTATION_FORCE * params.BUBBLE_BUOYANCY_FACTOR * 5;
      b.vel.y += buoyancy;
      
      // Mouvement chaotique horizontal plus fort
      let noise = createVector(
        random(-params.NOISE_MAGNITUDE * 2.5, params.NOISE_MAGNITUDE * 2.5), 
        random(-params.NOISE_MAGNITUDE * 0.3, params.NOISE_MAGNITUDE * 0.3)
      );
      b.vel.add(noise);
      
      // Limiter la vitesse
      b.vel.limit(params.BUBBLE_VELOCITY_LIMIT);
      
      // Mise à jour position
      b.pos.add(b.vel);
      
      // Interception : chercher les particules à capturer
      for (let j = particles.length - 1; j >= 0; j--) {
        let p = particles[j];
        if (p.deposited) continue; // Ignorer les particules déjà déposées
        
        let distance = p5.Vector.dist(b.pos, p.pos);
        if (distance < b.size / 2) { // Utiliser le rayon de la bulle
          // Facteur de taille : petites particules sont plus facilement capturées
          let sizeFactor = map(p.size, params.PARTICLE_SIZE_MIN, params.PARTICLE_SIZE_MAX, params.ADHESION_FACTOR_MAX, params.ADHESION_FACTOR_MIN);
          sizeFactor = constrain(sizeFactor, params.ADHESION_FACTOR_MIN, params.ADHESION_FACTOR_MAX);
          
          // Probabilité de capture dépend de la taille
          let captureProb = params.CAPTURE_PROB * sizeFactor;
          
          if (random() < captureProb) {
            // Retirer de particles[] et ajouter à capturedParticles[]
            particles.splice(j, 1);
            p.capturingBubble = b; // Référence à la bulle
            capturedParticles.push(p);
          }
        }
      }
      
      // Supprimer si sort par le haut (et déposer les particules capturées)
      if (b.pos.y < -b.size) {
        // Déposer toutes les particules capturées par cette bulle
        for (let j = capturedParticles.length - 1; j >= 0; j--) {
          let p = capturedParticles[j];
          if (p.capturingBubble === b) {
            capturedParticles.splice(j, 1);
            p.deposited = true;
            p.capturingBubble = null;
            p.pos.y = 0; // Position en haut
            p.vel.set(0, 0);
            depositedParticles.push(p);
          }
        }
        bubbles.splice(i, 1);
      }
    }
    
    // Mise à jour des particules capturées : suivre leur bulle
    for (let p of capturedParticles) {
      if (p.capturingBubble) {
        p.pos.set(p.capturingBubble.pos.x, p.capturingBubble.pos.y);
        p.vel.set(0, 0);
      }
    }
    
    // Compter les particules actives (non déposées, non capturées)
    let activeParticles = particles.filter(p => !p.deposited).length;
    
    // Germination : créer de nouvelles particules pour maintenir le nombre entre min et max
    if (activeParticles < params.GERMINATION_PARTICLES_MIN) {
      // Si en dessous du minimum, forcer la germination
      particles.push({
        pos: createVector(random(params.SIDE_BOTTOM, width - params.SIDE_BOTTOM), random(0, height)),
        size: random(params.PARTICLE_SIZE_MIN, params.PARTICLE_SIZE_MAX),
        vel: createVector(0, 0),
        deposited: false,
        cooldown: 0
      });
    } else if (activeParticles < params.GERMINATION_PARTICLES_MAX) {
      // Si entre min et max, germination aléatoire
      if (random() < params.GERMINATION_PROB) {
        particles.push({
          pos: createVector(random(params.SIDE_BOTTOM, width - params.SIDE_BOTTOM), random(0, height)),
          size: random(params.PARTICLE_SIZE_MIN, params.PARTICLE_SIZE_MAX),
          vel: createVector(0, 0),
          deposited: false,
          cooldown: 0
        });
      }
    }
    // Si activeParticles >= MAX, pas de germination
    
    // Construire le MetricTree pour la détection de collisions
    let mt = new MetricTree(particles.length, particles);
    for (let i = 0; i < particles.length; i++) {
      console.log("Inserting particle " + i);
      mt.insert(i, width/2);
    }

    // Mise à jour physique de toutes les particules
    for (let p of particles) {
      // Décrémenter le cooldown
      if (p.cooldown > 0) {
        p.cooldown--;
      }
      
      if (!p.deposited) {
        // Appliquer une force de gravité vers le bas dépendant de la taille
        // Grosse particule (size = 4) tombe plus vite que petite (size = 1)
        let sizeFactor = Math.pow(p.size / params.PARTICLE_SIZE_MIN, params.GRAVITY_SIZE_FACTOR);
        let gravity = createVector(0, params.GRAVITY * sizeFactor);
        p.vel.add(gravity);
        
        // Appliquer les forces de rotation de chaque ellipse
        for (let vortex of vortices) {
          applyRotationForce(p, vortex);
        }
        
        // Mettre à jour la position
        p.pos.add(p.vel);
        
        // Ajouter du bruit aléatoire pour simuler des mouvements plus naturels
        let noiseForce = createVector(random(-params.NOISE_MAGNITUDE, params.NOISE_MAGNITUDE), random(-params.NOISE_MAGNITUDE, params.NOISE_MAGNITUDE));
        p.vel.add(noiseForce);
        
        // Limiter la vitesse maximum dépendant de la taille
        // Grosse particule peut aller plus vite (vitesse terminale plus élevée)
        let velocityLimit = params.PARTICLE_VELOCITY_LIMIT * sizeFactor;
        p.vel.limit(velocityLimit);
        
        // Vérifier les limites du canvas
        checkBoundaries(p);
      }
    }
    
    // Agrégation : détecter et fusionner les particules en collision
    let aggregations = [];
    let particlesToRemove = new Set();
    
    for (let i = 0; i < particles.length; i++) {
      let p1 = particles[i];
      if (particlesToRemove.has(i)) continue;
      if (p1.cooldown > 0) continue; // Ignorer si en cooldown
      if (p1.deposited) continue; // Ignorer si déposée
      
      let p2 = getCollidingParticle(p1, mt, particles);
      if (p2) {
        let j = particles.indexOf(p2);
        if (j !== -1 && !particlesToRemove.has(j) && p2.cooldown === 0 && !p2.deposited) { // Vérifier cooldown de p2 aussi
          // Calculer la vitesse relative
          let relativeVel = p5.Vector.sub(p1.vel, p2.vel).mag();
          let velocityReduction = Math.max(0, 1 - relativeVel * params.AGGREGATION_VELOCITY_FACTOR / 10);
          
          // Test probabiliste d'agrégation
          let aggregationProb = params.AGGREGATION_PROB * velocityReduction;
          
          if (random() < aggregationProb && p1.size + p2.size <= params.AGGREGATION_MAX_SIZE) {
            let newParticle = aggregateParticles(p1, p2);
            aggregations.push(newParticle);
            particlesToRemove.add(i);
            particlesToRemove.add(j);
          }
        }
      }
    }
    
    // Supprimer les particules agrégées (en ordre inverse pour préserver les indices)
    let indicesToRemove = Array.from(particlesToRemove).sort((a, b) => b - a);
    for (let idx of indicesToRemove) {
      particles.splice(idx, 1);
    }
    
    // Ajouter les nouvelles particules agrégées
    particles.push(...aggregations);
    
    // Fragmentation : tester chaque particule pour une fragmentation potentielle
    let fragmentations = [];
    let particlesToFragment = [];
    
    for (let i = 0; i < particles.length; i++) {
      let p = particles[i];
      
      // Ne fragmenter que si la particule est assez grosse et pas en cooldown
      if (p.size < params.FRAGMENTATION_SIZE_MIN || p.cooldown > 0) continue;
      if (p.deposited) continue; // Ignorer si déposée
      
      // Facteurs augmentant la probabilité de fragmentation
      let sizeFactor = map(p.size, params.FRAGMENTATION_SIZE_MIN, params.AGGREGATION_MAX_SIZE, 1, 3);
      sizeFactor = constrain(sizeFactor, 1, 3);
      
      let speed = p.vel.mag();
      let velocityFactor = 1 + max(0, (speed - params.FRAGMENTATION_VELOCITY_THRESHOLD) / params.FRAGMENTATION_VELOCITY_THRESHOLD);
      
      // Facteur de cisaillement (augmente la fragmentation dans les zones de fort gradient de vitesse)
      let shearFactor = calculateShearStress(p);
      
      let fragmentationProb = params.FRAGMENTATION_PROB * sizeFactor * velocityFactor * shearFactor;
      
      if (random() < fragmentationProb) {
        let fragments = fragmentParticle(p);
        fragmentations.push(...fragments);
        particlesToFragment.push(i);
      }
    }
    
    // Supprimer les particules fragmentées (en ordre inverse)
    particlesToFragment.sort((a, b) => b - a);
    for (let idx of particlesToFragment) {
      particles.splice(idx, 1);
    }
    
    // Ajouter les nouveaux fragments
    particles.push(...fragmentations);
    
    // Transférer les particules déposées (après toutes les mises à jour)
    let hasTransfers = false;
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].deposited) {
        depositedParticles.push(particles[i]);
        particles.splice(i, 1);
        hasTransfers = true;
      }
    }
    
    // Reconstruire le MetricTree si des particules ont été transférées, agrégées ou fragmentées
    if ((hasTransfers || aggregations.length > 0 || fragmentations.length > 0) && particles.length > 0) {
      mt = new MetricTree(particles.length, particles);
      for (let i = 0; i < particles.length; i++) {
        mt.insert(i, width/2);
      }
    }
    
    // Affichage des particules actives
    for (let p of particles) {
      fill(0); // Noir pour particules actives
      noStroke();
      ellipse(p.pos.x, p.pos.y, p.size);
    }
    
    // Afficher les particules capturées
    for (let p of capturedParticles) {
      fill(0); // Noir pour particules capturées
      noStroke();
      ellipse(p.pos.x, p.pos.y, p.size);
    }
    
    // Afficher les particules déposées si l'option est activée
    if (params.SHOW_DEPOSITED) {
      for (let p of depositedParticles) {
        fill(0); // Noir pour particules déposées
        noStroke();
        ellipse(p.pos.x, p.pos.y, p.size);
      }
    }
    
    // Afficher les bulles
    for (let b of bubbles) {
      fill(255, 255, 255, 200); // Blanc semi-transparent
      stroke(200, 200, 255);
      strokeWeight(1);
      ellipse(b.pos.x, b.pos.y, b.size);
    }
  } else {
    // Afficher les particules même quand la simulation est en pause
    for (let p of particles) {
      fill(0);
      noStroke();
      ellipse(p.pos.x, p.pos.y, p.size);
    }
    
    // Afficher les particules capturées
    for (let p of capturedParticles) {
      fill(0); // Noir pour particules capturées
      noStroke();
      ellipse(p.pos.x, p.pos.y, p.size);
    }
    
    // Afficher les particules déposées si l'option est activée
    if (params.SHOW_DEPOSITED) {
      for (let p of depositedParticles) {
        fill(0);
        noStroke();
        ellipse(p.pos.x, p.pos.y, p.size);
      }
    }
    
    // Afficher les bulles même en pause
    for (let b of bubbles) {
      fill(255, 255, 255, 200);
      stroke(200, 200, 255);
      strokeWeight(1);
      ellipse(b.pos.x, b.pos.y, b.size);
    }
  }
}
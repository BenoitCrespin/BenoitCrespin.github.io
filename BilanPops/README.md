# Simulation de Bilan de Populations de Particules

Simulation interactive d'un système de flottation avec particules, bulles et vortex, implémentant un **bilan de population complet** pour modéliser les dynamiques particulaires dans un fluide.

## 🎮 Utilisation de l'interface

### Démarrage
1. Ouvrir `simuSimple/index.html` dans un navigateur
2. Cliquer sur **▶️ Démarrer** pour lancer la simulation
3. Utiliser **⏸️ Pause** pour arrêter temporairement
4. Cliquer sur **🔄 Réinitialiser** pour recommencer avec les paramètres actuels

### Interface graphique (lil-gui)

L'interface est organisée en **11 dossiers thématiques** :

#### 📊 **Statistiques** (lecture seule)
- Nombre de particules actives, capturées, déposées
- Distribution par classe de taille : **1-3 px**, **3-5 px**, **5-7 px**, **7+ px**

#### ⚙️ **Physique**
- `Gravité` : force de chute verticale
- `Exposant taille/gravité` : influence de la taille sur la gravité (0 = indépendant, 1 = linéaire)
- `V. max particules` : vitesse terminale des sédiments
- `V. max bulles` : vitesse maximale des bulles
- `Bruit` : fluctuations aléatoires du mouvement

#### 🌀 **Rotation** (vortex)
- `Force rotation` : intensité de la force tangentielle
- `Modulation min/max verticale` : variation de la force selon la hauteur dans le vortex

#### 🔧 **Géométrie**
- `Largeur bords` : largeur des parois obliques
- `Seuil vitesse dépôt` : vitesse minimale pour adhésion aux parois

#### 🔵 **Particules**
- `Taille min/max` : plage de tailles générées (1-9 px)
- `Rayon collision` : distance de détection pour l'agrégation
- Contrôle de l'affichage des particules déposées

#### 🌱 **Germination**
- `Probabilité` : taux d'apparition de nouvelles particules
- `Nb min/max` : limites de population active (200-800)

#### 🔗 **Agrégation**
- `Probabilité` : chance de fusion lors d'une collision
- `Taille max agrégats` : limite de croissance
- `Facteur vitesse` : réduction selon vitesse relative

#### 💥 **Fragmentation**
- `Probabilité` : taux de base de cassure
- `Taille min` : seuil de taille pour fragmenter
- `Nb fragments min/max` : nombre de morceaux générés
- `Seuil vitesse` : vitesse augmentant la fragmentation
- `Cooldown` : délai avant nouvelle réaction (évite re-agrégation immédiate)

#### ⚡ **Cisaillement**
- `Force centre` : intensité du cisaillement entre les deux vortex (zone de collision)
- `Force bords` : intensité du cisaillement aux frontières des vortex

#### 🫧 **Bulles**
- `Probabilité` : taux de génération par bulleur
- `Taille min/max` : plage de tailles des bulles
- `Facteur flottabilité` : force de remontée
- `Espacement bulleurs` : distance entre les deux colonnes de bulles

#### 🎯 **Interception**
- `Probabilité capture` : chance qu'une bulle capture une particule
- Influence de la taille : petites particules capturées plus facilement

#### 🎨 **Affichage**
- Couleurs des particules, bulles, vortex et bulles capturées

---

## 📐 Correspondance Équation ↔ Code

### Équation du bilan de population

$$
\frac{\partial n(V,t)}{\partial t} = S_{\text{germination}} + S_{\text{agrégation}} + S_{\text{fragmentation}} - S_{\text{dépôt}} - S_{\text{interception}}
$$

où **n(V,t)** = distribution en taille (nombre de particules de volume V à l'instant t)

---

## 🔍 Implémentation des termes

### ➕ **S_germination** : Terme source

**Équation théorique :**
```
S_germination = γ_germ × H(n_min - n_active) × H(n_active - n_max)
```
où H est la fonction de Heaviside (0 ou 1)

**Code (index.js, lignes ~690-710) :**
```javascript
// Germination conditionnelle
if (params.GERMINATION_PROB > 0 && 
    particles.length >= params.GERMINATION_PARTICLES_MIN && 
    particles.length < params.GERMINATION_PARTICLES_MAX) {
  if (random() < params.GERMINATION_PROB) {
    particles.push({
      pos: createVector(random(params.SIDE_BOTTOM, width - params.SIDE_BOTTOM), 
                        random(0, height)),
      size: random(params.PARTICLE_SIZE_MIN, params.PARTICLE_SIZE_MAX),
      vel: createVector(0, 0),
      deposited: false,
      cooldown: 0
    });
  }
}
```

**Paramètres :**
- `GERMINATION_PROB` : γ_germ (probabilité par frame)
- `GERMINATION_PARTICLES_MIN/MAX` : n_min, n_max (bornes de population)

---

### 🔗 **S_agrégation** : Coalescence

**Équation théorique :**
```
∂n(V)/∂t |_agg = ½ ∫∫ β(V',V'') n(V') n(V'') δ(V - V' - V'') dV' dV''
                  - n(V) ∫ β(V,V') n(V') dV'
```
où :
- β(V,V') = noyau d'agrégation (taux de collision)
- 1er terme : **naissance** (deux particules fusionnent pour créer V)
- 2ème terme : **mort** (V fusionne avec une autre)

**Code (index.js, lignes ~725-745) :**
```javascript
// Détection de collision avec MetricTree
let collidingParticle = getCollidingParticle(p, particleMetricTree, particles);

if (collidingParticle && p.cooldown === 0 && collidingParticle.cooldown === 0) {
  let relativeVel = p5.Vector.sub(p.vel, collidingParticle.vel).mag();
  let velocityPenalty = map(relativeVel, 0, 5, 1.0, params.AGGREGATION_VELOCITY_FACTOR);
  
  let aggregationProb = params.AGGREGATION_PROB * velocityPenalty;
  
  if (random() < aggregationProb) {
    aggregateParticles(p, collidingParticle);
  }
}
```

**Fonction aggregateParticles() (lignes ~345-375) :**
```javascript
function aggregateParticles(p1, p2) {
  // Conservation du volume : V_new = V1 + V2
  let vol1 = (p1.size / 2) ** 3;
  let vol2 = (p2.size / 2) ** 3;
  let newVol = vol1 + vol2;
  let newRadius = Math.pow(newVol, 1/3);
  let newSize = newRadius * 2;
  
  // Conservation de la quantité de mouvement
  let totalMass = vol1 + vol2;
  let newVel = p5.Vector.mult(p1.vel, vol1 / totalMass)
                 .add(p5.Vector.mult(p2.vel, vol2 / totalMass));
  
  p1.size = constrain(newSize, params.PARTICLE_SIZE_MIN, params.AGGREGATION_MAX_SIZE);
  p1.vel = newVel;
  p1.cooldown = params.COOLDOWN_FRAMES; // Empêche réaction immédiate
  p2.deposited = true; // Marquer pour suppression
}
```

**Paramètres :**
- `AGGREGATION_PROB` : probabilité de base β₀
- `COLLISION_RADIUS` : distance de détection (rayon d'interaction)
- `AGGREGATION_VELOCITY_FACTOR` : réduction si vitesse relative élevée
- `COOLDOWN_FRAMES` : délai avant nouvelle réaction

**Conservation :**
- **Volume** : r³_new = r³₁ + r³₂
- **Quantité de mouvement** : m₁v₁ + m₂v₂ = m_new v_new

---

### 💥 **S_fragmentation** : Cassure

**Équation théorique :**
```
∂n(V)/∂t |_frag = ∫_V^∞ Γ(V|V') g(V') n(V') dV' - g(V) n(V)
```
où :
- g(V) = taux de fragmentation (dépend de V, vitesse, cisaillement)
- Γ(V|V') = distribution des fragments (conservation de masse)
- 1er terme : **naissance** (gros fragments se cassent en V)
- 2ème terme : **mort** (V se fragmente)

**Code (index.js, lignes ~780-810) :**
```javascript
// Test de fragmentation stochastique
for (let p of particles) {
  if (p.size < params.FRAGMENTATION_SIZE_MIN || p.cooldown > 0) continue;
  
  // Facteurs augmentant la probabilité
  let sizeFactor = map(p.size, params.FRAGMENTATION_SIZE_MIN, 
                       params.AGGREGATION_MAX_SIZE, 1, 3);
  let speed = p.vel.mag();
  let velocityFactor = 1 + max(0, (speed - params.FRAGMENTATION_VELOCITY_THRESHOLD) / 
                                    params.FRAGMENTATION_VELOCITY_THRESHOLD);
  let shearFactor = calculateShearStress(p); // Cisaillement local
  
  let fragmentationProb = params.FRAGMENTATION_PROB * sizeFactor * 
                          velocityFactor * shearFactor;
  
  if (random() < fragmentationProb) {
    let fragments = fragmentParticle(p);
    // Ajouter fragments, supprimer parent
  }
}
```

**Fonction fragmentParticle() (lignes ~385-450) :**
```javascript
function fragmentParticle(particle) {
  let numFragments = floor(random(params.FRAGMENTATION_NUM_MIN, 
                                  params.FRAGMENTATION_NUM_MAX + 1));
  let vol_parent = (particle.size / 2) ** 3;
  
  // Générer volumes aléatoires qui somment à vol_parent
  let volumes = [];
  for (let i = 0; i < numFragments; i++) {
    volumes.push(random(0.1, 1));
  }
  let totalRandom = sum(volumes);
  
  // Créer fragments avec conservation du volume
  let fragments = [];
  for (let vol_norm of volumes) {
    let vol_frag = vol_parent * (vol_norm / totalRandom);
    let size_frag = 2 * Math.pow(vol_frag, 1/3);
    
    if (size_frag >= params.PARTICLE_SIZE_MIN) {
      fragments.push({
        pos: particle.pos + randomOffset,
        size: size_frag,
        vel: particle.vel + randomVel,
        cooldown: params.COOLDOWN_FRAMES
      });
    }
  }
  return fragments;
}
```

**Paramètres :**
- `FRAGMENTATION_PROB` : taux de base g₀
- `FRAGMENTATION_SIZE_MIN` : seuil de taille minimale
- `FRAGMENTATION_VELOCITY_THRESHOLD` : vitesse critique
- `SHEAR_CENTER_STRENGTH` / `SHEAR_EDGE_STRENGTH` : facteurs de cisaillement

**Facteur de cisaillement** (lignes ~280-315) :
```javascript
function calculateShearStress(particle) {
  let shearFactor = 1.0;
  
  // 1. Cisaillement inter-vortex (centre x ≈ width/2)
  let distToCenter = abs(particle.pos.x - width / 2);
  if (distToCenter < 100) {
    shearFactor *= map(distToCenter, 0, 100, 
                       params.SHEAR_CENTER_STRENGTH, 1.0);
  }
  
  // 2. Cisaillement aux bords des vortex
  for (let vortex of vortices) {
    let normalizedDist = ellipseDistance(particle.pos, vortex);
    if (normalizedDist ≈ 1.0) { // Proche de la frontière
      shearFactor *= params.SHEAR_EDGE_STRENGTH;
    }
  }
  
  return shearFactor;
}
```

---

### ➖ **S_dépôt** : Adhésion aux parois

**Équation théorique :**
```
S_dépôt = -k_dep(V) n(V) × δ_paroi
```
où k_dep(V) est le taux d'adhésion dépendant de la taille

**Code (index.js, lignes ~480-520) :**
```javascript
function checkBoundaries(p) {
  let canDeposit = false;
  
  // Parois obliques
  if (p.pos.x < leftBoundary || p.pos.x > rightBoundary) {
    canDeposit = true;
  }
  
  // Plancher
  if (p.pos.y > height - 5) {
    canDeposit = true;
  }
  
  if (canDeposit && p.vel.mag() < params.VELOCITY_THRESHOLD) {
    // Dépôt dépendant de la taille
    let sizeFactor = map(p.size, params.PARTICLE_SIZE_MIN, 
                         params.PARTICLE_SIZE_MAX,
                         params.ADHESION_FACTOR_MIN, 
                         params.ADHESION_FACTOR_MAX);
    let depositionProb = params.DEPOSITION_PROB * sizeFactor;
    
    if (random() < depositionProb) {
      p.deposited = true; // Transféré vers depositedParticles[]
    }
  }
}
```

**Paramètres :**
- `DEPOSITION_PROB` : probabilité de base k₀
- `VELOCITY_THRESHOLD` : vitesse maximale pour adhérer
- `ADHESION_FACTOR_MIN/MAX` : modulation selon taille (grosses particules adhèrent mieux)

**Transfert :**
```javascript
// Après mise à jour (lignes ~810-820)
for (let i = particles.length - 1; i >= 0; i--) {
  if (particles[i].deposited) {
    depositedParticles.push(particles.splice(i, 1)[0]);
  }
}
```

---

### 🎯 **S_interception** : Capture par bulles

**Équation théorique :**
```
S_interception = -k_cap(V, R_bulle) n(V) n_bulles
```
où k_cap dépend de la taille de la particule et du rayon de la bulle

**Code (index.js, lignes ~655-685) :**
```javascript
// Pour chaque bulle
for (let b of bubbles) {
  // Trouver particules dans le rayon de la bulle
  let nearbyParticles = particleMetricTree.findNearestWithinRadius(b, b.size);
  
  for (let p of nearbyParticles) {
    let d = dist(p.pos.x, p.pos.y, b.pos.x, b.pos.y);
    
    if (d < b.size / 2) {
      // Probabilité de capture dépendant de la taille
      let sizeFactor = map(p.size, params.PARTICLE_SIZE_MIN, 
                           params.PARTICLE_SIZE_MAX, 1.2, 0.6);
      let captureProb = params.CAPTURE_PROB * sizeFactor;
      
      if (random() < captureProb) {
        // Transférer vers capturedParticles[]
        capturedParticles.push({
          ...p,
          capturingBubble: b
        });
        p.toRemove = true;
      }
    }
  }
}

// Mise à jour position des particules capturées
for (let cp of capturedParticles) {
  cp.pos = cp.capturingBubble.pos.copy(); // Suit la bulle
}
```

**Paramètres :**
- `CAPTURE_PROB` : probabilité de base k_cap
- Facteur de taille : **petites particules capturées plus facilement** (sizeFactor inversé)

**Sortie du système :**
```javascript
// Bulles sortent en haut (lignes ~640)
bubbles = bubbles.filter(b => b.pos.y > -b.size);
// Particules capturées suivent les bulles et sortent avec elles
```

---

## 🌊 Phénomènes physiques additionnels

### Vortex elliptiques

**Code (lignes ~320-355) :**
```javascript
function applyRotationForce(particle, vortex) {
  let toCenter = p5.Vector.sub(particle.pos, vortex.center);
  let normalizedDist = (toCenter.x² / a²) + (toCenter.y² / b²);
  
  if (normalizedDist <= 1) { // Dans l'ellipse
    let rotationForce = vortex.clockwise ? 
      createVector(toCenter.y, -toCenter.x) : 
      createVector(-toCenter.y, toCenter.x);
    
    // Modulation verticale
    let verticalFactor = map(toCenter.y, -b, b, 
                             params.VERTICAL_MODULATION_MIN, 
                             params.VERTICAL_MODULATION_MAX);
    
    rotationForce.mult(params.ROTATION_FORCE * verticalFactor);
    particle.vel.add(rotationForce);
  }
}
```

**Synchronisation avec bulles :**
```javascript
// Vortex gauche : entre bord et bulleur gauche (sens trigo)
// Vortex droite : entre bulleur droit et bord (sens horaire)
function syncVortexToBubbles() {
  let bulleurGauche = width/2 - params.BUBBLE_SPACING;
  let bulleurDroit = width/2 + params.BUBBLE_SPACING;
  
  params.VORTEX1_CENTER_X = (bordGauche + bulleurGauche) / 2;
  params.VORTEX1_WIDTH = (bulleurGauche - bordGauche) * 1.15;
  
  params.VORTEX2_CENTER_X = (bulleurDroit + bordDroit) / 2;
  params.VORTEX2_WIDTH = (bordDroit - bulleurDroit) * 1.15;
}
```

### Gravité dépendante de la taille

```javascript
// Loi de Stokes simplifiée (lignes ~740)
let sizeFactor = pow(p.size / params.PARTICLE_SIZE_MIN, 
                     params.GRAVITY_SIZE_FACTOR);
let gravity = createVector(0, params.GRAVITY * sizeFactor);
p.vel.add(gravity);
```

### Indexation spatiale (MetricTreeArray)

Pour efficacité O(log n) au lieu de O(n²) :
```javascript
// Reconstruction après modifications (lignes ~825)
particleMetricTree = new MetricTreeArray(particles, 
                                         (a, b) => dist(a.pos.x, a.pos.y, 
                                                       b.pos.x, b.pos.y));

// Recherche rapide de voisins
let neighbors = particleMetricTree.findNearestWithinRadius(p, radius);
```

---

## 📊 Statistiques et distribution n(V)

**Calcul de la distribution par classes** (lignes ~555-575) :
```javascript
stats.sizeClass1 = 0; // 1-3 px
stats.sizeClass2 = 0; // 3-5 px
stats.sizeClass3 = 0; // 5-7 px
stats.sizeClass4 = 0; // 7+ px

for (let p of depositedParticles) {
  if (p.size < 3) stats.sizeClass1++;
  else if (p.size < 5) stats.sizeClass2++;
  else if (p.size < 7) stats.sizeClass3++;
  else stats.sizeClass4++;
}
```

**Interprétation :** La distribution des **particules déposées** représente le résultat du traitement de flottation. L'efficacité du système peut être évaluée en comparant les distributions de tailles à l'entrée (germination) et à la sortie (dépôt).

---

## 🔧 Architecture du code

### Structure des données

```javascript
// Particule active
{
  pos: p5.Vector,      // Position (x, y)
  vel: p5.Vector,      // Vitesse (vx, vy)
  size: Number,        // Diamètre en pixels
  deposited: Boolean,  // Flag pour transfert
  cooldown: Number     // Frames avant réaction
}

// Bulle
{
  pos: p5.Vector,
  vel: p5.Vector,
  size: Number
}

// Vortex
{
  center: p5.Vector,
  width: Number,
  height: Number,
  clockwise: Boolean
}
```

### Boucle principale (draw)

1. **Statistiques** : comptage et distribution
2. **Rendu** : parois, vortex, particules, bulles
3. **Physique** (si isRunning) :
   - Génération bulles
   - Mise à jour bulles + interception
   - Mise à jour particules (gravité, vortex, bruit)
   - Germination
   - Agrégation (avec MetricTree)
   - Fragmentation
   - Transfert particules déposées
   - Reconstruction MetricTree

---


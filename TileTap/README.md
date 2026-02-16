# TileTap 🎮

## Description
TileTap est un jeu d'arcade rapide développé avec p5.js où le joueur doit cliquer sur des tuiles vertes tout en évitant les tuiles rouges dans un temps limité.

## 🎯 Objectif
Atteindre **10 points** en moins de **20 secondes** pour gagner un code promo !

## 🎮 Règles du jeu
- 🟢 **Tuiles vertes** : +1 point
- 🔴 **Tuiles rouges** : -1 point
- ⏱️ **Timer** : 20 secondes pour atteindre l'objectif
- 🏆 **Victoire** : Atteindre 10 points → Code promo **RBF-9815**
- ❌ **Défaite** : Timer à 0 sans avoir atteint 10 points

## 📱 Responsive Design
Le jeu s'adapte automatiquement à la taille de l'écran :
- **Desktop** : Canvas de 560x560 pixels
- **Mobile** : Canvas de 352x469 pixels (seuil à 768px de largeur)

---

## 🗂️ Structure du projet

```
TileTap/
├── index.html      # Structure HTML de la page
├── styles.css      # Styles et mise en page responsive
├── index.js        # Logique du jeu en p5.js
└── README.md       # Documentation (ce fichier)
```

---

## 🔧 Structure du code (index.js)

### Variables globales

#### Constantes de configuration
```javascript
const speed = 5;                    // Vitesse de descente des tuiles
const probaNouvelleTuile = 0.04;   // Probabilité d'apparition (4% par frame)
const maxScore = 10;                // Score requis pour gagner
const maxTime = 20;                 // Durée du jeu en secondes
```

#### Variables d'état du jeu
```javascript
let tiles = [];           // Tableau contenant toutes les tuiles actives
let scorePopups = [];     // Animations de score (+1/-1)
let score = 0;            // Score actuel du joueur
let timer = maxTime;      // Temps restant
let gameWon = false;      // État de victoire
let gameLost = false;     // État de défaite
```

#### Variables de canvas
```javascript
let canvasWidth, canvasHeight;  // Dimensions du canvas
let tileWidth, tileHeight;      // Dimensions des tuiles
```

---

## 🎨 Fonctions principales

### `setup()`
**Rôle** : Initialisation du jeu (appelée une seule fois au démarrage)

**Actions** :
1. Détermine la taille du canvas selon l'appareil (mobile/desktop)
2. Calcule les dimensions des tuiles
3. Crée et attache le canvas au conteneur HTML
4. Initialise le chronomètre

### `draw()`
**Rôle** : Boucle principale du jeu (exécutée ~60 fois par seconde)

**Flux d'exécution** :
1. Affiche le fond
2. **Écrans de fin** : Si victoire ou défaite → affiche l'écran correspondant
3. **Génération** : Ajoute aléatoirement des tuiles (gauche/centre/droite)
4. **Mise à jour** : Déplace les tuiles vers le bas
5. **Détection de clic** : Vérifie si une tuile est cliquée
6. **Animation** : Affiche les popups de score (+1/-1)
7. **Interface** : Affiche le score et le timer
8. **Conditions de fin** : Vérifie victoire ou défaite

### `addTile(position)`
**Rôle** : Créer une nouvelle tuile

**Paramètres** :
- `position` : "left", "center" ou "right"

**Logique** :
- Vérifie qu'aucune tuile n'existe déjà à cette position (évite les collisions)
- Crée un objet tuile avec :
  - Position x/y
  - Couleur aléatoire (50% rouge, 50% verte)
  - Timer d'animation pour l'effet de pulsation

### `mousePressed()`
**Rôle** : Gérer le clic de souris

**Action** :
- Si `gameWon` ou `gameLost` est vrai → redémarre le jeu

---

## 🎯 Mécaniques détaillées

### 1. Système de tuiles

Chaque tuile est un objet contenant :
```javascript
{
  x: number,           // Position horizontale
  y: number,           // Position verticale
  color: p5.Color,     // Couleur (rouge ou verte)
  myTime: number       // Temps pour animation de croissance
}
```

**Animation** : Les tuiles oscillent légèrement grâce à `cos(myTime)` pour un effet visuel dynamique.

### 2. Détection de collision

La détection se fait via les coordonnées de la souris :
```javascript
mouseIsPressed && 
mouseY > tile.y && 
mouseY < tile.y + currentTileHeight && 
mouseX > tile.x - currentTileWidth / 2 && 
mouseX < tile.x + currentTileWidth / 2
```

### 3. Système de popups

Quand une tuile est cliquée, une popup est créée :
```javascript
{
  x, y: number,        // Position de départ
  value: number,       // +1 ou -1
  color: p5.Color,     // Vert ou rouge
  opacity: number,     // Transparence (255 → 0)
  life: number         // Durée de vie (0 → 30 frames)
}
```

**Animation** :
- Remonte de 2 pixels par frame
- L'opacité diminue progressivement
- Disparaît après 30 frames (~0.5 seconde)

### 4. Gestion du temps

Le timer est calculé en temps réel :
```javascript
timer = max(0, maxTime - floor((millis() - startTime) / 1000));
```
- `millis()` : temps écoulé depuis le début du sketch
- `startTime` : moment du début de la partie
- Résultat : compte à rebours de 20 à 0 secondes

### 5. Conditions de victoire/défaite

**Victoire** : Vérifiée après chaque clic de tuile verte
```javascript
if (score >= maxScore && !gameWon) {
  gameWon = true;
  // Vide l'écran et affiche le code promo
}
```

**Défaite** : Vérifiée à chaque frame
```javascript
if (timer === 0 && !gameWon && score < maxScore) {
  gameLost = true;
  // Vide l'écran et affiche le message d'échec
}
```

---

## 🎨 Styles CSS

### Mise en page
- **Centrage** : Utilise Flexbox pour centrer le canvas verticalement et horizontalement
- **Fond** : Gris clair (`#f0f0f0`) pour contraster avec le canvas
- **Canvas** : Ombre portée et coins arrondis pour un effet moderne

### Responsive
Le CSS reste simple, la responsivité étant principalement gérée par JavaScript qui adapte la taille du canvas.

---

## 🚀 Lancement du jeu

1. Ouvrir `index.html` dans un navigateur web
2. Le jeu démarre automatiquement
3. Cliquer sur les tuiles vertes, éviter les rouges
4. Atteindre 10 points avant la fin du timer !

---

## 📚 Technologies utilisées

- **p5.js** : Framework de création graphique et interactive
- **HTML5** : Structure de la page
- **CSS3** : Styles et mise en page responsive
- **JavaScript (ES6+)** : Logique du jeu

---

## 🎓 Concepts de programmation illustrés

1. **Boucle de jeu** : `draw()` exécutée en continu
2. **Gestion d'événements** : `mousePressed()` pour les interactions
3. **Tableaux dynamiques** : Ajout/suppression de tuiles et popups
4. **Détection de collision** : Calculs de zones rectangulaires
5. **Animation** : Interpolation d'opacité et mouvement
6. **Machine à états** : Gestion des écrans (jeu/victoire/défaite)
7. **Responsive design** : Adaptation aux différentes tailles d'écran




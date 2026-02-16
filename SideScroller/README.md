# Side Scroller Game - p5play

## 📖 Description

Jeu de plateforme side-scroller développé avec **p5play** (bibliothèque basée sur p5.js). Le joueur contrôle un personnage nuage qui doit collecter des pièces d'or tout en évitant des rochers dans un environnement défilant automatiquement.

## 🎯 Objectif du jeu

**Collecter 5 pièces d'or** pour remporter la partie et débloquer un code promo !

## 🎮 Contrôles

- **Clic de souris** : Faire sauter le personnage
- **Clic après victoire** : Rejouer une partie

## 🎲 Éléments du jeu

### Personnage
- **Sprite animé** : Nuage avec animation de respiration (9 frames)
- **Physique dynamique** : Soumis à la gravité et aux collisions
- **Position** : Fixe horizontalement (x=200), se déplace uniquement verticalement
- **Effet visuel** : Ombre au sol qui s'adapte à la hauteur du personnage

### Objets collectables et obstacles

#### 🪙 Pièces d'or (Gold)
- Incrémentent le compteur de +1 à chaque collecte
- Animation de collecte avec effet de montée, zigzag et disparition progressive
- Apparition aléatoire (contrôlée par la fréquence `appGoldRock`)

#### 🪨 Rochers (Rock)
- **Pénalité** : Remettent le compteur à 0
- Déclenchent un effet de clignotement du personnage (30 frames)
- Apparition aléatoire

### Environnement

#### Sol
- Zone verte décorative de hauteur 300px
- Collider invisible pour arrêter les sauts du personnage

#### Décors en mouvement
- **Buissons** : 4 variantes différentes avec taille et position aléatoires
  - Générés aléatoirement sur le côté droit
  - Se déplacent à une vitesse de 4 pixels/frame
  - Superposition gérée par tri en profondeur (basé sur Y)
  
- **Montagne** : Élément d'arrière-plan
  - Chargée dans `preload()` et initialisée au premier frame
  - Redimensionnée selon `mountainScale` (défaut: 50% de la taille originale)
  - Positionnée avec `mountainAjustY` pour un alignement précis avec le sol
  - Effet de parallaxe (vitesse réduite de 50% par rapport aux buissons)
  - Crée une impression de profondeur

## 🏗️ Structure du code

### Configuration initiale
```javascript
const speed = 4;                    // Vitesse de défilement
const hauteurSol = 300;            // Hauteur de la zone de sol
const appGoldRock = 80;            // Fréquence d'apparition (en frames)
world.gravity.y = 10;              // Gravité du monde physique

// Configuration de la montagne
let mountainScale = 0.5;           // Échelle de la montagne (50% de la taille originale)
let mountainAjustY = 372;          // Ajustement vertical de la position
```

### Variables principales

#### Sprites et animations
- `perso` : Sprite du personnage avec physique dynamique
- `groundCollider` : Collider statique invisible pour le sol
- `bushImages[]` : Array des 4 images de buissons préchargées
- `activeBushes[]` : Buissons actuellement affichés à l'écran

#### Gestion des items
- `activeItems[]` : Pièces d'or et rochers actifs sur l'écran
- `animatingGolds[]` : Pièces en cours d'animation après collecte
- `frameCounter` : Compteur pour la fréquence d'apparition des items

#### État du jeu
- `goldCount` : Nombre de pièces collectées (0 à 5)
- `flashEffect` : Durée restante de l'effet de clignotement
- `gameOver` : État de victoire (débloque l'écran final)

### Fonctions principales

#### `preload()`
Précharge tous les assets nécessaires :
- 4 images de buissons (`bush1.png` à `bush4.png`)
- Image de la montagne (`mountain.png`)
- Image de pièce d'or (`gold.png`)
- Image de rocher (`rock.png`)
- Image du code promo (`code-promo.avif`)

#### `spawnBush(startX)`
Génère un nouveau buisson avec des propriétés aléatoires :
- Sélection aléatoire parmi les 4 variantes
- Échelle aléatoire entre 0.2 et 0.4
- Position verticale aléatoire (entre 100 et hauteurSol-100)
- Tri automatique des buissons par profondeur

#### `update()`
Boucle principale du jeu qui gère :

1. **Condition de victoire**
   - Vérification si `goldCount >= 5`
   - Affichage de l'écran de victoire avec le code promo
   - Texte clignotant "CONGRATULATIONS"
   - Option de rejouer

2. **Initialisation des décors**
   - Génération de 5 buissons initiaux au premier frame

3. **Rendu du fond**
   - Fond bleu ciel
   - Sol vert décoratif
   - Montagne en arrière-plan avec effet parallaxe

4. **Gestion du personnage**
   - Ombre dynamique sous le personnage
   - Animation qui se met en pause pendant le saut
   - Effet de clignotement après collision avec un rocher
   - Saut au clic de souris (`vel.y = -10`)

5. **Gestion des décors**
   - Déplacement des buissons vers la gauche
   - Suppression des buissons hors écran
   - Génération aléatoire de nouveaux buissons (probabilité 2.5%)

6. **Système d'items (gold/rock)**
   - Compteur de frames pour la fréquence d'apparition
   - Génération aléatoire (70% de chance qu'un item apparaisse)
   - Répartition : 50% gold / 50% rock parmi les items générés
   - Déplacement horizontal des items
   - Détection de collision par distance
   - Actions selon le type :
     - Gold : incrémente compteur + démarre animation de collecte
     - Rock : remet compteur à 0 + effet de clignotement

7. **Animations de collecte**
   - Effet visuel pour les pièces collectées :
     - Montée progressive (3 pixels/frame)
     - Mouvement zigzag sinusoïdal
     - Réduction progressive de la taille (95% par frame)
     - Fade out de l'opacité
     - Suppression après 25 frames

### Interface utilisateur

- **Compteur** : Affiche "X/5" en haut au centre (taille 50px)
- **Instructions** : "click to jump!" au centre de l'écran
- **Écran de victoire** :
  - Image code promo centrée (800px de largeur)
  - Texte "CONGRATULATIONS" en or avec contour noir
  - "Click to replay" pour recommencer

## 🛠️ Technologies utilisées

- **[q5.js](https://q5js.org/)** : Version légère et rapide de p5.js
- **[p5play](https://p5play.org/)** : Bibliothèque de sprites et physique pour p5.js
- **[Planck.js](https://piqnt.com/planck.js/)** : Moteur physique 2D

## 🚀 Installation et lancement

### Méthode 1 : Mode en ligne (par défaut)
1. Ouvrir `index-SideScroller.html` dans un navigateur web
2. Les bibliothèques sont chargées depuis les CDN en ligne

### Méthode 2 : Mode hors ligne
1. Installer les dépendances :
   ```bash
   npm install q5 p5play
   ```
2. Dans `index-SideScroller.html`, commenter les liens ONLINE et décommenter les liens OFFLINE
3. Ouvrir le fichier HTML dans un navigateur

## 📁 Structure des fichiers

```
SideScroller/
├── index-SideScroller.html    # Point d'entrée HTML
├── sketch-SideScroller.js     # Code principal du jeu
├── README.md                   # Ce fichier
└── assets/                     # Ressources graphiques
    ├── cloud_breathing1.webp   # Animation du personnage
    ├── bush1.png à bush4.png   # Variantes de buissons
    ├── mountain.png            # Arrière-plan montagne
    ├── gold.png                # Pièce d'or
    ├── rock.png                # Rocher obstacle
    └── code-promo.avif         # Image de victoire
```

## 🎨 Paramètres modifiables

Vous pouvez facilement modifier le comportement du jeu en ajustant ces constantes :

- `speed` : Vitesse de défilement (défaut: 4)
- `hauteurSol` : Hauteur de la zone de sol (défaut: 300)
- `appGoldRock` : Fréquence d'apparition des items en frames (défaut: 80)
- `world.gravity.y` : Force de gravité (défaut: 10)
- `mountainScale` : Échelle de la montagne (défaut: 0.5 = 50%)
- `mountainAjustY` : Ajustement vertical de la montagne (défaut: 372)
- `goldCount >= 5` : Nombre de pièces requis pour gagner
- `flashEffect = 30` : Durée du clignotement après un rocher
- `perso.vel.y = -10` : Force du saut

## 📝 Crédits

Code source inspiré de : [https://refybe.com/fr/games/side-scroller](https://refybe.com/fr/games/side-scroller)

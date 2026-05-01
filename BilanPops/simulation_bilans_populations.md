# Simulation de Bilans de Populations

## Description du système

Le système modélise la dynamique d'une population de **sédiments/particules** dans un fluide avec injection de **bulles**.

### Éléments du système
- **Disques noirs** : sédiments/particules (population étudiée)
- **Disques blancs** : bulles qui remontent
- **Conteneur** : domaine de simulation avec parois

### Phénomènes modélisés
1. **Transport simple** : advection des sédiments par le fluide
2. **Interception directe** : capture des particules par les bulles
3. **Agrégation** : fusion de particules entre elles
4. **Fragmentation** : séparation due au cisaillement
5. **Sédimentation** : chute des particules par gravité
6. **Dépôt aux interfaces** : adhésion aux parois

## Composantes nécessaires pour la simulation

### 1. Fluide réaliste
- Résolution des équations de Navier-Stokes (ou simplifications)
- Champ de vitesse $\vec{v}$ pour l'advection des particules
- Champs de cisaillement pour l'agrégation et la fragmentation

### 2. Bulles
- Force de flottabilité (remontée)
- Mouvement brownien ou turbulent (trajectoires aléatoires)
- Interaction avec le fluide (modification locale de l'écoulement)
- Collision/capture avec les sédiments

### 3. Sédiments (la population)
- **Advection** : transport par le champ de vitesse du fluide
- **Sédimentation** : force de gravité (descente)
- **Agrégation** : fusion quand deux particules se rencontrent (dépend du cisaillement, de la taille)
- **Fragmentation** : séparation quand le cisaillement est trop fort
- **Propriétés** : position, volume/taille, vitesse

### 4. Interactions supplémentaires
- Capture par les bulles (adhésion particule-bulle)
- Dépôt aux parois du conteneur
- Germination (apparition de nouvelles particules) - optionnel

## Équation de bilan

$$\frac{\partial n}{\partial t} + \nabla \cdot (n\vec{v}) + \frac{\partial}{\partial V}(n\dot{V}) = S + \frac{1}{2}\int_0^V f(V', V-V')dV' - \int_0^\infty f(V, V')dV' - g(V) + \int_V^\infty \Gamma(V, V')g(V')dV'$$

### Terme source
$$S = S_{\text{germination}} - S_{\text{sédimentation}} - S_{\text{interception}} - S_{\text{dépôt}}$$

### Fonctions d'agrégation et fragmentation
- Agrégation : $f(V_1, V_2) = \beta(V_1, V_2)\, n(V_1)\, n(V_2)$ avec $\beta = \beta_{\text{sédimentation}} + \beta_{\text{cisaillement}}$
- Fragmentation : $g(V) = \gamma_{\text{fragmentation}}(V)\, n(V)$

### Explication détaillée des termes

#### Variables principales

**$n(V, \vec{x}, t)$ - Densité numérique de particules**
- **Signification** : fonction de distribution de taille des particules
- $n(V) \, dV$ = nombre de particules par unité de volume de fluide ayant un volume compris entre $V$ et $V + dV$
- **Unités** : $[\text{nombre}] / ([\text{volume de fluide}] \times [\text{volume de particule}])$
- **Variable dépendante** : c'est ce qu'on cherche à calculer avec l'équation

**$V, V', V_1, V_2$ - Volumes de particules**
- $V$ : volume de la particule dont on étudie la dynamique
- $V_1, V_2$ (ou $V', V-V'$) : volumes des deux particules qui s'agrègent
- Si deux particules fusionnent : $V_{\text{résultante}} = V_1 + V_2$

**$\vec{x}$ - Position spatiale**
- Apparaît implicitement dans l'opérateur $\nabla$ (dérivation spatiale)
- Tous les termes peuvent dépendre de la position

#### Membre de gauche (accumulation + transport)

**$\frac{\partial n}{\partial t}$ - Accumulation temporelle**
- Variation temporelle de la concentration de particules de volume $V$ en un point donné

**$\nabla \cdot (n\vec{v})$ - Advection spatiale**
- Transport des particules par le fluide
- Le champ de vitesse $\vec{v}(\vec{x}, t)$ déplace les particules dans l'espace
- $\nabla = \left(\frac{\partial}{\partial x}, \frac{\partial}{\partial y}, \frac{\partial}{\partial z}\right)$

**$\frac{\partial}{\partial V}(n\dot{V})$ - Croissance/décroissance**
- Variation de concentration due au changement de volume des particules
- $\dot{V}$ = vitesse de changement de volume (ex: dissolution, évaporation)

#### Membre de droite (termes sources)

**$S$ - Sources externes**
- Termes de germination, sédimentation, interception, dépôt
- Ajoutent ou retirent des particules indépendamment de l'agrégation/fragmentation

**$\frac{1}{2}\int_0^V f(V', V-V')dV'$ - Naissance par agrégation**
- Formation de particules de volume $V$ par collision de deux particules plus petites
- Le facteur $\frac{1}{2}$ évite de compter deux fois la même collision
- $f(V', V-V')$ = taux de collision entre particules de volumes $V'$ et $(V-V')$

**$-\int_0^\infty f(V, V')dV'$ - Mort par agrégation**
- Disparition de particules de volume $V$ qui s'agrègent avec d'autres particules
- Intégration sur tous les volumes possibles $V'$ de collision

**$-g(V)$ - Mort par fragmentation**
- Disparition de particules de volume $V$ qui se fragmentent
- $g(V)$ = taux de fragmentation

**$\int_V^\infty \Gamma(V, V')g(V')dV'$ - Naissance par fragmentation**
- Formation de particules de volume $V$ issues de la fragmentation de particules plus grosses ($V' > V$)
- $\Gamma(V, V')$ = distribution des fragments produits (fonction de fragmentation)

#### Récapitulatif

L'équation est une **EDP en 4 dimensions** :
- **Temps** : $t$
- **Espace** : $\vec{x}$ (3D)
- **Volume de particule** : $V$ (coordonnée interne)

Elle exprime : **variation de $n(V)$** = transport spatial + croissance + sources externes + (naissance par agrégation) - (mort par agrégation) - (mort par fragmentation) + (naissance par fragmentation)

## Approches de simulation possibles

### Méthode SPH (Smoothed Particle Hydrodynamics)
- Fluide et particules représentés par des particules SPH
- Bon pour les interactions fluide-particule
- Coûteux en calcul

### Méthode Eulérienne-Lagrangienne
- **Eulérienne** : grille pour le fluide (champ de vitesse)
- **Lagrangienne** : particules individuelles pour les sédiments
- Compromis performance/précision

### Méthode de Monte Carlo
- Pour l'agrégation/fragmentation stochastique
- Combine bien avec approche Lagrangienne
- Adapté aux grands nombres de particules

## Considérations techniques

### Dimensionnalité
- **2D** : plus rapide, bon pour prototypage/visualisation
- **3D** : plus réaliste, beaucoup plus coûteux

### Paramètres de simulation
- Nombre de bulles
- Nombre de particules
- Taille du domaine
- Pas de temps
- Coefficients : $\beta_{\text{cisaillement}}$, $\beta_{\text{sédimentation}}$, $\gamma_{\text{fragmentation}}$

### Phénomène du cisaillement
Le cisaillement a un double rôle :
- **Favorise l'agrégation** : rapproche les particules
- **Favorise la fragmentation** : casse les agrégats trop gros

## De l'équation à la simulation numérique

### Pourquoi simuler ?

L'équation de bilan est une **équation intégro-différentielle non-linéaire** en 4 dimensions qui ne peut pas être résolue analytiquement. La simulation numérique est nécessaire pour :
- Discrétiser et résoudre l'équation
- Calculer $n(V, \vec{x}, t)$ à chaque instant
- Prendre en compte le couplage avec Navier-Stokes pour obtenir $\vec{v}(\vec{x}, t)$

**L'équation** décrit le modèle physique. **La simulation** calcule la solution.

### Paramètres : physiques vs numériques

Il faut distinguer deux types de paramètres :

#### Paramètres physiques (entrées du modèle)
- **Propriétés du fluide** : viscosité $\mu$, densité $\rho_{\text{fluide}}$
- **Propriétés des particules** : densité $\rho_{\text{particule}}$, tension superficielle
- **Coefficients phénoménologiques** : $\beta_{\text{sédimentation}}$, $\beta_{\text{cisaillement}}$, $\gamma_{\text{fragmentation}}$, $\Gamma(V,V')$
- **Conditions initiales** : $n(V, \vec{x}, t=0)$ et conditions aux limites

#### Paramètres numériques (choix d'implémentation)
- **Discrétisation spatiale** : taille de grille (ex: 100×100 cellules)
- **Discrétisation temporelle** : pas de temps $\Delta t$ (ex: 0.001 s)
- **Discrétisation en volume** : nombre de classes de taille (ex: 50 classes)
- **Méthode numérique** : schéma d'intégration, solveur
- **Nombre de particules** (si approche lagrangienne)

Les **paramètres physiques** décrivent le système réel. Les **paramètres numériques** peuvent être ajustés pour améliorer précision/vitesse sans changer la physique.

### Grandeurs calculées par la simulation

À partir de $n(V, \vec{x}, t)$, on peut extraire :

#### Distributions en taille
- **$n_{\text{sommet}}(V, t)$** : distribution des particules à la surface (celles récupérées)
- **$n_{\text{fond}}(V, t)$** : distribution des particules sédimentées
- Permet de savoir quelles tailles sont effectivement capturées

#### Efficacité du procédé
- **Taux de capture global** : pourcentage de particules éliminées
- **Efficacité par taille** : pourcentage de particules de volume $V$ récupéré
- **Flux massiques** : débit de particules en surface et au fond

#### Concentrations et statistiques
- **Concentration totale** : $C_{\text{totale}}(\vec{x}, t) = \int_0^\infty n(V, \vec{x}, t) \, dV$
- **Taille moyenne** : $V_{\text{moyen}}(\vec{x}, t)$
- **Temps de résidence** : durée moyenne dans le bassin

#### Optimisation
- Identifier les zones mortes (peu de mouvement)
- Taille optimale des bulles
- Débit d'air optimal
- Géométrie du bassin

### Simulation 2D : avantages et limitations

#### Ce qu'apporte la 2D

**✅ Tendances qualitatives**
- Comprendre les mécanismes dominants
- Identifier les zones de recirculation
- Observer la stratification

**✅ Comparaisons relatives**
- Tester différentes configurations
- Analyse de sensibilité aux paramètres
- Optimisation paramétrique

**✅ Rapidité**
- Prototypage rapide
- Débugguer le code
- Visualisation facile

#### Ce que la 2D ne capture pas

**❌ Géométrie réelle**
- Bassins 3D (cylindriques, rectangulaires)
- Écoulements tourbillonnaires 3D
- Effets de bord en profondeur

**❌ Physique incomplète**
- Mouvements latéraux des bulles impossibles
- Trajectoires hélicoïdales absentes
- Taux de collision modifiés

**❌ Valeurs quantitatives inexactes**
- Débits non transposables directement
- Efficacité de capture approximative
- Gradients de cisaillement différents

#### Interpréter les résultats 2D

**Pas de "correction magique"**, mais plusieurs approches :

1. **Interprétation prudente**
   - Valeurs 2D = indicatives, pas exactes
   - Focus sur les tendances, pas les chiffres absolus
   - Exemple : efficacité 2D = 75% → "probablement entre 60-90%"

2. **Calibration avec données expérimentales**
   - Mesurer $\text{facteur} = \frac{\text{valeur 3D/expérience}}{\text{valeur 2D}}$
   - Appliquer ce facteur aux nouveaux cas (avec prudence)

3. **Paramètres effectifs**
   - Ajuster $\beta$, $\gamma$ en 2D pour reproduire des mesures
   - Ces paramètres 2D ne sont plus les vraies valeurs physiques

4. **Analyse de sensibilité**
   - Identifier ce qui compte vraiment (ex: "débit de bulles ×2 → efficacité +30%")
   - La tendance est fiable même si +30% n'est pas exact en 3D

#### Quand utiliser la 2D ?

| Contexte | 2D acceptable ? |
|----------|----------------|
| Phase exploratoire | ✅ Oui |
| Étude de sensibilité | ✅ Oui |
| Dimensionnement précis | ❌ Non → 3D |
| Validation expérimentale | ❌ Non → 3D |
| Géométrie simple (canal) | ✅ Oui |
| Géométrie complexe | ❌ Non → 3D |

**Workflow pragmatique** :
1. **2D** : exploration rapide, tests de paramètres
2. **Analyse de sensibilité** : identifier les leviers importants
3. **3D ciblée** : validation sur configurations prometteuses
4. **Calibration** : ajuster les paramètres si on a des données

## Application : Flottation en traitement des eaux

### Principe de la flottation

1. **Injection de bulles** : On injecte de fines bulles d'air au fond du bassin
2. **Capture des particules** : Les bulles remontent et capturent les particules/sédiments au passage (par adhésion)
3. **Remontée** : Les bulles chargées de particules montent jusqu'à la surface
4. **Récupération** : En surface, elles forment une **mousse/écume** qui est raclée et évacuée

### Flottation vs Sédimentation

C'est l'**inverse de la sédimentation** :
- **Sédimentation** : les particules lourdes tombent au fond → récupération en bas
- **Flottation** : les particules légères (ou rendues légères par les bulles) remontent → récupération en haut

### Applications en traitement des eaux

#### Eaux usées urbaines
- Élimination des **graisses et huiles** (naturellement hydrophobes)
- Élimination des **matières en suspension fines**
- **Épaississement des boues** (flottation des boues activées)

#### Eaux industrielles
- Industrie papetière : élimination des fibres et encres
- Industrie alimentaire : graisses, huiles
- Industrie minière : séparation de minerais

#### Avantages
- Efficace pour les particules **légères ou de petite taille**
- Plus rapide que la sédimentation pour certaines particules
- Récupération facile en surface (raclage de mousse)

---

*Notes basées sur le schéma "Bilans de populations"*
const nFourmis = 750;
const nbCases = 50;
const xNid = 0;
const yNid = nbCases - 1;
const xNourriture = nbCases - 1;
const yNourriture = nbCases - 1;
const decayRate = 0.99;
const EPSILON = 0.0001;
const explorationRate = 0.2;
const maxAge = 1500;
const exclusionRadius = 20;
const yCenter = nbCases + 5;
const xCenter = nbCases / 2;

let fourmis = [];
let pheromones = [];

function setup() {
  createCanvas(400, 400);
  for (let i = 0; i < nFourmis; i++) {
    fourmis.push({ x: xNid, y: yNid, run: [], age: random(maxAge) });
  }
  for (let i = 0; i < nbCases; i++) {
    pheromones.push([]);
    for (let j = 0; j < nbCases; j++) {
      pheromones[i].push(0);
    }
  }
}

function isValid(x, y) {
  let d = dist(x, y, xCenter, yCenter);
  return (d > exclusionRadius);
}

function moveFourmi(fourmi) {
  let r = int(random(4));
  if (r == 0) {
    if (isValid(fourmi.x + 1, fourmi.y)) {
      fourmi.x += 1;
    }
  }
  else if (r == 1) {
    if (isValid(fourmi.x - 1, fourmi.y)) {
      fourmi.x -= 1;
    }
  }
  else if (r == 2) {
    if (isValid(fourmi.x, fourmi.y + 1)) {
      fourmi.y += 1;
    }
  }
  else {
    if (isValid(fourmi.x, fourmi.y - 1)) {
      fourmi.y -= 1;
    }
  }
  fourmi.x = constrain(fourmi.x, 0, nbCases - 1);
  fourmi.y = constrain(fourmi.y, 0, nbCases - 1);
}

function draw() {
  background(220);
  for (let i = 0; i < nbCases; i++) {
    for (let j = 0; j < nbCases; j++) {
      if (!isValid(i, j)) {
        fill(255, 0, 0);
      }
      else {
        let pheromoneValue = pheromones[i][j];
        if (pheromoneValue > EPSILON) {
          fill(255 - pheromoneValue * 5, 255 - pheromoneValue * 5, 150);
        } else {
          fill(255);
        }
      }
      rect(i * width / nbCases, j * height / nbCases,
        width / nbCases, height / nbCases);
      pheromones[i][j] *= decayRate;
    }
  }

  for (let i = 0; i < nFourmis; i++) {
    let fourmi = fourmis[i];
    fill(0);
    rect(fourmi.x * width / nbCases, fourmi.y * width / nbCases,
      width / nbCases, height / nbCases);
    fourmi.run.push({ x: fourmi.x, y: fourmi.y });
    if (random(1) < explorationRate) {
      moveFourmi(fourmi);
    }
    else {
      let sumPheromone = 0;
      let probas = [];
      // Add pheromone values for each neighbor
      for (let k = fourmi.x - 1; k <= fourmi.x + 1; k++) {
        for (let l = fourmi.y - 1; l <= fourmi.y + 1; l++) {
          if (k == fourmi.x || l == fourmi.y) {
            continue;
          }
          if (k >= 0 && k < nbCases && l >= 0 && l < nbCases && (isValid(k, l))) {
            sumPheromone += pheromones[k][l];
            probas.push({ p: pheromones[k][l], x: k, y: l });
          }
        }
      }
      if (sumPheromone < EPSILON) {
        moveFourmi(fourmi);
      }
      else {
        let r = random(sumPheromone);
        for (let j = 0; j < probas.length; j++) {
          r -= probas[j].p;
          if (r < 0) {
            fourmi.x = probas[j].x;
            fourmi.y = probas[j].y;
            break;
          }
        }
      }
    }
    fourmi.x = constrain(fourmi.x, 0, nbCases - 1);
    fourmi.y = constrain(fourmi.y, 0, nbCases - 1);
    if (fourmi.x == xNourriture && fourmi.y == yNourriture) {
      fourmi.run.push({ x: fourmi.x, y: fourmi.y });
      let p = 1;
      for (let j = fourmi.run.length - 1; j >= 0; j--) {
        let x = fourmi.run[j].x;
        let y = fourmi.run[j].y;
        // If this position is already visited, we don't add pheromone
        let found = false;
        for (let k = j + 1; k < fourmi.run.length; k++) {
          if (fourmi.run[k].x == x && fourmi.run[k].y == y) {
            found = true;
            break;
          }
        }
        if (found) {
          continue;
        }
        pheromones[x][y] += 2 * (1 - fourmi.run.length / maxAge) * j / fourmi.run.length;
        // pheromones[x][y] += p; 
        // p *= decayRate;
        // if (p < EPSILON) {
        //   break;
        // }
      }
      fourmi.run = [];
      fourmi.x = xNid;
      fourmi.y = yNid;
      fourmi.age = random(maxAge);
      console.log("Hit for " + i);
    }
    fourmi.age--;
    if (fourmi.age < 0) {
      fourmi.run = [];
      fourmi.x = xNid;
      fourmi.y = yNid;
      fourmi.age = random(maxAge);
    }
  }
}

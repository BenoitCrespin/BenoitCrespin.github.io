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
const exclusionRadius = nbCases/3;
const yCenter = nbCases + 5;
const xCenter = nbCases/2;

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
      let pheromoneValue = pheromones[i][j];
      if (pheromoneValue > EPSILON) {
        fill(255 - pheromoneValue * 5);
      } else {
        fill(255);
      }
      rect(i * width / nbCases, j * height / nbCases,
        width / nbCases, height / nbCases);
      pheromones[i][j] *= decayRate;
    }
  }
  // Smooth the pheromone values wih a Gaussian filter
  // let nextPheromones = [];
  // for (let i = 0; i < nbCases - 1; i++) {
  //   nextPheromones.push([]);
  //   for (let j = 0; j < nbCases - 1; j++) {
  //     let sum = 0;
  //     let count = 0;
  //     for (let k = -1; k <= 1; k++) {
  //       for (let l = -1; l <= 1; l++) {
  //         if (i + k < 0 || i + k >= nbCases || j + l < 0 || j + l >= nbCases) {
  //           continue;
  //         }
  //         sum += pheromones[i + k][j + l];
  //         count++;
  //       }
  //     }
  //     let avg = sum / count;
  //     let v = pheromones[i][j]*0.999 + avg * 0.001;
  //     nextPheromones[i].push(v);
  //   }
  // }
  // // Copy the smoothed pheromone values back to the original array
  // for (let i = 1; i < nbCases - 1; i++) {
  //   for (let j = 1; j < nbCases - 1; j++) {
  //     pheromones[i][j] = nextPheromones[i][j];
  //   }
  // }

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
          if (k >= 0 && k < nbCases && l >= 0 && l < nbCases) {
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
            if (isValid(probas[j].x, probas[j].y)) {
              fourmi.x = probas[j].x;
              fourmi.y = probas[j].y;
              break;
            }
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
        pheromones[x][y] += 10*(1 - fourmi.run.length / maxAge) * j / fourmi.run.length;
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

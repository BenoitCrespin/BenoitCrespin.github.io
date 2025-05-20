const nFourmis = 50;
const coteCases = 50;
const xNid = 0;
const yNid = nbCases/2;
const xNourriture = nbCases - 1;
const yNourriture = nbCases/2;
const decayRate = 0.9999;
const explorationRate = 0.5;
const EPSILON = 0.0001;

let fourmis = [];
let pheromones = [];

function setup() {
  createCanvas(400, 400);
  for (let i = 0; i < nFourmis; i++) {
    fourmis.push({ x: xNid, y: yNid, run: [] });
  }
  for (let i = 0; i < nbCases; i++) {
    pheromones.push([]);
    for (let j = 0; j < nbCases; j++) {
      let probas = [0, 0, 0, 0];
      pheromones[i].push(probas);
    }
  }
}

function draw() {
  background(220);
  for (let i = 0; i < nbCases; i++) {
    for (let j = 0; j < nbCases; j++) {
      let pheromone = pheromones[i][j];
      let pheromoneValue = 0;
      for (let k = 0; k < pheromone.length; k++) {
        pheromoneValue += pheromone[k];
        pheromone[k] *= decayRate;
      }
      if (pheromoneValue > EPSILON) {
        fill(255 - pheromoneValue * 5);
      } else {
        fill(255);
      }
      rect(i * width / nbCases, j * height / nbCases,
        width / nbCases, height / nbCases);
    }
  }

  for (let i = 0; i < nFourmis; i++) {
    let fourmi = fourmis[i];
    fill(0);
    rect(fourmi.x * width / nbCases, fourmi.y * width / nbCases,
      width / nbCases, height / nbCases);
    fourmi.run.push({ x: fourmi.x, y: fourmi.y });
    if (random(1) < explorationRate) {
      fourmi.x += random(1) < 0.5 ? -1 : 1;
      fourmi.y += random(1) < 0.5 ? -1 : 1;
    }
    else {
      let pheromone = pheromones[fourmi.x][fourmi.y];
      let sumPheromone = 0;
      for (let j = 0; j < pheromone.length; j++) {
        sumPheromone += pheromone[j];
      }
      if (sumPheromone < EPSILON) {
        fourmi.x += random(1) < 0.5 ? -1 : 1;
        fourmi.y += random(1) < 0.5 ? -1 : 1;
      }
      else {
        let r = random(sumPheromone);
        let probas = [];
        for (let j = pheromone.length - 1; j >= 0; j--) {
          probas.push({j: j, p: pheromone[j]});
        }
        // Mix probas
        for (let k = 0; k < 10; k++) {
          // Exchange two random probas
          let i1 = floor(random(probas.length));
          let i2 = floor(random(probas.length));
          let tmp = probas[i1];
          probas[i1] = probas[i2];
          probas[i2] = tmp;
        }
        for (let j = 0; j < probas.length; j++) {
          r -= probas[j].p;
          if (r < 0) {
            if (probas[j].j == 0) {
              fourmi.y += 1;
            }
            else if (probas[j].j == 1) {
              fourmi.x += 1;
            }
            else if (probas[j].j == 2) {
              fourmi.y -= 1;
            }
            else if (probas[j].j == 3) {
              fourmi.x -= 1;
            }
            break;
          }
        }
      }
    }
    fourmi.x = constrain(fourmi.x, 0, nbCases - 1);
    fourmi.y = constrain(fourmi.y, 0, nbCases - 1);
    if (fourmi.x == xNourriture && fourmi.y == yNourriture) {
      let p = 5;
      for (let j = fourmi.run.length - 2; j > 2; j--) {
        let x = fourmi.run[j].x;
        let y = fourmi.run[j].y;
        let xprev = fourmi.run[j + 1].x;
        let yprev = fourmi.run[j + 1].y;
        if (y == yprev) {
          if (x < xprev) {
            pheromones[x][y][1] += p;
          } else {
            pheromones[x][y][3] += p;
          }
        }
        if (x == xprev) {
          if (y < yprev) {
            pheromones[x][y][0] += p;
          } else {
            pheromones[x][y][2] += p;
          }
        }
        p *= 0.999;
        if (p < EPSILON) {
          break;
        }
      }
      fourmi.run = [];
      fourmi.x = xNid;
      fourmi.y = yNid;
    }
  }
}

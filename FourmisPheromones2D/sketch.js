const nFourmis = 200;
const nbCases = 50;
const xNid = 0;
const yNid = nbCases - 1;
const xNourriture = nbCases - 1;
const yNourriture = nbCases - 1;
const decayPheromoneRate = 0.995;
const decayPheromonePath = 0.99;
const maxPheromone = 400;
const startPheromonePath = 50;
const explorationRate = 0.2;
const exclusionRadius = 20;
const yCenter = nbCases + 5;
const xCenter = nbCases / 2;
const EPSILON = 0.0001;

let fourmis = [];
let pheromones = [];
let occupied = [];

function newFourmi() {
  return {
    x: xNid,
    y: yNid,
    prevX: xNid,
    prevY: yNid,
    run: [],
    age: 0,
    pReturn: 0
  };
}

function setup() {
  createCanvas(400, 400);
  for (let i = 0; i < nFourmis; i++) {
    fourmis.push(newFourmi());
  }
  for (let i = 0; i < nbCases; i++) {
    pheromones.push([]);
    for (let j = 0; j < nbCases; j++) {
      pheromones[i].push(0);
    }
  }
}

function isValid(x, y) {
  if (x >= 0 && y >= 0 && x < nbCases && y < nbCases
    && occupied[x][y]) {
    return false;
  }
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
  occupied = [];
  for (let i = 0; i < nbCases; i++) {
    occupied.push([]);
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
      pheromones[i][j] *= decayPheromoneRate;
      occupied[i].push(false);
    }
  }

  for (let i = 0; i < nFourmis; i++) {
    let fourmi = fourmis[i];
    //if (fourmi.pReturn == 0) 
    occupied[fourmi.x][fourmi.y] = true;
  }

  for (let i = 0; i < nFourmis; i++) {
    let fourmi = fourmis[i];
    fill(0);
    if (fourmi.pReturn > 0) fill(150, 255, 0);
    rect(fourmi.x * width / nbCases, fourmi.y * width / nbCases,
      width / nbCases, height / nbCases);
    fourmi.run.push({ x: fourmi.x, y: fourmi.y });
    if (fourmi.pReturn > 0) {
      fourmi.x = fourmi.run[fourmi.age].x;
      fourmi.y = fourmi.run[fourmi.age].y;
      let found = false;
      for (let j = fourmi.age; j < fourmi.run.length; j++) {
        if (fourmi.run[j].x == fourmi.x && fourmi.run[j].y == fourmi.y) {
          found = true;
          break;
        }
      }
      if (found) {
        pheromones[fourmi.x][fourmi.y] += fourmi.pReturn; 
        if (pheromones[fourmi.x][fourmi.y] > maxPheromone) {
          pheromones[fourmi.x][fourmi.y] = maxPheromone;
        }
      }
      fourmi.pReturn *= decayPheromonePath;
      fourmi.age--;
      if (fourmi.pReturn < EPSILON || fourmi.age < 0)  
        fourmis[i] = newFourmi();
      //console.log(fourmis[i]);
    }
    else {
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
            if (k >= 0 && k < nbCases && l >= 0 && l < nbCases
              && (isValid(k, l))
              && ((k != fourmi.prevX || l != fourmi.prevY))) {
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
      fourmi.prevX = fourmi.x;
      fourmi.prevY = fourmi.y;
      fourmi.age++;
      if (fourmi.x == xNourriture && fourmi.y == yNourriture) {
        fourmi.run.push({ x: fourmi.x, y: fourmi.y });
        fourmi.age++;
        fourmi.run.push({ x: fourmi.x, y: fourmi.y });
        fourmi.pReturn = startPheromonePath * dist(xNid, yNid, xNourriture, yNourriture) / fourmi.age;
        // let p = startPheromonePath * dist(xNid, yNid, xNourriture, yNourriture) / fourmi.age;
        // //startPheromonePath;
        // for (let j = fourmi.run.length - 1; j >= 0; j--) {
        //   let x = fourmi.run[j].x;
        //   let y = fourmi.run[j].y;
        //   // If this position is already visited, we don't add pheromone
        //   let found = false;
        //   for (let k = j + 1; k < fourmi.run.length; k++) {
        //     if (fourmi.run[k].x == x && fourmi.run[k].y == y) {
        //       found = true;
        //       break;
        //     }
        //   }
        //   if (found) {
        //     continue;
        //   }
        //   pheromones[x][y] += p;
        //   if (pheromones[x][y] > maxPheromone) {
        //     pheromones[x][y] = maxPheromone;
        //   }
        //   p *= decayPheromonePath;
        //   if (p < EPSILON) {
        //     break;
        //   }
        // }
        // fourmis[i] = newFourmi();
        console.log("Hit for " + i);
      }
    }
  }
}

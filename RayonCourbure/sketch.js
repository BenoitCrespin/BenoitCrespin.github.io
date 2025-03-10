const spreadFactor = 10;
let rValue = 115;
const nAngles = 180;

let maxValue = 0;
let maxCenter = [0, 0];
let imgContour;
let imgBoule;
let imgHough;
let rslider;
let error;

function preload() {
  // load image
  imgContour = loadImage('Boule.jpg');
  imgBoule = loadImage('BouleOrig.jpg');
  rslider = createSlider(rValue, 175, 0);
  rslider.position(10, 10);
  rslider.style('width', '80px');
  rslider.value(143);
}

function resetHough() {
  imgHough.loadPixels();
  for (let x = 0; x < imgHough.width; x++) {
    for (let y = 0; y < imgHough.height; y++) {
      imgHough.set(x, y, color(0, 0, 0));
    }
  }
  imgHough.updatePixels();
  maxValue = 0;
}

function setup() {
  createCanvas(imgContour.width * 2 + 5, imgContour.height);
  imgHough = createImage(imgContour.width * 2, imgContour.height * 2);
  hough();
}

function draw() {
  background(255);
  image(imgContour, 0, 0);
  if (rValue != rslider.value()) {
    rValue = rslider.value();
    hough();
  }
  image(imgBoule, imgContour.width + 5, 0);
  if (maxValue > 0) {
    noFill();
    stroke(255, 0, 0);
    ellipse(maxCenter[0], maxCenter[1], 2 * rValue, 2 * rValue);
    ellipse(maxCenter[0] + imgContour.width + 5, maxCenter[1], 2 * rValue, 2 * rValue);
  }
  // Write rValue
  fill(255);
  text('r = ' + rValue, 20, 50);
  // Write error
  error = 0;
  for (let x = 0; x < imgContour.width; x++) {
    for (let y = 0; y < imgContour.height; y++) {
      let p = imgContour.get(x, y);
      if (p[0] < 50) {
        continue;
      }
      let d = dist(x, y, maxCenter[0], maxCenter[1]);
      error += (d - rValue) * (d - rValue);
    }
  }

  text('error = ' + error, 20, 70);
}

function gradient(img, i, j) {
  let dx = (img.get(i + 1, j)[0] - img.get(i - 1, j)[0]) / 2;
  let dy = (img.get(i, j + 1)[0] - img.get(i, j - 1)[0]) / 2;
  let d = sqrt(dx * dx + dy * dy);
  dx /= d;
  dy /= d;
  return [dx, dy];
}

function spread(i, j) {
  for (let x = i - spreadFactor; x < i + spreadFactor; x++) {
    for (let y = j - spreadFactor; y < j + spreadFactor; y++) {
      let d = dist(i, j, x, y);
      if (d > spreadFactor) continue;
      let c0 = imgHough.pixels[(x + y * imgHough.width) * 4];
      let addValue = (1 - d / spreadFactor);
      addValue = 10 * addValue * addValue * addValue;
      imgHough.pixels[(x + y * imgHough.width) * 4] = c0 + addValue;
      if (c0 + addValue > maxValue) {
        maxValue = c0 + addValue;
        maxCenter = [x, y];
      }
    }
  }
}

function hough() {
  resetHough();
  let r = rValue;
  imgHough.loadPixels();
  imgContour.loadPixels();
  for (let x = 0; x < imgContour.width; x++) {
    for (let y = 0; y < imgContour.height; y++) {
      let p = imgContour.get(x, y);
      if (p[0] < 50) {
        continue;
      }
      // let g = gradient(imgOriginal, x, y);
      // // Mark the center of the two circles that pass through the point with radius r
      // let x1 = x + r * g[0];
      // let y1 = y + r * g[1];
      // let x2 = x - r * g[0];
      // let y2 = y - r * g[1];
      // if (x1 >= spreadFactor && x1 < imgOriginal.width - spreadFactor && y1 >= spreadFactor + imgOriginal.height/3 && y1 < imgOriginal.height - spreadFactor) {
      //   spread(x1, y1);
      // }
      // if (x2 >= spreadFactor && x2 < imgOriginal.width - spreadFactor && y2 >= spreadFactor + imgOriginal.height/3 && y2 < imgOriginal.height - spreadFactor) {
      //   spread(x2, y2);
      // }
      for (let theta = 0; theta < nAngles; theta++) {
        let a = theta * 2 * PI / nAngles;
        let x0 = x + rValue * cos(a);
        let y0 = y + rValue * sin(a);
        if (x0 >= spreadFactor && x0 < imgHough.width - spreadFactor && y0 >= spreadFactor + imgHough.height/3 && y0 < imgHough.height - spreadFactor) {
          spread(x0, y0);
        }
      }
    }
  }
  imgHough.updatePixels();
  console.log(maxValue);
  // Remap from [0, max] to [0, 255]
  // for (let x = 0; x < imgHough.width; x++) {
  //   for (let y = 0; y < imgHough.height; y++) {
  //     let c = imgHough.get(x, y);
  //     let v = map(c[0], 0, maxValue, 0, 255);
  //     imgHough.set(x, y, color(v, v, v));
  //   }
  // }
  // imgHough.updatePixels();
}

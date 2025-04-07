const radiusExtraction = 170;
const radiusSearch = 10;
const epsilonSearch = 0.001;

let currentRadiusSearch = radiusSearch;
let img;
let contour = [];
let closeContour = [];
let selectedPoint = null;
let bestCircle = null;
let currentError = 0;

function preload() {
    img = loadImage("fibre853x100.png");
}

function setup() {
    createCanvas(img.width, img.height);
    img.loadPixels();

    // Extract the contour of the image
    for (let x = 0; x < img.width; x++) {
        // Find the two consecutive pixels in this column that have the maximal difference in brightness
        let maxDiff = 0;
        let p1 = null;
        let p2 = null;
        for (let y = 0; y < img.height - 1; y++) {
            let index1 = (x + y * img.width) * 4;
            let index2 = (x + (y + 1) * img.width) * 4;
            let brightness1 = img.pixels[index1];
            let brightness2 = img.pixels[index2];
            let diff = abs(brightness1 - brightness2);
            if (diff > maxDiff) {
                maxDiff = diff;
                p1 = { x, y };
                p2 = { x, y: y + 1 };
            }
        }
        // Add a point to the contour
        if (p1 && p2)
            contour.push({ x: p1.x, y: (p1.y + p2.y) / 2 });
    }
    // Smooth the contour
    for (let cpt = 0; cpt < 10; cpt++) {
        let smoothedContour = [];
        smoothedContour.push(contour[0]);
        for (let i = 1; i < contour.length - 1; i++) {
            let p1 = contour[i - 1];
            let p2 = contour[i];
            let p3 = contour[i + 1];
            let y = (p1.y + p2.y + p3.y) / 3;
            smoothedContour.push({ x: p2.x, y: y });
        }
        smoothedContour.push(contour[contour.length - 1]);
        contour = smoothedContour;
    }
}

function draw() {
    image(img, 0, 0);

    // Draw the contour
    noFill();
    stroke(200, 50, 50);
    beginShape();
    for (let p of contour) {
        vertex(p.x, p.y);
    }
    endShape();

    if (bestCircle) {
        // Draw a blue box around the selected point
        noFill();
        stroke(50, 50, 200);
        rect(selectedPoint.x - radiusExtraction, selectedPoint.y - radiusExtraction/6, radiusExtraction*2, radiusExtraction/3);
        stroke(255, 0, 0);
        ellipse(bestCircle.x, bestCircle.y, bestCircle.r * 2);

        // Draw the selected point with a blue cross
        stroke(50, 50, 200);
        line(selectedPoint.x - 15, selectedPoint.y, selectedPoint.x + 15, selectedPoint.y);
        line(selectedPoint.x, selectedPoint.y + 15, selectedPoint.x, selectedPoint.y - 15);

        fill(255, 0, 0);
        textSize(16);
        text(`R = ${nf(bestCircle.r, 1, 4)} px`, width - 150, 20);
        text(`Erreur = ${nf(currentScore, 1, 5)}`, width - 150, 40);
        if (currentRadiusSearch > epsilonSearch) {
            optimizeBestCircle();
        }
    }
    if (!mouseIsPressed) return;
    let clickedPoint = getNearestContourPoint(mouseX, mouseY);
    if (clickedPoint) {
        closeContour = [];
        selectedPoint = clickedPoint;
        extractCloseContour();
        bestCircle = {x: selectedPoint.x, y: height * 2, r: height * 2 - selectedPoint.y};
        currentScore = computeError(bestCircle);
        currentRadiusSearch = radiusSearch;
    }
}

function getNearestContourPoint(x, y) {
    let minDist = Infinity;
    let nearestPoint = null;
    for (let p of contour) {
        let d = dist(x, y, p.x, p.y);
        if (d < minDist) {
            minDist = d;
            nearestPoint = { x: p.x, y: p.y };
        }
    }
    return nearestPoint;
}

function extractCloseContour() {
    for (let p of contour) {
        let x = p.x;
        let y = p.y;
        if (dist(x, y, selectedPoint.x, selectedPoint.y) > radiusExtraction) continue;
        closeContour.push({ x, y });
    }
}

function optimizeBestCircle() {
    // Compute 36 points around the current best circle's center with radius currentRadiusSearch
    let points = [];
    for (let i = 0; i < 36; i++) {
        let angle = i * TWO_PI / 36;
        let x = bestCircle.x + currentRadiusSearch * cos(angle);
        let y = bestCircle.y + currentRadiusSearch * sin(angle);
        points.push({ x, y });
    }
    // Find the point with the minimal error
    let minError = Infinity;
    let bestPoint = null;
    for (let p of points) {
        let circle = { x: p.x, y: p.y, r: dist(p.x, p.y, selectedPoint.x, selectedPoint.y) };
        let error = computeError(circle);
        if (error < minError) {
            minError = error;
            bestPoint = p;
        }
    }
    // Update the best circle if the error is smaller
    if (minError < currentScore) {
        bestCircle = { x: bestPoint.x, y: bestPoint.y, r: dist(bestPoint.x, bestPoint.y, selectedPoint.x, selectedPoint.y) };
        currentScore = minError;
    }
    else {
        currentRadiusSearch /= 2;
    }
    // currentRadiusSearch *= 1 - epsilonSearch;
}

function computeError(circle) {
    // return sqrt(closeContour.reduce((sum, p) => sum + pow(dist(p.x, p.y, circle.x, circle.y) - circle.r, 2), 0));
    let error = 0;
    for (let p of closeContour) {
        let d = dist(p.x, p.y, circle.x, circle.y);
        if (d < circle.r) error += 2 * pow(d - circle.r, 2);
        else error += pow(d - circle.r, 2);
    }
    return sqrt(error)/closeContour.length;
}

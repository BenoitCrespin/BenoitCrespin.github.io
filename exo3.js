import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';

const fov = 40;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(0, 50, 0);
camera.up.set(0, 0, 1);
camera.lookAt(0, 0, 0);

const scene = new THREE.Scene();
const light = new THREE.PointLight(0xffffff, 1, 100);
scene.add(light);

const objects = [];

const radius = 1;
const widthSegments = 32;
const heightSegments = 32;
const sphereGeometry = new THREE.SphereGeometry(    // On utilise une seule géométrie pour limiter les besoins en mémoire
    radius, widthSegments, heightSegments);

const solarSystem = new THREE.Object3D();
scene.add(solarSystem);
objects.push(solarSystem);

//const sunMaterial = new THREE.MeshPhongMaterial({ emissive: 0xFFFF00 });
const sunMaterial = new THREE.MeshPhongMaterial({
    emissive: 0xffff00,
    emissiveMap: new THREE.TextureLoader().load('./images/sun.jpg'),
    emissiveIntensity: 1
});
const sunMesh = new THREE.Mesh(sphereGeometry, sunMaterial);
sunMesh.scale.set(5, 5, 5);
scene.add(sunMesh);             // On ajoute le soleil directement à la scène pour éviter qu'il soit pris en compte dans la rotation

const earthOrbit = new THREE.Object3D();
earthOrbit.position.x = 10;
solarSystem.add(earthOrbit);
objects.push(earthOrbit);

//const earthMaterial = new THREE.MeshPhongMaterial({ color: 0x2233FF, emissive: 0x112244 });
const earthColor = "./images/earthmap1k.jpg";
const earthBump = "./images/earthbump1k.jpg";
const earthSpec = "./images/earthspec1k.jpg";
const textureLoader = new THREE.TextureLoader();
const earthMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load(earthColor),
    bumpMap: textureLoader.load(earthBump),
    specularMap: textureLoader.load(earthSpec),
    bumpScale: 0.25,
    shininess: 1
});
const earthMesh = new THREE.Mesh(sphereGeometry, earthMaterial);
earthOrbit.add(earthMesh);
objects.push(earthMesh);

const moonOrbit = new THREE.Object3D();
moonOrbit.position.x = 2;
earthOrbit.add(moonOrbit);

//const moonMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, emissive: 0x222222 });
const moonColor = "./images/moonmap1k.jpg";
const moonBump = "./images/moonbump1k.jpg";
const moonMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load(moonColor),
    bumpMap: textureLoader.load(moonBump),
    bumpScale: 0.05,
    shininess: 1
});
const moonMesh = new THREE.Mesh(sphereGeometry, moonMaterial);
moonMesh.scale.set(.5, .5, .5);
moonOrbit.add(moonMesh);
objects.push(moonMesh);

// Renderer
const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// GridHelper
const grille = new THREE.GridHelper(25, 10);
scene.add(grille);

// Resize 
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
});

// GUI
const gui = new GUI();
const params = {
    vitesse: 0.025,
    soleil: true,
    terre: true,
    lune: true,
    grille: true
};
gui.add(params, "soleil");
gui.add(params, "terre");
gui.add(params, "lune");
gui.add(params, "grille");
gui.add(params, "vitesse", 0.01, 0.1);

// Stats
const container = document.getElementById('container');
const stats = new Stats();
container.appendChild(stats.dom);

// Il vaut mieux utiliser "time" comme un paramètre de rotation
let time = 0;
function loop() {
    sunMesh.visible = params.soleil;
    earthMesh.visible = params.terre;
    moonMesh.visible = params.lune;
    grille.visible = params.grille;
    time += params.vitesse;
    objects.forEach((obj) => {
        obj.rotation.y = time;
    });
    controls.update();
    stats.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}
loop();

// Background
scene.background = new THREE.CubeTextureLoader()
    .setPath("./galaxy/")
    .load(['dark-s_px.jpg',
        'dark-s_nx.jpg',
        'dark-s_py.jpg',
        'dark-s_ny.jpg',
        'dark-s_pz.jpg',
        'dark-s_nz.jpg']);

// Torus
const eoGeometry = new THREE.TorusGeometry(10, .1, 16, 100);
const eoMaterial = new THREE.MeshBasicMaterial({ color: 0x6655dd });
const eoCircle = new THREE.Mesh(eoGeometry, eoMaterial);
eoCircle.rotateX(Math.PI / 2);
scene.add(eoCircle);
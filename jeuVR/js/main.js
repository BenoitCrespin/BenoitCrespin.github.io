import common from './data/common.js';
import objects from './data/objects.js';
import trashes from './data/trashes.js';
import createTimer from './timer.js';
import { V } from './view.js';

let score = 0;
let objectRemoved = 0;
const timer = createTimer();



function playSound(type) {
    var audio = document.getElementById("sound" + type);
    audio.play();
}


function groundCollision(e) {
    setTimeout(function () {
        let targetId = e.detail.target.el.id;
        let targetNode = e.detail.target.el;


        for (let object in objects) {
            if (targetId == objects[object].name + '-box') {
                V.createObject(common, objects[object]);
            }
        }

        if (targetId != 'plaquette' && targetId != 'ground' && targetId != 'radio') {
            targetNode.parentNode.removeChild(targetNode);
        }
    }, 1);

}



function trashCollision(e) {
    setTimeout(function () {
        let targetNode = e.detail.target.el;
        let objectId = e.detail.target.el.id;
        let objectclass = e.detail.target.el.classList.item(0);
        let trashclass = e.detail.body.el.classList.item(0);

        if (targetNode.classList.contains('trashHitbox')) {
            targetNode = e.detail.body.el;
        }
        if (objectId != 'plaquette' && objectId != 'ground' && objectId != 'radio') {
            targetNode.parentNode.removeChild(targetNode);
            objectRemoved++;
        }

        if (trashclass == objectclass) {
            score += 100;
            playSound('+');
        } else if (trashclass != null && objectclass != null) {
            score -= 50;
            playSound('-');
        }

        V.setScore(score);
        if (objectRemoved >= Object.keys(objects).length) {

            V.createGameOver();
            V.createPlayButton();
            objectRemoved = 0;

            timer.stop();
            V.toggleRaycaster(true);


        }
    }, 0);

}


for (let i = 0; i < Object.keys(trashes).length; i++) {
    V.createTrash(common, trashes[i]);

}

AFRAME.registerComponent('collider-check', {
    dependencies: ['raycaster'],

    init: function () {


        document.querySelector('#ground').addEventListener('collide', groundCollision);

        document.querySelectorAll('.trashHitbox').forEach(item => { item.addEventListener('collide', trashCollision); });

        this.el.addEventListener('click', function () {

            score = 0;
            V.setScore(score);
            try {
                timer.reset();
            }
            catch (e) {
                console.log('no timer');
            }

            timer.start();

            V.toggleRaycaster(false);
            let playButton = document.querySelector('#playButton');
            playButton.parentNode.removeChild(playButton);
            try {
                let gameOver = document.querySelector('#gameOver');
                gameOver.parentNode.removeChild(gameOver);
            } catch (e) {
                console.log('no game over');
            }

            try {
                let rules = document.querySelector('#rulesbutton');
                rules.parentNode.removeChild(rulesbutton);
            } catch (e) {
                console.log('no rules button');
            }

            for (let i = 0; i < Object.keys(objects).length; i++) {
                V.createObject(common, objects[i]);
            }

        });
    }
});


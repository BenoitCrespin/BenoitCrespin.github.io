import { TitleScene } from './scenes/TitleScene.js';
import { GameScene } from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    backgroundColor: '#87ceeb',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: false // set to true to see the physics bodies
        }
    },
    scene: [TitleScene, GameScene]
};

new Phaser.Game(config);

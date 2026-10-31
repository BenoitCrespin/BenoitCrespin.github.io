import { makeTextures, BALL_RADIUS } from '../textures.js';

export class TitleScene extends Phaser.Scene {
    constructor () {
        super('Title');
    }

    create () {
        makeTextures(this);

        // Ground
        this.add.rectangle(640, 690, 1280, 60, 0x4c9a4c);
        this.matter.add.rectangle(640, 690, 1280, 60, { isStatic: true });
        this.matter.world.setBounds(0, -500, 1280, 1220);

        this.add.text(640, 160, 'Angry Countryballs', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '72px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        this.add.text(640, 250, 'Ireland · España · France  vs  the Pigeons', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#1b1b24'
        }).setOrigin(0.5);

        const start = this.add.text(640, 340, 'Click to play', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#e63946',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        this.tweens.add({ targets: start, scale: 1.08, duration: 600, yoyo: true, repeat: -1 });

        // The three heroes drop in and bounce around
        ['ireland', 'spain', 'france'].forEach((country, i) => {
            this.time.delayedCall(300 + i * 400, () => {
                const ball = this.matter.add.image(440 + i * 200, -50, 'ball_' + country, null, {
                    shape: { type: 'circle', radius: BALL_RADIUS },
                    restitution: 0.7
                });
                ball.setAngularVelocity(Phaser.Math.FloatBetween(-0.1, 0.1));
            });
        });

        // The balls can be grabbed and thrown with the mouse
        this.matter.add.mouseSpring();

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('Game', { level: 0 }));
        start.setInteractive({ useHandCursor: true }).once('pointerdown', () => {
            this.scene.start('Game', { level: 0 });
        });
    }
}

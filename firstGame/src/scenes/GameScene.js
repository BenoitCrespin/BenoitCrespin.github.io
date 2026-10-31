import { makeTextures, blockTexture, BALL_RADIUS, PIGEON_RADIUS } from '../textures.js';
import { LEVELS } from '../levels.js';

const GROUND_Y = 660;
const SLING = { x: 220, y: 520 };   // where the ball sits before launch
const MAX_PULL = 110;               // max drag distance, in pixels
const LAUNCH_POWER = 0.16;          // launch speed = pull distance * LAUNCH_POWER
const BALL_AIR_FRICTION = 0.005;

// Matter gravity applied at each 60 Hz step (gravity.y * scale * step²), used by the aim preview
const GRAVITY_STEP = 0.001 * (1000 / 60) ** 2;

const MATERIALS = {
    glass: { hp: 3, density: 0.001, color: 0xbfe6ff, points: 50 },
    wood: { hp: 8, density: 0.002, color: 0xc68642, points: 100 },
    stone: { hp: 16, density: 0.004, color: 0x9ea3a8, points: 200 }
};
const PIGEON_HP = 2.5;
const MIN_IMPACT = 1.5;             // softer hits do no damage

const POWERS = {
    ireland: 'Split into 3!',
    spain: '¡Olé! Charge!',
    france: 'Pétanque slam!'
};

export class GameScene extends Phaser.Scene {
    constructor () {
        super('Game');
    }

    init (data) {
        this.levelIndex = data.level ?? 0;
        this.score = data.score ?? 0;
    }

    create () {
        makeTextures(this);
        this.level = LEVELS[this.levelIndex];

        this.state = 'aiming';      // aiming -> flying -> waiting -> aiming ... -> over
        this.queue = [...this.level.balls];
        this.flying = [];           // balls currently in play (several after an Irish split)
        this.pigeons = [];
        this.canDamage = false;     // ignore collisions while the level settles

        this.drawBackground();
        this.buildLevel();
        this.createSlingshot();
        this.createHud();
        this.setupInput();

        this.particles = this.add.particles(0, 0, 'dot', {
            speed: { min: 80, max: 260 },
            lifespan: 600,
            scale: { start: 1, end: 0 },
            gravityY: 600,
            emitting: false
        }).setDepth(10);

        this.matter.world.on('collisionstart', (event) => this.onCollision(event));
        this.time.delayedCall(1000, () => { this.canDamage = true; });

        this.loadNextBall();
    }

    // ---------------------------------------------------------------- level

    drawBackground () {
        this.cameras.main.setBackgroundColor(this.level.sky);
        this.add.circle(1150, 110, 50, 0xfff3b0);
        const hills = this.add.graphics();
        hills.fillStyle(Phaser.Display.Color.ValueToColor(this.level.ground).darken(15).color);
        hills.fillEllipse(300, GROUND_Y + 20, 900, 260);
        hills.fillEllipse(1000, GROUND_Y + 30, 1000, 200);

        this.add.rectangle(640, GROUND_Y + 40, 1280, 80, this.level.ground);
        this.matter.add.rectangle(640, GROUND_Y + 40, 4000, 80, { isStatic: true, friction: 1, label: 'ground' });
    }

    buildLevel () {
        for (const b of this.level.blocks) {
            const mat = MATERIALS[b.type];
            const block = this.matter.add.image(b.x, b.y, blockTexture(this, b.type, b.w, b.h), null, {
                density: mat.density,
                friction: 0.8,
                restitution: 0.05
            });
            block.setData({ kind: 'block', material: b.type, hp: mat.hp });
        }

        for (const p of this.level.pigeons) {
            const pigeon = this.matter.add.image(p.x, p.y, 'pigeon', null, {
                shape: { type: 'circle', radius: PIGEON_RADIUS },
                density: 0.001,
                friction: 0.8,
                restitution: 0.2
            });
            pigeon.setData({ kind: 'pigeon', hp: PIGEON_HP });
            this.pigeons.push(pigeon);
        }
    }

    // ------------------------------------------------------------ slingshot

    createSlingshot () {
        const g = this.add.graphics().setDepth(1);
        g.lineStyle(14, 0x6e4219);
        g.beginPath();
        g.moveTo(SLING.x, GROUND_Y);
        g.lineTo(SLING.x, SLING.y + 40);
        g.lineTo(SLING.x - 18, SLING.y);
        g.moveTo(SLING.x, SLING.y + 40);
        g.lineTo(SLING.x + 18, SLING.y);
        g.strokePath();

        this.bands = this.add.graphics().setDepth(5);
        this.aimDots = this.add.graphics().setDepth(2);
    }

    drawBands () {
        this.bands.clear();
        if (this.state !== 'aiming' || !this.ball) {
            return;
        }
        this.bands.lineStyle(5, 0x3b1f0e);
        this.bands.lineBetween(SLING.x - 18, SLING.y, this.ball.x, this.ball.y);
        this.bands.lineBetween(SLING.x + 18, SLING.y, this.ball.x, this.ball.y);
    }

    // Simulates the launch the same way Matter does, and draws dots along the path
    drawAimPreview (vx, vy) {
        this.aimDots.clear();
        this.aimDots.fillStyle(0xffffff, 0.8);
        let x = this.ball.x;
        let y = this.ball.y;
        for (let step = 1; step <= 90; step++) {
            vy += GRAVITY_STEP;
            vx *= 1 - BALL_AIR_FRICTION;
            vy *= 1 - BALL_AIR_FRICTION;
            x += vx;
            y += vy;
            if (y > GROUND_Y) {
                break;
            }
            if (step % 4 === 0) {
                this.aimDots.fillCircle(x, y, 3);
            }
        }
    }

    loadNextBall () {
        const country = this.queue.shift();
        this.ball = this.matter.add.image(SLING.x, SLING.y, 'ball_' + country, null, {
            shape: { type: 'circle', radius: BALL_RADIUS },
            density: 0.004,
            friction: 0.6,
            restitution: 0.35,
            frictionAir: BALL_AIR_FRICTION
        });
        // Created as a dynamic body, THEN made static, so Matter remembers its real mass
        this.ball.setStatic(true).setDepth(3);
        this.ball.setData({ kind: 'ball', country, punch: 1.5 });

        this.state = 'aiming';
        this.dragging = false;
        this.powerUsed = false;
        this.updateHud();
        this.hint.setText('Drag the ball back and release to launch');
        this.drawBands();
    }

    // ---------------------------------------------------------------- input

    setupInput () {
        this.input.on('pointerdown', (pointer) => {
            if (this.state === 'aiming' && pointer.x < 600) {
                this.dragging = true;
            } else if (this.state === 'flying') {
                this.usePower();
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (!this.dragging) {
                return;
            }
            // Keep the ball within MAX_PULL of the slingshot
            const pull = new Phaser.Math.Vector2(pointer.x - SLING.x, pointer.y - SLING.y).limit(MAX_PULL);
            this.ball.setPosition(SLING.x + pull.x, SLING.y + pull.y);
            this.drawBands();
            this.drawAimPreview(-pull.x * LAUNCH_POWER, -pull.y * LAUNCH_POWER);
        });

        this.input.on('pointerup', () => {
            if (!this.dragging) {
                return;
            }
            this.dragging = false;
            const pullX = this.ball.x - SLING.x;
            const pullY = this.ball.y - SLING.y;
            if (Math.hypot(pullX, pullY) < 20) {
                // Too small: put the ball back
                this.ball.setPosition(SLING.x, SLING.y);
                this.drawBands();
                this.aimDots.clear();
                return;
            }
            this.launch(-pullX * LAUNCH_POWER, -pullY * LAUNCH_POWER);
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.state === 'flying') {
                this.usePower();
            }
        });
        this.input.keyboard.on('keydown-R', () => this.scene.restart({ level: this.levelIndex, score: 0 }));
        this.input.keyboard.on('keydown-ESC', () => this.scene.start('Title'));
    }

    launch (vx, vy) {
        this.ball.setStatic(false);
        this.ball.setVelocity(vx, vy);
        this.ball.setAngularVelocity(0.15);
        this.flying = [this.ball];
        this.launchTime = this.time.now;
        this.state = 'flying';
        this.aimDots.clear();
        this.drawBands();
        this.hint.setText(`Click or SPACE: ${POWERS[this.ball.getData('country')]}`);
    }

    // --------------------------------------------------------------- powers

    usePower () {
        if (this.powerUsed || !this.ball || !this.ball.active) {
            return;
        }
        this.powerUsed = true;
        this.hint.setText('');
        const ball = this.ball;
        const v = ball.getVelocity();
        const country = ball.getData('country');

        if (country === 'ireland') {
            // Split into three balls fanning out
            for (const angle of [-0.25, 0.25]) {
                const rotated = new Phaser.Math.Vector2(v.x, v.y).rotate(angle);
                const clone = this.matter.add.image(ball.x, ball.y, 'ball_ireland', null, {
                    shape: { type: 'circle', radius: BALL_RADIUS },
                    density: 0.004,
                    friction: 0.6,
                    restitution: 0.35,
                    frictionAir: BALL_AIR_FRICTION
                });
                clone.setDepth(3).setData({ kind: 'ball', country, punch: 1.5 });
                clone.setVelocity(rotated.x, rotated.y);
                this.flying.push(clone);
            }
            this.popText(ball.x, ball.y - 40, 'Sláinte!', '#169b62');
        } else if (country === 'spain') {
            // Charge: double speed in the current direction, hits harder
            ball.setVelocity(v.x * 2, v.y * 2);
            ball.setData('punch', 2.5);
            this.popText(ball.x, ball.y - 40, '¡Olé!', '#f1bf00');
        } else if (country === 'france') {
            // Pétanque: becomes very heavy and slams straight down
            ball.setDensity(0.02);
            ball.setVelocity(v.x * 0.2, 20);
            ball.setData('punch', 4);
            this.popText(ball.x, ball.y - 40, 'Pétanque !', '#0055a4');
        }
    }

    // ------------------------------------------------------------- collision

    onCollision (event) {
        if (!this.canDamage) {
            return;
        }
        for (const pair of event.pairs) {
            const a = pair.bodyA.gameObject;
            const b = pair.bodyB.gameObject;
            // Impact strength = how fast the two bodies hit each other
            const impact = Math.hypot(
                pair.bodyA.velocity.x - pair.bodyB.velocity.x,
                pair.bodyA.velocity.y - pair.bodyB.velocity.y
            );
            if (impact < MIN_IMPACT) {
                continue;
            }
            this.damage(a, impact * (b?.getData('punch') ?? 1));
            this.damage(b, impact * (a?.getData('punch') ?? 1));
        }
    }

    damage (obj, amount) {
        if (!obj || !obj.active) {
            return;
        }
        const kind = obj.getData('kind');
        if (kind !== 'block' && kind !== 'pigeon') {
            return;
        }
        const hp = obj.getData('hp') - amount;
        obj.setData('hp', hp);

        if (kind === 'pigeon') {
            if (hp <= 0) {
                this.killPigeon(obj);
            }
            return;
        }

        const mat = MATERIALS[obj.getData('material')];
        if (hp <= 0) {
            this.burst(obj.x, obj.y, mat.color, 12);
            this.addScore(mat.points, obj.x, obj.y);
            obj.destroy();
        } else {
            // Fade blocks as they get damaged
            obj.setAlpha(0.4 + 0.6 * (hp / mat.hp));
        }
    }

    killPigeon (pigeon) {
        this.burst(pigeon.x, pigeon.y, 0x8d99ae, 20);
        this.addScore(1000, pigeon.x, pigeon.y);
        Phaser.Utils.Array.Remove(this.pigeons, pigeon);
        pigeon.destroy();

        if (this.pigeons.length === 0 && this.state !== 'over') {
            this.time.delayedCall(1200, () => this.endLevel(true));
        }
    }

    // ---------------------------------------------------------------- update

    update (time) {
        // Pigeons knocked out of the screen count as defeated
        for (const pigeon of [...this.pigeons]) {
            if (pigeon.x < -100 || pigeon.x > 1380 || pigeon.y > 800) {
                this.killPigeon(pigeon);
            }
        }

        if (this.state !== 'flying') {
            return;
        }

        // The turn ends when every ball has stopped or left the screen (or after 8 s)
        const allDone = this.flying.every((ball) => {
            if (!ball.active) {
                return true;
            }
            const out = ball.x < -100 || ball.x > 1380 || ball.y > 800;
            const stopped = ball.body.speed < 0.2 && time - this.launchTime > 1000;
            return out || stopped;
        });

        if (allDone || time - this.launchTime > 8000) {
            this.state = 'waiting';
            this.hint.setText('');
            this.time.delayedCall(800, () => this.nextTurn());
        }
    }

    nextTurn () {
        if (this.state === 'over') {
            return;
        }
        for (const ball of this.flying) {
            if (ball.active) {
                this.burst(ball.x, ball.y, 0xffffff, 8);
                ball.destroy();
            }
        }
        this.flying = [];

        if (this.queue.length > 0) {
            this.loadNextBall();
        } else {
            // Last chance: let things fall for a moment before declaring defeat
            this.time.delayedCall(1500, () => {
                if (this.state !== 'over') {
                    this.endLevel(false);
                }
            });
        }
    }

    endLevel (won) {
        if (this.state === 'over') {
            return;
        }
        this.state = 'over';
        this.hint.setText('');
        this.drawBands();

        if (won) {
            // Bonus for every ball not used
            const unused = this.queue.length + (this.ball && this.ball.isStatic() ? 1 : 0);
            this.score += unused * 500;
            this.updateHud();
        }

        const last = this.levelIndex === LEVELS.length - 1;
        const title = won ? (last ? 'All pigeons defeated!' : 'Level cleared!') : 'The pigeons win…';
        const action = won ? (last ? 'Click to play again' : 'Click for next level') : 'Click to retry';

        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.5).setDepth(20);
        this.add.text(640, 300, title, {
            fontFamily: 'Arial Black, Arial', fontSize: '60px', color: '#ffffff', stroke: '#000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(21);
        this.add.text(640, 380, `Score: ${this.score}`, {
            fontFamily: 'Arial', fontSize: '32px', color: '#ffffff'
        }).setOrigin(0.5).setDepth(21);
        this.add.text(640, 440, action, {
            fontFamily: 'Arial', fontSize: '26px', color: '#ffe66d'
        }).setOrigin(0.5).setDepth(21);

        // Small delay so the click that ended the level doesn't skip this screen
        this.time.delayedCall(500, () => {
            this.input.once('pointerdown', () => {
                if (!won) {
                    this.scene.restart({ level: this.levelIndex, score: 0 });
                } else if (last) {
                    this.scene.start('Title');
                } else {
                    this.scene.restart({ level: this.levelIndex + 1, score: this.score });
                }
            });
        });
    }

    // ------------------------------------------------------------------- HUD

    createHud () {
        const style = { fontFamily: 'Arial', fontSize: '24px', color: '#1b1b24' };
        this.add.text(20, 16, `Level ${this.levelIndex + 1}: ${this.level.name}`, style).setDepth(15);
        this.scoreText = this.add.text(1260, 16, '', style).setOrigin(1, 0).setDepth(15);
        this.hint = this.add.text(640, 60, '', { ...style, fontSize: '22px' }).setOrigin(0.5, 0).setDepth(15);
        this.add.text(20, 690, 'R: restart   ESC: menu', { ...style, fontSize: '16px', color: '#ffffff' }).setDepth(15);
        this.queueIcons = [];
    }

    updateHud () {
        this.scoreText.setText(`Score: ${this.score}`);
        // Waiting balls, lined up behind the slingshot
        this.queueIcons.forEach((icon) => icon.destroy());
        this.queueIcons = this.queue.map((country, i) =>
            this.add.image(SLING.x - 70 - i * 45, GROUND_Y - 20, 'ball_' + country).setScale(0.7).setDepth(2)
        );
    }

    addScore (points, x, y) {
        this.score += points;
        this.updateHud();
        this.popText(x, y, `+${points}`, '#ffffff', 20);
    }

    popText (x, y, text, color, size = 30) {
        const t = this.add.text(x, y, text, {
            fontFamily: 'Arial Black, Arial', fontSize: `${size}px`, color, stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(12);
        this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 900, onComplete: () => t.destroy() });
    }

    burst (x, y, color, count) {
        this.particles.setParticleTint(color);
        this.particles.explode(count, x, y);
    }
}

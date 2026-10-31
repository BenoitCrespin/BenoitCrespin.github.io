// All the graphics are drawn in code, so we don't need any image files yet.

export const BALL_RADIUS = 26;
export const PIGEON_RADIUS = 18;

// Flag stripes, drawn inside the ball.
// Spain is red / yellow / red with a double-height yellow band (1:2:1).
export const FLAGS = {
    ireland: { dir: 'vertical', colors: ['#169b62', '#ffffff', '#ff883e'] },
    spain: { dir: 'horizontal', colors: ['#aa151b', '#f1bf00', '#f1bf00', '#aa151b'] },
    france: { dir: 'vertical', colors: ['#0055a4', '#ffffff', '#ef4135'] }
};

const BLOCK_STYLES = {
    wood: { fill: '#c68642', border: '#6e4219', detail: '#a86b32' },
    stone: { fill: '#9ea3a8', border: '#4f5459', detail: '#7d8287' },
    glass: { fill: 'rgba(190, 230, 255, 0.55)', border: '#4f9fd1', detail: 'rgba(255, 255, 255, 0.8)' }
};

export function makeTextures (scene) {
    // Textures are global to the game: only create them once
    if (scene.textures.exists('ball_ireland')) {
        return;
    }

    for (const country in FLAGS) {
        drawCountryball(scene, 'ball_' + country, FLAGS[country], BALL_RADIUS);
    }
    drawPigeon(scene);

    // Small white dot used for particles and the trajectory preview
    const g = scene.make.graphics({}, false);
    g.fillStyle(0xffffff);
    g.fillCircle(4, 4, 4);
    g.generateTexture('dot', 8, 8);
    g.destroy();
}

function drawCountryball (scene, key, flag, r) {
    const size = r * 2 + 4;
    const c = size / 2;
    const ctx = scene.textures.createCanvas(key, size, size).getContext();

    // Flag stripes, clipped to the circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.clip();
    const n = flag.colors.length;
    flag.colors.forEach((color, i) => {
        ctx.fillStyle = color;
        if (flag.dir === 'vertical') {
            ctx.fillRect(c - r + (i * 2 * r) / n, 0, (2 * r) / n + 1, size);
        } else {
            ctx.fillRect(0, c - r + (i * 2 * r) / n, size, (2 * r) / n + 1);
        }
    });
    ctx.restore();

    // Black outline
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();

    // Countryball eyes: white, no pupils, looking right (towards the pigeons)
    drawEye(ctx, c + r * 0.05, c - r * 0.15, r);
    drawEye(ctx, c + r * 0.5, c - r * 0.15, r);

    scene.textures.get(key).refresh();
}

function drawEye (ctx, x, y, r) {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.17, r * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

function drawPigeon (scene) {
    const r = PIGEON_RADIUS;
    const size = r * 2 + 12;
    const c = size / 2;
    const ctx = scene.textures.createCanvas('pigeon', size, size).getContext();

    // Body
    ctx.fillStyle = '#8d99ae';
    ctx.strokeStyle = '#2b2d42';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Shiny green/purple neck band
    ctx.save();
    ctx.beginPath();
    ctx.arc(c, c, r - 1.5, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#5e8c61';
    ctx.fillRect(0, c + 1, size, 4);
    ctx.fillStyle = '#7b4f8e';
    ctx.fillRect(0, c + 5, size, 3);
    ctx.restore();

    // Wing
    ctx.fillStyle = '#6c7a91';
    ctx.beginPath();
    ctx.ellipse(c + r * 0.35, c + r * 0.45, r * 0.45, r * 0.25, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Beak, pointing left (towards the slingshot)
    ctx.fillStyle = '#f4a261';
    ctx.beginPath();
    ctx.moveTo(c - r + 2, c - 4);
    ctx.lineTo(c - r - 7, c);
    ctx.lineTo(c - r + 2, c + 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Angry eye
    ctx.fillStyle = '#ff7b00';
    ctx.beginPath();
    ctx.arc(c - r * 0.4, c - r * 0.35, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(c - r * 0.45, c - r * 0.35, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(c - r * 0.85, c - r * 0.8);
    ctx.lineTo(c - r * 0.05, c - r * 0.55);
    ctx.stroke();

    scene.textures.get('pigeon').refresh();
}

// Returns the texture key for a block of the given material and size,
// creating the texture the first time it is needed.
export function blockTexture (scene, type, w, h) {
    const key = `${type}_${w}x${h}`;
    if (scene.textures.exists(key)) {
        return key;
    }

    const style = BLOCK_STYLES[type];
    const ctx = scene.textures.createCanvas(key, w, h).getContext();

    ctx.fillStyle = style.fill;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = style.detail;
    ctx.lineWidth = 2;
    if (type === 'wood') {
        // Wood grain along the long side
        const horizontal = w >= h;
        const len = horizontal ? h : w;
        for (let i = len / 3; i < len - 2; i += len / 3) {
            ctx.beginPath();
            if (horizontal) {
                ctx.moveTo(4, i);
                ctx.lineTo(w - 4, i);
            } else {
                ctx.moveTo(i, 4);
                ctx.lineTo(i, h - 4);
            }
            ctx.stroke();
        }
    } else if (type === 'stone') {
        // A few cracks / speckles at fixed positions
        ctx.fillStyle = style.detail;
        for (let i = 0; i < (w * h) / 150; i++) {
            const x = (i * 37) % (w - 6) + 3;
            const y = (i * 53) % (h - 6) + 3;
            ctx.fillRect(x, y, 3, 3);
        }
    } else {
        // Glass shine
        ctx.beginPath();
        ctx.moveTo(4, h * 0.6);
        ctx.lineTo(w * 0.6, 4);
        ctx.stroke();
    }

    ctx.strokeStyle = style.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, w - 3, h - 3);

    scene.textures.get(key).refresh();
    return key;
}

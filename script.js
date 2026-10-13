import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

// ==================================================
// GLACIER-INSPIRED VR HIKING TRAIL
// ==================================================

document.body.replaceChildren();

document.body.style.cssText = `
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #000;
    font-family: Arial, sans-serif;
    touch-action: none;
`;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa6c9df);
scene.fog = new THREE.FogExp2(0xa6c9df, 0.0045);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1800
);

camera.position.set(0, 1.75, 12);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
});

// Match renderer coordinates to the CSS-pixel lens layout.
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.autoClear = false;
renderer.xr.enabled = false;

Object.assign(renderer.domElement.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    display: 'block',
    zIndex: '1',
    outline: 'none'
});

renderer.domElement.tabIndex = 0;
document.body.appendChild(renderer.domElement);

// ==================================================
// LIGHTING
// ==================================================

scene.add(
    new THREE.HemisphereLight(0xd8edff, 0x40523a, 2.0)
);

const sunlight = new THREE.DirectionalLight(0xffedcf, 2.8);
sunlight.position.set(-60, 100, 40);
scene.add(sunlight);

const mountainFill = new THREE.DirectionalLight(0x9bc9ff, 0.8);
mountainFill.position.set(40, 30, -80);
scene.add(mountainFill);

// ==================================================
// MATERIALS
// ==================================================

const grassMaterial = new THREE.MeshStandardMaterial({
    color: 0x526f43,
    roughness: 1
});

const trailMaterial = new THREE.MeshStandardMaterial({
    color: 0x9b896b,
    roughness: 1
});

const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x777d80,
    roughness: 0.96,
    flatShading: true
});

const snowMaterial = new THREE.MeshStandardMaterial({
    color: 0xe7f0f3,
    roughness: 0.85
});

const barkMaterial = new THREE.MeshStandardMaterial({
    color: 0x60432e,
    roughness: 1
});

const foliageMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x164b35, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0x1d5a3b, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0x286747, roughness: 1 })
];

// ==================================================
// GROUND AND HIKING TRAIL
// ==================================================

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200, 60, 60),
    grassMaterial
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.12;
scene.add(ground);

// The trail curves through the valley.
function trailX(z) {
    return Math.sin(z * 0.035) * 5 +
           Math.sin(z * 0.012) * 3;
}

function createTrail() {
    const segments = 240;
    const vertices = [];
    const indices = [];

    for (let i = 0; i <= segments; i++) {
        const z = 35 - i * 2.5;
        const x = trailX(z);

        vertices.push(x - 2.25, 0.02, z);
        vertices.push(x + 2.25, 0.02, z);

        if (i < segments) {
            const a = i * 2;
            indices.push(
                a, a + 2, a + 1,
                a + 1, a + 2, a + 3
            );
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const trail = new THREE.Mesh(geometry, trailMaterial);
    trail.frustumCulled = false;
    scene.add(trail);
}

createTrail();

// ==================================================
// MOUNTAINS
// ==================================================

function createMountain(x, z, radius, height, snowy = false) {
    const geometry = new THREE.ConeGeometry(
        radius,
        height,
        7,
        4
    );

    const positions = geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
        const x0 = positions.getX(i);
        const y0 = positions.getY(i);
        const z0 = positions.getZ(i);

        const variation =
            1 + 0.08 * Math.sin(x0 * 3.7 + z0 * 2.1);

        positions.setXYZ(
            i,
            x0 * variation,
            y0,
            z0 * variation
        );
    }

    geometry.computeVertexNormals();

    const mountain = new THREE.Mesh(geometry, rockMaterial);
    mountain.position.set(x, height / 2 - 1, z);
    mountain.rotation.y = Math.random() * Math.PI;
    scene.add(mountain);

    if (snowy) {
        const snow = new THREE.Mesh(
            new THREE.ConeGeometry(
                radius * 0.43,
                height * 0.37,
                7,
                2
            ),
            snowMaterial
        );

        snow.position.set(x, height * 0.79, z);
        snow.rotation.y = mountain.rotation.y;
        scene.add(snow);
    }
}

[
    [-32, -38, 23, 48, true],
    [31, -45, 27, 59, true],
    [-55, -100, 36, 75, true],
    [54, -115, 40, 83, true],
    [-20, -170, 40, 84, true],
    [32, -205, 48, 98, true],
    [-85, -240, 50, 95, true],
    [85, -280, 55, 108, true],
    [-30, -350, 50, 100, true],
    [35, -410, 65, 120, true]
].forEach(args => createMountain(...args));

// Faraway mountain silhouettes.
const distantMountainMaterial = new THREE.MeshStandardMaterial({
    color: 0x879ba8,
    roughness: 1,
    flatShading: true
});

for (let i = 0; i < 26; i++) {
    const height = 55 + Math.random() * 100;

    const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(
            30 + Math.random() * 45,
            height,
            6,
            3
        ),
        distantMountainMaterial
    );

    mountain.position.set(
        (Math.random() - 0.5) * 300,
        height / 2 - 4,
        -250 - Math.random() * 400
    );

    mountain.rotation.y = Math.random() * Math.PI;
    scene.add(mountain);
}

// ==================================================
// PINE TREES
// ==================================================

const trunkGeometry = new THREE.CylinderGeometry(
    0.12, 0.25, 2.4, 7
);

const foliageGeometries = [
    new THREE.ConeGeometry(1.3, 3.2, 8),
    new THREE.ConeGeometry(1.05, 2.8, 8),
    new THREE.ConeGeometry(0.78, 2.3, 8)
];

function createPine(x, z, scale = 1) {
    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(
        trunkGeometry,
        barkMaterial
    );

    trunk.position.y = 1.1 * scale;
    trunk.scale.setScalar(scale);
    tree.add(trunk);

    for (let i = 0; i < 3; i++) {
        const leaves = new THREE.Mesh(
            foliageGeometries[i],
            foliageMaterials[
                Math.floor(Math.random() * foliageMaterials.length)
            ]
        );

        leaves.position.y = (2 + i * 1.15) * scale;
        leaves.scale.setScalar(scale);
        tree.add(leaves);
    }

    tree.position.set(x, 0, z);
    tree.rotation.y = Math.random() * Math.PI * 2;
    scene.add(tree);

    return tree;
}

// Trees leave space around the path and the campsite clearings.
for (let i = 0; i < 680; i++) {
    const z = 35 - Math.random() * 520;
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = trailX(z) + side * (5 + Math.random() * 27);

    const nearCamp = [
        [-12, -38],
        [13, -82],
        [-13, -155]
    ].some(([cx, cz]) =>
        Math.hypot(x - cx, z - cz) < 9
    );

    if (!nearCamp) {
        createPine(x, z, 0.65 + Math.random() * 1.8);
    }
}

// ==================================================
// SIGNPOSTS AND SIGN TEXTURES
// ==================================================

function makeSignTexture(lines, background = '#493b2a') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = '#d8c49b';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 496, 240);

    ctx.fillStyle = '#fff3d6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const fontSize = lines.length > 2 ? 36 : 43;
    ctx.font = `bold ${fontSize}px Arial`;

    const lineHeight = 256 / (lines.length + 1);

    lines.forEach((line, index) => {
        ctx.fillText(
            line,
            256,
            lineHeight * (index + 1),
            460
        );
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function createSign(x, z, heading, lines, options = {}) {
    const group = new THREE.Group();

    const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 2.5, 0.16),
        barkMaterial
    );

    post.position.y = 1.25;
    group.add(post);

    const boardWidth = options.width ?? 3.2;
    const boardHeight = options.height ?? 1.1;

    const board = new THREE.Mesh(
        new THREE.BoxGeometry(
            boardWidth,
            boardHeight,
            0.15
        ),
        new THREE.MeshStandardMaterial({
            map: makeSignTexture(lines, options.background),
            roughness: 0.85
        })
    );

    board.position.y = 2.05;
    group.add(board);

    group.position.set(x, 0, z);
    group.rotation.y = heading;
    scene.add(group);

    return group;
}

// Trailhead and route signs.
createSign(
    trailX(10) - 3,
    10,
    0,
    ['GLACIER TRAIL', 'START HERE'],
    { width: 3.6 }
);

createSign(
    trailX(-24) + 4,
    -24,
    Math.PI,
    ['WATERFALL', '1.2 MILES'],
    { background: '#34513d' }
);

createSign(
    -8,
    -45,
    Math.PI / 2,
    ['CAMP SITE 1', 'RIVER CLEARING'],
    { background: '#34513d' }
);

createSign(
    10,
    -92,
    -Math.PI / 2,
    ['WATERFALL VIEW', 'KEEP TO THE TRAIL'],
    { background: '#34513d' }
);

createSign(
    -8,
    -162,
    Math.PI / 2,
    ['CAMP SITE 2', 'ALPINE MEADOW'],
    { background: '#34513d' }
);

createSign(
    0,
    -205,
    Math.PI,
    ['LOOKOUT POINT', 'MOUNTAIN VIEWS'],
    { background: '#34513d' }
);

// ==================================================
// CAMPSITES
// ==================================================

function createTent(x, z, color = 0xb94c35, scale = 1) {
    const group = new THREE.Group();

    const tentMaterial = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.9,
        side: THREE.DoubleSide
    });

    const tent = new THREE.Mesh(
        new THREE.ConeGeometry(1.6, 1.8, 4, 1),
        tentMaterial
    );

    tent.rotation.y = Math.PI / 4;
    tent.position.y = 0.9;
    tent.scale.set(1, 1, 1.25);
    group.add(tent);

    const entrance = new THREE.Mesh(
        new THREE.PlaneGeometry(0.65, 0.85),
        new THREE.MeshStandardMaterial({
            color: 0x292a25,
            side: THREE.DoubleSide
        })
    );

    entrance.position.set(0, 0.42, 1.02);
    group.add(entrance);

    group.position.set(x, 0, z);
    group.scale.setScalar(scale);
    scene.add(group);

    return group;
}

function createLog(x, z, length, rotation) {
    const log = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.12, 0.15, length, 8
        ),
        barkMaterial
    );

    log.rotation.z = Math.PI / 2;
    log.rotation.y = rotation;
    log.position.set(x, 0.15, z);
    scene.add(log);
}

// Campfire glow and animated flames.
const campfires = [];

function createCampfire(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const stoneMaterial = new THREE.MeshStandardMaterial({
        color: 0x66625a,
        roughness: 1
    });

    for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;

        const stone = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.23, 0),
            stoneMaterial
        );

        stone.position.set(
            Math.cos(angle) * 0.75,
            0.16,
            Math.sin(angle) * 0.75
        );

        group.add(stone);
    }

    const log1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.14, 1.15, 7),
        barkMaterial
    );

    log1.rotation.z = Math.PI / 2;
    log1.rotation.y = 0.25;
    log1.position.y = 0.23;
    group.add(log1);

    const log2 = log1.clone();
    log2.rotation.y = -0.8;
    group.add(log2);

    const flameMaterials = [
        new THREE.MeshBasicMaterial({
            color: 0xff4b0b,
            transparent: true,
            opacity: 0.85
        }),
        new THREE.MeshBasicMaterial({
            color: 0xffa51c,
            transparent: true,
            opacity: 0.9
        }),
        new THREE.MeshBasicMaterial({
            color: 0xffe6a0,
            transparent: true,
            opacity: 0.95
        })
    ];

    const flames = [];

    for (let i = 0; i < 3; i++) {
        const flame = new THREE.Mesh(
            new THREE.ConeGeometry(
                0.32 - i * 0.055,
                0.85 - i * 0.13,
                7
            ),
            flameMaterials[i]
        );

        flame.position.set(
            (Math.random() - 0.5) * 0.18,
            0.6 + i * 0.08,
            (Math.random() - 0.5) * 0.18
        );

        group.add(flame);
        flames.push(flame);
    }

    const light = new THREE.PointLight(0xff7824, 3.5, 13);
    light.position.set(0, 1.2, 0);
    group.add(light);

    scene.add(group);

    campfires.push({
        group,
        flames,
        light,
        baseIntensity: 3.5,
        phase: Math.random() * 10
    });

    return group;
}

function createCampsite(x, z, tentColor) {
    createTent(x, z, tentColor, 1.0);
    createTent(x + 3.2, z - 1.2, 0x526d9c, 0.8);

    createCampfire(x + 1.5, z + 3.1);

    createLog(x - 0.5, z + 4.2, 1.8, 0.3);
    createLog(x + 3.2, z + 4.1, 1.8, -0.3);

    // Camp lantern.
    const lantern = new THREE.PointLight(0xffc66b, 0.6, 6);
    lantern.position.set(x - 2, 1.5, z + 1);
    scene.add(lantern);
}

createCampsite(-12, -38, 0xb94c35);
createCampsite(13, -82, 0xc6a33b);
createCampsite(-13, -155, 0x3d8d75);

// ==================================================
// WATERFALL AND STREAM
// ==================================================

const cliff = new THREE.Mesh(
    new THREE.BoxGeometry(46, 42, 16),
    rockMaterial
);

cliff.position.set(0, 22, -139);
scene.add(cliff);

const snowShelf = new THREE.Mesh(
    new THREE.BoxGeometry(40, 1.4, 18),
    snowMaterial
);

snowShelf.position.set(0, 40, -136);
scene.add(snowShelf);

const waterfall = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 32, 8, 24),
    new THREE.MeshStandardMaterial({
        color: 0xc6efff,
        emissive: 0x2e829e,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.82,
        roughness: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false
    })
);

waterfall.position.set(0, 19, -129.8);
scene.add(waterfall);

const waterfallStreaks = [];

for (let i = 0; i < 32; i++) {
    const streak = new THREE.Mesh(
        new THREE.PlaneGeometry(
            0.035 + Math.random() * 0.09,
            1.2 + Math.random() * 4
        ),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
            depthWrite: false
        })
    );

    streak.position.set(
        (Math.random() - 0.5) * 11,
        3 + Math.random() * 31,
        -129.5
    );

    scene.add(streak);
    waterfallStreaks.push(streak);
}

const pool = new THREE.Mesh(
    new THREE.CircleGeometry(18, 64),
    new THREE.MeshStandardMaterial({
        color: 0x268aa2,
        emissive: 0x063746,
        emissiveIntensity: 0.22,
        roughness: 0.19,
        metalness: 0.18
    })
);

pool.rotation.x = -Math.PI / 2;
pool.position.set(0, 0.08, -113);
scene.add(pool);

// Stream geometry.
const streamVertices = [];
const streamIndices = [];

for (let i = 0; i <= 80; i++) {
    const z = -105 - i * 3;
    const x = Math.sin(i * 0.12) * 6;

    streamVertices.push(x - 1.7, 0.045, z);
    streamVertices.push(x + 1.7, 0.045, z);

    if (i < 80) {
        const a = i * 2;
        streamIndices.push(
            a, a + 2, a + 1,
            a + 1, a + 2, a + 3
        );
    }
}

const streamGeometry = new THREE.BufferGeometry();
streamGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(streamVertices, 3)
);
streamGeometry.setIndex(streamIndices);
streamGeometry.computeVertexNormals();

scene.add(
    new THREE.Mesh(
        streamGeometry,
        new THREE.MeshStandardMaterial({
            color: 0x3b9db5,
            emissive: 0x0d5368,
            emissiveIntensity: 0.18,
            roughness: 0.23,
            metalness: 0.12
        })
    )
);

// ==================================================
// WATERFALL MIST
// ==================================================

const mistCount = 350;
const mistPositions = new Float32Array(mistCount * 3);
const mistSpeeds = new Float32Array(mistCount);

for (let i = 0; i < mistCount; i++) {
    mistPositions[i * 3] = (Math.random() - 0.5) * 18;
    mistPositions[i * 3 + 1] = Math.random() * 14;
    mistPositions[i * 3 + 2] = -117 + (Math.random() - 0.5) * 13;
    mistSpeeds[i] = 0.4 + Math.random() * 1.4;
}

const mistGeometry = new THREE.BufferGeometry();
mistGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(mistPositions, 3)
);

const mist = new THREE.Points(
    mistGeometry,
    new THREE.PointsMaterial({
        color: 0xe5f8ff,
        size: 0.12,
        transparent: true,
        opacity: 0.65,
        depthWrite: false
    })
);

scene.add(mist);

// ==================================================
// MAP SCREEN AT THE START
// ==================================================

const mapOverlay = document.createElement('div');

Object.assign(mapOverlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '20',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '18px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    background: 'linear-gradient(#10251deF, #081510f5)',
    color: '#fff'
});

mapOverlay.innerHTML = `
    <div style="
        width: min(580px, 100%);
        box-sizing: border-box;
        padding: 22px;
        border: 1px solid #7c9b7b;
        border-radius: 18px;
        background: #1b3028;
        box-shadow: 0 12px 45px #0009;
        text-align: center;
    ">
        <div style="
            color: #b9d6ae;
            font-size: 12px;
            letter-spacing: 4px;
            margin-bottom: 8px;
        ">ALPINE WILDERNESS</div>

        <h1 style="
            font-size: clamp(27px, 6vw, 42px);
            margin: 0 0 6px;
        ">Glacier Trail</h1>

        <p style="
            margin: 0 0 18px;
            color: #d4e2d4;
            line-height: 1.5;
        ">
            A mountain hike through pine forests, alpine camps,
            glacier-inspired peaks and a roaring waterfall.
        </p>

        <canvas id="trail-map" width="480" height="310" style="
            width: 100%;
            height: auto;
            border-radius: 12px;
            background: #dbe5c5;
            display: block;
            margin: 0 auto 16px;
        "></canvas>

        <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 9px;
            text-align: left;
            font-size: 13px;
            line-height: 1.55;
            margin-bottom: 18px;
        ">
            <div>📍 <b>Trailhead</b><br>Starting point</div>
            <div>⛺ <b>Campgrounds</b><br>Three rest stops</div>
            <div>🔥 <b>Campfires</b><br>At designated camps</div>
            <div>💧 <b>Waterfall</b><br>Scenic destination</div>
        </div>

        <div style="
            font-size: 12px;
            color: #c3d3c1;
            line-height: 1.6;
            margin-bottom: 17px;
        ">
            Keyboard: W/A/S/D or arrow keys to move and turn.<br>
            Space: toggle walking. Mouse drag: look around.<br>
            Phone VR: use motion sensors to look around.
        </div>

        <button id="start-hike" style="
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 10px;
            background: #d99046;
            color: #fff;
            font-size: 17px;
            font-weight: bold;
            cursor: pointer;
        ">START HIKE</button>

        <p style="
            font-size: 11px;
            color: #a9b9a7;
            margin: 12px 0 0;
        ">
            Inspired by Glacier National Park. This is a fictional
            3D trail, not an official park map.
        </p>
    </div>
`;

document.body.appendChild(mapOverlay);

function drawTrailMap() {
    const canvas = document.getElementById('trail-map');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#dbe5c5';
    ctx.fillRect(0, 0, w, h);

    // Mountain areas.
    ctx.fillStyle = '#8fa8a0';

    for (let i = 0; i < 8; i++) {
        const x = i * 70 - 15;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 45, 0);
        ctx.lineTo(x + 70, 65);
        ctx.lineTo(x + 30, 85);
        ctx.closePath();
        ctx.fill();
    }

    // Lake.
    ctx.fillStyle = '#77b9cb';
    ctx.beginPath();
    ctx.ellipse(360, 105, 74, 39, -0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('ALPINE LAKE', 323, 109);

    // Winding trail.
    ctx.beginPath();
    ctx.moveTo(240, 285);
    ctx.bezierCurveTo(160, 250, 300, 220, 220, 190);
    ctx.bezierCurveTo(145, 150, 240, 130, 230, 100);
    ctx.bezierCurveTo(220, 70, 270, 65, 270, 50);

    ctx.strokeStyle = '#fff7db';
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.strokeStyle = '#98794f';
    ctx.lineWidth = 4;
    ctx.stroke();

    function marker(x, y, color, label) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#263a2e';
        ctx.font = 'bold 13px Arial';
        ctx.fillText(label, x + 11, y + 4);
    }

    marker(240, 285, '#df7437', 'START');
    marker(200, 222, '#4b754d', 'CAMP 1');
    marker(220, 158, '#4b754d', 'CAMP 2');
    marker(230, 100, '#4b754d', 'CAMP 3');
    marker(270, 50, '#247cba', 'WATERFALL');

    ctx.fillStyle = '#263a2e';
    ctx.font = 'bold 15px Arial';
    ctx.fillText('TRAIL MAP', 16, 26);

    ctx.font = '12px Arial';
    ctx.fillText('Not to scale', 16, 45);
}

drawTrailMap();

// ==================================================
// MOVEMENT, MOUSE AND MOTION TRACKING
// ==================================================

let phoneVR = false;
let orientationAvailable = false;
let walking = false;

let walkSpeed = 3;
let yaw = 0;
let pitch = 0;

let dragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let lastFrameTime = 0;
let hasStarted = false;

const keys = new Set();

const initialPosition = new THREE.Vector3(0, 1.75, 12);
const originalCameraQuaternion = new THREE.Quaternion();

const stereo = new THREE.StereoCamera();
stereo.eyeSep = 0.064;

const deviceEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const sensorQuaternion = new THREE.Quaternion();
const deviceCorrection = new THREE.Quaternion();
const screenCorrection = new THREE.Quaternion();
const zee = new THREE.Vector3(0, 0, 1);

deviceCorrection.setFromEuler(
    new THREE.Euler(-Math.PI / 2, 0, 0)
);

function onDeviceOrientation(event) {
    if (event.alpha == null) return;

    orientationAvailable = true;

    const alpha = THREE.MathUtils.degToRad(event.alpha);
    const beta = THREE.MathUtils.degToRad(event.beta ?? 0);
    const gamma = THREE.MathUtils.degToRad(event.gamma ?? 0);

    deviceEuler.set(beta, alpha, -gamma, 'YXZ');

    sensorQuaternion.setFromEuler(deviceEuler);
    sensorQuaternion.multiply(deviceCorrection);

    const screenAngle = THREE.MathUtils.degToRad(
        window.screen.orientation?.angle ??
        window.orientation ??
        0
    );

    screenCorrection.setFromAxisAngle(zee, -screenAngle);

    camera.quaternion.copy(sensorQuaternion);
    camera.quaternion.multiply(screenCorrection);
}

function applyMouseLook(dx, dy) {
    yaw -= dx * 0.003;
    pitch -= dy * 0.003;

    pitch = THREE.MathUtils.clamp(
        pitch,
        -Math.PI * 0.46,
        Math.PI * 0.46
    );

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
}

function updateStatus() {
    status.textContent = walking
        ? 'Walking • Space or click to stop'
        : 'WASD / arrows to move • Space to walk';
}

// ==================================================
// HUD AND CONTROLS
// ==================================================

const hud = document.createElement('div');

Object.assign(hud.style, {
    position: 'fixed',
    top: '12px',
    left: '12px',
    zIndex: '10',
    display: 'none',
    color: '#fff',
    fontSize: '13px',
    lineHeight: '1.6',
    textShadow: '0 2px 5px #000',
    pointerEvents: 'none'
});

hud.innerHTML = `
    <div id="hud-location" style="font-weight:bold">TRAILHEAD</div>
    <div id="hud-speed">Speed: 3.0 m/s</div>
`;

document.body.appendChild(hud);

const status = document.createElement('div');
status.textContent = 'Glacier Trail';

Object.assign(status.style, {
    position: 'fixed',
    bottom: '14px',
    left: '0',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
    fontSize: '13px',
    textShadow: '0 2px 5px #000',
    pointerEvents: 'none',
    zIndex: '10',
    display: 'none'
});

document.body.appendChild(status);

const vrButton = document.createElement('button');
vrButton.textContent = 'ENTER PHONE VR';

Object.assign(vrButton.style, {
    position: 'fixed',
    right: '12px',
    top: '12px',
    padding: '10px 13px',
    border: 'none',
    borderRadius: '9px',
    background: '#e58b37',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 'bold',
    zIndex: '12',
    display: 'none'
});

document.body.appendChild(vrButton);

const mapButton = document.createElement('button');
mapButton.textContent = 'MAP';

Object.assign(mapButton.style, {
    position: 'fixed',
    right: '12px',
    top: '58px',
    padding: '9px 13px',
    border: '1px solid #d4e2d4',
    borderRadius: '9px',
    background: '#1b3028',
    color: '#fff',
    fontSize: '13px',
    zIndex: '12',
    display: 'none'
});

document.body.appendChild(mapButton);

function showHikingUI(visible) {
    hud.style.display = visible ? 'block' : 'none';
    status.style.display = visible ? 'block' : 'none';
    vrButton.style.display = visible ? 'block' : 'none';
    mapButton.style.display = visible ? 'block' : 'none';
}

function updateLocationLabel() {
    const z = camera.position.z;
    let label = 'FOREST TRAIL';

    if (z > -15) label = 'TRAILHEAD';
    else if (z > -65) label = 'CAMP SITE 1';
    else if (z > -105) label = 'CAMP SITE 2';
    else if (z > -145) label = 'WATERFALL AREA';
    else if (z > -185) label = 'CAMP SITE 3';
    else if (z > -230) label = 'MOUNTAIN LOOKOUT';
    else label = 'ALPINE WILDERNESS';

    const labelElement = document.getElementById('hud-location');
    const speedElement = document.getElementById('hud-speed');

    if (labelElement) labelElement.textContent = label;
    if (speedElement) {
        speedElement.textContent = `Speed: ${walkSpeed.toFixed(1)} m/s`;
    }
}

// ==================================================
// START HIKE AND MAP BUTTON
// ==================================================

document.getElementById('start-hike').addEventListener('click', () => {
    hasStarted = true;
    mapOverlay.style.display = 'none';
    showHikingUI(true);
    renderer.domElement.focus();
    updateLocationLabel();
});

mapButton.addEventListener('click', () => {
    walking = false;
    mapOverlay.style.display = 'flex';
    drawTrailMap();
});

// ==================================================
// KEYBOARD SUPPORT
// ==================================================

document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    keys.add(key);

    if (
        ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ']
            .includes(key)
    ) {
        event.preventDefault();
    }

    if (event.code === 'Space' && !event.repeat && hasStarted) {
        walking = !walking;
        updateStatus();
    }

    if (key === 'm' && hasStarted) {
        mapOverlay.style.display =
            mapOverlay.style.display === 'flex' ? 'none' : 'flex';

        drawTrailMap();
    }

    if (key === 'escape' && phoneVR) {
        exitVR();
    }
});

document.addEventListener('keyup', event => {
    keys.delete(event.key.toLowerCase());
});

// ==================================================
// MOUSE SUPPORT
// ==================================================

let mouseDownX = 0;
let mouseDownY = 0;
let mouseDragged = false;

renderer.domElement.addEventListener('mousedown', event => {
    if (event.button !== 0) return;

    dragging = true;
    mouseDragged = false;

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;

    mouseDownX = event.clientX;
    mouseDownY = event.clientY;
});

window.addEventListener('mousemove', event => {
    if (!dragging) return;

    const dx = event.clientX - lastMouseX;
    const dy = event.clientY - lastMouseY;

    if (
        Math.abs(event.clientX - mouseDownX) > 4 ||
        Math.abs(event.clientY - mouseDownY) > 4
    ) {
        mouseDragged = true;
    }

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;

    if (!(phoneVR && orientationAvailable)) {
        applyMouseLook(dx, dy);
    }
});

window.addEventListener('mouseup', () => {
    dragging = false;
});

renderer.domElement.addEventListener('click', () => {
    if (mouseDragged || !hasStarted) return;

    walking = !walking;
    updateStatus();
});

renderer.domElement.addEventListener('contextmenu', event => {
    event.preventDefault();
});

renderer.domElement.addEventListener('wheel', event => {
    walkSpeed += event.deltaY < 0 ? 0.5 : -0.5;
    walkSpeed = THREE.MathUtils.clamp(walkSpeed, 0.5, 10);
    updateLocationLabel();
}, { passive: true });

// ==================================================
// VR ENTER / EXIT
// ==================================================

async function enterVR() {
    try {
        if (!window.isSecureContext) {
            status.textContent = 'Phone VR requires HTTPS.';
            return;
        }

        if (
            typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function'
        ) {
            const permission =
                await DeviceOrientationEvent.requestPermission();

            if (permission !== 'granted') {
                status.textContent = 'Motion permission denied.';
                return;
            }
        }

        window.addEventListener(
            'deviceorientation',
            onDeviceOrientation
        );

        phoneVR = true;
        orientationAvailable = false;

        try {
            await document.documentElement.requestFullscreen?.();
        } catch (_) {}

        try {
            await window.screen.orientation?.lock?.('landscape');
        } catch (_) {}

        calculateLensLayout();
        drawLensMask();
        lensMask.style.display = 'block';

        vrButton.textContent = 'EXIT VR';
    } catch (error) {
        console.error(error);
        status.textContent = 'Could not enable motion tracking.';
    }
}

async function exitVR() {
    phoneVR = false;
    orientationAvailable = false;

    window.removeEventListener(
        'deviceorientation',
        onDeviceOrientation
    );

    lensMask.style.display = 'none';
    vrButton.textContent = 'ENTER PHONE VR';

    if (document.fullscreenElement) {
        try {
            await document.exitFullscreen();
        } catch (_) {}
    }

    try {
        await window.screen.orientation?.unlock?.();
    } catch (_) {}

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
}

vrButton.addEventListener('click', () => {
    if (phoneVR) exitVR();
    else enterVR();
});

// ==================================================
// STEREO RENDERING
// ==================================================

function renderEye(eyeCamera, x, y, width, height) {
    renderer.setViewport(x, y, width, height);
    renderer.setScissor(x, y, width, height);
    renderer.clear(true, true, true);
    renderer.render(scene, eyeCamera);
}

// ==================================================
// MAIN LOOP
// ==================================================

function animate(time = 0) {
    const dt = Math.min(
        (time - (lastFrameTime || time)) / 1000,
        0.05
    );

    lastFrameTime = time;

    if (hasStarted) {
        let forward = 0;
        let sideways = 0;

        if (walking) forward += 1;

        if (keys.has('w') || keys.has('arrowup')) forward += 1;
        if (keys.has('s') || keys.has('arrowdown')) forward -= 1;
        if (keys.has('a')) sideways -= 1;
        if (keys.has('d')) sideways += 1;

        if (keys.has('arrowleft')) yaw += dt * 1.5;
        if (keys.has('arrowright')) yaw -= dt * 1.5;

        if (forward !== 0 || sideways !== 0) {
            // Derive forward direction from the camera view.
            // This allows walking in the direction the phone is facing.
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);

            direction.y = 0;

            if (direction.lengthSq() > 0) {
                direction.normalize();

                const right = new THREE.Vector3(
                    -direction.z,
                    0,
                    direction.x
                );

                camera.position.addScaledVector(
                    direction,
                    forward * walkSpeed * dt
                );

                camera.position.addScaledVector(
                    right,
                    sideways * walkSpeed * dt
                );
            }
        }
    }

    camera.position.y = 1.75;

    // Animate waterfall streaks.
    for (const streak of waterfallStreaks) {
        streak.position.y -= dt * 5;

        if (streak.position.y < 3) {
            streak.position.y = 34;
        }
    }

    // Animate campfire flames and flickering light.
    for (const fire of campfires) {
        const flicker =
            0.82 + Math.sin(time * 0.009 + fire.phase) * 0.16;

        fire.light.intensity = fire.baseIntensity * flicker;

        fire.flames.forEach((flame, index) => {
            flame.scale.y =
                0.8 + 0.35 * Math.sin(
                    time * 0.012 + fire.phase + index
                );

            flame.rotation.y += dt * (index + 1) * 0.3;
        });
    }

    // Animate waterfall mist.
    const mistArray = mist.geometry.attributes.position.array;

    for (let i = 0; i < mistCount; i++) {
        mistArray[i * 3 + 1] += dt * mistSpeeds[i];
        mistArray[i * 3] += Math.sin(time * 0.0006 + i) * dt * 0.15;

        if (mistArray[i * 3 + 1] > 14) {
            mistArray[i * 3 + 1] = 0;
        }
    }

    mist.geometry.attributes.position.needsUpdate = true;

    if (!(phoneVR && orientationAvailable)) {
        camera.rotation.order = 'YXZ';
        camera.rotation.y = yaw;
        camera.rotation.x = pitch;
    }

    camera.updateMatrixWorld(true);

    updateLocationLabel();

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, screenWidth, screenHeight);
    renderer.clear(true, true, true);

    if (!phoneVR) {
        camera.aspect = screenWidth / screenHeight;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
        return;
    }

    const {
        leftX,
        rightX,
        topY,
        width,
        height
    } = lensLayout;

    const eyeWidth = Math.round(width);
    const eyeHeight = Math.round(height);
    const eyeY = Math.round(screenHeight - topY - height);

    if (eyeWidth <= 0 || eyeHeight <= 0) return;

    camera.aspect = eyeWidth / eyeHeight;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    stereo.eyeSep = 0.064;
    stereo.update(camera);

    renderer.setScissorTest(true);

    renderEye(
        stereo.cameraL,
        Math.round(leftX),
        eyeY,
        eyeWidth,
        eyeHeight
    );

    renderEye(
        stereo.cameraR,
        Math.round(rightX),
        eyeY,
        eyeWidth,
        eyeHeight
    );

    renderer.setScissorTest(false);
}

renderer.setAnimationLoop(animate);

// ==================================================
// RESIZE HANDLING
// ==================================================

function resizeScene() {
    renderer.setPixelRatio(1);
    renderer.setSize(window.innerWidth, window.innerHeight);

    calculateLensLayout();
    drawLensMask();

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    lensMask.style.display = phoneVR ? 'block' : 'none';
}

window.addEventListener('resize', resizeScene);
window.addEventListener('orientationchange', resizeScene);

resizeScene();


import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

document.body.replaceChildren();
document.body.style.cssText = 'margin:0;padding:0;overflow:hidden;background:#000;font-family:Arial,sans-serif;';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91b9ce);
scene.fog = new THREE.FogExp2(0x91b9ce, 0.008);

const camera = new THREE.PerspectiveCamera(
    80, window.innerWidth / window.innerHeight, 0.1, 1200
);

const playerPosition = new THREE.Vector3(0, 1.7, 5);
const originalCameraPosition = playerPosition.clone();
const originalCameraQuaternion = new THREE.Quaternion();
camera.position.copy(playerPosition);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
});

renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;
renderer.xr.enabled = false;
renderer.setClearColor(0x000000, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

Object.assign(renderer.domElement.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    zIndex: '1',
    touchAction: 'none'
});

document.body.appendChild(renderer.domElement);

// ============================================================
// PHONE VR LENS MASK AND LAYOUT
// Preserve the two-eye viewport layout and stereo render flow.
// ============================================================

const lensMask = document.createElement('canvas');
const lensContext = lensMask.getContext('2d');

Object.assign(lensMask.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    zIndex: '2',
    pointerEvents: 'none',
    display: 'none'
});

document.body.appendChild(lensMask);

const lensLayout = {
    leftX: 0,
    rightX: 0,
    topY: 0,
    width: 0,
    height: 0,
    centerX: 0,
    centerY: 0,
    gap: 0
};

function calculateLensLayout() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const lensWidth = Math.min(height * 0.78, width * 0.365);
    const lensHeight = Math.min(height * 0.775, lensWidth);
    const centerX = width / 2;
    const centerY = height * 0.562;
    const gap = width * 0.019;

    Object.assign(lensLayout, {
        leftX: centerX - gap / 2 - lensWidth,
        rightX: centerX + gap / 2,
        topY: centerY - lensHeight / 2,
        width: lensWidth,
        height: lensHeight,
        centerX,
        centerY,
        gap
    });
}

function drawLensMask() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    lensMask.width = Math.round(width * pixelRatio);
    lensMask.height = Math.round(height * pixelRatio);

    lensContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    lensContext.clearRect(0, 0, width, height);
    lensContext.globalCompositeOperation = 'source-over';
    lensContext.fillStyle = '#000';
    lensContext.fillRect(0, 0, width, height);

    const {
        leftX, rightX, topY, width: w, height: h,
        centerX, centerY
    } = lensLayout;

    function drawLens(x) {
        const y = topY;

        lensContext.beginPath();
        lensContext.moveTo(x + w * 0.055, y + h * 0.045);

        lensContext.bezierCurveTo(
            x + w * 0.28, y - h * 0.015,
            x + w * 0.70, y - h * 0.015,
            x + w * 0.945, y + h * 0.045
        );

        lensContext.bezierCurveTo(
            x + w * 1.015, y + h * 0.20,
            x + w * 1.015, y + h * 0.38,
            x + w * 0.985, y + h * 0.61
        );

        lensContext.bezierCurveTo(
            x + w * 0.97, y + h * 0.80,
            x + w * 0.95, y + h * 0.91,
            x + w * 0.935, y + h * 0.945
        );

        lensContext.bezierCurveTo(
            x + w * 0.72, y + h * 1.015,
            x + w * 0.28, y + h * 1.015,
            x + w * 0.065, y + h * 0.945
        );

        lensContext.bezierCurveTo(
            x - w * 0.015, y + h * 0.78,
            x - w * 0.015, y + h * 0.39,
            x + w * 0.025, y + h * 0.20
        );

        lensContext.bezierCurveTo(
            x + w * 0.03, y + h * 0.12,
            x + w * 0.04, y + h * 0.075,
            x + w * 0.055, y + h * 0.045
        );

        lensContext.closePath();
        lensContext.fill();
    }

    lensContext.globalCompositeOperation = 'destination-out';
    drawLens(leftX);
    drawLens(rightX);

    lensContext.globalCompositeOperation = 'source-over';
    lensContext.fillStyle = '#fff';
    lensContext.strokeStyle = '#fff';
    lensContext.beginPath();
    lensContext.moveTo(centerX, height * 0.61);
    lensContext.lineTo(centerX, height);
    lensContext.lineWidth = 2;
    lensContext.stroke();

    const dotRadius = Math.max(1, width * 0.0013);

    for (const x of [leftX + w * 0.52, rightX + w * 0.48]) {
        lensContext.beginPath();
        lensContext.arc(x, centerY, dotRadius, 0, Math.PI * 2);
        lensContext.fill();
    }

    lensContext.globalCompositeOperation = 'source-over';
}

calculateLensLayout();
drawLensMask();

// ============================================================
// LIGHTING AND ENVIRONMENT
// ============================================================

scene.add(new THREE.HemisphereLight(0xd9eeff, 0x34462a, 1.65));

const sunlight = new THREE.DirectionalLight(0xffedcf, 2.0);
sunlight.position.set(-25, 40, 15);
scene.add(sunlight);

const fillLight = new THREE.DirectionalLight(0x9ec7ff, 0.45);
fillLight.position.set(20, 15, -30);
scene.add(fillLight);

const materials = {
    grass: new THREE.MeshStandardMaterial({ color: 0x426a36, roughness: 1 }),
    dirt: new THREE.MeshStandardMaterial({ color: 0x806044, roughness: 1 }),
    dirtEdge: new THREE.MeshStandardMaterial({ color: 0x5c4834, roughness: 1 }),
    bark: new THREE.MeshStandardMaterial({ color: 0x65402a, roughness: 1 }),
    leaves: [
        new THREE.MeshStandardMaterial({ color: 0x245638, roughness: 1 }),
        new THREE.MeshStandardMaterial({ color: 0x2e6539, roughness: 1 }),
        new THREE.MeshStandardMaterial({ color: 0x19472e, roughness: 1 })
    ],
    rock: new THREE.MeshStandardMaterial({ color: 0x777c76, roughness: 1 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x77502f, roughness: 1 }),
    woodLight: new THREE.MeshStandardMaterial({ color: 0xb38a51, roughness: 1 }),
    water: new THREE.MeshStandardMaterial({
        color: 0x4bafcb,
        roughness: 0.23,
        metalness: 0.05,
        transparent: true,
        opacity: 0.88
    })
};

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    materials.grass
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.08;
scene.add(ground);

// ============================================================
// FOREST TREES
// ============================================================

function createTree(x, z, scale = 1, variant = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);

    const trunkHeight = 2.8 + (variant % 3) * 0.25;

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.32, trunkHeight, 8),
        materials.bark
    );
    trunk.position.y = trunkHeight / 2;
    group.add(trunk);

    const leafMaterial = materials.leaves[variant % materials.leaves.length];

    if (variant % 4 === 0) {
        const crown = new THREE.Mesh(
            new THREE.SphereGeometry(1.7, 8, 7),
            leafMaterial
        );
        crown.position.y = trunkHeight + 0.7;
        crown.scale.set(0.85, 1.25, 0.85);
        group.add(crown);
    } else {
        for (let i = 0; i < 3; i++) {
            const cone = new THREE.Mesh(
                new THREE.ConeGeometry(1.65 - i * 0.27, 2.5, 8),
                leafMaterial
            );
            cone.position.y = trunkHeight + 0.45 + i * 0.9;
            group.add(cone);
        }
    }

    scene.add(group);
    return group;
}

// A clear corridor is deliberately left along the main trail.
let seed = 1947;
function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}

for (let i = 0; i < 340; i++) {
    const z = 25 - random() * 210;
    const side = random() < 0.5 ? -1 : 1;
    const x = side * (5.3 + random() * 42);

    createTree(x, z, 0.75 + random() * 1.25, Math.floor(random() * 5));
}

// Extra trees around the off-trail clearings, leaving the interiors open.
[
    [-15, -36, 1.4], [-19, -41, 1.1], [-11, -45, 1.5],
    [-22, -48, 1.3], [-13, -52, 1.1],
    [18, -69, 1.5], [23, -73, 1.2], [27, -77, 1.5],
    [17, -81, 1.4], [25, -86, 1.1],
    [-21, -108, 1.4], [-26, -113, 1.5], [-18, -118, 1.2],
    [-29, -121, 1.3], [-17, -125, 1.5]
].forEach((p, i) => createTree(p[0], p[1], p[2], i % 4));

// Fern-like undergrowth made from small leafy shapes.
function createBush(x, z, scale = 1) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);

    for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(
            new THREE.ConeGeometry(0.24, 1.05, 5),
            materials.leaves[i % materials.leaves.length]
        );
        leaf.position.set(
            Math.cos(i * 1.25) * 0.25,
            0.4,
            Math.sin(i * 1.25) * 0.25
        );
        leaf.rotation.z = Math.cos(i * 1.25) * 0.65;
        leaf.rotation.x = Math.sin(i * 1.25) * 0.65;
        group.add(leaf);
    }

    scene.add(group);
}

for (let i = 0; i < 170; i++) {
    const z = 15 - random() * 165;
    const side = random() < 0.5 ? -1 : 1;
    const x = side * (3.2 + random() * 14);

    if (Math.abs(x) < 3.1 && z > -130) continue;
    createBush(x, z, 0.5 + random() * 1.1);
}

// ============================================================
// WALKABLE DIRT TRAILS
// Ribbon geometry follows each curve and visibly joins junctions.
// ============================================================

function createTrail(points, width = 2.5, edgeWidth = 0.35) {
    const curve = new THREE.CatmullRomCurve3(
        points.map(p => new THREE.Vector3(p[0], 0.015, p[1]))
    );

    const segments = Math.max(24, points.length * 18);
    const vertices = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const point = curve.getPoint(t);
        const tangent = curve.getTangent(t).normalize();
        const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        for (const offset of [-width / 2 - edgeWidth, -width / 2, width / 2, width / 2 + edgeWidth]) {
            vertices.push(
                point.x + side.x * offset,
                0.02,
                point.z + side.z * offset
            );
            uvs.push(t * 12, (offset + width / 2 + edgeWidth) / (width + edgeWidth * 2));
        }
    }

    for (let i = 0; i < segments; i++) {
        const a = i * 4;
        const b = a + 4;

        for (let j = 0; j < 3; j++) {
            indices.push(a + j, b + j, a + j + 1);
            indices.push(a + j + 1, b + j, b + j + 1);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const edgeMesh = new THREE.Mesh(geometry, materials.dirtEdge);
    edgeMesh.position.y = -0.003;
    scene.add(edgeMesh);

    // Narrower central strip gives the trail a worn-earth look.
    const centerVertices = [];
    const centerIndices = [];

    for (let i = 0; i <= segments; i++) {
        const point = curve.getPoint(i / segments);
        const tangent = curve.getTangent(i / segments).normalize();
        const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        centerVertices.push(
            point.x - side.x * width * 0.42, 0.028, point.z - side.z * width * 0.42,
            point.x + side.x * width * 0.42, 0.028, point.z + side.z * 0.42
        );

        if (i < segments) {
            const a = i * 2;
            centerIndices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
    }

    const centerGeometry = new THREE.BufferGeometry();
    centerGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(centerVertices, 3)
    );
    centerGeometry.setIndex(centerIndices);
    centerGeometry.computeVertexNormals();

    scene.add(new THREE.Mesh(centerGeometry, materials.dirt));

    return curve;
}

// Main route from the trailhead toward the waterfall.
createTrail([
    [0, 8], [0.1, 2], [-0.4, -5], [0.5, -12],
    [1.5, -19], [0.4, -27], [-0.5, -35],
    [1.3, -43], [2.7, -52], [2.4, -61],
    [0.8, -70], [0.2, -80], [-1.8, -91],
    [-2.4, -102], [-0.8, -113], [1.8, -124],
    [2.2, -136]
], 2.7, 0.35);

// Branch to the left-hand secluded campsite.
createTrail([
    [0.2, -22], [-2, -25], [-5.2, -28],
    [-8.5, -32], [-11, -37], [-12, -42],
    [-14, -46]
], 1.7, 0.28);

// Branch to a right-hand woodland campsite.
createTrail([
    [1.2, -45], [4.4, -47], [8, -51],
    [11, -56], [14, -62], [18, -67],
    [21, -73]
], 1.7, 0.28);

// Branch leading up to the mountain overlook.
createTrail([
    [0.3, -78], [-3.4, -81], [-7, -85],
    [-10.5, -90], [-14, -96], [-18, -101],
    [-22, -106], [-25, -111]
], 1.8, 0.3);

// Final spur toward the waterfall pool.
createTrail([
    [-0.8, -113], [3.8, -117], [7, -121],
    [8.5, -127], [8, -133]
], 1.8, 0.3);

// ============================================================
// REAL-WORLD-STYLE WOODEN TRAIL SIGNS
// ============================================================

function makeTextTexture(lines, options = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = options.background || '#6f4b2c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#c9a56a';
    ctx.lineWidth = 9;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    ctx.fillStyle = options.color || '#fff0c8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const list = Array.isArray(lines) ? lines : [lines];
    const lineHeight = 66;
    const startY = canvas.height / 2 - ((list.length - 1) * lineHeight) / 2;

    list.forEach((line, i) => {
        ctx.font = i === 0
            ? 'bold 34px Arial'
            : 'bold 28px Arial';
        ctx.fillText(line, canvas.width / 2, startY + i * lineHeight, 470);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function createSign(x, z, rotationY, entries) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotationY;

    const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 2.2, 0.16),
        materials.bark
    );
    post.position.y = 1.1;
    group.add(post);

    entries.forEach((entry, index) => {
        const board = new THREE.Mesh(
            new THREE.BoxGeometry(1.65, 0.48, 0.12),
            materials.woodLight
        );
        board.position.set(0, 1.8 - index * 0.54, 0);
        group.add(board);

        const signFace = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 0.38),
            new THREE.MeshStandardMaterial({
                map: makeTextTexture(entry, {
                    background: '#795331',
                    color: '#fff0c8'
                }),
                roughness: 1
            })
        );
        signFace.position.set(0, 1.8 - index * 0.54, 0.067);
        group.add(signFace);
    });

    scene.add(group);
    return group;
}

createSign(1.9, 1, -0.12, [
    ['FOREST TRAIL'],
    ['WATERFALL  1.2 km'],
    ['CAMP CLEARING  250 m']
]);

createSign(-3.2, -22, Math.PI * 0.35, [
    ['JUNCTION A'],
    ['HIDDEN CAMP  180 m'],
    ['MAIN TRAIL  250 m']
]);

createSign(4.3, -45, -Math.PI * 0.3, [
    ['JUNCTION B'],
    ['WOODLAND CAMP  300 m'],
    ['WATERFALL  800 m']
]);

createSign(-2.2, -78, Math.PI * 0.35, [
    ['OVERLOOK PATH'],
    ['MOUNTAIN VIEW  450 m'],
    ['WATERFALL  600 m']
]);

createSign(5.2, -113, -0.45, [
    ['WATERFALL'],
    ['VIEWING POOL  120 m'],
    ['TRAILHEAD  1.2 km']
]);

// Small trail markers with arrows at key junctions.
function createTrailMarker(x, z, color = 0xe7c77d) {
    const marker = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.8, 0.1),
        new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
    );
    marker.position.set(x, 0.55, z);
    scene.add(marker);
}
createTrailMarker(-1.8, -22);
createTrailMarker(3.5, -45);
createTrailMarker(-2.8, -78);

// ============================================================
// CAMPSITES
// ============================================================

function createTent(x, z, color = 0x8f4f32) {
    const tentMaterial = new THREE.MeshStandardMaterial({
        color,
        roughness: 1,
        side: THREE.DoubleSide
    });

    const tent = new THREE.Mesh(
        new THREE.ConeGeometry(1.45, 1.65, 4, 1),
        tentMaterial
    );
    tent.position.set(x, 0.83, z);
    tent.rotation.y = Math.PI / 4;
    scene.add(tent);

    const entrance = new THREE.Mesh(
        new THREE.PlaneGeometry(0.65, 0.85),
        new THREE.MeshStandardMaterial({
            color: 0x33251d,
            side: THREE.DoubleSide
        })
    );
    entrance.position.set(x, 0.48, z + 0.72);
    scene.add(entrance);
}

function createLog(x, z, length = 2.4, rotation = 0) {
    const log = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.2, length, 8),
        materials.bark
    );
    log.rotation.z = Math.PI / 2;
    log.rotation.y = rotation;
    log.position.set(x, 0.2, z);
    scene.add(log);
}

function createCampfire(x, z) {
    const stones = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.13, 6, 12),
        materials.rock
    );
    stones.rotation.x = Math.PI / 2;
    stones.position.set(x, 0.13, z);
    scene.add(stones);

    createLog(x, z, 1.1, 0.3);
    createLog(x, z, 1.1, -0.3);

    const flameMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8a24,
        transparent: true,
        opacity: 0.9
    });

    const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.36, 1.05, 7),
        flameMaterial
    );
    flame.position.set(x, 0.72, z);
    scene.add(flame);

    const innerFlame = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.62, 7),
        new THREE.MeshBasicMaterial({ color: 0xffdf78 })
    );
    innerFlame.position.set(x, 0.56, z);
    scene.add(innerFlame);

    const glow = new THREE.PointLight(0xff8a32, 1.6, 8);
    glow.position.set(x, 0.9, z);
    scene.add(glow);

    animatedFires.push({ flame, innerFlame, glow, baseY: 0.72 });
}

const animatedFires = [];

function createBench(x, z, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    const seat = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 0.14, 0.45),
        materials.wood
    );
    seat.position.y = 0.65;
    group.add(seat);

    for (const px of [-0.65, 0.65]) {
        const leg = new THREE.Mesh(
            new THREE.BoxGeometry(0.13, 0.65, 0.13),
            materials.bark
        );
        leg.position.set(px, 0.32, 0);
        group.add(leg);
    }

    scene.add(group);
}

// Campsite 1: secluded clearing reached by the left branch.
createTent(-15.8, -46, 0x7d5940);
createCampfire(-13.1, -47.1);
createBench(-15.3, -48.8, 0.3);
createLog(-11.8, -47.5, 2.2, 0.1);
createSign(-17.1, -42.2, 0.2, [
    ['HIDDEN CAMP'],
    ['QUIET CLEARING'],
    ['PLEASE LEAVE NO TRACE']
]);

// Campsite 2: farther off the right-hand path.
createTent(23.6, -76, 0x536d4e);
createTent(20.6, -79, 0x8a5a42);
createCampfire(23.3, -81);
createBench(19.9, -82, -0.4);
createLog(25.8, -80, 2.5, 0.4);
createSign(27.2, -70, -0.6, [
    ['WOODLAND CAMP'],
    ['REST AREA'],
    ['RETURN TO MAIN TRAIL']
]);

// ============================================================
// MOUNTAIN OVERLOOK: OPEN CLEARING AND DISTANT RIDGELINES
// ============================================================

function createMountain(x, z, width, height, color) {
    const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(width, height, 7, 1),
        new THREE.MeshStandardMaterial({
            color,
            roughness: 1,
            flatShading: true
        })
    );
    mountain.position.set(x, height / 2 - 2, z);
    mountain.rotation.y = random() * Math.PI;
    scene.add(mountain);
}

createMountain(-70, -185, 44, 48, 0x748d98);
createMountain(-34, -205, 52, 61, 0x627d8d);
createMountain(8, -215, 48, 56, 0x8299a0);
createMountain(51, -203, 58, 65, 0x617986);
createMountain(88, -192, 48, 50, 0x7c939b);
createMountain(-12, -230, 70, 70, 0x9caeb0);

// Low valley floor beneath the distant mountain range.
const valley = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 85),
    new THREE.MeshStandardMaterial({ color: 0x718f78, roughness: 1 })
);
valley.rotation.x = -Math.PI / 2;
valley.position.set(5, -0.01, -185);
scene.add(valley);

// A small overlook platform, not a teleport point.
const overlook = new THREE.Mesh(
    new THREE.CylinderGeometry(5.5, 6.3, 0.25, 12),
    new THREE.MeshStandardMaterial({ color: 0x8a7961, roughness: 1 })
);
overlook.position.set(-25, 0.03, -112);
scene.add(overlook);

createSign(-27.5, -107.5, 0.3, [
    ['MOUNTAIN OVERLOOK'],
    ['VALLEY VIEW'],
    ['STAY ON THE TRAIL']
]);

// A few trees around the edges frame the view but keep the centre open.
[
    [-33, -107, 1.3], [-35, -114, 1.5], [-17, -116, 1.2],
    [-18, -107, 1.3], [-32, -120, 1.5], [-15, -111, 1.1]
].forEach((p, i) => createTree(p[0], p[1], p[2], i % 4));

// ============================================================
// WATERFALL AND POOL
// ============================================================

const cliffMaterial = new THREE.MeshStandardMaterial({
    color: 0x656f66,
    roughness: 1
});

for (let i = 0; i < 7; i++) {
    const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(2 + random() * 2, 0),
        cliffMaterial
    );
    rock.position.set(4 + (random() - 0.5) * 9, 1.4 + random() * 2, -140 - random() * 3);
    rock.scale.set(1.4, 1.2, 0.8);
    scene.add(rock);
}

const waterfall = new THREE.Mesh(
    new THREE.PlaneGeometry(5.5, 8.5),
    new THREE.MeshBasicMaterial({
        color: 0x9be6f5,
        transparent: true,
        opacity: 0.83,
        side: THREE.DoubleSide
    })
);
waterfall.position.set(4, 4.2, -141.4);
scene.add(waterfall);

const pool = new THREE.Mesh(
    new THREE.CircleGeometry(5, 32),
    materials.water
);
pool.rotation.x = -Math.PI / 2;
pool.position.set(4, 0.04, -133.6);
scene.add(pool);

// ============================================================
// UI: START, MAP, AND TRAIL STATUS
// ============================================================

function makeButton(label, background = '#315d3b') {
    const button = document.createElement('button');
    button.textContent = label;
    Object.assign(button.style, {
        border: '1px solid rgba(255,255,255,.35)',
        borderRadius: '9px',
        padding: '11px 15px',
        background,
        color: '#fff',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 3px 12px rgba(0,0,0,.28)'
    });
    return button;
}

const status = document.createElement('div');
status.textContent = 'FOREST TRAIL  •  Trailhead';
Object.assign(status.style, {
    position: 'fixed',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#fff',
    background: 'rgba(14,32,20,.72)',
    borderRadius: '8px',
    padding: '9px 13px',
    fontSize: '13px',
    textShadow: '0 1px 3px #000',
    zIndex: '10',
    pointerEvents: 'none',
    maxWidth: '80vw',
    textAlign: 'center'
});
document.body.appendChild(status);

const vrButton = makeButton('ENTER PHONE VR', '#bd7027');
Object.assign(vrButton.style, {
    position: 'fixed',
    bottom: '18px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '20'
});
document.body.appendChild(vrButton);

const mapButton = makeButton('TRAIL MAP', '#315d3b');
Object.assign(mapButton.style, {
    position: 'fixed',
    top: '12px',
    right: '12px',
    zIndex: '20'
});
document.body.appendChild(mapButton);

const mapOverlay = document.createElement('div');
Object.assign(mapOverlay.style, {
    position: 'fixed',
    inset: '0',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(8,17,12,.88)',
    zIndex: '50',
    color: '#fff',
    padding: '20px',
    boxSizing: 'border-box'
});
document.body.appendChild(mapOverlay);

const mapPanel = document.createElement('div');
Object.assign(mapPanel.style, {
    width: 'min(560px, 94vw)',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: '#e8dfc6',
    color: '#302b20',
    borderRadius: '14px',
    padding: '22px',
    boxSizing: 'border-box',
    boxShadow: '0 12px 40px #0008'
});
mapOverlay.appendChild(mapPanel);

const mapTitle = document.createElement('h2');
mapTitle.textContent = 'FOREST TRAIL MAP';
mapTitle.style.marginTop = '0';
mapPanel.appendChild(mapTitle);

const mapIntro = document.createElement('p');
mapIntro.textContent = 'Follow the main dirt trail and choose a branch at each signpost. All side trails reconnect to the main hiking route.';
mapPanel.appendChild(mapIntro);

const mapRouteList = document.createElement('div');
mapRouteList.innerHTML = `
    <div style="border-top:1px solid #c8bda3;padding:12px 0">
      <b>MAIN TRAIL → WATERFALL</b><br>
      Follow the broad dirt path through the forest to the waterfall pool.
    </div>
    <div style="border-top:1px solid #c8bda3;padding:12px 0">
      <b>JUNCTION A → HIDDEN CAMP</b><br>
      Take the narrow path to the left for a quiet tent clearing and fire ring.
    </div>
    <div style="border-top:1px solid #c8bda3;padding:12px 0">
      <b>JUNCTION B → WOODLAND CAMP</b><br>
      Follow the right-hand branch to a secluded campsite deeper among the trees.
    </div>
    <div style="border-top:1px solid #c8bda3;padding:12px 0">
      <b>OVERLOOK PATH → MOUNTAIN VIEW</b><br>
      Take the left branch farther down the trail to reach an open view across the valley.
    </div>
`;
mapPanel.appendChild(mapRouteList);

const closeMapButton = makeButton('RETURN TO HIKE', '#315d3b');
closeMapButton.style.marginTop = '12px';
mapPanel.appendChild(closeMapButton);

const startOverlay = document.createElement('div');
Object.assign(startOverlay.style, {
    position: 'fixed',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(8,18,12,.72)',
    zIndex: '40',
    color: '#fff',
    padding: '20px',
    boxSizing: 'border-box'
});
document.body.appendChild(startOverlay);

const startPanel = document.createElement('div');
Object.assign(startPanel.style, {
    maxWidth: '440px',
    textAlign: 'center',
    background: 'rgba(19,39,25,.94)',
    border: '1px solid rgba(255,255,255,.2)',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 10px 35px #0008'
});
startOverlay.appendChild(startPanel);

const startTitle = document.createElement('h1');
startTitle.textContent = 'THE FOREST TRAIL';
startTitle.style.letterSpacing = '2px';
startPanel.appendChild(startTitle);

const startDescription = document.createElement('p');
startDescription.textContent =
    'Explore the winding trail, follow wooden signposts, discover secluded campsites, and find the mountain overlook.';
startDescription.style.lineHeight = '1.6';
startPanel.appendChild(startDescription);

const startInstructions = document.createElement('p');
startInstructions.textContent =
    'WASD / arrow keys: walk • Mouse drag: look • M: map';
startInstructions.style.fontSize = '13px';
startInstructions.style.opacity = '0.85';
startPanel.appendChild(startInstructions);

const startButton = makeButton('START HIKE', '#bd7027');
startButton.style.marginTop = '12px';
startPanel.appendChild(startButton);

// ============================================================
// MOVEMENT: KEYS MUST BE HELD; TAPS NEVER START WALKING
// ============================================================

const keys = new Set();
let hasStarted = false;
let mapOpen = false;
let mouseDown = false;
let mouseDragged = false;
let lastMouseX = 0;
let lastMouseY = 0;

let yaw = 0;
let pitch = 0;
const lookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const lookQuaternion = new THREE.Quaternion();

const WALK_SPEED = 4.0;
const TURN_SPEED = 1.55;
const PLAYER_HEIGHT = 1.7;
const WORLD_LIMIT = 80;

function clearMovementKeys() {
    keys.clear();
}

function openMap() {
    if (!hasStarted) return;
    mapOpen = true;
    mapOverlay.style.display = 'flex';
    clearMovementKeys();
}

function closeMap() {
    mapOpen = false;
    mapOverlay.style.display = 'none';
    clearMovementKeys();
}

mapButton.addEventListener('click', () => {
    if (mapOpen) closeMap();
    else openMap();
});

closeMapButton.addEventListener('click', closeMap);

startButton.addEventListener('click', () => {
    hasStarted = true;
    startOverlay.style.display = 'none';
    status.textContent = 'FOREST TRAIL  •  Trailhead';
    clearMovementKeys();
});

window.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();

    if ([
        'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '
    ].includes(key)) {
        event.preventDefault();
    }

    if (key === 'm') {
        if (mapOpen) closeMap();
        else openMap();
        return;
    }

    if (key === 'escape' && mapOpen) {
        closeMap();
        return;
    }

    if (!hasStarted || mapOpen) return;

    if ([
        'w', 'a', 's', 'd',
        'arrowup', 'arrowdown', 'arrowleft', 'arrowright'
    ].includes(key)) {
        keys.add(key);
    }
});

window.addEventListener('keyup', event => {
    keys.delete(event.key.toLowerCase());
});

window.addEventListener('blur', clearMovementKeys);

renderer.domElement.addEventListener('pointerdown', event => {
    if (event.button !== 0 || phoneVR || mapOpen || !hasStarted) return;

    mouseDown = true;
    mouseDragged = false;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    renderer.domElement.setPointerCapture?.(event.pointerId);
});

renderer.domElement.addEventListener('pointermove', event => {
    if (!mouseDown || phoneVR || mapOpen) return;

    const dx = event.clientX - lastMouseX;
    const dy = event.clientY - lastMouseY;

    if (Math.abs(dx) + Math.abs(dy) > 2) mouseDragged = true;

    yaw -= dx * 0.003;
    pitch -= dy * 0.003;
    pitch = THREE.MathUtils.clamp(pitch, -1.25, 1.25);

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
});

renderer.domElement.addEventListener('pointerup', () => {
    mouseDown = false;
});

renderer.domElement.addEventListener('pointercancel', () => {
    mouseDown = false;
});

renderer.domElement.addEventListener('click', () => {
    // Clicking never starts or toggles walking.
    mouseDragged = false;
});

// ============================================================
// PHONE ORIENTATION
// ============================================================

let phoneVR = false;
let orientationAvailable = false;
let deviceAlpha = 0;
let deviceBeta = 0;
let deviceGamma = 0;

const stereo = new THREE.StereoCamera();
stereo.eyeSep = 0.02;

const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const sensorQuaternion = new THREE.Quaternion();
const cameraCorrection = new THREE.Quaternion();
const screenCorrection = new THREE.Quaternion();
const zee = new THREE.Vector3(0, 0, 1);

cameraCorrection.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));

function onDeviceOrientation(event) {
    if (event.alpha === null) return;

    deviceAlpha = THREE.MathUtils.degToRad(event.alpha);
    deviceBeta = THREE.MathUtils.degToRad(event.beta ?? 0);
    deviceGamma = THREE.MathUtils.degToRad(event.gamma ?? 0);
    orientationAvailable = true;
}

function updatePhoneOrientation() {
    euler.set(deviceBeta, deviceAlpha, -deviceGamma, 'YXZ');
    sensorQuaternion.setFromEuler(euler);
    sensorQuaternion.multiply(cameraCorrection);

    const screenAngle = THREE.MathUtils.degToRad(
        window.screen.orientation?.angle ??
        window.orientation ??
        0
    );

    screenCorrection.setFromAxisAngle(zee, -screenAngle);
    camera.quaternion.copy(sensorQuaternion);
    camera.quaternion.multiply(screenCorrection);
}

function setControlsVisible(visible) {
    vrButton.style.display = visible ? 'block' : 'none';
    status.style.display = visible ? 'block' : 'none';
    mapButton.style.display = visible && hasStarted ? 'block' : 'none';
}

vrButton.addEventListener('click', async () => {
    if (phoneVR) {
        phoneVR = false;
        orientationAvailable = false;

        window.removeEventListener('deviceorientation', onDeviceOrientation);

        camera.position.copy(playerPosition);
        lensMask.style.display = 'none';
        vrButton.textContent = 'ENTER PHONE VR';
        setControlsVisible(true);

        if (document.fullscreenElement) {
            try { await document.exitFullscreen(); } catch (_) {}
        }

        try { await window.screen.orientation?.unlock?.(); } catch (_) {}

        resizeScene();
        return;
    }

    try {
        if (!window.isSecureContext) {
            status.textContent = 'Open this page using HTTPS to use phone VR.';
            return;
        }

        if (
            typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function'
        ) {
            const permission = await DeviceOrientationEvent.requestPermission();

            if (permission !== 'granted') {
                status.textContent = 'Motion permission denied.';
                return;
            }
        }

        window.addEventListener('deviceorientation', onDeviceOrientation);
        phoneVR = true;
        vrButton.textContent = 'EXIT PHONE VR';

        if (document.documentElement.requestFullscreen) {
            try { await document.documentElement.requestFullscreen(); } catch (_) {}
        }

        try { await window.screen.orientation?.lock?.('landscape'); } catch (_) {}

        calculateLensLayout();
        drawLensMask();
        lensMask.style.display = 'block';
        setControlsVisible(false);
        resizeScene();
    } catch (error) {
        console.error(error);
        phoneVR = false;
        lensMask.style.display = 'none';
        setControlsVisible(true);
        status.textContent = 'Could not start VR. Check browser permissions.';
    }
});

// ============================================================
// PLAYER UPDATE
// ============================================================

const forwardVector = new THREE.Vector3();
const rightVector = new THREE.Vector3();

function updatePlayer(delta) {
    if (!hasStarted || mapOpen) return;

    const turnLeft = keys.has('arrowleft');
    const turnRight = keys.has('arrowright');

    if (!phoneVR) {
        if (turnLeft) yaw += TURN_SPEED * delta;
        if (turnRight) yaw -= TURN_SPEED * delta;
    }

    lookEuler.set(pitch, yaw, 0, 'YXZ');
    lookQuaternion.setFromEuler(lookEuler);

    camera.quaternion.copy(lookQuaternion);

    // Walk direction follows the player's horizontal facing direction.
    forwardVector.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
    rightVector.set(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();

    const move = new THREE.Vector3();

    if (keys.has('w') || keys.has('arrowup')) move.add(forwardVector);
    if (keys.has('s') || keys.has('arrowdown')) move.sub(forwardVector);
    if (keys.has('a')) move.sub(rightVector);
    if (keys.has('d')) move.add(rightVector);

    if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(WALK_SPEED * delta);
        playerPosition.add(move);
    }

    playerPosition.x = THREE.MathUtils.clamp(playerPosition.x, -WORLD_LIMIT, WORLD_LIMIT);
    playerPosition.z = THREE.MathUtils.clamp(playerPosition.z, -230, 18);
    playerPosition.y = PLAYER_HEIGHT;

    camera.position.copy(playerPosition);

    updateTrailStatus();
}

function updateTrailStatus() {
    const x = playerPosition.x;
    const z = playerPosition.z;

    if (Math.abs(x + 25) < 8 && z < -104 && z > -122) {
        status.textContent = 'MOUNTAIN OVERLOOK  •  Valley view';
    } else if (Math.abs(x - 23) < 10 && z < -69 && z > -88) {
        status.textContent = 'WOODLAND CAMP  •  Secluded campsite';
    } else if (Math.abs(x + 14) < 10 && z < -39 && z > -54) {
        status.textContent = 'HIDDEN CAMP  •  Quiet clearing';
    } else if (z < -128) {
        status.textContent = 'WATERFALL  •  Viewing pool';
    } else if (z < -74) {
        status.textContent = 'MAIN TRAIL  •  Overlook junction';
    } else if (z < -42) {
        status.textContent = 'MAIN TRAIL  •  Junction B';
    } else if (z < -20) {
        status.textContent = 'MAIN TRAIL  •  Junction A';
    } else {
        status.textContent = 'FOREST TRAIL  •  Trailhead';
    }
}

// ============================================================
// ANIMATION AND ORIGINAL STEREO VIEWPORT FLOW
// ============================================================

const clock = new THREE.Clock();

function renderEye(eyeCamera, x, y, width, height) {
    renderer.setViewport(x, y, width, height);
    renderer.setScissor(x, y, width, height);
    renderer.clear(true, true, true);
    renderer.render(scene, eyeCamera);
}

function animate() {
    const delta = Math.min(clock.getDelta(), 0.05);
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    updatePlayer(delta);

    if (phoneVR && orientationAvailable) {
        updatePhoneOrientation();
    }

    // Gentle animated fire flicker.
    const elapsed = clock.elapsedTime;
    animatedFires.forEach((fire, i) => {
        fire.flame.scale.y = 0.85 + Math.sin(elapsed * 8 + i) * 0.18;
        fire.innerFlame.scale.y = 0.85 + Math.sin(elapsed * 11 + i) * 0.12;
        fire.glow.intensity = 1.3 + Math.sin(elapsed * 7 + i) * 0.3;
    });

    camera.position.copy(playerPosition);
    camera.updateMatrixWorld(true);

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

    const xLeft = Math.round(leftX);
    const xRight = Math.round(rightX);
    const viewWidth = Math.round(width);
    const viewHeight = Math.round(height);
    const viewY = Math.round(screenHeight - topY - height);

    camera.aspect = viewWidth / viewHeight;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    stereo.eyeSep = 0.02;
    stereo.update(camera);

    renderer.setScissorTest(true);

    renderEye(
        stereo.cameraL,
        xLeft,
        viewY,
        viewWidth,
        viewHeight
    );

    renderEye(
        stereo.cameraR,
        xRight,
        viewY,
        viewWidth,
        viewHeight
    );

    renderer.setScissorTest(false);
}

renderer.setAnimationLoop(animate);

function resizeScene() {
    renderer.setSize(window.innerWidth, window.innerHeight);

    calculateLensLayout();
    drawLensMask();

    if (!phoneVR) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }

    lensMask.style.display = phoneVR ? 'block' : 'none';
}

window.addEventListener('resize', resizeScene);
window.addEventListener('orientationchange', resizeScene);

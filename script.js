
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

document.body.replaceChildren();

document.body.style.cssText = `
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #000;
  touch-action: none;
`;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.FogExp2(0xa9c99a, 0.009);

const camera = new THREE.PerspectiveCamera(
  80,
  window.innerWidth / window.innerHeight,
  0.1,
  1200
);

camera.position.set(0, 2, 5);
camera.lookAt(0, 2, -20);

const originalCameraPosition = camera.position.clone();
const originalCameraQuaternion = camera.quaternion.clone();

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});

// IMPORTANT: viewport and lens coordinates use CSS pixels.
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.autoClear = false;
renderer.xr.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x87ceeb, 1);

Object.assign(renderer.domElement.style, {
  position: 'fixed',
  inset: '0',
  width: '100%',
  height: '100%',
  zIndex: '1',
  display: 'block'
});

document.body.appendChild(renderer.domElement);

// ==================================================
// LENS MASK
// ==================================================

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
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // Two side-by-side lens openings.
  const lensWidth = Math.min(
    screenWidth * 0.46,
    screenHeight * 0.78
  );

  const lensHeight = Math.min(
    screenHeight * 0.78,
    lensWidth * 1.08
  );

  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;
  const gap = screenWidth * 0.035;

  Object.assign(lensLayout, {
    leftX: Math.max(
      0,
      centerX - gap / 2 - lensWidth
    ),

    rightX: Math.min(
      screenWidth - lensWidth,
      centerX + gap / 2
    ),

    topY: centerY - lensHeight / 2,
    width: lensWidth,
    height: lensHeight,
    centerX,
    centerY,
    gap
  });
}

function drawLensMask() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // Same coordinate system as the renderer.
  lensMask.width = screenWidth;
  lensMask.height = screenHeight;

  lensMask.style.width = `${screenWidth}px`;
  lensMask.style.height = `${screenHeight}px`;

  lensContext.setTransform(1, 0, 0, 1, 0, 0);
  lensContext.clearRect(0, 0, screenWidth, screenHeight);

  lensContext.globalCompositeOperation = 'source-over';
  lensContext.fillStyle = '#000';
  lensContext.fillRect(0, 0, screenWidth, screenHeight);

  const {
    leftX,
    rightX,
    topY,
    width,
    height
  } = lensLayout;

  function cutLens(x) {
    const y = topY;
    const w = width;
    const h = height;

    lensContext.beginPath();
    lensContext.moveTo(x + w * 0.05, y + h * 0.05);

    lensContext.bezierCurveTo(
      x + w * 0.28, y,
      x + w * 0.72, y,
      x + w * 0.95, y + h * 0.05
    );

    lensContext.bezierCurveTo(
      x + w, y + h * 0.20,
      x + w, y + h * 0.80,
      x + w * 0.95, y + h * 0.95
    );

    lensContext.bezierCurveTo(
      x + w * 0.72, y + h,
      x + w * 0.28, y + h,
      x + w * 0.05, y + h * 0.95
    );

    lensContext.bezierCurveTo(
      x, y + h * 0.80,
      x, y + h * 0.20,
      x + w * 0.05, y + h * 0.05
    );

    lensContext.closePath();
    lensContext.fill();
  }

  // Punch transparent openings into the black mask.
  lensContext.globalCompositeOperation = 'destination-out';
  cutLens(leftX);
  cutLens(rightX);

  // Draw the central separator after cutting the holes.
  lensContext.globalCompositeOperation = 'source-over';
  lensContext.fillStyle = '#000';

  lensContext.fillRect(
    screenWidth / 2 - screenWidth * 0.018,
    0,
    screenWidth * 0.036,
    screenHeight
  );

  // Small central alignment markers.
  lensContext.fillStyle = '#fff';
  lensContext.strokeStyle = '#fff';
  lensContext.lineWidth = 2;

  lensContext.beginPath();
  lensContext.moveTo(screenWidth / 2, screenHeight * 0.62);
  lensContext.lineTo(screenWidth / 2, screenHeight);
  lensContext.stroke();

  const dotRadius = Math.max(1, screenWidth * 0.0013);

  for (const x of [
    leftX + width / 2,
    rightX + width / 2
  ]) {
    lensContext.beginPath();
    lensContext.arc(
      x,
      lensLayout.centerY,
      dotRadius,
      0,
      Math.PI * 2
    );
    lensContext.fill();
  }

  lensContext.globalCompositeOperation = 'source-over';
}

calculateLensLayout();
drawLensMask();

// ==================================================
// LIGHTING
// ==================================================

scene.add(
  new THREE.HemisphereLight(
    0xffffff,
    0x49613a,
    1.8
  )
);

const sunlight = new THREE.DirectionalLight(0xffffff, 2.2);
sunlight.position.set(10, 30, 10);
scene.add(sunlight);

// ==================================================
// GROUND AND FOREST PATH
// ==================================================

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1200, 1200),
  new THREE.MeshStandardMaterial({
    color: 0x3b7a3b,
    roughness: 1
  })
);

ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.03, -300);
scene.add(ground);

const path = new THREE.Mesh(
  new THREE.PlaneGeometry(7, 800),
  new THREE.MeshStandardMaterial({
    color: 0x967953,
    roughness: 1
  })
);

path.rotation.x = -Math.PI / 2;
path.position.set(0, 0, -350);
scene.add(path);

// ==================================================
// TREES
// ==================================================

const forestGroup = new THREE.Group();
scene.add(forestGroup);

const trunkGeometry = new THREE.CylinderGeometry(
  0.3, 0.4, 3.4, 8
);

const foliageGeometry1 = new THREE.ConeGeometry(
  1.6, 4.2, 8
);

const foliageGeometry2 = new THREE.ConeGeometry(
  1.2, 3.4, 8
);

const trunkMaterial = new THREE.MeshStandardMaterial({
  color: 0x6b3e26,
  roughness: 1
});

const leafMaterials = [
  new THREE.MeshStandardMaterial({ color: 0x176b2c, roughness: 1 }),
  new THREE.MeshStandardMaterial({ color: 0x237736, roughness: 1 }),
  new THREE.MeshStandardMaterial({ color: 0x105124, roughness: 1 }),
  new THREE.MeshStandardMaterial({ color: 0x31823b, roughness: 1 }),
  new THREE.MeshStandardMaterial({ color: 0x194b22, roughness: 1 })
];

function createTree(x, z, scale = 1, colorIndex = 0) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    trunkGeometry,
    trunkMaterial
  );

  trunk.position.y = 1.7;
  tree.add(trunk);

  const lowerLeaves = new THREE.Mesh(
    foliageGeometry1,
    leafMaterials[colorIndex % leafMaterials.length]
  );

  lowerLeaves.position.y = 4.0;
  tree.add(lowerLeaves);

  const upperLeaves = new THREE.Mesh(
    foliageGeometry2,
    leafMaterials[(colorIndex + 1) % leafMaterials.length]
  );

  upperLeaves.position.y = 6.0;
  tree.add(upperLeaves);

  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);

  forestGroup.add(tree);
}

// Deterministic random layout.
let seed = 123456;

function random() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

// Trees beside the trail.
for (let i = 0; i < 420; i++) {
  const side = random() < 0.5 ? -1 : 1;
  const x = side * (5.5 + random() * 65);
  const z = 12 - random() * 650;
  const scale = 0.7 + random() * 1.8;
  const colorIndex = Math.floor(random() * leafMaterials.length);

  createTree(x, z, scale, colorIndex);
}

// Extra trees in the distance.
for (let i = 0; i < 100; i++) {
  const x = (random() - 0.5) * 140;
  const z = -30 - random() * 500;

  if (Math.abs(x) > 5) {
    createTree(
      x,
      z,
      1 + random() * 1.6,
      Math.floor(random() * leafMaterials.length)
    );
  }
}

// ==================================================
// GRASS AND ROCKS
// ==================================================

const grassPositions = [];

for (let i = 0; i < 6000; i++) {
  const x = (random() - 0.5) * 150;
  const z = 10 - random() * 600;

  if (Math.abs(x) > 4) {
    grassPositions.push(x, 0.08, z);
  }
}

const grassGeometry = new THREE.BufferGeometry();

grassGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(grassPositions, 3)
);

const grass = new THREE.Points(
  grassGeometry,
  new THREE.PointsMaterial({
    color: 0xa1c65c,
    size: 0.12,
    sizeAttenuation: true
  })
);

scene.add(grass);

const rockGeometry = new THREE.DodecahedronGeometry(0.45, 0);

const rockMaterial = new THREE.MeshStandardMaterial({
  color: 0x77786a,
  roughness: 1
});

for (let i = 0; i < 150; i++) {
  const rock = new THREE.Mesh(rockGeometry, rockMaterial);

  rock.position.set(
    (random() - 0.5) * 100,
    0.18,
    5 - random() * 500
  );

  rock.scale.set(
    0.4 + random(),
    0.3 + random() * 0.5,
    0.4 + random()
  );

  scene.add(rock);
}

// ==================================================
// DEVICE ORIENTATION
// ==================================================

let phoneVR = false;
let orientationAvailable = false;

const stereo = new THREE.StereoCamera();
stereo.eyeSep = 0.064;

const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const sensorQuaternion = new THREE.Quaternion();
const cameraCorrection = new THREE.Quaternion();
const screenCorrection = new THREE.Quaternion();
const zee = new THREE.Vector3(0, 0, 1);

cameraCorrection.setFromEuler(
  new THREE.Euler(-Math.PI / 2, 0, 0)
);

function updatePhoneOrientation(event) {
  if (!event || event.alpha === null) return;

  orientationAvailable = true;

  const alpha = THREE.MathUtils.degToRad(event.alpha || 0);
  const beta = THREE.MathUtils.degToRad(event.beta || 0);
  const gamma = THREE.MathUtils.degToRad(event.gamma || 0);

  euler.set(beta, alpha, -gamma, 'YXZ');
  sensorQuaternion.setFromEuler(euler);
  sensorQuaternion.multiply(cameraCorrection);

  const angle =
    window.screen.orientation?.angle ??
    window.orientation ??
    0;

  screenCorrection.setFromAxisAngle(
    zee,
    -THREE.MathUtils.degToRad(angle)
  );

  camera.quaternion
    .copy(sensorQuaternion)
    .multiply(screenCorrection);
}

function onDeviceOrientation(event) {
  updatePhoneOrientation(event);
}

// ==================================================
// UI
// ==================================================

const vrButton = document.createElement('button');
vrButton.textContent = 'ENTER PHONE VR';

Object.assign(vrButton.style, {
  position: 'fixed',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '14px 22px',
  border: 'none',
  borderRadius: '10px',
  background: '#f28c28',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  zIndex: '10',
  cursor: 'pointer'
});

document.body.appendChild(vrButton);

const status = document.createElement('div');
status.textContent = 'Forest loaded — ready to enter VR';

Object.assign(status.style, {
  position: 'fixed',
  top: '12px',
  left: '5%',
  width: '90%',
  textAlign: 'center',
  color: '#fff',
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  textShadow: '0 1px 4px #000',
  pointerEvents: 'none',
  zIndex: '10'
});

document.body.appendChild(status);

// ==================================================
// ENTER / EXIT VR
// ==================================================

function enterVRDisplay() {
  calculateLensLayout();
  drawLensMask();

  lensMask.style.display = 'block';
  vrButton.textContent = 'EXIT PHONE VR';
  status.style.display = 'none';
}

function exitVRDisplay() {
  lensMask.style.display = 'none';
  vrButton.textContent = 'ENTER PHONE VR';
  status.style.display = 'block';
  status.textContent = 'Forest loaded — ready to enter VR';
}

async function requestOrientationPermission() {
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    const permission =
      await DeviceOrientationEvent.requestPermission();

    if (permission !== 'granted') {
      throw new Error('Motion permission was not granted.');
    }
  }
}

vrButton.addEventListener('click', async () => {
  if (phoneVR) {
    phoneVR = false;
    orientationAvailable = false;

    window.removeEventListener(
      'deviceorientation',
      onDeviceOrientation
    );

    camera.position.copy(originalCameraPosition);
    camera.quaternion.copy(originalCameraQuaternion);

    exitVRDisplay();

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (_) {}
    }

    try {
      window.screen.orientation?.unlock?.();
    } catch (_) {}

    resizeScene();
    return;
  }

  try {
    await requestOrientationPermission();

    window.addEventListener(
      'deviceorientation',
      onDeviceOrientation
    );

    phoneVR = true;

    enterVRDisplay();

    if (document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (_) {}
    }

    try {
      await window.screen.orientation?.lock?.('landscape');
    } catch (_) {}

    resizeScene();

    status.textContent = 'VR mode active';
  } catch (error) {
    console.warn(error);

    // Keep VR usable even if motion permission is unavailable.
    phoneVR = true;
    enterVRDisplay();

    status.style.display = 'block';
    status.textContent =
      'VR active. Motion tracking may require HTTPS and permission.';
  }
});

// ==================================================
// RESIZE
// ==================================================

function resizeScene() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);

  calculateLensLayout();
  drawLensMask();

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  lensMask.style.display = phoneVR ? 'block' : 'none';
}

window.addEventListener('resize', resizeScene);
window.addEventListener('orientationchange', resizeScene);

// ==================================================
// STEREO RENDERING
// ==================================================

function renderEye(eyeCamera, x, y, width, height) {
  renderer.setViewport(x, y, width, height);
  renderer.setScissor(x, y, width, height);
  renderer.clear(true, true, true);
  renderer.render(scene, eyeCamera);
}

function animate() {
  renderer.setAnimationLoop(animate);

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // Do not reset camera position every frame.
  // Device orientation controls the camera quaternion.
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

  const viewWidth = Math.round(width);
  const viewHeight = Math.round(height);

  const leftViewportX = Math.round(leftX);
  const rightViewportX = Math.round(rightX);

  // WebGL viewport Y coordinates start at the bottom.
  const viewportY = Math.round(
    screenHeight - topY - height
  );

  if (viewWidth <= 0 || viewHeight <= 0) return;

  camera.aspect = viewWidth / viewHeight;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);

  stereo.eyeSep = 0.064;
  stereo.update(camera);

  renderer.setScissorTest(true);

  renderEye(
    stereo.cameraL,
    leftViewportX,
    viewportY,
    viewWidth,
    viewHeight
  );

  renderEye(
    stereo.cameraR,
    rightViewportX,
    viewportY,
    viewWidth,
    viewHeight
  );

  renderer.setScissorTest(false);
}

// ==================================================
// START
// ==================================================

resizeScene();

// Use a single animation loop.
renderer.setAnimationLoop(animate);

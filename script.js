import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

document.body.replaceChildren();

document.body.style.cssText = `
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #000;
`;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
    80,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const originalCameraPosition = new THREE.Vector3(0, 2, 5);
const originalCameraQuaternion = new THREE.Quaternion();

camera.position.copy(originalCameraPosition);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;
renderer.xr.enabled = false;
renderer.setClearColor(0x000000, 1);

Object.assign(renderer.domElement.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    zIndex: '1'
});

document.body.appendChild(renderer.domElement);

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

    const lensWidth = Math.min(
        height * 0.78,
        width * 0.365
    );

    const lensHeight = Math.min(
        height * 0.775,
        lensWidth
    );

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
        leftX,
        rightX,
        topY,
        width: w,
        height: h,
        centerX,
        centerY
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

    for (const x of [
        leftX + w * 0.52,
        rightX + w * 0.48
    ]) {
        lensContext.beginPath();
        lensContext.arc(x, centerY, dotRadius, 0, Math.PI * 2);
        lensContext.fill();
    }

    lensContext.globalCompositeOperation = 'source-over';
}

calculateLensLayout();
drawLensMask();

scene.add(new THREE.HemisphereLight(0xffffff, 0x49613a, 1.5));

const sunlight = new THREE.DirectionalLight(0xffffff, 1.8);
sunlight.position.set(10, 20, 10);
scene.add(sunlight);

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x3b7a3b })
);

ground.rotation.x = -Math.PI / 2;
scene.add(ground);

function createTree(x, z, scale = 1) {
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 2, 8),
        new THREE.MeshStandardMaterial({ color: 0x6b3e26 })
    );

    trunk.position.set(x, scale, z);
    trunk.scale.setScalar(scale);
    scene.add(trunk);

    const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(1.3, 3, 8),
        new THREE.MeshStandardMaterial({ color: 0x176b2c })
    );

    leaves.position.set(x, 3.2 * scale, z);
    leaves.scale.setScalar(scale);
    scene.add(leaves);
}

[
    [-2.5, 1, 0.8],
    [2.8, -1, 0.9],
    [-4, -5, 1],
    [3, -6, 1],
    [-6, -10, 1],
    [5, -12, 1],
    [0, -15, 1],
    [-2, -3, 0.8],
    [2, -9, 1.2],
    [-9, -16, 1.4],
    [8, -20, 1.5],
    [-3, -25, 1.6],
    [4, -30, 1.7]
].forEach(([x, z, scale]) => createTree(x, z, scale));

let phoneVR = false;
let orientationAvailable = false;

const stereo = new THREE.StereoCamera();
stereo.eyeSep = 0.02;

const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const sensorQuaternion = new THREE.Quaternion();
const cameraCorrection = new THREE.Quaternion();
const screenCorrection = new THREE.Quaternion();
const zee = new THREE.Vector3(0, 0, 1);

cameraCorrection.setFromEuler(
    new THREE.Euler(-Math.PI / 2, 0, 0)
);

let deviceAlpha = 0;
let deviceBeta = 0;
let deviceGamma = 0;

function onDeviceOrientation(event) {
    if (event.alpha === null) return;

    deviceAlpha = THREE.MathUtils.degToRad(event.alpha);
    deviceBeta = THREE.MathUtils.degToRad(event.beta ?? 0);
    deviceGamma = THREE.MathUtils.degToRad(event.gamma ?? 0);

    orientationAvailable = true;
}

function updatePhoneOrientation() {
    euler.set(
        deviceBeta,
        deviceAlpha,
        -deviceGamma,
        'YXZ'
    );

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
status.textContent = 'Forest VR ready';

Object.assign(status.style, {
    position: 'fixed',
    top: '12px',
    left: '0',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    textShadow: '0 1px 4px #000',
    pointerEvents: 'none',
    zIndex: '10'
});

document.body.appendChild(status);

function setControlsVisible(visible) {
    vrButton.style.display = visible ? 'block' : 'none';
    status.style.display = visible ? 'block' : 'none';
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

        lensMask.style.display = 'none';
        vrButton.textContent = 'ENTER PHONE VR';
        setControlsVisible(true);

        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (_) {}
        }

        try {
            await window.screen.orientation?.unlock?.();
        } catch (_) {}

        resizeScene();
        return;
    }

    try {
        if (!window.isSecureContext) {
            status.textContent = 'Open this page using HTTPS to use VR.';
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
        vrButton.textContent = 'EXIT PHONE VR';

        if (document.documentElement.requestFullscreen) {
            try {
                await document.documentElement.requestFullscreen();
            } catch (_) {}
        }

        try {
            await window.screen.orientation?.lock?.('landscape');
        } catch (_) {}

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

function renderEye(eyeCamera, x, y, width, height) {
    renderer.setViewport(x, y, width, height);
    renderer.setScissor(x, y, width, height);
    renderer.clear(true, true, true);
    renderer.render(scene, eyeCamera);
}

function animate() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    camera.position.copy(originalCameraPosition);

    if (phoneVR && orientationAvailable) {
        updatePhoneOrientation();
    } else if (!phoneVR) {
        camera.quaternion.copy(originalCameraQuaternion);
    }

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

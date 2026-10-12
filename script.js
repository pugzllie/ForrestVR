
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const originalCameraPosition = new THREE.Vector3(0, 2, 5);
const originalCameraQuaternion = new THREE.Quaternion();

camera.position.copy(originalCameraPosition);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = false;

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#87ceeb';
document.body.appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(10, 20, 10);
scene.add(sunlight);

// Ground
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: 0x3b7a3b })
);

ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Trees
function createTree(x, z) {
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 2, 8),
        new THREE.MeshStandardMaterial({ color: 0x6b3e26 })
    );

    trunk.position.set(x, 1, z);
    scene.add(trunk);

    const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(1.3, 3, 8),
        new THREE.MeshStandardMaterial({ color: 0x176b2c })
    );

    leaves.position.set(x, 3.2, z);
    scene.add(leaves);
}

createTree(-4, -5);
createTree(3, -6);
createTree(-6, -10);
createTree(5, -12);
createTree(0, -15);

// Phone VR
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

    const angle = THREE.MathUtils.degToRad(
        window.screen.orientation?.angle ??
        window.orientation ??
        0
    );

    screenCorrection.setFromAxisAngle(zee, -angle);

    camera.quaternion.copy(sensorQuaternion);
    camera.quaternion.multiply(screenCorrection);
}

// VR Button
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
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    zIndex: '1000',
    cursor: 'pointer'
});

document.body.appendChild(vrButton);

// Status
const status = document.createElement('div');
status.textContent = 'Forest VR ready';

Object.assign(status.style, {
    position: 'fixed',
    top: '12px',
    left: '0',
    width: '100%',
    textAlign: 'center',
    color: '#ffffff',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    textShadow: '0 1px 4px #000000',
    pointerEvents: 'none',
    zIndex: '999'
});

document.body.appendChild(status);

// Start and stop VR
vrButton.addEventListener('click', async () => {
    if (!phoneVR) {
        try {
            if (!window.isSecureContext) {
                status.textContent =
                    'Use HTTPS for phone motion tracking.';
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

            document.body.style.background = '#000000';
            status.textContent =
                'VR active — turn your phone to look around';

            if (document.documentElement.requestFullscreen) {
                try {
                    await document.documentElement.requestFullscreen();
                } catch (_) {}
            }

            try {
                await window.screen.orientation?.lock?.('landscape');
            } catch (_) {}

        } catch (error) {
            console.error(error);
            status.textContent =
                'Could not start VR. Check browser permissions.';
        }
    } else {
        phoneVR = false;

        window.removeEventListener(
            'deviceorientation',
            onDeviceOrientation
        );

        camera.position.copy(originalCameraPosition);
        camera.quaternion.copy(originalCameraQuaternion);

        vrButton.textContent = 'ENTER PHONE VR';
        status.textContent = 'Forest VR ready';
        document.body.style.background = '#87ceeb';

        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (_) {}
        }
    }
});

// Rendering
function animate() {
    camera.position.copy(originalCameraPosition);

    if (phoneVR && orientationAvailable) {
        updatePhoneOrientation();
    } else if (!phoneVR) {
        camera.quaternion.copy(originalCameraQuaternion);
    }

    camera.updateMatrixWorld(true);

    if (phoneVR) {
        stereo.update(camera);

        const width = window.innerWidth;
        const height = window.innerHeight;
        const halfWidth = Math.floor(width / 2);

        renderer.setScissorTest(true);

        // Left eye
        renderer.setViewport(0, 0, halfWidth, height);
        renderer.setScissor(0, 0, halfWidth, height);
        renderer.render(scene, stereo.cameraL);

        // Right eye
        renderer.setViewport(
            halfWidth, 0, width - halfWidth, height
        );
        renderer.setScissor(
            halfWidth, 0, width - halfWidth, height
        );
        renderer.render(scene, stereo.cameraR);

        renderer.setScissorTest(false);
    } else {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setViewport(
            0, 0, window.innerWidth, window.innerHeight
        );

        renderer.render(scene, camera);
    }
}

renderer.setAnimationLoop(animate);

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});

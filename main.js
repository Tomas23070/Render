// === Escena base ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera3D.position.z = 2.5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === Crear puntos ===
const points = [];
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const geometry = new THREE.SphereGeometry(0.02, 8, 8);

for (let i = 0; i < 33; i++) {
  const point = new THREE.Mesh(geometry, material);
  scene.add(point);
  points.push(point);
}

// === Crear líneas del esqueleto ===
const connections = [
  [0, 1], [1, 2], [2, 3], [3, 7],        // Cara
  [0, 4], [4, 5], [5, 6], [6, 8],        // Cara y orejas
  [9, 10], [11, 12],                     // Ojos y hombros
  [11, 13], [13, 15],                    // Brazo izquierdo
  [12, 14], [14, 16],                    // Brazo derecho
  [11, 23], [12, 24],                    // Torso a caderas
  [23, 24],                             // Caderas
  [23, 25], [25, 27],                   // Pierna izquierda
  [24, 26], [26, 28],                   // Pierna derecha
  [27, 31], [28, 32],                   // Tobillos a pies
];

const lines = [];

const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
for (let [start, end] of connections) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    points[start].position,
    points[end].position
  ]);
  const line = new THREE.Line(geometry, lineMaterial);
  scene.add(line);
  lines.push({ geometry, start, end });
}

// === Animación ===
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera3D);
}
animate();

// === MediaPipe Pose ===
const video = document.getElementById('video');

const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

pose.onResults(results => {
  if (!results.poseLandmarks) return;

  for (let i = 0; i < results.poseLandmarks.length; i++) {
    const { x, y, z } = results.poseLandmarks[i];
    points[i].position.set((x - 0.5) * 2, -(y - 0.5) * 2, -z);
  }

  // === Actualizar líneas ===
  for (let { geometry, start, end } of lines) {
    const positions = new Float32Array([
      points[start].position.x, points[start].position.y, points[start].position.z,
      points[end].position.x, points[end].position.y, points[end].position.z
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.attributes.position.needsUpdate = true;
  }
});

// === Cámara ===
const cameraMP = new Camera(video, {
  onFrame: async () => {
    await pose.send({ image: video });
  },
  width: 640,
  height: 480
});
cameraMP.start();

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export function setupScene(container) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    35,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0.4, 7);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true, // transparent so the Tailwind bg-ink shows through
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Procedural environment map: gives the metal chassis's clearcoat/metalness
  // something to reflect. Without this, PBR metal materials read as flat and
  // dark regardless of how many directional lights point at them.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // Key light (mimics the reference's single strong top-left highlight)
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-3, 4, 5);
  scene.add(key);

  // Cool rim light from the back to separate the laptop from the black bg
  const rim = new THREE.DirectionalLight(0x6688ff, 1.1);
  rim.position.set(2, 1, -4);
  scene.add(rim);

  // Low ambient so shadow faces aren't pure black
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  function onResize() {
    const { clientWidth: w, clientHeight: h } = container;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  return { scene, camera, renderer, dispose: () => window.removeEventListener('resize', onResize) };
}

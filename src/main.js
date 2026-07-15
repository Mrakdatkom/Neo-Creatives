import './styles/main.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setupScene } from './three/setupScene.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

gsap.registerPlugin(ScrollTrigger);

const stage = document.getElementById('canvas-stage');
const videoEl = document.getElementById('screen-video');

const { scene, camera, renderer } = setupScene(stage);

// Load the 3D laptop model
const loader = new GLTFLoader();
let laptop;

loader.load('/models/laptop.gltf', (gltf) => {
  laptop = gltf.scene;

  // Find the screen mesh (adjust name to match your model)
  const screenMesh = laptop.getObjectByName('Screen') ||
    laptop.getObjectByName('screen') ||
    laptop.getObjectByName('Display');

  if (screenMesh) {
    // Apply video texture to the screen
    const screenMat = buildScreenMaterial(videoEl);
    screenMesh.material = screenMat;
    laptop.userData.screen = screenMesh;
  }

  // Position, scale, and rotate like the placeholder
  laptop.scale.setScalar(1.5);
  laptop.position.set(0, 0.1, 0);
  laptop.rotation.x = THREE.MathUtils.degToRad(10);
  laptop.rotation.y = THREE.MathUtils.degToRad(-20);

  scene.add(laptop);

  // Start animations after model loads
  setupAnimations(laptop);

  console.log('Laptop model loaded successfully!');
}, undefined, (error) => {
  console.error('Error loading laptop model:', error);
  // Fallback to procedural laptop if model fails to load
  import('./three/createLaptop.js').then(module => {
    const fallbackLaptop = module.createLaptop(videoEl);
    laptop = fallbackLaptop;
    laptop.scale.setScalar(1.5);
    laptop.position.set(0, 0.1, 0);
    scene.add(laptop);
    setupAnimations(laptop);
    console.log('Using fallback procedural laptop');
  });
});

// Helper function to create screen material with video
function buildScreenMaterial(videoEl) {
  let texture;
  let usingVideo = false;

  try {
    texture = new THREE.VideoTexture(videoEl);
    texture.colorSpace = THREE.SRGBColorSpace;
    usingVideo = true;
  } catch (err) {
    texture = null;
  }

  return new THREE.MeshBasicMaterial({
    color: usingVideo ? 0xffffff : 0x3a6ea8,
    map: usingVideo ? texture : null,
  });
}

// Setup animations (moved from bottom)
function setupAnimations(laptop) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Gentle entrance on load
  gsap.from(laptop.scale, {
    x: 0.85, y: 0.85, z: 0.85,
    duration: 1.4,
    ease: 'power3.out',
  });
  gsap.from(laptop.position, {
    y: -0.6,
    duration: 1.4,
    ease: 'power3.out',
  });

  if (!prefersReducedMotion) {
    gsap.timeline({
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
    })
      .to(laptop.rotation, { y: Math.PI * 0.35, x: -0.15 }, 0)
      .to(laptop.position, { y: 0.9, z: 1.2 }, 0)
      .to(camera.position, { y: 0.9 }, 0);
  }

  // Subtle idle sway
  gsap.to(laptop.rotation, {
    y: '+=0.06',
    duration: 3.2,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  });
}

// Video autoplay
videoEl.play().catch(() => { });

// ---- Render loop ----
function tick() {
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
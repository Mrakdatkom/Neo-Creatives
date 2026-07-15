import './styles/main.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setupScene } from './three/setupScene.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { createLaptop } from './three/createLaptop.js';

gsap.registerPlugin(ScrollTrigger);

const stage = document.getElementById('canvas-stage');
const imageEl = document.getElementById('screen-image');

const { scene, camera, renderer } = setupScene(stage);

// Load the 3D laptop model
const loader = new GLTFLoader();
let laptop;

loader.load('/models/laptop.gltf', (gltf) => {
  laptop = gltf.scene;

  // Find the screen mesh
  const screenMesh = laptop.getObjectByName('Screen') ||
    laptop.getObjectByName('screen') ||
    laptop.getObjectByName('Display');

  if (screenMesh) {
    // Create texture from image
    const texture = new THREE.Texture(imageEl);
    texture.colorSpace = THREE.SRGBColorSpace;

    if (imageEl.complete) {
      texture.needsUpdate = true;
    } else {
      imageEl.onload = () => {
        texture.needsUpdate = true;
        screenMesh.material.map = texture;
        screenMesh.material.needsUpdate = true;
      };
    }

    screenMesh.material = new THREE.MeshBasicMaterial({
      map: texture,
      color: 0xffffff,
    });
    laptop.userData.screen = screenMesh;
  }

  // Position, scale, and rotate - REDUCED SCALE HERE
  laptop.scale.setScalar(0.9); // Changed from 1.5 to 0.9
  laptop.position.set(0, 0.1, 0);
  laptop.rotation.x = THREE.MathUtils.degToRad(10);
  laptop.rotation.y = THREE.MathUtils.degToRad(-20);

  scene.add(laptop);
  setupAnimations(laptop);
  console.log('Laptop model loaded successfully!');

}, undefined, (error) => {
  console.error('Error loading laptop model:', error);
  // Fallback to procedural laptop
  const fallbackLaptop = createLaptop(imageEl);
  laptop = fallbackLaptop;
  laptop.scale.setScalar(0.9); // Changed from 1.5 to 0.9
  laptop.position.set(0, 0.1, 0);
  scene.add(laptop);
  setupAnimations(laptop);
  console.log('Using fallback procedural laptop');
});

// Setup animations
function setupAnimations(laptop) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Gentle entrance on load - ADJUSTED SCALE ANIMATION
  gsap.from(laptop.scale, {
    x: 0.7, // Adjusted from 0.85 to match new scale
    y: 0.7,
    z: 0.7,
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

// ---- Render loop ----
function tick() {
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
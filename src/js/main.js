// src\js\main.js
import '../styles/main.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { loadSection } from './section-loader.js';
import * as THREE from 'three';
import { animateServices } from './animations/services.js';
import { animateComparison } from './animations/comparison.js';

gsap.registerPlugin(ScrollTrigger);

let smoother = null;

function refreshScroll() {
  ScrollTrigger.refresh();
}

// ── SECTION LOADER ──
async function init() {
  try {
    // Load ALL sections first
    const sections = [
      { path: '/src/sections/hero.html', id: 'section-hero' },
      { path: '/src/sections/about.html', id: 'section-about' },
      { path: '/src/sections/services.html', id: 'section-services', animate: animateServices },
      { path: '/src/sections/comparison.html', id: 'section-comparison', animate: animateComparison },
      { path: '/src/sections/contact.html', id: 'section-contact' },
    ];

    // Load all sections
    for (const section of sections) {
      const loaded = await loadSection(section.path, section.id);
      if (loaded) {
        console.log(`✅ Loaded ${section.path}`);
      }
    }

    // Wait a moment for DOM to update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Now initialize everything
    initThreeScene();
    setupMenu();

    // Animate sections after everything is loaded
    for (const section of sections) {
      if (section.animate) {
        try {
          section.animate();
        } catch (error) {
          console.warn(`Error animating ${section.id}:`, error);
        }
      }
    }

    // Final refresh
    setTimeout(() => {
      ScrollTrigger.refresh();
      console.log('🔄 ScrollTrigger refreshed');
    }, 500);

  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

// ── 3D SCENE SETUP ──
async function initThreeScene() {
  try {
    const { setupScene } = await import('../three/setupScene.js');
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const { createLaptop } = await import('../three/createLaptop.js');

    // Wait for hero to be in DOM
    const heroSection = document.querySelector('#hero');
    if (!heroSection) {
      console.warn('Hero section not found, waiting...');
      // Try again after a delay
      setTimeout(initThreeScene, 500);
      return;
    }

    const stage = document.getElementById('canvas-stage');
    const imageEl = document.getElementById('screen-image');

    if (!stage) {
      console.warn('Canvas stage not found');
      return;
    }

    console.log('✅ Canvas stage found, initializing Three.js...');

    const { scene, camera, renderer } = setupScene(stage);
    const loader = new GLTFLoader();
    let laptop;

    // Try loading the model
    loader.load('/models/laptop.gltf', (gltf) => {
      laptop = gltf.scene;
      const screenMesh = laptop.getObjectByName('Screen') ||
        laptop.getObjectByName('screen') ||
        laptop.getObjectByName('Display');

      if (screenMesh && imageEl) {
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

      laptop.scale.setScalar(0.9);
      laptop.position.set(0, 0.1, 0);
      laptop.rotation.x = THREE.MathUtils.degToRad(10);
      laptop.rotation.y = THREE.MathUtils.degToRad(-20);

      scene.add(laptop);
      setupAnimations(laptop, camera);
      console.log('✅ Laptop model loaded successfully!');

    }, undefined, (error) => {
      console.warn('Error loading laptop model, using fallback:', error);
      if (imageEl) {
        const fallbackLaptop = createLaptop(imageEl);
        laptop = fallbackLaptop;
        laptop.scale.setScalar(0.9);
        laptop.position.set(0, 0.1, 0);
        scene.add(laptop);
        setupAnimations(laptop, camera);
        console.log('✅ Using fallback procedural laptop');
      }
    });

    function setupAnimations(laptop, camera) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      gsap.from(laptop.scale, {
        x: 0.7,
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

      gsap.to(laptop.rotation, {
        y: '+=0.06',
        duration: 3.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }

    function tick() {
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    tick();

  } catch (error) {
    console.error('Error initializing Three.js scene:', error);
  }
}

// ── MENU SETUP ──
function setupMenu() {
  const menuBtn = document.querySelector('.menu-btn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const menuPopup = document.getElementById('menuPopup');
  const menuLinks = document.querySelectorAll('.menu-link');

  if (!menuBtn || !menuPopup) {
    console.warn('Menu elements not found');
    return;
  }

  function openMenu() {
    menuPopup.classList.remove('pointer-events-none', 'opacity-0');
    menuPopup.classList.add('pointer-events-auto', 'opacity-100');
    const panel = menuPopup.querySelector('.bg-white');
    if (panel) {
      panel.classList.remove('scale-90');
      panel.classList.add('scale-100');
    }
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menuPopup.classList.remove('pointer-events-auto', 'opacity-100');
    menuPopup.classList.add('pointer-events-none', 'opacity-0');
    const panel = menuPopup.querySelector('.bg-white');
    if (panel) {
      panel.classList.remove('scale-100');
      panel.classList.add('scale-90');
    }
    document.body.style.overflow = '';
  }

  menuBtn.addEventListener('click', openMenu);
  if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
  menuPopup.addEventListener('click', (e) => {
    if (e.target === menuPopup || e.target.classList.contains('bg-black/40')) {
      closeMenu();
    }
  });
  menuLinks.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

// ── START ──
document.addEventListener('DOMContentLoaded', init);
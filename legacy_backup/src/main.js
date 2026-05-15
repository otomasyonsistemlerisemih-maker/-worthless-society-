import './style.css'
import * as THREE from 'three';

// Preloader & Audio System
const preloader = document.getElementById('preloader');
const loadingPct = document.getElementById('loading-percentage');
const enterBtn = document.getElementById('enter-button');
let audioCtx;
let masterGain;

// Simulate Loading
let progress = 0;
document.body.style.overflow = 'hidden';

const loadInterval = setInterval(() => {
  progress += Math.floor(Math.random() * 10) + 2;
  if (progress >= 100) {
    progress = 100;
    clearInterval(loadInterval);
    loadingPct.style.display = 'none';
    enterBtn.style.display = 'inline-block';
  }
  loadingPct.innerText = progress < 10 ? `0${progress}%` : `${progress}%`;
}, 100);

// Enter The Void (Init Audio)
enterBtn.addEventListener('click', () => {
  preloader.classList.add('hide');
  document.body.style.overflow = 'auto';
  setTimeout(() => preloader.style.display = 'none', 1200);
  initAudio();
});

function initAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);
  masterGain.gain.value = 0.5;

  // Ambient Drone (Low frequency rumble)
  const droneOsc = audioCtx.createOscillator();
  droneOsc.type = 'sawtooth';
  droneOsc.frequency.value = 40; // Deep bass

  const droneFilter = audioCtx.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.frequency.value = 100;
  
  const droneGain = audioCtx.createGain();
  droneGain.gain.value = 0.6;

  // LFO for drone filter sweep to make it feel alive
  const lfo = audioCtx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.1; // Very slow sweep
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 50; // Filter freq variance

  lfo.connect(lfoGain);
  lfoGain.connect(droneFilter.frequency);
  lfo.start();

  droneOsc.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(masterGain);
  droneOsc.start();

  // Add click sounds and cursor effects to interactive elements
  document.querySelectorAll('a, button, .product-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      playClick(800, 0.05); // Hover tick
      if (cursorFollower) cursorFollower.classList.add('active');
    });
    
    el.addEventListener('mouseleave', () => {
      if (cursorFollower) cursorFollower.classList.remove('active');
    });
    
    el.addEventListener('click', () => playClick(150, 0.15)); // Deep click
  });
}

function playClick(freq, duration) {
  if (!audioCtx) return;
  const clickOsc = audioCtx.createOscillator();
  const clickGain = audioCtx.createGain();
  
  clickOsc.type = 'sine';
  clickOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  clickOsc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  clickGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  clickGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  clickOsc.connect(clickGain);
  clickGain.connect(masterGain);
  
  clickOsc.start();
  clickOsc.stop(audioCtx.currentTime + duration);
}

// Custom Cursor Logic
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');

let cursorX = 0;
let cursorY = 0;
let followerX = 0;
let followerY = 0;

document.addEventListener('mousemove', (e) => {
  cursorX = e.clientX;
  cursorY = e.clientY;
  
  if (cursor) {
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;
  }
});

function animateCursor() {
  followerX += (cursorX - followerX) * 0.15;
  followerY += (cursorY - followerY) * 0.15;
  
  if (cursorFollower) {
    cursorFollower.style.left = `${followerX}px`;
    cursorFollower.style.top = `${followerY}px`;
  }
  requestAnimationFrame(animateCursor);
}
animateCursor();

// Secret Room / Terminal Logic
const secretTrigger = document.getElementById('secret-trigger');
const terminalModal = document.getElementById('terminal-modal');
const terminalClose = document.getElementById('terminal-close');
const terminalInput = document.getElementById('terminal-input');
const voidProduct = document.getElementById('void-product');
const voidDesc = document.getElementById('void-desc');
const voidImageText = document.getElementById('void-image-text');
const terminalBody = document.getElementById('terminal-body');

let originalTerminalContent = terminalBody.innerHTML;

secretTrigger.addEventListener('click', () => {
  terminalModal.classList.add('active');
  terminalInput.focus();
  playClick(1200, 0.1); // High pitch notification
});

terminalClose.addEventListener('click', () => {
  terminalModal.classList.remove('active');
  terminalBody.innerHTML = originalTerminalContent;
  // Re-bind input listener since innerHTML resets it
  bindTerminalInput();
});

function bindTerminalInput() {
  const input = document.getElementById('terminal-input');
  if (!input) return;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = input.value.trim().toUpperCase();
      if (val === 'VOID') {
        // Success
        terminalBody.innerHTML = `<p class="granted">ACCESS GRANTED.</p><p class="granted">DECRYPTING COMPARTMENT 009...</p>`;
        playClick(800, 0.5); // Success sound
        
        setTimeout(() => {
          terminalModal.classList.remove('active');
          voidProduct.setAttribute('data-locked', 'false');
          voidDesc.innerText = 'UNLOCKED';
          voidImageText.innerText = 'RESTRICTION LIFTED';
          voidProduct.style.background = 'none';
          
          // Flash effect
          voidProduct.style.opacity = '0';
          setTimeout(() => voidProduct.style.opacity = '1', 100);
          setTimeout(() => voidProduct.style.opacity = '0', 200);
          setTimeout(() => voidProduct.style.opacity = '1', 300);
          
          playClick(400, 1); // Deep unlock sound
        }, 2000);
      } else {
        // Fail
        const p = document.createElement('p');
        p.className = 'denied';
        p.innerText = 'ACCESS DENIED: INCORRECT PASSCODE.';
        input.parentElement.before(p);
        input.value = '';
        playClick(100, 0.3); // Error buzz
      }
    }
  });
}
bindTerminalInput();

// Scroll animations
const observerOptions = {
  threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
  observer.observe(el);
});

// Smooth scroll for nav links
document.querySelectorAll('nav a').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    if (this.getAttribute('href').startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }
  });
});

const products = {
  'ARCHIVE_001': {
    title: 'ARCHIVE_001',
    description: 'Heavyweight garment dyed hoodie. Built for silent endurance.',
    image: './assets/archive_001.png',
    specs: [
      ['WEIGHT', '500 GSM'],
      ['FIT', 'OVERSIZED'],
      ['PRINT', 'CRACKED SCREEN'],
      ['ORIGIN', 'RESTRICTED']
    ],
    price: '€240.00'
  },
  'ARCHIVE_002': {
    title: 'ARCHIVE_002',
    description: 'Minimalist bone white t-shirt. Industrial distressing.',
    image: './assets/archive_002.png',
    specs: [
      ['WEIGHT', '280 GSM'],
      ['FIT', 'RELAXED'],
      ['TEXTURE', 'WASHED COTTON'],
      ['STATUS', 'AVAILABLE']
    ],
    price: '€85.00'
  },
  'SILENT_PRESSURE': {
    title: 'SILENT_PRESSURE',
    description: 'Special edition garment dyed sweatshirt. A testament to the weight of existence.',
    image: './assets/archive_003.png',
    specs: [
      ['WEIGHT', '420 GSM'],
      ['FIT', 'BOXY'],
      ['DYE', 'GARMENT PIGMENT'],
      ['LABEL', 'VOID_ARCHIVE']
    ],
    price: '€180.00'
  },
  'ARCHIVE_004': {
    title: 'ARCHIVE_004',
    description: 'Experimental cut top. Designed to conceal and protect.',
    image: './assets/28b61a06-d5db-4676-91bc-eead97c294c8.png',
    specs: [
      ['WEIGHT', '320 GSM'],
      ['FIT', 'OVERSIZED'],
      ['FINISH', 'DISTRESSED'],
      ['STATUS', 'AVAILABLE']
    ],
    price: '€120.00'
  },
  'ARCHIVE_005': {
    title: 'ARCHIVE_005',
    description: 'Heavyweight signature piece. Cold aesthetic, warm core.',
    image: './assets/6291e69b-1e82-4402-9b87-152ca115edcb.png',
    specs: [
      ['WEIGHT', '450 GSM'],
      ['FIT', 'BOXY'],
      ['DETAIL', 'REVERSE SEAMS'],
      ['STATUS', 'AVAILABLE']
    ],
    price: '€160.00'
  },
  'ARCHIVE_006': {
    title: 'ARCHIVE_006',
    description: 'Limited edition outerwear. Built to withstand the pressure.',
    image: './assets/9786ee9f-9980-46b8-84a1-af18bdf7b420.png',
    specs: [
      ['FABRIC', 'NYLON BLEND'],
      ['FIT', 'RELAXED'],
      ['HARDWARE', 'MATTE BLACK'],
      ['STATUS', 'AVAILABLE']
    ],
    price: '€190.00'
  },
  'ARCHIVE_007': {
    title: 'ARCHIVE_007',
    description: 'Essential tee with raw edge detailing. Silent statement.',
    image: './assets/WhatsApp Image 2026-05-14 at 03.23.51.jpeg',
    specs: [
      ['WEIGHT', '240 GSM'],
      ['FIT', 'SLIM'],
      ['WASH', 'ACID WASH'],
      ['STATUS', 'AVAILABLE']
    ],
    price: '€110.00'
  },
  'ARCHIVE_008': {
    title: 'ARCHIVE_008',
    description: 'Raw finish garment. Represents the invisible strength.',
    image: './assets/WhatsApp Image 2026-05-14 at 03.26.53.jpeg',
    specs: [
      ['WEIGHT', '260 GSM'],
      ['FIT', 'REGULAR'],
      ['DYE', 'COLD PIGMENT'],
      ['STATUS', 'AVAILABLE']
    ],
    price: '€90.00'
  }
};

const modal = document.getElementById('product-modal');
const modalContent = document.getElementById('modal-content');
const modalClose = document.getElementById('modal-close');
const cartLink = document.querySelector('nav a[href="#cart"]');

let cartCount = 0;

function updateCart(count) {
  cartCount += count;
  if (cartLink) {
    cartLink.innerText = `Cart (${cartCount})`;
    cartLink.style.opacity = '1';
    setTimeout(() => { cartLink.style.opacity = '0.5'; }, 500);
  }
}

document.querySelectorAll('.product-card').forEach(card => {
  card.addEventListener('click', () => {
    // Check if locked
    if (card.getAttribute('data-locked') === 'true') {
      playClick(100, 0.2); // Denied low sound
      return;
    }

    const titleEl = card.querySelector('.product-title');
    const metaEl = card.querySelector('.product-meta');
    
    if (!titleEl || !metaEl) return;
    
    const title = titleEl.innerText;
    const meta = metaEl.innerText;
    
    if (meta === 'ARCHIVED.' && title !== 'SILENT_PRESSURE') {
      return;
    }
    
    
    const product = products[title];
    if (product) {
      modalContent.innerHTML = `
        <img src="${product.image || ''}" class="product-detail-image" alt="${product.title}">
        <div class="product-detail-info">
          <h2>${product.title}</h2>
          <p>${product.description}</p>
          <ul class="product-specs">
            ${product.specs.map(spec => `<li><span>${spec[0]}</span><span>${spec[1]}</span></li>`).join('')}
          </ul>
          <button class="buy-button" id="acquire-btn">ACQUIRE — ${product.price}</button>
        </div>
      `;
      
      // Add event listener to the newly created button
      document.getElementById('acquire-btn').addEventListener('click', () => {
        const btn = document.getElementById('acquire-btn');
        btn.innerText = 'ADDED TO VOID';
        btn.style.background = '#444';
        btn.disabled = true;
        updateCart(1);
        setTimeout(() => {
          modal.classList.remove('active');
          document.body.style.overflow = 'auto';
        }, 800);
      });

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  });
});

modalClose.addEventListener('click', () => {
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
});

// Three.js Background
const canvas = document.getElementById('bg-canvas');
if (canvas) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0a, 0.02);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Core Object
  const geometry = new THREE.IcosahedronGeometry(12, 1);
  const material = new THREE.MeshBasicMaterial({ 
    color: 0x444444, 
    wireframe: true,
    transparent: true,
    opacity: 0.15
  });
  const core = new THREE.Mesh(geometry, material);
  scene.add(core);

  // Particles
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 800;
  const posArray = new Float32Array(particlesCount * 3);

  for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 100;
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x888888,
    transparent: true,
    opacity: 0.3
  });

  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  // Mouse interaction
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
  });

  // Animation Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    core.rotation.y += 0.002;
    core.rotation.x += 0.001;

    particlesMesh.rotation.y = -elapsedTime * 0.02;
    particlesMesh.rotation.x = -elapsedTime * 0.01;

    core.rotation.y += 0.05 * (targetX - core.rotation.y);
    core.rotation.x += 0.05 * (targetY - core.rotation.x);

    renderer.render(scene, camera);
  }

  animate();

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

console.log('WORTHLESS ARCHIVE INITIALIZED.');

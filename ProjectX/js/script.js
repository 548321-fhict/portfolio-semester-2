const container = document.getElementById('threejs-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const imageCount = 20;
const loader = new THREE.TextureLoader();
const imageUrls = [
  'images/DSC05779.jpg',
  'images/DSC05791.jpg',
  'images/DSC05798-2.jpg',
  'images/DSC05802.jpg',
  'images/DSC05805.jpg',
  'images/DSC05869.jpg',
  'images/DSC05813.jpg',
  'images/DSC05837.jpg',
  'images/DSC05849.jpg',
  'images/DSC05855.jpg',
  'images/DSC05865.jpg',
  'images/DSC05809.jpg',
  'images/DSC05872.jpg',
  'images/DSC05876.jpg',
  'images/DSC05879.jpg',
  'images/DSC05896.jpg',
  'images/DSC05889.jpg',
  'images/DSC05902.jpg',
  'images/DSC05910.jpg',
  'images/DSC05914.jpg'
];

const radius = 11;
const meshes = [];
let isHovering = false;
let focusedIndex = Math.floor(imageCount / 2);

// Morphing state variables
// 0: circle, 1: carousel, 2: line large, 3: line small
let morphStage = 0;
let circleTransition = 1; // 1 = circle, 0 = line
let curveTransition = 1;  // 1 = curve, 0 = line
let shrinkTransition = 0; // 0 = large, 1 = small

let circleRotation = 0; // Only for circle stage

// --- Overlay logic flags ---
let hasVisitedCircleMorph = false;
let previousMorphStage = 0;

// --- Auto-morph variables ---
let autoMorph = false;
let autoMorphFrame = 0;
let autoMorphState = "morph"; // "morph" or "scroll"
let autoMorphTargetScrolls = 0;
let autoMorphScrollsDone = 0;
let autoMorphScrollDir = 1;

const maskTexture = loader.load('images/rounded-mask.png', () => {

  for (let i = 0; i < imageCount; i++) {
    const angle = (i / imageCount) * Math.PI * 2;
    const texture = loader.load(imageUrls[i % imageUrls.length]);
    const geometry = new THREE.BoxGeometry(1.9, 2.3, 0.05);
    const transparentMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0
    });
    const faceMaterials = [
      transparentMaterial, // right
      transparentMaterial, // left
      transparentMaterial, // top
      transparentMaterial, // bottom
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        alphaMap: maskTexture,
        alphaTest: 0.5
      }), // front
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        alphaMap: maskTexture,
        alphaTest: 0.5
      })  // back
    ];
    const mesh = new THREE.Mesh(geometry, faceMaterials);
    mesh.userData = {
      angle,
      baseRadius: radius,
      index: i,
      targetRadius: radius,
      targetScale: 1
    };
    mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    mesh.rotation.z = angle - Math.PI / 2;
    mesh.userData.originalPosition = mesh.position.clone();
    mesh.userData.originalScale = mesh.scale.clone();
    mesh.userData.originalRotation = mesh.rotation.z;
    scene.add(mesh);
    meshes.push(mesh);
  }

  let hoveredMesh = null;
  let hoveredIndex = -1;
  let zoomedMesh = null;
  let zoomProgress = 0;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  camera.position.z = 20;

  // Wheel mesh
  const wheelTexture = loader.load('images/wheel.png');
  const wheelGeometry = new THREE.PlaneGeometry(45, 45);
  const wheelMaterial = new THREE.MeshBasicMaterial({
    map: wheelTexture,
    transparent: true,
    alphaMap: loader.load('images/circle-mask.png')
  });
  const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheelMesh.position.set(0, 0, -1);
  scene.add(wheelMesh);

  // --- Hover effect ---
  window.addEventListener('mousemove', (event) => {
    const mousePx = { x: event.clientX, y: event.clientY };
    const hoverRadiusPx = 120;
    let anyHover = false;

    meshes.forEach((mesh) => {
      const vector = mesh.position.clone().project(camera);
      const meshPx = {
        x: (vector.x * 0.5 + 0.5) * window.innerWidth,
        y: (-vector.y * 0.5 + 0.5) * window.innerHeight
      };
      const dx = mousePx.x - meshPx.x;
      const dy = mousePx.y - meshPx.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      mesh.userData.targetScale = 1;

      if (dist < hoverRadiusPx) {
        anyHover = true;
        const t = 1 - (dist / hoverRadiusPx);
        mesh.userData.targetScale = 1 + 0.25 * t; // More pronounced pop-out
      }
    });
    isHovering = anyHover;
  });

  window.addEventListener('mouseleave', () => {
    meshes.forEach((mesh) => {
      mesh.userData.targetScale = 1;
    });
    isHovering = false;
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // --- Morphing click handler with improved circle logic ---
  window.addEventListener('click', (event) => {
    const mouse = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1
    };
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const clickedIndex = intersects[0].object.userData.index;

      // Use >= and <= to be robust against floating point drift
      let canAdvance = false;
      if (
        (morphStage === 0 && circleTransition >= 0.98 && curveTransition >= 0.98 && shrinkTransition <= 0.02) ||
        (morphStage === 1 && circleTransition <= 0.02 && curveTransition >= 0.98 && shrinkTransition <= 0.02) ||
        (morphStage === 2 && circleTransition <= 0.02 && curveTransition <= 0.02 && shrinkTransition <= 0.02) ||
        (morphStage === 3 && circleTransition <= 0.02 && curveTransition <= 0.02 && shrinkTransition >= 0.98)
      ) {
        canAdvance = true;
      }
      // Always allow the very first click after load (all transitions at initial values)
      if (
        morphStage === 0 &&
        Math.abs(circleTransition - 1) < 0.02 &&
        Math.abs(curveTransition - 1) < 0.02 &&
        Math.abs(shrinkTransition - 0) < 0.02
      ) {
        canAdvance = true;
      }

      // In circle stage, clicking any card focuses and morphs in one click
      if (morphStage === 0 && canAdvance) {
        if (clickedIndex !== focusedIndex) {
          focusedIndex = clickedIndex;
        }
        morphStage = (morphStage + 1) % 4;
      } else if (clickedIndex === focusedIndex && canAdvance) {
        morphStage = (morphStage + 1) % 4;
      } else if (clickedIndex !== focusedIndex) {
        focusedIndex = clickedIndex;
      }
    }
  });

  function animate() {
    requestAnimationFrame(animate);

    // Track morphStage transitions for overlay logic
    if (morphStage === 0 && previousMorphStage !== 0) {
      hasVisitedCircleMorph = true;
    }
    previousMorphStage = morphStage;

    // Animate transitions based on morphStage
    if (morphStage === 0) { // Circle (small)
      circleTransition = Math.min(circleTransition + 0.07, 1);
      curveTransition = Math.min(curveTransition + 0.07, 1);
      shrinkTransition = Math.max(shrinkTransition - 0.07, 0);
    } else if (morphStage === 1) { // Carousel (large)
      circleTransition = Math.max(circleTransition - 0.07, 0);
      curveTransition = Math.min(curveTransition + 0.07, 1);
      shrinkTransition = Math.max(shrinkTransition - 0.07, 0);
    } else if (morphStage === 2) { // Line large
      circleTransition = Math.max(circleTransition - 0.07, 0);
      curveTransition = Math.max(curveTransition - 0.07, 0);
      shrinkTransition = Math.max(shrinkTransition - 0.07, 0);
    } else if (morphStage === 3) { // Line small (same as circle)
      circleTransition = Math.max(circleTransition - 0.07, 0);
      curveTransition = Math.max(curveTransition - 0.07, 0);
      shrinkTransition = Math.min(shrinkTransition + 0.07, 1);
    }

    // --- Circle rotation logic (only for circle stage, not scene-wide) ---
    if (morphStage === 0 && circleTransition > 0.99 && !isHovering) {
      circleRotation += -0.002; // Adjust speed as desired
    }
    // Reset rotation when leaving circle
    if (morphStage !== 0 || circleTransition < 0.99) {
      circleRotation = 0;
    }

    // --- Auto-morph logic ---
    if (autoMorph) {
    autoMorphFrame++;

    if (autoMorphState === "morph") {
      // Wait for transitions to finish and a pause
      let transitionsDone =
        (morphStage === 0 && circleTransition >= 0.98 && curveTransition >= 0.98 && shrinkTransition <= 0.02) ||
        (morphStage === 1 && circleTransition <= 0.02 && curveTransition >= 0.98 && shrinkTransition <= 0.02) ||
        (morphStage === 2 && circleTransition <= 0.02 && curveTransition <= 0.02 && shrinkTransition <= 0.02) ||
        (morphStage === 3 && circleTransition <= 0.02 && curveTransition <= 0.02 && shrinkTransition >= 0.98);

      if (transitionsDone && autoMorphFrame > 120) { // 2 seconds pause
        autoMorphTargetScrolls = Math.floor(Math.random() * 6) + 2; // 2-7 scrolls
        autoMorphScrollsDone = 0;
        autoMorphScrollDir = Math.random() > 0.5 ? 1 : -1;
        autoMorphState = "scroll";
        autoMorphFrame = 0;
      }
    } else if (autoMorphState === "scroll") {
      // Scroll every 30 frames (~2 per second)
      if (autoMorphFrame % 30 === 0 && autoMorphScrollsDone < autoMorphTargetScrolls) {
        focusedIndex = (focusedIndex + autoMorphScrollDir + imageCount) % imageCount;
        autoMorphScrollsDone++;
      }
      // After scrolling, morph to next stage
      if (autoMorphScrollsDone >= autoMorphTargetScrolls) {
        if (autoMorphFrame > (autoMorphTargetScrolls * 30) + 60) { // 1 second pause after scroll
          morphStage = (morphStage + 1) % 4;
          autoMorphState = "morph";
          autoMorphFrame = 0;
        }
      }
    }
  }
  

    meshes.forEach((mesh, i) => {
      // Looping offset for infinite carousel/line
      let offset = i - focusedIndex;
      if (offset > imageCount / 2) offset -= imageCount;
      if (offset < -imageCount / 2) offset += imageCount;
      

      const angle = (i / imageCount) * Math.PI * 2;

      // Circle layout (with rotation)
      const circleX = Math.cos(angle + circleRotation) * radius;
      const circleY = Math.sin(angle + circleRotation) * radius;

      // Carousel (arc) layout
      const curveRadius = 10;
      const carouselYOffset = -9;
      const xCurve = offset * 10;
      const yCurve = -Math.pow(offset, 2) + curveRadius + carouselYOffset;

      // Line layout
      const xLine = offset * 10;
      const centerY = curveRadius + carouselYOffset;

      // Interpolate between layouts
      const xCurveMix = THREE.MathUtils.lerp(xLine, xCurve, curveTransition);
      const yCurveMix = THREE.MathUtils.lerp(centerY, yCurve, curveTransition);

      let x = THREE.MathUtils.lerp(xCurveMix, circleX, circleTransition);
      let y = THREE.MathUtils.lerp(yCurveMix, circleY, circleTransition);

      // Scale logic
      // Small for circle and small line, large for carousel and line large
      const smallScale = 1.2;
      const largeScale = 3.5;
      let baseScale = smallScale;
      if (morphStage === 1 || morphStage === 2) {
        baseScale = largeScale;
      }

      // Highlight focused image in circle morph
      let focusBoost = 1;
      if (morphStage === 0 && i === focusedIndex) {
        focusBoost = 1.25; // Scale up focused image
      }
      const hoverScale = (mesh.userData.targetScale || 1) * focusBoost;
      const scale = baseScale * hoverScale;

      // --- No bounce/pulse animation ---
      let finalScale = scale;

      // Pop out on hover
      let popOut = 0;
      if (mesh.userData.targetScale > 1) {
        const dir = new THREE.Vector2(x, y).normalize();
        popOut = 2 * (mesh.userData.targetScale - 1);
        x += dir.x * popOut;
        y += dir.y * popOut;
      }

      mesh.visible = true;
      mesh.position.lerp(new THREE.Vector3(x, y, 0), 0.15);
      mesh.scale.lerp(new THREE.Vector3(finalScale, finalScale, finalScale), 0.15);

      // Orientation logic
      if (morphStage === 0 && circleTransition > 0.5) {
        // In circle: rotate to face outward (with rotation)
        mesh.rotation.z += ((angle + circleRotation - Math.PI / 2) - mesh.rotation.z) * 0.15;
      } else {
        // In other stages: smoothly reset to upright
        mesh.rotation.z += (0 - mesh.rotation.z) * 0.15;
      }
    });

    // Make the wheel PNG rotate at the same speed and direction as the circle
    if (morphStage === 0 && circleTransition > 0.99) {
      wheelMesh.rotation.z = circleRotation;
    } else {
      wheelMesh.rotation.z = 0;
    }

    // Show wheel only in full circle
    wheelMesh.position.set(0, 0, -1);
    wheelMesh.scale.set(1, 1, 1);
    wheelMesh.visible = (morphStage === 0 && circleTransition > 0.99);

    const indicator = document.getElementById('auto-morph-indicator');
if (indicator) {
  indicator.style.display = autoMorph ? 'block' : 'none';
}

    // Show/hide instructions overlay based on morphStage and visit flag
    updateInstructionsOverlay();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // --- Overlay fade in/out logic ---
  function showInstructionsOverlay() {
    const overlay = document.getElementById('instructions-overlay');
    overlay.classList.add('visible');
  }

  function hideInstructionsOverlay() {
    const overlay = document.getElementById('instructions-overlay');
    overlay.classList.remove('visible');
  }

  function updateInstructionsOverlay() {
    const overlay = document.getElementById('instructions-overlay');
    if (typeof morphStage !== 'undefined' && morphStage === 1) {
      showInstructionsOverlay();
    } else if (typeof morphStage !== 'undefined' && morphStage === 2) {
      hideInstructionsOverlay();
    } else {
      hideInstructionsOverlay();
    }
  }

});

window.addEventListener('keydown', (event) => {
  // Prevent default scrolling for arrow keys and spacebar
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key === "ArrowUp") {
    morphStage = (morphStage + 1) % 4;
  } else if (event.key === "ArrowDown") {
    morphStage = (morphStage + 3) % 4;
  } else if (event.key === "ArrowRight") {
    if (morphStage === 0) {
      // Circle morph: right arrow moves clockwise (decrement index)
      focusedIndex = (focusedIndex - 1 + imageCount) % imageCount;
    } else {
      // Other morphs: right arrow moves to next image (increment index)
      focusedIndex = (focusedIndex + 1) % imageCount;
    }
  } else if (event.key === "ArrowLeft") {
    if (morphStage === 0) {
      // Circle morph: left arrow moves counterclockwise (increment index)
      focusedIndex = (focusedIndex + 1) % imageCount;
    } else {
      // Other morphs: left arrow moves to previous image (decrement index)
      focusedIndex = (focusedIndex - 1 + imageCount) % imageCount;
    }
  } else if (event.key === " ") {
    autoMorph = !autoMorph;
    autoMorphFrame = 0;
    autoMorphState = "morph";
  }
});
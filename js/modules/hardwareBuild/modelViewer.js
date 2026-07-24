import * as THREE from "../../../assets/vendor/three/three.module.js";
import { GLTFLoader } from "../../../assets/vendor/three/loaders/GLTFLoader.js";
import { OrbitControls } from "../../../assets/vendor/three/controls/OrbitControls.js";

export function mountHardwareModelViewer(root, { modelPath, accent = 0x4f46e5 } = {}) {
  const canvas = root.querySelector("[data-hardware-model-canvas]");
  const stage = root.querySelector("[data-hardware-model-stage]");
  const status = root.querySelector("[data-hardware-model-status]");
  if (!canvas || !stage || !modelPath) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf4f7ff);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
  const initialPosition = new THREE.Vector3(3.2, 2.35, 3.8);
  camera.position.copy(initialPosition);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 2.2;
  controls.maxDistance = 9;
  controls.minPolarAngle = 0.02;
  controls.maxPolarAngle = Math.PI - 0.02;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
  controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
  controls.mouseButtons.RIGHT = THREE.MOUSE.DOLLY;
  controls.target.set(0, 0.15, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa8c4, 2.15));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
  keyLight.position.set(4, 7, 5);
  keyLight.castShadow = true;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(accent, 1.1);
  fillLight.position.set(-4, 3, -2);
  scene.add(fillLight);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(2.7, 64),
    new THREE.MeshStandardMaterial({ color: 0xe7ecf8, roughness: 0.9, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.02;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(5.2, 20, 0xb8c5e2, 0xd7deee);
  grid.position.y = -1;
  scene.add(grid);

  let model = null;
  let autoRotate = true;
  let frameId = 0;

  const loader = new GLTFLoader();
  loader.load(
    modelPath,
    (gltf) => {
      model = gltf.scene;
      model.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = true;
        node.receiveShadow = true;
        if (node.material) {
          node.material.side = THREE.DoubleSide;
          node.material.needsUpdate = true;
        }
      });
      scene.add(model);
      if (status) {
        status.textContent = "3D 모델 준비 완료 · 왼쪽 드래그: 회전 · 가운데 드래그: 이동 · 휠: 확대/축소";
        status.classList.add("is-ready");
      }
    },
    (event) => {
      if (!status || !event.total) return;
      status.textContent = `3D 모델 불러오는 중 · ${Math.round((event.loaded / event.total) * 100)}%`;
    },
    () => {
      if (status) {
        status.textContent = "3D 모델을 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.";
        status.classList.add("is-error");
      }
    }
  );

  const resetView = () => {
    camera.position.copy(initialPosition);
    controls.target.set(0, 0.15, 0);
    controls.update();
    if (model) model.rotation.y = 0;
  };

  root.querySelector("[data-hardware-model-reset]")?.addEventListener("click", resetView);
  const rotateButton = root.querySelector("[data-hardware-model-rotate]");
  rotateButton?.addEventListener("click", () => {
    autoRotate = !autoRotate;
    rotateButton.classList.toggle("is-active", autoRotate);
    rotateButton.setAttribute("aria-pressed", String(autoRotate));
    rotateButton.textContent = autoRotate ? "자동 회전 켜짐" : "자동 회전 꺼짐";
  });
  root.querySelector("[data-hardware-model-fullscreen]")?.addEventListener("click", () => {
    stage.requestFullscreen?.();
  });

  const resize = () => {
    const width = Math.max(stage.clientWidth, 320);
    const height = Math.max(stage.clientHeight, 320);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();

  const animate = () => {
    if (!canvas.isConnected) {
      observer.disconnect();
      renderer.dispose();
      cancelAnimationFrame(frameId);
      return;
    }
    if (model && autoRotate) model.rotation.y += 0.0035;
    const viewingFromBelow = camera.position.y < controls.target.y - 0.45;
    floor.visible = !viewingFromBelow;
    grid.visible = !viewingFromBelow;
    controls.update();
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  };
  animate();
}

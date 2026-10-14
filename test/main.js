import {
    WebGPURenderer, Scene, PerspectiveCamera, DirectionalLight, HemisphereLight,
    Raycaster, Vector2, Color, AnimationMixer,
} from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import Inspector from '@lijuhong1981/inspector';
import { PostProcessingLibrary, AntiAliasingMethod } from '@lijuhong1981/tsl.postprocessing';

if (!('gpu' in navigator)) {
    throw new Error('当前浏览器不支持 WebGPU，请使用 Chrome 113+ / Edge 并开启硬件加速');
}

const { threeVersion, cdnBase } = window.__TSL_TEST__ || {};
const DRACO_PATH = `${cdnBase || 'https://unpkg.com'}/three@${threeVersion || '0.186.1'}/examples/jsm/libs/draco/gltf/`;
const MODEL_URL = 'https://threejs.org/examples/models/gltf/LittlestTokyo.glb';

// ===== 渲染器 =====
const renderer = new WebGPURenderer({ antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ===== GUI（@lijuhong1981/inspector）=====
renderer.inspector = new Inspector();

// ===== 场景 =====
const scene = new Scene();
scene.background = new Color(0xbfe3dd);

const camera = new PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(5, 2, 8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.5, 0);
controls.enablePan = false;
controls.enableDamping = true;
controls.update();

// ===== 灯光（SSS 需要 DirectionalLight 作为主光源）=====
const mainLight = new DirectionalLight(0xffffff, 3);
mainLight.position.set(5, 10, 5);
scene.add(mainLight);
scene.add(new HemisphereLight(0xffffff, 0x445566, 0.8));

// ===== 后处理 =====
const postProcessor = new PostProcessingLibrary(renderer, scene, camera, mainLight);
postProcessor.aoPass.enabled = true;
postProcessor.bloomPass.enabled = true;
postProcessor.outlinePass.visibleEdgeColor = 0x00e5ff; // 青色描边
postProcessor.outlinePass.highlightStrength = 0.25;
postProcessor.dofPass.focusDistance = 5;

// ===== 鼠标拾取：点中哪个模型就高亮哪个 =====
const raycaster = new Raycaster();
const pointer = new Vector2();
let pickTarget = null;

function pick(event) {
    if (!pickTarget) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(pickTarget, true);
    // 命中则高亮该 mesh，否则清空选中
    postProcessor.outlinePass.selectedObjects = hits.length > 0 ? [hits[0].object] : [];
}

// 区分「点击」与「拖拽旋转」
let pointerDown = null;
renderer.domElement.addEventListener('pointerdown', (e) => { pointerDown = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('click', (e) => {
    if (pointerDown) {
        const dx = e.clientX - pointerDown.x;
        const dy = e.clientY - pointerDown.y;
        if (dx * dx + dy * dy > 25) return;
    }
    pick(e);
});

// ===== 加载动画模型（LittlestTokyo.glb，Draco 压缩）=====
const loadingEl = document.createElement('div');
loadingEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#333;font-size:14px;z-index:5;';
loadingEl.textContent = '正在加载 LittlestTokyo.glb …';
document.body.appendChild(loadingEl);

let mixer = null;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(DRACO_PATH);

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load(
    MODEL_URL,
    (gltf) => {
        const model = gltf.scene;
        model.position.set(1, 1, 0);
        model.scale.set(0.01, 0.01, 0.01);
        scene.add(model);

        mixer = new AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();

        pickTarget = model;
        loadingEl.remove();
    },
    undefined,
    (err) => {
        loadingEl.remove();
        const el = document.getElementById('error');
        el.style.display = 'block';
        el.textContent = '模型加载失败：' + (err && err.message ? err.message : err) +
            '\n\n可能是网络无法访问 threejs.org，请检查网络后刷新。';
    },
);

// ===== GUI =====
buildGui(renderer, postProcessor);

// ===== 渲染循环 =====
let lastTime = performance.now();
function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    if (mixer) mixer.update(delta);
    controls.update();
    postProcessor.render(delta);
}

// WebGPU 渲染器必须先 await renderer.init() 初始化后端，才能调用 render()
async function init() {
    try {
        await renderer.init();
    } catch (err) {
        const el = document.getElementById('error');
        el.style.display = 'block';
        el.textContent = 'WebGPU 初始化失败：' + (err && err.message ? err.message : err);
        return;
    }
    animate();
}
init();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===== GUI 构建函数 =====
function buildGui(renderer, pp) {
    const gui = renderer.inspector.createParameters('Post Processing');

    gui.add(pp, 'enabled').name('后处理总开关');

    // AO
    const ao = gui.addFolder('环境光遮蔽 AO');
    ao.add(pp.aoPass, 'enabled').name('启用');
    ao.add(pp.aoPass, 'radius', 0, 2, 0.01).name('半径');
    ao.add(pp.aoPass, 'thickness', 0, 5, 0.01).name('厚度');
    ao.add(pp.aoPass, 'scale', 0, 5, 0.01).name('强度');
    ao.add(pp.aoPass, 'samples', 1, 16, 1).name('采样数');
    ao.add(pp.aoPass, 'resolutionScale', 0.25, 1, 0.05).name('分辨率缩放');
    ao.add(pp.aoPass, 'distanceExponent', 1, 2, 0.1).name('距离指数');
    ao.add(pp.aoPass, 'distanceFallOff', 0, 1, 0.01).name('距离衰减');
    ao.add(pp.aoPass, 'useTemporalFiltering').name('时域滤波');

    // SSGI
    const ssgi = gui.addFolder('全局光照 SSGI');
    ssgi.add(pp.ssgiPass, 'enabled').name('启用');
    ssgi.add(pp.ssgiPass, 'sliceCount', 1, 4, 1).name('切片数');
    ssgi.add(pp.ssgiPass, 'stepCount', 1, 32, 1).name('步数');
    ssgi.add(pp.ssgiPass, 'aoIntensity', 0, 4, 0.1).name('AO 强度');
    ssgi.add(pp.ssgiPass, 'giIntensity', 0, 100, 1).name('GI 强度');
    ssgi.add(pp.ssgiPass, 'radius', 1, 25, 0.1).name('半径');
    ssgi.add(pp.ssgiPass, 'thickness', 0.01, 10, 0.01).name('厚度');
    ssgi.add(pp.ssgiPass, 'expFactor', 1, 3, 0.1).name('分布指数');
    ssgi.add(pp.ssgiPass, 'backfaceLighting', 0, 1, 0.01).name('背面发光');
    ssgi.add(pp.ssgiPass, 'useScreenSpaceSampling').name('屏幕空间采样');
    ssgi.add(pp.ssgiPass, 'useLinearThickness').name('线性厚度');
    ssgi.add(pp.ssgiPass, 'useTemporalFiltering').name('时域滤波');

    // SSR
    const ssr = gui.addFolder('反射 SSR');
    ssr.add(pp.ssrPass, 'enabled').name('启用');
    ssr.add(pp.ssrPass, 'maxDistance', 0, 5, 0.01).name('最大距离');
    ssr.add(pp.ssrPass, 'thickness', 0, 1, 0.01).name('厚度');
    ssr.add(pp.ssrPass, 'opacity', 0, 1, 0.01).name('不透明度');
    ssr.add(pp.ssrPass, 'quality', 0, 1, 0.05).name('质量');
    ssr.add(pp.ssrPass, 'resolutionScale', 0.1, 1, 0.05).name('分辨率缩放');
    ssr.add(pp.ssrPass, 'blurQuality', 1, 3, 1).name('模糊质量');

    // SSS
    const sss = gui.addFolder('阴影 SSS');
    sss.add(pp.sssPass, 'enabled').name('启用');
    sss.add(pp.sssPass, 'maxDistance', 0, 2, 0.01).name('最大距离');
    sss.add(pp.sssPass, 'thickness', 0, 0.1, 0.001).name('厚度');
    sss.add(pp.sssPass, 'shadowIntensity', 0, 1, 0.01).name('阴影强度');
    sss.add(pp.sssPass, 'quality', 0, 1, 0.05).name('质量');
    sss.add(pp.sssPass, 'resolutionScale', 0, 1, 0.05).name('分辨率缩放');
    sss.add(pp.sssPass, 'useTemporalFiltering').name('时域滤波');

    // Denoise
    const denoise = gui.addFolder('降噪 Denoise');
    denoise.add(pp.denoisePass, 'enabled').name('启用');
    denoise.add(pp.denoisePass, 'lumaPhi', 0, 20, 0.1).name('亮度 Phi');
    denoise.add(pp.denoisePass, 'depthPhi', 0, 20, 0.1).name('深度 Phi');
    denoise.add(pp.denoisePass, 'normalPhi', 0, 20, 0.1).name('法线 Phi');
    denoise.add(pp.denoisePass, 'radius', 0, 20, 0.1).name('半径');

    // Bloom
    const bloom = gui.addFolder('泛光 Bloom');
    bloom.add(pp.bloomPass, 'enabled').name('启用');
    bloom.add(pp.bloomPass, 'strength', 0, 3, 0.01).name('强度');
    bloom.add(pp.bloomPass, 'radius', 0, 1, 0.01).name('半径');
    bloom.add(pp.bloomPass, 'threshold', 0, 1, 0.01).name('阈值');
    bloom.add(pp.bloomPass, 'smoothWidth', 0, 1, 0.01).name('平滑宽度');

    // DOF
    const dof = gui.addFolder('景深 DOF');
    dof.add(pp.dofPass, 'enabled').name('启用');
    dof.add(pp.dofPass, 'focusDistance', 0, 20, 0.1).name('焦点距离');
    dof.add(pp.dofPass, 'focalLength', 0, 10, 0.1).name('焦段');
    dof.add(pp.dofPass, 'bokehScale', 0, 5, 0.1).name('散景大小');

    // Outline
    const outline = gui.addFolder('轮廓 Outline');
    outline.add(pp.outlinePass, 'enabled').name('启用');
    outline.add(pp.outlinePass, 'edgeThickness', 0, 10, 0.1).name('描边粗细');
    outline.add(pp.outlinePass, 'edgeStrength', 0, 10, 0.1).name('描边强度');
    outline.add(pp.outlinePass, 'edgeGlow', 0, 10, 0.1).name('边缘辉光');
    outline.add(pp.outlinePass, 'pulsePeriod', 0, 10, 0.1).name('脉冲周期');
    outline.add(pp.outlinePass, 'highlightStrength', 0, 5, 0.1).name('高亮强度');
    outline.add(pp.outlinePass, 'downSampleRatio', 1, 8, 1).name('降采样比例');
    outline.addColor(pp.outlinePass, 'visibleEdgeColor').name('可见边缘色');
    outline.addColor(pp.outlinePass, 'hiddenEdgeColor').name('隐藏边缘色');
    outline.addColor(pp.outlinePass, 'highlightColor').name('高亮色');

    // AA
    const aa = gui.addFolder('抗锯齿 AA');
    aa.add(pp.aaPass, 'enabled').name('启用');
    aa.add(pp.aaPass, 'method', {
        'FXAA': AntiAliasingMethod.FXAA,
        'SMAA': AntiAliasingMethod.SMAA,
        'SSAA': AntiAliasingMethod.SSAA,
        'TRAA': AntiAliasingMethod.TRAA,
        'TAAU': AntiAliasingMethod.TAAU,
    }).name('方法').onChange(updateAaParams);

    // three.js 把 TRAA/TAAU/SSAA 的部分参数烘焙进着色器，改值需重建管线才生效。
    // 这里做防抖：拖动停止 250ms 后触发一次重建，避免拖动过程中每帧重建。
    let aaRebuildTimer = null;
    const requestAaRebuild = () => {
        if (aaRebuildTimer) clearTimeout(aaRebuildTimer);
        aaRebuildTimer = setTimeout(() => { pp.needsUpdate = true; }, 250);
    };

    // SSAA 参数
    const ssaaFolder = aa.addFolder('SSAA 参数');
    ssaaFolder.add(pp.aaPass.ssaaPass, 'sampleLevel', 0, 5, 1).name('采样级别 (2^n)');
    ssaaFolder.add(pp.aaPass.ssaaPass, 'unbiased').name('无偏').onChange(requestAaRebuild);

    // TRAA 参数
    const traaFolder = aa.addFolder('TRAA 参数');
    traaFolder.add(pp.aaPass.traaPass, 'depthThreshold', 0, 0.005, 0.0001).name('深度阈值').onChange(requestAaRebuild);
    traaFolder.add(pp.aaPass.traaPass, 'edgeDepthDiff', 0, 0.01, 0.0001).name('边缘深度差').onChange(requestAaRebuild);
    traaFolder.add(pp.aaPass.traaPass, 'maxVelocityLength', 0, 512, 1).name('最大速度长度').onChange(requestAaRebuild);
    traaFolder.add(pp.aaPass.traaPass, 'useSubpixelCorrection').name('子像素校正').onChange(requestAaRebuild);

    // TAAU 参数
    const taauFolder = aa.addFolder('TAAU 参数');
    taauFolder.add(pp.aaPass.taauPass, 'depthThreshold', 0, 0.005, 0.0001).name('深度阈值').onChange(requestAaRebuild);
    taauFolder.add(pp.aaPass.taauPass, 'edgeDepthDiff', 0, 0.01, 0.0001).name('边缘深度差').onChange(requestAaRebuild);
    taauFolder.add(pp.aaPass.taauPass, 'maxVelocityLength', 0, 512, 1).name('最大速度长度').onChange(requestAaRebuild);
    taauFolder.add(pp.aaPass.taauPass, 'currentFrameWeight', 0, 0.2, 0.001).name('当前帧权重').onChange(requestAaRebuild);

    // 根据所选方法显示/隐藏对应参数文件夹（FXAA/SMAA 无额外参数）
    function updateAaParams(method) {
        ssaaFolder.hide();
        traaFolder.hide();
        taauFolder.hide();
        if (method === AntiAliasingMethod.SSAA) ssaaFolder.show();
        else if (method === AntiAliasingMethod.TRAA) traaFolder.show();
        else if (method === AntiAliasingMethod.TAAU) taauFolder.show();
    }
    updateAaParams(pp.aaPass.method);
}

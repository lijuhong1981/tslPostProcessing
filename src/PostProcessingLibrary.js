import { Camera, Scene } from "three";
import { colorToDirection, diffuseColor, directionToColor, metalness, mrt, normalView, pass, renderOutput, roughness, sample, vec2, velocity } from "three/tsl";
import { DirectionalLight, RenderPipeline, UnsignedByteType, WebGPURenderer } from "three/webgpu";
import AntiAliasingPassProxy, { AntiAliasingMethod } from "./AntiAliasingPassProxy.js";
import BloomPassProxy from "./BloomPassProxy.js";
import GTAOPassProxy from "./GTAOPassProxy.js";
import OutlinePassProxy from "./OutlinePassProxy.js";
import SSGIPassProxy from "./SSGIPassProxy.js";
import SSRPassProxy from "./SSRPassProxy.js";
import SSSPassProxy from "./SSSPassProxy.js";

/**
 * 后处理库，用于管理各种后处理特效。
*/
class PostProcessingLibrary {
    /**
     * 构造函数
     * @param {WebGPURenderer} renderer - 渲染器
     * @param {Scene} scene - 场景
     * @param {Camera} camera - 相机
     * @param {DirectionalLight} [mainLight] - 场景主光源，必须是DirectionalLight类型，未指定则SSS（Screen Space Shadows）特效将无法使用
     * @constructor
    */
    constructor(renderer, scene, camera, mainLight) {
        /**
         * 渲染器
         * @type {WebGPURenderer}
         * @readonly
        */
        this.renderer = renderer;
        /**
         * 场景
         * @type {Scene}
         * @readonly
        */
        this.scene = scene;
        /**
         * 相机
         * @type {Camera}
         * @readonly
        */
        this.camera = camera;
        /**
         * 场景主光源，必须是DirectionalLight类型，未指定则SSS（Screen Space Shadows）特效将无法使用
         * @type {DirectionalLight}
         * @readonly
        */
        this.mainLight = mainLight;
        /**
         * 是否启用后处理。
         * @type {boolean}
         * @default true
        */
        this.enabled = true;
        /**
         * 是否需要更新后处理管线。
         * @type {boolean}
        */
        this.needsUpdate = true;
        /**
         * 后处理渲染管线
         * @type {RenderPipeline}
         * @readonly
        */
        this.renderPipeline = new RenderPipeline(renderer);
        /**
         * 屏幕空间环境光遮蔽（GTAO）通道实例。
         * @type {GTAOPassProxy}
         * @readonly
        */
        this.aoPass = new GTAOPassProxy(this);
        this.aoPass.changed.on((key, value) => {
            if (key === 'enabled')
                this.needsUpdate = true;
        });
        /**
         * 屏幕空间全局光照（SSGI）通道实例。
         * @type {SSGIPassProxy}
         * @readonly
        */
        this.ssgiPass = new SSGIPassProxy(this);
        this.ssgiPass.changed.on((key, value) => {
            if (key === 'enabled')
                this.needsUpdate = true;
        });
        /**
         * 屏幕空间反射（SSR）通道实例。
         * @type {SSRPassProxy}
         * @readonly
        */
        this.ssrPass = new SSRPassProxy(this);
        this.ssrPass.changed.on((key, value) => {
            if (key === 'enabled')
                this.needsUpdate = true;
        });
        /**
         * 屏幕空间阴影（SSS）通道实例。
         * @type {SSSPassProxy}
         * @readonly
        */
        this.sssPass = new SSSPassProxy(this);
        this.sssPass.changed.on((key, value) => {
            if (key === 'enabled')
                this.needsUpdate = true;
        });
        /**
         * 泛光（Bloom）通道实例。
         * @type {BloomPassProxy}
         * @readonly
        */
        this.bloomPass = new BloomPassProxy(this);
        this.bloomPass.changed.on((key, value) => {
            if (key === 'enabled')
                this.needsUpdate = true;
        });
        /**
         * 轮廓（Outline）通道实例。
         * @type {OutlinePassProxy}
         * @readonly
        */
        this.outlinePass = new OutlinePassProxy(this);
        this.outlinePass.changed.on((key, value) => {
            if (key === 'enabled')
                this.needsUpdate = true;
        });
        /**
         * 抗锯齿（Anti-Aliasing）通道实例。
         * @type {AntiAliasingPassProxy}
         * @readonly
        */
        this.aaPass = new AntiAliasingPassProxy(this);
        this.aaPass.changed.on((key, value) => {
            if (key === 'method' || key === 'enabled')
                this.needsUpdate = true;
        });

        this.outlinePass.enabled = true;
        // 启用了硬件抗锯齿，不需要开启后处理抗锯齿
        this.aaPass.enabled = !(renderer.samples > 0);
    }
    // setSize(width, height) {
    //     this.renderPipeline.setSize(width, height);
    // }
    /**
     * 构建渲染管线。
     * @param {boolean} force - 是否强制重新构建渲染管线 
    */
    build(force) {
        if (this.needsUpdate || force) {
            this.disposePasses();
            const { renderPipeline, aoPass, ssgiPass, ssrPass, sssPass, bloomPass, outlinePass, aaPass, scene, camera, mainLight } = this;
            const aaEnabled = aaPass.enabled;
            const aaMethod = aaPass.method;

            //#region 预渲染通道，用于生成无光照、深度、运动、金属/粗糙等节点
            const prePass = this.prePass = pass(scene, camera);
            prePass.name = 'Pre-Pass';
            // prePass.transparent = false;
            prePass.setMRT(mrt({
                output: diffuseColor,
                // normal: directionToColor(normalView),
                velocity: velocity,
                metalrough: vec2(metalness, roughness),
            }));
            // 无光照节点
            const sceneDiffuse = prePass.getTextureNode('output');
            sceneDiffuse.toInspector('Diffuse');
            // 深度节点
            const sceneDepth = prePass.getTextureNode('depth');
            sceneDepth.toInspector('Depth', () => prePass.getLinearDepthNode());
            // 运动节点
            const sceneVelocity = prePass.getTextureNode('velocity');
            sceneVelocity.toInspector('Velocity');
            // 金属/粗糙节点
            const sceneMetalRough = prePass.getTextureNode('metalrough');
            sceneMetalRough.toInspector('Metalness-Roughness');
            // 带宽优化
            const diffuseTexture = prePass.getTexture('output');
            const metalRoughTexture = prePass.getTexture('metalrough');
            diffuseTexture.type = metalRoughTexture.type = UnsignedByteType;
            //#endregion

            //#region  Normal预渲染通道，与prePass不同的是，会过滤掉场景中的Points、Line、Sprite等元素
            const preNormalPass = this.preNormalPass = pass(scene, camera);
            preNormalPass.name = 'Pre-NormalPass';
            // preNormalPass.transparent = false;
            preNormalPass.setMRT(mrt({
                // diffuse: diffuseColor,
                output: normalView, //为保证精度，法线输出不进行颜色编码，而是直接输出为浮点数格式的视图空间法线
            }));
            // 法线节点
            const sceneNormal = preNormalPass.getTextureNode('output');
            sceneNormal.toInspector('Normal');
            // 深度节点
            // const aoDepth = preNormalPass.getTextureNode('depth');
            // aoDepth.toInspector('AODepth', () => preNormalPass.getLinearDepthNode());
            // 重写updateBefore函数，在渲染前将Points、Line、Sprite等元素设置为不可见，渲染后再恢复
            const originalUpdateBefore = preNormalPass.updateBefore.bind(preNormalPass);
            const visibilityCache = [];
            preNormalPass.updateBefore = (frame) => {
                scene.traverseVisible((child) => {
                    if (child.isPoints || child.isLine || child.isLine2 || child.isSprite) {
                        child.visible = false;
                        visibilityCache.push(child);
                    }
                });
                try {
                    originalUpdateBefore(frame);
                } finally {
                    visibilityCache.forEach((child) => {
                        child.visible = true;
                    });
                    visibilityCache.length = 0;
                }
            };
            //#endregion

            //#region 场景渲染节点
            let scenePass;
            // 当启用了SSAA时，使用SSAA的输出作为场景通道的输出
            if (aaEnabled && aaMethod === AntiAliasingMethod.SSAA)
                scenePass = aaPass.ssaaPass.build(scene, camera);
            else
                scenePass = this.scenePass = pass(scene, camera);
            // 标准颜色输出节点
            const sceneColor = scenePass.getTextureNode();
            sceneColor.toInspector('Color');
            //#endregion

            let outputNode = sceneColor;

            //#region AO pass
            if (aoPass.enabled)
                outputNode = aoPass.build(sceneDepth, sceneNormal, camera, outputNode);
            //#endregion
            //#region ssgi-pass
            if (ssgiPass.enabled)
                outputNode = ssgiPass.build(sceneColor, sceneDepth, sceneNormal, camera, sceneDiffuse, outputNode);
            //#endregion
            //#region ssr-pass
            if (ssrPass.enabled)
                outputNode = ssrPass.build(sceneColor, sceneDepth, sceneNormal, sceneMetalRough.r, sceneMetalRough.g, camera, outputNode);
            //#endregion
            //#region sss-pass
            if (sssPass.enabled)
                outputNode = sssPass.build(sceneDepth, camera, mainLight, outputNode);
            //#endregion
            //#region  bloom-pass
            if (bloomPass.enabled)
                outputNode = bloomPass.build(sceneColor, outputNode);
            //#endregion
            //#region  outline-pass
            if (outlinePass.enabled)
                outputNode = outlinePass.build(scene, camera, outputNode);
            //#endregion

            renderPipeline.outputColorTransform = true;

            //#region anti-aliasing pass
            if (aaPass.enabled) {
                if (aaMethod === AntiAliasingMethod.FXAA) {
                    // 使用FXAA时，先进行色调映射和sRGB转换再执行FXAA
                    renderPipeline.outputColorTransform = false;
                    outputNode = renderOutput(outputNode);
                    outputNode = aaPass.fxaaPass.build(outputNode);
                } else {
                    switch (aaMethod) {
                        case AntiAliasingMethod.SMAA:
                            outputNode = aaPass.smaaPass.build(outputNode);
                            break;
                        case AntiAliasingMethod.TRAA:
                            outputNode = aaPass.traaPass.build(outputNode, sceneDepth, sceneVelocity, camera);
                            break;
                        case AntiAliasingMethod.TAAU:
                            outputNode = aaPass.taauPass.build(outputNode, sceneDepth, sceneVelocity, camera);
                            break;
                    }
                }
            }
            //#endregion

            renderPipeline.outputNode = outputNode;
            renderPipeline.needsUpdate = true;
            this.needsUpdate = false;
        }
    }
    /**
     * 执行渲染
     * @param {number} deltaTime - 与上一帧的间隔时间，单位秒
    */
    render(deltaTime) {
        this.build();
        if (this.enabled)
            this.renderPipeline.render();
        else
            this.renderer.render(this.scene, this.camera);
    }
    /**
     * 释放后处理管线中的Pass节点资源
     * @private
    */
    disposePasses() {
        if (this.prePass) {
            this.prePass.dispose();
            delete this.prePass;
        }
        if (this.preNormalPass) {
            this.preNormalPass.dispose();
            delete this.preNormalPass;
        }
        if (this.scenePass) {
            this.scenePass.dispose();
            delete this.scenePass;
        }
        this.aoPass.dispose();
        this.ssgiPass.dispose();
        this.ssrPass.dispose();
        this.sssPass.dispose();
        this.bloomPass.dispose();
        this.outlinePass.dispose();
        this.aaPass.dispose();
    }
    /**
     * 释放资源
     */
    dispose() {
        this.renderPipeline.dispose();
        this.disposePasses();
    }
};

export default PostProcessingLibrary;
export { PostProcessingLibrary };


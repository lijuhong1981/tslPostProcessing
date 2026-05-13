import EventSubscriber from "@lijuhong1981/jsevents/src/EventSubscriber.js";
import { Camera, Color, DoubleSide, NoBlending, Object3D, Scene, ShaderMaterial, WebGLRenderer, WebGLRenderTarget } from "three";
import { FullScreenQuad, Pass } from "three/addons/postprocessing/Pass.js";
import { CopyShader } from "three/addons/shaders/CopyShader.js";

/**
 * 线框渲染后处理通道
 * @extends Pass
 */
class WireframePass extends Pass {
    /**
     * 构造函数
     * @param {Scene} scene - 场景
     * @param {Camera} camera - 相机
    */
    constructor(scene, camera) {
        super();

        this.scene = scene;
        this.camera = camera;
        /**
         * 选中对象数组，为undefined时，表示全局显示场景所有对象。
         * @type {Array<Object3D>|undefined}
         */
        this.selectedObjects = undefined;
        /**
         * 线框颜色
         * @type {Color}
         * @default 0x000000
         */
        this.color = new Color(0x000000);
        /**
         * 线框线宽
         * @type {number}
         * @default 1.0
         */
        this.linewidth = 1.0;
        /**
         * 线框材质
         * @type {ShaderMaterial}
         * @readonly
        */
        this.wireframeMaterial = new ShaderMaterial({
            uniforms: {
                "color": { value: this.color }
            },
            vertexShader: `
                void main() {
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;

                void main() {
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: DoubleSide,
            transparent: false,
            opacity: 1.0,
            wireframe: true,
            vertexColors: false,
            depthTest: true,
            depthWrite: false
        });

        // 复制材质，用于混合渲染buffer
        this._copyMaterial = new ShaderMaterial(Object.assign({}, CopyShader, {
            depthTest: true,
            depthWrite: false,
            blending: NoBlending,
        }));

        this._fsQuad = new FullScreenQuad(this._copyMaterial);
        this._selectedMeshes = [];
        this._invisibleCaches = new Map();
    }
    /**
     * 状态改变事件订阅器
     * @type {EventSubscriber}
     * @readonly
    */
    get changed() {
        if (!this._changed)
            this._changed = new EventSubscriber();
        return this._changed;
    }
    set enabled(value) {
        if (this._enabled !== value) {
            this._enabled = value;
            this.changed.raiseEvent('enabled', value);
        }
    }
    get enabled() {
        return this._enabled;
    }
    /**
     * 渲染
     * @param {WebGLRenderer} renderer - 渲染器
     * @param {WebGLRenderTarget} writeBuffer - 写入缓冲区
     * @param {WebGLRenderTarget} readBuffer - 读取缓冲区
     * @param {number} deltaTime - 时间差
     * @param {boolean} maskActive - 是否激活遮罩
    */
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        // 选中的对象数组存在时，隐藏非选中的对象。
        if (Array.isArray(this.selectedObjects)) {
            const meshes = [];
            // 遍历选中的对象，将选中的对象添加到meshes数组中
            this.selectedObjects.forEach(element => {
                element.traverse(child => {
                    if (child.isMesh) {
                        meshes.push(child);
                    }
                });
            });
            // 遍历场景，将非选中的对象设置为不可见，并添加到_invisibleCaches映射中
            this.scene.traverseVisible(child => {
                if (child.geometry) {
                    if (!meshes.includes(child)) {
                        this._invisibleCaches.set(child, child.visible);
                        child.visible = false;
                    }
                }
            });
            meshes.length = 0; //清空meshes数组
        }

        // 保存原始状态
        const originalOverrideMaterial = this.scene.overrideMaterial;
        const originalBackground = this.scene.background;
        const originalEnvironment = this.scene.environment;
        const originalAutoClear = renderer.autoClear;

        this.wireframeMaterial.wireframeLinewidth = this.linewidth;
        // 设置场景为线框模式
        this.scene.overrideMaterial = this.wireframeMaterial;
        this.scene.background = null;
        this.scene.environment = null;

        // 设置渲染器状态
        renderer.autoClear = false;

        // 设置渲染目标
        renderer.setRenderTarget(writeBuffer);
        // 复制输入缓冲区
        this._copyMaterial.uniforms.tDiffuse.value = readBuffer.texture;
        this._fsQuad.render(renderer);
        // 渲染线框场景
        renderer.render(this.scene, this.camera);

        // 恢复原始状态
        this.scene.overrideMaterial = originalOverrideMaterial;
        this.scene.background = originalBackground;
        this.scene.environment = originalEnvironment;
        renderer.autoClear = originalAutoClear;
        // 恢复非选中的对象的可见性
        if (this._invisibleCaches.size > 0) {
            this._invisibleCaches.forEach((value, key) => {
                key.visible = value;
            });
            this._invisibleCaches.clear();
        }

        if (this.renderToScreen) {
            renderer.setRenderTarget(null);
            // 复制输出缓冲区到屏幕
            this._copyMaterial.uniforms.tDiffuse.value = writeBuffer.texture;
            this._fsQuad.render(renderer);
        }
    }
    /**
     * 释放资源
    */
    dispose() {
        this.wireframeMaterial.dispose();
        this._copyMaterial.dispose();
        this._fsQuad.dispose();
        if (this._tempRenderTarget) {
            this._tempRenderTarget.dispose();
        }
    }
};

export default WireframePass;
export { WireframePass };

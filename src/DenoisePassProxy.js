import Check from "@lijuhong1981/jscheck/src/Check.js";
import PassNodeProxy from "./PassNodeProxy.js";
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';

/**
 * @import { Camera, TextureNode } from "three/webgpu";
 * @import DenoiseNode from 'three/addons/tsl/display/DenoiseNode.js';
*/

/**
 * DenoisePassProxy是PassNodeProxy的一个子类，用于代理Denoise（降噪）后处理特效的Pass节点。
 * 可配合GTAO、SSGI、SSR、SSS等关闭时域滤波（useTemporalFiltering=false）时产生的噪点进行降噪。
 * @class
 * @extends PassNodeProxy<DenoiseNode>
*/
class DenoisePassProxy extends PassNodeProxy {
    constructor(library) {
        super(library);
        // 默认值与 three.js DenoiseNode 保持一致。调参方向：
        // - lumaPhi / depthPhi：值越大越宽容（越平滑），越小越保边（降噪越弱）
        // - normalPhi：法线点积的指数，值越大越严格（越保边），越小越平滑
        // - radius：采样半径（像素），越大降噪越强但越容易糊
        // - index：时域旋转索引，逐帧变化可进一步抑制时域噪声
        this._values = {
            lumaPhi: 5,
            depthPhi: 5,
            normalPhi: 5,
            radius: 5,
            index: 0,
        };
    }
    /**
     * The luma Phi value.
     * @type {number}
     * @default 5
    */
    set lumaPhi(value) {
        Check.typeOf.number('lumaPhi', value);
        this._values.lumaPhi = value;
        this.node && (this.node.lumaPhi.value = value);
    }
    get lumaPhi() {
        return this._values.lumaPhi;
    }
    /**
     * The depth Phi value.
     * @type {number}
     * @default 5
    */
    set depthPhi(value) {
        Check.typeOf.number('depthPhi', value);
        this._values.depthPhi = value;
        this.node && (this.node.depthPhi.value = value);
    }
    get depthPhi() {
        return this._values.depthPhi;
    }
    /**
     * The normal Phi value.
     * @type {number}
     * @default 5
    */
    set normalPhi(value) {
        Check.typeOf.number('normalPhi', value);
        this._values.normalPhi = value;
        this.node && (this.node.normalPhi.value = value);
    }
    get normalPhi() {
        return this._values.normalPhi;
    }
    /**
     * The radius.
     * @type {number}
     * @default 5
    */
    set radius(value) {
        Check.typeOf.number('radius', value);
        this._values.radius = value;
        this.node && (this.node.radius.value = value);
    }
    get radius() {
        return this._values.radius;
    }
    /**
     * The index.
     * @type {number}
     * @default 0
    */
    set index(value) {
        Check.typeOf.number('index', value);
        this._values.index = value;
        this.node && (this.node.index.value = value);
    }
    get index() {
        return this._values.index;
    }
    /**
     * 构建Denoise Pass节点。
     * @param {TextureNode} depthNode - 深度节点对象
     * @param {TextureNode} normalNode - 法线节点对象
     * @param {Camera} camera - 相机对象
     * @param {TextureNode} outputNode - 输出节点对象
     * @returns {DenoiseNode} 处理后的节点对象
     * @override
    */
    build(depthNode, normalNode, camera, outputNode) {
        const denoisePass = this.node = denoise(outputNode, depthNode, normalNode, camera);
        denoisePass.toInspector('Denoise');
        this.setValues(this._values);
        return denoisePass;
    }
};

export default DenoisePassProxy;
export { DenoisePassProxy };

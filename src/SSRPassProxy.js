import Check from "@lijuhong1981/jscheck/src/Check.js";
import PassNodeProxy from "./PassNodeProxy.js";
import SSRNode, { ssr } from 'three/addons/tsl/display/SSRNode.js';
import { Camera, Node, TextureNode } from "three/webgpu";

/**
 * SSRPassProxy是PassNodeProxy的一个子类，用于代理SSR（Screen Space Reflections）后处理特效的Pass节点。
 * @class
 * @extends PassNodeProxy<SSRNode>
*/
class SSRPassProxy extends PassNodeProxy {
    constructor(library) {
        super(library);
        this._values = {
            resolutionScale: 1,
            maxDistance: 1,
            thickness: 0.03,
            opacity: 1,
            quality: 0.5,
            blurQuality: 1,
        };
    }
    /**
     * The resolution scale. Valid values are in the range
     * `[0,1]`. `1` means best quality but also results in
     * more computational overhead. Setting to `0.5` means
     * the effect is computed in half-resolution.
     *
     * @type {number}
     * @default 1
     */
    set resolutionScale(value) {
        Check.typeOf.number('resolutionScale', value);
        this._values.resolutionScale = value;
        this.node && (this.node.resolutionScale = value);
    }
    get resolutionScale() {
        return this._values.resolutionScale;
    }
    /**
     * Controls how far a fragment can reflect. Increasing this value result in more
     * computational overhead but also increases the reflection distance.
     *
     * @type {number}
     * @default 1
     */
    set maxDistance(value) {
        Check.typeOf.number('maxDistance', value);
        this._values.maxDistance = value;
        this.node && (this.node.maxDistance.value = value);
    }
    get maxDistance() {
        return this._values.maxDistance;
    }
    /**
     * Controls the cutoff between what counts as a possible reflection hit and what does not.
     *
     * @type {number}
     * @default 0.03
     */
    set thickness(value) {
        Check.typeOf.number('thickness', value);
        this._values.thickness = value;
        this.node && (this.node.thickness.value = value);
    }
    get thickness() {
        return this._values.thickness;
    }
    /**
     * Controls how the SSR reflections are blended with the beauty pass.
     *
     * @type {number}
     * @default 1
     */
    set opacity(value) {
        Check.typeOf.number('opacity', value);
        this._values.opacity = value;
        this.node && (this.node.opacity.value = value);
    }
    get opacity() {
        return this._values.opacity;
    }
    /**
     * This parameter controls how detailed the raymarching process works.
     * The value ranges is `[0,1]` where `1` means best quality (the maximum number
     * of raymarching iterations/samples) and `0` means no samples at all.
     *
     * A quality of `0.5` is usually sufficient for most use cases. Try to keep
     * this parameter as low as possible. Larger values result in noticeable more
     * overhead.
     *
     * @type {number}
     * @default 0.5
     */
    set quality(value) {
        Check.typeOf.number('quality', value);
        this._values.quality = value;
        this.node && (this.node.quality.value = value);
    }
    get quality() {
        return this._values.quality;
    }
    /**
     * The quality of the blur. Must be an integer in the range `[1,3]`.
     *
     * @type {number}
     * @default 1
     */
    set blurQuality(value) {
        Check.typeOf.number('blurQuality', value);
        this._values.blurQuality = value;
        this.node && (this.node.blurQuality.value = value);
    }
    get blurQuality() {
        return this._values.blurQuality;
    }
    /**
     * 构建SSR Pass节点。
     * @param {TextureNode} colorNode - 颜色节点对象 
     * @param {TextureNode} depthNode - 深度节点对象
     * @param {TextureNode} normalNode - 法线节点对象
     * @param {Node} metalnessNode - 金属度节点对象
     * @param {Node} roughnessNode - 粗糙度节点对象
     * @param {Camera} camera - 相机对象
     * @param {TextureNode} outputNode - 输出节点对象
     * @returns {TextureNode} 处理后的节点对象
     * @override
    */
    build(colorNode, depthNode, normalNode, metalnessNode, roughnessNode, camera, outputNode) {
        const ssrPass = this.node = ssr(colorNode, depthNode, normalNode, metalnessNode, roughnessNode, camera).toInspector('SSR');
        this.setValues(this._values);
        return outputNode.add(ssrPass.rgb);
    }
};

export default SSRPassProxy;
export { SSRPassProxy };
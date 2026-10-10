import Check from "@lijuhong1981/jscheck/src/Check.js";
import PassNodeProxy from "./PassNodeProxy.js";
import { ssr } from 'three/addons/tsl/display/SSRNode.js';

/**
 * @import { Camera, Node, TextureNode } from "three/webgpu";
 * @import SSRNode from 'three/addons/tsl/display/SSRNode.js';
*/

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
     * `[0.1,1]`（最小 0.1 为兼容 three.js SSRNode 模糊 RT 的 mip 限制）。
     * `1` means best quality but also results in
     * more computational overhead. Setting to `0.5` means
     * the effect is computed in half-resolution.
     *
     * @type {number}
     * @default 1
     */
    set resolutionScale(value) {
        Check.typeOf.number('resolutionScale', value);
        // three.js SSRNode 的模糊 RT 带 5 级 mipmap，分辨率过小（min(宽,高)<16px）会导致 WebGPU
        // 创建纹理失败（mip 级数超限），故限制最小值为 0.1
        value = Math.min(1, Math.max(0.1, value));
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
        // three r185 起 SSRNode 移除了 opacity 属性
        this.node && this.node.opacity && (this.node.opacity.value = value);
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
        if (this.node && this.node.blurQuality !== undefined) {
            // r184 为 UniformNode（.value），r185 起改为普通数值属性（getter/setter）
            if (this.node.blurQuality.value !== undefined)
                this.node.blurQuality.value = value;
            else
                this.node.blurQuality = value;
        }
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
        // three r185 起 ssr() 由位置参数改为 options 对象（metalnessNode/roughnessNode/camera 通过 options 传入）
        const ssrPass = this.node = (ssr.length >= 4
            ? ssr(colorNode, depthNode, normalNode, metalnessNode, roughnessNode, camera)
            : ssr(colorNode, depthNode, normalNode, { metalnessNode, roughnessNode, camera })
        ).toInspector('SSR');
        this.setValues(this._values);
        return outputNode.add(ssrPass.rgb);
    }
};

export default SSRPassProxy;
export { SSRPassProxy };
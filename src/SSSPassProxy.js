import Check from "@lijuhong1981/jscheck/src/Check.js";
import PassNodeProxy from "./PassNodeProxy.js";
import SSSNode, { sss } from 'three/addons/tsl/display/SSSNode.js';
import { DirectionalLight, Light, Node, PassNode, TextureNode } from "three/webgpu";
import { builtinShadowContext, screenUV, vec3, vec4 } from "three/tsl";

/**
 * SSSPassProxy是PassNodeProxy的一个子类，用于代理SSS（Screen Space Shadows）后处理特效的Pass节点。
 * @class
 * @extends PassNodeProxy<SSSNode>
*/
class SSSPassProxy extends PassNodeProxy {
    constructor(library) {
        super(library);
        this._values = {
            resolutionScale: 1,
            maxDistance: 0.2,
            thickness: 0.01,
            shadowIntensity: 1,
            quality: 0.5,
            useTemporalFiltering: true,
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
     * Maximum shadow length in world units. Longer shadows result in more computational
     * overhead.
     *
     * @type {number}
     * @default 0.2
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
     * Depth testing thickness.
     *
     * @type {number}
     * @default 0.01
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
     * Shadow intensity. Must be in the range `[0, 1]`.
     *
     * @type {number}
     * @default 1
     */
    set shadowIntensity(value) {
        Check.typeOf.number('shadowIntensity', value);
        this._values.shadowIntensity = value;
        this.node && (this.node.shadowIntensity.value = value);
    }
    get shadowIntensity() {
        return this._values.shadowIntensity;
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
     * Whether to use temporal filtering or not. Setting this property to
     * `true` requires the usage of `TRAANode`. This will help to reduce noice
     * although it introduces typical TAA artifacts like ghosting and temporal
     * instabilities.
     *
     * @type {boolean}
     * @default true
     */
    set useTemporalFiltering(value) {
        Check.typeOf.boolean('useTemporalFiltering', value);
        this._values.useTemporalFiltering = value;
        this.node && (this.node.useTemporalFiltering = value);
    }
    get useTemporalFiltering() {
        return this._values.useTemporalFiltering;
    }
    /**
     * 构建SSS Pass节点。
     * @param {TextureNode} depthNode - 深度节点对象
     * @param {Camera} camera - 摄像机对象
     * @param {DirectionalLight} mainLight - 主光源对象，必须是DirectionalLight类型
     * @param {TextureNode} outputNode - 输出节点对象
     * @returns {TextureNode} 处理后的节点对象
     * @override
    */
    build(depthNode, camera, mainLight, outputNode) {
        const sssPass = this.node = sss(depthNode, camera, mainLight).toInspector('SSS');
        this.setValues(this._values);
        // const sssSample = sssPass.getTextureNode().sample(screenUV).r;
        // const sssContext = builtinShadowContext(sssSample, mainLight);
        // scenePass.contextNode = sssContext;
        const sssPassOutput = sssPass.getTextureNode();
        return outputNode.mul(vec4(vec3(sssPassOutput.r), 1));
    }
};

export default SSSPassProxy;
export { SSSPassProxy };
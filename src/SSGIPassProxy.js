import Check from "@lijuhong1981/jscheck/src/Check.js";
import PassNodeProxy from "./PassNodeProxy.js";
import SSGINode, { ssgi } from 'three/addons/tsl/display/SSGINode.js';
import { Camera, Node, TextureNode } from "three/webgpu";
import { add, vec4 } from "three/tsl";

/**
 * SSGIPassProxy是PassNodeProxy的一个子类，用于代理SSGI（Screen Space Global Illumination）后处理特效的Pass节点。
 * @class
 * @extends PassNodeProxy<SSGINode>
*/
class SSGIPassProxy extends PassNodeProxy {
    constructor(library) {
        super(library);
        this._values = {
            sliceCount: 2,
            stepCount: 8,
            aoIntensity: 0,
            giIntensity: 10,
            radius: 12,
            useScreenSpaceSampling: false,
            expFactor: 2,
            thickness: 1,
            useLinearThickness: true,
            backfaceLighting: 0,
            useTemporalFiltering: true,
        };
    }
    /**
     * Number of per-pixel hemisphere slices. This has a big performance cost and should be kept as low as possible.
     * Should be in the range `[1, 4]`.
     *
     * @type {number}
     * @default 2
     */
    set sliceCount(value) {
        Check.typeOf.number('sliceCount', value);
        this._values.sliceCount = value;
        this.node && (this.node.sliceCount.value = value);
    }
    get sliceCount() {
        return this._values.sliceCount;
    }
    /**
     * Number of samples taken along one side of a given hemisphere slice. This has a big performance cost and should
     * be kept as low as possible.  Should be in the range `[1, 32]`.
     *
     * @type {number}
     * @default 8
     */
    set stepCount(value) {
        Check.typeOf.number('stepCount', value);
        this._values.stepCount = value;
        this.node && (this.node.stepCount.value = value);
    }
    get stepCount() {
        return this._values.stepCount;
    }
    /**
     * Power function applied to AO to make it appear darker/lighter. Should be in the range `[0, 4]`.
     *
     * @type {number}
     * @default 0
     */
    set aoIntensity(value) {
        Check.typeOf.number('aoIntensity', value);
        this._values.aoIntensity = value;
        this.node && (this.node.aoIntensity.value = value);
    }
    get aoIntensity() {
        return this._values.aoIntensity;
    }
    /**
     * Intensity of the indirect diffuse light. Should be in the range `[0, 100]`.
     *
     * @type {number}
     * @default 10
     */
    set giIntensity(value) {
        Check.typeOf.number('giIntensity', value);
        this._values.giIntensity = value;
        this.node && (this.node.giIntensity.value = value);
    }
    get giIntensity() {
        return this._values.giIntensity;
    }
    /**
     * Effective sampling radius in world space. AO and GI can only have influence within that radius.
     * Should be in the range `[1, 25]`.
     *
     * @type {number}
     * @default 12
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
     * Makes the sample distance in screen space instead of world-space (helps having more detail up close).
     *
     * @type {boolean}
     * @default false
     */
    set useScreenSpaceSampling(value) {
        Check.typeOf.boolean('useScreenSpaceSampling', value);
        this._values.useScreenSpaceSampling = value;
        this.node && (this.node.useScreenSpaceSampling.value = value);
    }
    get useScreenSpaceSampling() {
        return this._values.useScreenSpaceSampling;
    }
    /**
     * Controls samples distribution. It's an exponent applied at each step get increasing step size over the distance.
     * Should be in the range `[1, 3]`.
     *
     * @type {number}
     * @default 2
     */
    set expFactor(value) {
        Check.typeOf.number('expFactor', value);
        this._values.expFactor = value;
        this.node && (this.node.expFactor.value = value);
    }
    get expFactor() {
        return this._values.expFactor;
    }
    /**
     * Constant thickness value of objects on the screen in world units. Allows light to pass behind surfaces past that thickness value.
     * Should be in the range `[0.01, 10]`.
     *
     * @type {number}
     * @default 1
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
     * Whether to increase thickness linearly over distance or not (avoid losing detail over the distance).
     *
     * @type {boolean}
     * @default false
     */
    set useLinearThickness(value) {
        Check.typeOf.boolean('useLinearThickness', value);
        this._values.useLinearThickness = value;
        this.node && (this.node.useLinearThickness.value = value);
    }
    get useLinearThickness() {
        return this._values.useLinearThickness;
    }
    /**
     * How much light backface surfaces emit.
     * Should be in the range `[0, 1]`.
     *
     * @type {number}
     * @default 0
     */
    set backfaceLighting(value) {
        Check.typeOf.number('backfaceLighting', value);
        this._values.backfaceLighting = value;
        this.node && (this.node.backfaceLighting.value = value);
    }
    get backfaceLighting() {
        return this._values.backfaceLighting;
    }
    /**
     * Whether to use temporal filtering or not. Setting this property to
     * `true` requires the usage of `TRAANode`. This will help to reduce noise
     * although it introduces typical TAA artifacts like ghosting and temporal instabilities.
     *
     * If setting this property to `false`, a manual denoise via `DenoiseNode` is required.
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
     * 构建SSGI Pass节点。
     * @param {TextureNode} colorNode - 颜色节点对象 
     * @param {TextureNode} depthNode - 深度节点对象
     * @param {TextureNode} normalNode - 法线节点对象
     * @param {Camera} camera - 相机对象
     * @param {TextureNode} diffuseNode - 漫反射节点对象
     * @param {TextureNode} outputNode - 输出节点对象
     * @returns {Node} 处理后的节点对象
     * @override
    */
    build(colorNode, depthNode, normalNode, camera, diffuseNode, outputNode) {
        const ssgiPass = this.node = ssgi(colorNode, depthNode, normalNode, camera);
        this.setValues(this._values);
        const gi = ssgiPass.rgb.toInspector('SSGI');
        const ao = ssgiPass.a.toInspector('SSAO');
        // const compositePass = vec4(add(outputNode.rgb.mul(ao), (diffuseNode.rgb.mul(gi))), outputNode.a);
        // compositePass.name = 'SSGI-Composite';
        // return compositePass;
        outputNode.rgb.mul(ao).add(diffuseNode.rgb.mul(gi));
        return outputNode;
    }
};

export default SSGIPassProxy;
export { SSGIPassProxy };
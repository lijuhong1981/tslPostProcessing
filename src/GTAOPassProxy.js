import Check from "@lijuhong1981/jscheck/src/Check.js";
import GTAONode, { ao } from "three/addons/tsl/display/GTAONode.js";
import { vec3, vec4 } from "three/tsl";
import { Camera, TextureNode } from "three/webgpu";
import PassNodeProxy from "./PassNodeProxy.js";

/**
 * GTAOPassProxy是PassNodeProxy的一个子类，用于代理GTAO（Ground Truth Ambient Occlusion）后处理特效的Pass节点。
 * @class
 * @extends PassNodeProxy<GTAONode>
*/
class GTAOPassProxy extends PassNodeProxy {
    constructor(library) {
        super(library);
        this._values = {
            resolutionScale: 1,
            radius: 0.25,
            thickness: 1,
            distanceExponent: 1,
            distanceFallOff: 1,
            scale: 1,
            samples: 8,
            useTemporalFiltering: false,
        };
    }
    /**
     * The resolution scale. By default the effect is rendered in full resolution
     * for best quality but a value of `0.5` should be sufficient for most scenes.
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
     * The radius of the ambient occlusion.
     * @type {number}
     * @default 0.25
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
     * The thickness of the ambient occlusion.
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
     * Another option to tweak the occlusion. The recommended range is `[1,2]` for attenuating the AO.
     * @type {number}
     * @default 1
    */
    set distanceExponent(value) {
        Check.typeOf.number('distanceExponent', value);
        this._values.distanceExponent = value;
        this.node && (this.node.distanceExponent.value = value);
    }
    get distanceExponent() {
        return this._values.distanceExponent;
    }
    /**
     * The distance fall off value of the ambient occlusion. A lower value leads to a larger AO effect. The value should lie in the range `[0,1]`.
     * @type {number}
     * @default 1
    */
    set distanceFallOff(value) {
        Check.typeOf.number('distanceFallOff', value);
        this._values.distanceFallOff = value;
        this.node && (this.node.distanceFallOff.value = value);
    }
    get distanceFallOff() {
        return this._values.distanceFallOff;
    }
    /**
     * The scale of the ambient occlusion.
     * @type {number}
     * @default 1
    */
    set scale(value) {
        Check.typeOf.number('scale', value);
        this._values.scale = value;
        this.node && (this.node.scale.value = value);
    }
    get scale() {
        return this._values.scale;
    }
    /**
     * How many samples are used to compute the AO. A higher value results in better quality but also in a more expensive runtime behavior.
     * @type {number}
     * @default 8
    */
    set samples(value) {
        Check.typeOf.number('samples', value);
        this._values.samples = value;
        this.node && (this.node.samples.value = value);
    }
    get samples() {
        return this._values.samples;
    }
    /**
     * Whether to use temporal filtering or not. Setting this property to
     * `true` requires the usage of `TRAANode`. This will help to reduce noise
     * although it introduces typical TAA artifacts like ghosting and temporal
     * instabilities.
     *
     * If setting this property to `false`, a manual denoise via `DenoiseNode`
     * might be required.
     * @type {boolean}
     * @default false
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
     * 构建GTAO Pass节点。
     * @param {TextureNode} depthNode - 深度节点对象
     * @param {TextureNode} normalNode - 法线节点对象
     * @param {Camera} camera - 相机对象
     * @param {TextureNode} outputNode - 输出节点对象
     * @returns {TextureNode} 处理后的节点对象
     * @override
    */
    build(depthNode, normalNode, camera, outputNode) {
        const aoPass = this.node = ao(depthNode, normalNode, camera);
        aoPass.toInspector('GTAO');
        this.setValues(this._values);
        const aoPassOutput = aoPass.getTextureNode();
        // AO乘法混合
        return outputNode.mul(vec4(vec3(aoPassOutput.r), 1));
    }
};

export default GTAOPassProxy;
export { GTAOPassProxy };


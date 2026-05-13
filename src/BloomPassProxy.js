import Check from "@lijuhong1981/jscheck/src/Check.js";
import BloomNode, { bloom } from "three/addons/tsl/display/BloomNode.js";
import { TextureNode } from "three/webgpu";
import PassNodeProxy from "./PassNodeProxy.js";

/**
 * BloomPassProxy是PassNodeProxy的一个子类，用于代理Bloom（泛光）后处理特效的Pass节点。
 * @class
 * @extends PassNodeProxy<BloomNode>
*/
class BloomPassProxy extends PassNodeProxy {
    constructor(library) {
        super(library);
        this._values = {
            strength: 0.5,
            radius: 0,
            threshold: 0,
            smoothWidth: 0.01,
        };
    }
    /**
     * The strength of the bloom.
     * @type {number}
     * @default 0.5
    */
    set strength(value) {
        Check.typeOf.number('strength', value);
        this._values.strength = value;
        this.node && (this.node.strength.value = value);
    }
    get strength() {
        return this._values.strength;
    }
    /**
     * The radius of the bloom. Must be in the range `[0,1]`.
     * @type {number}
     * @default 0.0
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
     * The luminance threshold limits which bright areas contribute to the bloom effect.
     * @type {number}
     * @default 0.0
    */
    set threshold(value) {
        Check.typeOf.number('threshold', value);
        this._values.threshold = value;
        this.node && (this.node.threshold.value = value);
    }
    get threshold() {
        return this._values.threshold;
    }
    /**
     * Can be used to tweak the extracted luminance from the scene.
     * @type {number}
     * @default 0.01
    */
    set smoothWidth(value) {
        Check.typeOf.number('smoothWidth', value);
        this._values.smoothWidth = value;
        this.node && (this.node.smoothWidth.value = value);
    }
    get smoothWidth() {
        return this._values.smoothWidth;
    }
    /**
     * 构建Bloom Pass节点。
     * @param {TextureNode} inputNode 输入节点对象
     * @param {TextureNode} outputNode 输出节点对象
     * @returns {TextureNode} 处理后的节点对象
     * @override
    */
    build(inputNode, outputNode) {
        const bloomPass = this.node = bloom(inputNode);
        bloomPass.toInspector('Bloom');
        this.setValues(this._values);
        // Bloom加法混合
        return outputNode.add(bloomPass);
    }
};

export default BloomPassProxy;
export { BloomPassProxy };


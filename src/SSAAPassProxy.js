import Check from "@lijuhong1981/jscheck/src/Check.js";
import { Camera, Scene } from "three";
import SSAAPassNode, { ssaaPass } from 'three/addons/tsl/display/SSAAPassNode.js';
import { Node, TextureNode } from "three/webgpu";
import PassNodeProxy from "./PassNodeProxy.js";

/**
 * SSAAPassProxy是PassNodeProxy的一个子类，用于代理SSAA（超采样抗锯齿）后处理特效的Pass节点。
 * @class
 * @extends PassNodeProxy<SSAAPassNode>
*/
class SSAAPassProxy extends PassNodeProxy {
    constructor(library) {
        super(library);
        this._values = {
            sampleLevel: 2,
            unbiased: true,
        };
    }
    /**
     * The sample level specified  as n, where the number of samples is 2^n,
     * so sampleLevel = 4, is 2^4 samples, 16.
     *
     * @type {number}
     * @default 2
    */
    set sampleLevel(value) {
        Check.typeOf.number('sampleLevel', value);
        this._values.sampleLevel = value;
        this.node && (this.node.sampleLevel = value);
    }
    get sampleLevel() {
        return this._values.sampleLevel;
    }
    /**
     * Whether rounding errors should be mitigated or not.
     *
     * @type {boolean}
     * @default true
    */
    set unbiased(value) {
        Check.typeOf.boolean('unbiased', value);
        this._values.unbiased = value;
        this.node && (this.node.unbiased = value);
    }
    get unbiased() {
        return this._values.unbiased;
    }
    /**
     * 构建SSAA Pass节点。
     * @param {Scene} scene - 场景对象
     * @param {Camera} camera - 相机对象
     * @returns {SSAAPassNode} 构建出的节点对象
     * @override
    */
    build(scene, camera) {
        const ssaaPassNode = this.node = ssaaPass(scene, camera);
        this.setValues(this._values);
        // PassNode会在setup/update流程里依据options.samples重设renderTarget.samples。
        // 这里显式固定为0，确保SSAA内部depth copy两端采样数一致。
        // ssaaPassNode.options.samples = 0;
        // ssaaPassNode.renderTarget.samples = 0;
        ssaaPassNode.toInspector('SSAA');
        return ssaaPassNode;
    }
};

export default SSAAPassProxy;
export { SSAAPassProxy };


import Check from "@lijuhong1981/jscheck/src/Check.js";
import TRAANode, { traa } from 'three/addons/tsl/display/TRAANode.js';
import { Camera, Node, TextureNode } from 'three/webgpu';
import PassNodeProxy from './PassNodeProxy.js';

/**
 * TRAAPassProxy是TRAANode节点的代理类，用于管理TRAA(Temporal Reprojection Anti-Aliasing)后处理特效的Pass节点。
 * @class
 * @extends PassNodeProxy<TRAANode>
*/
class TRAAPassProxy extends PassNodeProxy {
    constructor(library) {
        super(library);
        this._values = {
            depthThreshold: 0.0005,
            edgeDepthDiff: 0.001,
            maxVelocityLength: 128,
            useSubpixelCorrection: true,
        };
    }
    /**
     * When the difference between the current and previous depth goes above this threshold,
     * the history is considered invalid.
     *
     * @type {number}
     * @default 0.0005
     */
    set depthThreshold(value) {
        Check.typeOf.number('depthThreshold', value);
        this._values.depthThreshold = value;
        this.node && (this.node.depthThreshold = value);
    }
    get depthThreshold() {
        return this._values.depthThreshold;
    }
    /**
     * The depth difference within the 3×3 neighborhood to consider a pixel as an edge.
     *
     * @type {number}
     * @default 0.001
     */
    set edgeDepthDiff(value) {
        Check.typeOf.number('edgeDepthDiff', value);
        this._values.edgeDepthDiff = value;
        this.node && (this.node.edgeDepthDiff = value);
    }
    get edgeDepthDiff() {
        return this._values.edgeDepthDiff;
    }
    /**
     * The history becomes invalid as the pixel length of the velocity approaches this value.
     *
     * @type {number}
     * @default 128
     */
    set maxVelocityLength(value) {
        Check.typeOf.number('maxVelocityLength', value);
        this._values.maxVelocityLength = value;
        this.node && (this.node.maxVelocityLength = value);
    }
    get maxVelocityLength() {
        return this._values.maxVelocityLength;
    }
    /**
     * Whether to decrease the weight on the current frame when the velocity is more subpixel.
     * This reduces blurriness under motion, but can introduce a square pattern artifact.
     *
     * @type {boolean}
     * @default true
     */
    set useSubpixelCorrection(value) {
        Check.typeOf.boolean('useSubpixelCorrection', value);
        this._values.useSubpixelCorrection = value;
        this.node && (this.node.useSubpixelCorrection = value);
    }
    get useSubpixelCorrection() {
        return this._values.useSubpixelCorrection;
    }
    /**
     * 构建TRAA Pass节点。
     * @param {TextureNode} inputNode - 输入节点对象 
     * @param {TextureNode} depthNode - 深度节点对象
     * @param {TextureNode} velocityNode - 运动节点对象
     * @param {Camera} camera - 相机对象 
     * @returns {Node} 处理后的节点对象
     * @override 
    */
    build(inputNode, depthNode, velocityNode, camera) {
        const traaPass = this.node = traa(inputNode, depthNode, velocityNode, camera);
        this.setValues(this._values);
        return traaPass;
    }
};

export default TRAAPassProxy;
export { TRAAPassProxy };


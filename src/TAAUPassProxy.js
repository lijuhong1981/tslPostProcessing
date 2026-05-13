import TAAUNode, { taau } from 'three/addons/tsl/display/TAAUNode.js';
import { Camera, Node, TextureNode } from 'three/webgpu';
import PassNodeProxy from './PassNodeProxy.js';

/**
 * TAAUPassProxy是TAAUNode节点的代理类，用于管理TAAU(Temporal Anti-Aliasing Upsampling)后处理特效的Pass节点。
 * @class
 * @extends PassNodeProxy<TAAUNode>
*/
class TAAUPassProxy extends PassNodeProxy {
    constructor(library) {
        super(library);
        this._values = {
            depthThreshold: 0.0005,
            edgeDepthDiff: 0.001,
            maxVelocityLength: 128,
            currentFrameWeight: 0.025,
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
        this._values.maxVelocityLength = value;
        this.node && (this.node.maxVelocityLength = value);
    }
    get maxVelocityLength() {
        return this._values.maxVelocityLength;
    }
    /**
     * Baseline weight applied to the current frame in the resolve. Lower
     * values produce smoother results with longer accumulation but slower
     * convergence on disoccluded regions; the motion factor is added on
     * top, so fast-moving pixels still respond quickly.
     *
     * @type {number}
     * @default 0.025
     */
    set currentFrameWeight(value) {
        this._values.currentFrameWeight = value;
        this.node && (this.node.currentFrameWeight = value);
    }
    get currentFrameWeight() {
        return this._values.currentFrameWeight;
    }
    /**
     * 构建TAAU Pass节点。
     * @param {TextureNode} inputNode - 输出节点对象
     * @param {TextureNode} depthNode - 深度节点对象
     * @param {TextureNode} velocityNode - 运动节点对象
     * @param {Camera} camera - 相机对象
     * @returns {Node} 处理后的节点对象
     * @override 
    */
    build(inputNode, depthNode, velocityNode, camera) {
        const taauPass = this.node = taau(inputNode, depthNode, velocityNode, camera);
        this.setValues(this._values);
        return taauPass;
    }
};

export default TAAUPassProxy;
export { TAAUPassProxy };


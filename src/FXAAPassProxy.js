import FXAANode, { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { TextureNode } from 'three/webgpu';
import PassNodeProxy from "./PassNodeProxy.js";

/**
 * FXAAPassProxy是PassNodeProxy的一个子类，用于代理FXAA（快速近似抗锯齿）后处理特效的Pass节点。
 * @class
 * @extends PassNodeProxy<FXAANode>
*/
class FXAAPassProxy extends PassNodeProxy {
    /**
     * 构建FXAA Pass节点。
     * @param {TextureNode} outputNode - 输出节点对象
     * @returns {FXAANode} 处理后的节点对象
     * @override
    */
    build(outputNode) {
        const fxaaNode = this.node = fxaa(outputNode);
        return fxaaNode;
    }
};

export default FXAAPassProxy;
export { FXAAPassProxy };


import { smaa } from 'three/addons/tsl/display/SMAANode.js';
import PassNodeProxy from "./PassNodeProxy.js";

/**
 * @import { TextureNode } from "three/webgpu";
 * @import SMAANode from 'three/addons/tsl/display/SMAANode.js';
*/

/**
 * SMAAPassProxy是PassNodeProxy的一个子类，用于代理SMAA（增强型多重采样抗锯齿）后处理特效的Pass节点。
 * @class
 * @extends PassNodeProxy<SMAANode>
*/
class SMAAPassProxy extends PassNodeProxy {
    /**
     * 构建SMAA Pass节点。
     * @param {TextureNode} outputNode - 输出节点对象
     * @returns {SMAANode} 处理后的节点对象
     * @override
    */
    build(outputNode) {
        const smaaPass = this.node = smaa(outputNode);
        return smaaPass;
    }
};

export default SMAAPassProxy;
export { SMAAPassProxy };


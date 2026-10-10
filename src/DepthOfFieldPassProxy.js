import Check from "@lijuhong1981/jscheck/src/Check.js";
import PassNodeProxy from "./PassNodeProxy.js";
import { uniform } from "three/tsl";
import { dof } from 'three/addons/tsl/display/DepthOfFieldNode.js';

/**
 * @import { TextureNode } from "three/webgpu";
 * @import DepthOfFieldNode from 'three/addons/tsl/display/DepthOfFieldNode.js';
*/

/**
 * DepthOfFieldPassProxy是PassNodeProxy的一个子类，用于代理DOF（Depth Of Field，景深）后处理特效的Pass节点。
 * @class
 * @extends PassNodeProxy<DepthOfFieldNode>
*/
class DepthOfFieldPassProxy extends PassNodeProxy {
    constructor(library) {
        super(library);
        this._values = {
            focusDistance: 1,
            focalLength: 1,
            bokehScale: 1,
        };
    }
    /**
     * Defines the effect's focus which is the distance along the camera's look direction in world units.
     * @type {number}
     * @default 1
    */
    set focusDistance(value) {
        Check.typeOf.number('focusDistance', value);
        this._values.focusDistance = value;
        this.node && (this.node.focusDistanceNode.value = value);
    }
    get focusDistance() {
        return this._values.focusDistance;
    }
    /**
     * How far an object can be from the focal plane before it goes completely out-of-focus in world units.
     * @type {number}
     * @default 1
    */
    set focalLength(value) {
        Check.typeOf.number('focalLength', value);
        this._values.focalLength = value;
        this.node && (this.node.focalLengthNode.value = value);
    }
    get focalLength() {
        return this._values.focalLength;
    }
    /**
     * A unitless value for artistic purposes to adjust the size of the bokeh.
     * @type {number}
     * @default 1
    */
    set bokehScale(value) {
        Check.typeOf.number('bokehScale', value);
        this._values.bokehScale = value;
        this.node && (this.node.bokehScaleNode.value = value);
    }
    get bokehScale() {
        return this._values.bokehScale;
    }
    /**
     * 构建DOF Pass节点。
     * @param {TextureNode} viewZNode - 视图空间Z深度节点对象（可由PassNode.getViewZNode('depth')获取）
     * @param {TextureNode} outputNode - 输出节点对象
     * @returns {DepthOfFieldNode} 处理后的节点对象
     * @override
    */
    build(viewZNode, outputNode) {
        // focusDistance/focalLength/bokehScale 必须传 uniform 节点：
        // dof() 内部用 nodeObject(number) 会把数字变成不可更新的常量，导致运行时调参无效
        const dofPass = this.node = dof(
            outputNode,
            viewZNode,
            uniform(this._values.focusDistance),
            uniform(this._values.focalLength),
            uniform(this._values.bokehScale),
        );
        dofPass.toInspector('DepthOfField');
        this.setValues(this._values);
        return dofPass;
    }
};

export default DepthOfFieldPassProxy;
export { DepthOfFieldPassProxy };

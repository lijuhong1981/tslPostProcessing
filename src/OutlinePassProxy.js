import Check from "@lijuhong1981/jscheck/src/Check.js";
import { Color, Scene } from "three";
import OutlineNode, { outline } from './OutlineNode.js';
import { oscSine, time, uniform } from "three/tsl";
import { TextureNode } from "three/webgpu";
import PassNodeProxy from "./PassNodeProxy.js";

/**
 * OutlinePassProxy是PassNodeProxy的一个子类，用于代理Outline（轮廓）后处理特效的Pass节点。
 * @class
 * @extends PassNodeProxy<OutlineNode>
*/
class OutlinePassProxy extends PassNodeProxy {
    constructor(library) {
        super(library);
        this._selectedObjects = [];
        this._downSampleRatio = 2;
        this._uniformEdgeThickness = uniform(1);
        this._uniformEdgeGlow = uniform(0);
        this._uniformeEdgeStrength = uniform(3.0);
        this._uniformPulsePeriod = uniform(0);
        this._uniformVisibleEdgeColor = uniform(new Color(0xffffff));
        this._uniformHiddenEdgeColor = uniform(new Color(0));
        this._uniformHighlightColor = uniform(new Color(0x0000ff));
        this._uniformHighlightStrength = uniform(0);
    }
    /**
     * An array of selected objects.
     * @type {Array<Object3D>}
    */
    set selectedObjects(value) {
        this._selectedObjects = value ?? [];
        this.node && (this.node.selectedObjects = this._selectedObjects);
    }
    get selectedObjects() {
        return this._selectedObjects;
    }
    /**
     * The downsample ratio.
     * @type {number}
     * @default 2
    */
    set downSampleRatio(value) {
        Check.typeOf.number('downSampleRatio', value);
        this._downSampleRatio = value;
        this.node && (this.node.downSampleRatio = value);
    }
    get downSampleRatio() {
        return this._downSampleRatio;
    }
    /**
     * The thickness of the edges.
     * @type {number}
     * @default 1
    */
    set edgeThickness(value) {
        Check.typeOf.number('edgeThickness', value);
        this._uniformEdgeThickness.value = value;
    }
    get edgeThickness() {
        return this._uniformEdgeThickness.value;
    }
    /**
     * Can be used for an animated glow/pulse effect.
     * @type {number}
     * @default 0
    */
    set edgeGlow(value) {
        Check.typeOf.number('edgeGlow', value);
        this._uniformEdgeGlow.value = value;
    }
    get edgeGlow() {
        return this._uniformEdgeGlow.value;
    }
    /**
     * The strength of the edges.
     * @type {number}
     * @default 3
    */
    set edgeStrength(value) {
        Check.typeOf.number('edgeStrength', value);
        this._uniformeEdgeStrength.value = value;
    }
    get edgeStrength() {
        return this._uniformeEdgeStrength.value;
    }
    /**
     * The period of the pulse effect in seconds. Set to 0 to disable the pulse effect.
     * @type {number}
     * @default 0
    */
    set pulsePeriod(value) {
        Check.typeOf.number('pulsePeriod', value);
        this._uniformPulsePeriod.value = value;
    }
    get pulsePeriod() {
        return this._uniformPulsePeriod.value;
    }
    /**
     * The color of visible edges.
     * @param {Color|string|number} value - The color value, It can be a Color instance, a css color string, or a hexadecimal color number.
    */
    set visibleEdgeColor(value) {
        Check.defined('visibleEdgeColor', value);
        this._uniformVisibleEdgeColor.value.set(value);
    }
    /**
     * The color of visible edges.
     * @returns {Color}
    */
    get visibleEdgeColor() {
        return this._uniformVisibleEdgeColor.value;
    }
    /**
     * The color of hidden edges.
     * @param {Color|string|number} value - The color value, It can be a Color instance, a css color string, or a hexadecimal color number.
    */
    set hiddenEdgeColor(value) {
        Check.defined('hiddenEdgeColor', value);
        this._uniformHiddenEdgeColor.value.set(value);
    }
    /**
     * The color of hidden edges.
     * @returns {Color}
    */
    get hiddenEdgeColor() {
        return this._uniformHiddenEdgeColor.value;
    }
    /**
     * The highlight color for the selected objects.
     * @param {Color|string|number} value - The color value, It can be a Color instance, a css color string, or a hexadecimal color number.
    */
    set highlightColor(value) {
        Check.defined('highlightColor', value);
        this._uniformHighlightColor.value.set(value);
    }
    /**
     * The highlight color for the selected objects.
     * @returns {Color}
    */
    get highlightColor() {
        return this._uniformHighlightColor.value;
    }
    /**
     * The strength of the highlight on the selected objects.
     * @type {number}
     * @default 0
    */
    set highlightStrength(value) {
        Check.typeOf.number('highlightStrength', value);
        this._uniformHighlightStrength.value = value;
    }
    get highlightStrength() {
        return this._uniformHighlightStrength.value;
    }
    /**
     * Whether to use highlight for the selected objects. When set to true, the highlightStrength will be set to 1, otherwise it will be set to 0.
     * @type {boolean}
     * @default false
     * @deprecated Use highlightStrength instead to control the strength of the highlight.
    */
    set useHighlight(value) {
        Check.typeOf.boolean('useHighlight', value);
        this.highlightStrength = value ? 1 : 0;
    }
    get useHighlight() {
        return this.highlightStrength > 0;
    }
    /**
     * 构建Outline Pass节点。
     * @param {Scene} scene - 场景对象
     * @param {Camera} camera - 相机对象
     * @param {TextureNode} outputNode - 输出节点对象
     * @returns {TextureNode} 处理后的节点对象
     * @override
    */
    build(scene, camera, outputNode) {
        const outlinePass = this.node = outline(scene, camera, {
            selectedObjects: this._selectedObjects,
            edgeThickness: this._uniformEdgeThickness,
            edgeGlow: this._uniformEdgeGlow,
            downSampleRatio: this._downSampleRatio,
        });
        outlinePass.toInspector('Outline');

        const { visibleEdge, hiddenEdge, visibleSelected } = outlinePass;
        // 边缘颜色由可见边缘和隐藏边缘的颜色混合而成，并根据边缘强度进行调整。
        const edgeColor = visibleEdge.mul(this._uniformVisibleEdgeColor).add(hiddenEdge.mul(this._uniformHiddenEdgeColor)).mul(this._uniformeEdgeStrength);
        // 高亮颜色由可见选中区域的颜色乘以高亮颜色和高亮强度得到。
        const highlightColor = visibleSelected.mul(this._uniformHighlightColor).mul(this._uniformHighlightStrength);
        // 脉冲效果通过一个正弦函数来实现，周期由pulsePeriod控制。当pulsePeriod大于0时，边缘颜色会在原有基础上乘以osc（在0.5到1之间变化），从而产生脉冲效果；当pulsePeriod为0时，边缘颜色保持不变。
        const period = time.div(this._uniformPulsePeriod).mul(2);
        const osc = oscSine(period).mul(.5).add(.5); // osc [ 0.5, 1.0 ]
        const edgePulse = this._uniformPulsePeriod.greaterThan(0).select(edgeColor.mul(osc), edgeColor);
        // 最终的颜色是边缘颜色（可能带有脉冲效果）和高亮颜色的叠加。
        const finalColor = edgePulse.add(highlightColor);
        // 叠加混合
        return outputNode.add(finalColor);
    }
};

export default OutlinePassProxy;
export { OutlinePassProxy };


import Check from "@lijuhong1981/jscheck/src/Check.js";
import FXAAPassProxy from "./FXAAPassProxy.js";
import PassNodeProxy from "./PassNodeProxy.js";
import SMAAPassProxy from "./SMAAPassProxy.js";
import SSAAPassProxy from "./SSAAPassProxy.js";
import TAAUPassProxy from "./TAAUPassProxy.js";
import TRAAPassProxy from "./TRAAPassProxy.js";

/**
 * 抗锯齿方法枚举
 * @enum {string} AntiAliasingMethod
 * @property {string} FXAA - Fast Approximate Anti-Aliasing (FXAA)
 * @property {string} SMAA - Subpixel Morphological Anti-Aliasing (SMAA)
 * @property {string} SSAA - Supersampling Anti-Aliasing (SSAA)
 * @property {string} TRAA - Temporal Reprojection Anti-Aliasing (TRAA)
 * @property {string} TAAU - Temporal Anti-Aliasing Upsampling (TAAU)
*/
const AntiAliasingMethod = Object.freeze({
    FXAA: "fxaa",
    SMAA: "smaa",
    SSAA: "ssaa",
    TRAA: "traa",
    TAAU: "taau",
});

/**
 * AntiAliasingPassProxy是PassNodeProxy的一个子类，用于代理抗锯齿后处理特效的Pass节点。
 * @class
 * @extends PassNodeProxy<PassNode>
*/
class AntiAliasingPassProxy extends PassNodeProxy {
    constructor(library) {
        super(library);
        /**
         * FXAA（快速近似抗锯齿）通道实例。
         * @type {FXAAPassProxy}
         * @readonly
        */
        this.fxaaPass = new FXAAPassProxy(this);
        /**
         * SMAA（增强型多重采样抗锯齿）通道实例。
         * @type {SMAAPassProxy}
         * @readonly
        */
        this.smaaPass = new SMAAPassProxy(this);
        /**
         * SSAA（超采样抗锯齿）通道实例。
         * @type {SSAAPassProxy}
         * @readonly
        */
        this.ssaaPass = new SSAAPassProxy(this);
        /**
         * TRAA（时间重投影抗锯齿）通道实例。
         * @type {TRAAPassProxy}
         * @readonly
        */
        this.traaPass = new TRAAPassProxy(this);
        /**
         * TAAU（时间抗锯齿上采样）通道实例。
         * @type {TAAUPassProxy}
         * @readonly
        */
        this.taauPass = new TAAUPassProxy(this);
        this.method = AntiAliasingMethod.FXAA;
    }
    /**
     * 抗锯齿方法，默认为FXAA。
     * @type {AntiAliasingMethod}
     * @default AntiAliasingMethod.FXAA
    */
    set method(value) {
        Check.typeOf.string('method', value);
        if (this._method === value) return;
        this._method = value;
        this.fxaaPass._enabled = (value === AntiAliasingMethod.FXAA);
        this.smaaPass._enabled = (value === AntiAliasingMethod.SMAA);
        this.ssaaPass._enabled = (value === AntiAliasingMethod.SSAA);
        this.traaPass._enabled = (value === AntiAliasingMethod.TRAA);
        this.taauPass._enabled = (value === AntiAliasingMethod.TAAU);
        this.changed.raiseEvent('method', value);
    }
    get method() {
        return this._method;
    }
    // setValues(values) {
    //     if (values.ssaaPass)
    //         this.ssaaPass.setValues(values.ssaaPass);
    //     if (values.traaPass)
    //         this.traaPass.setValues(values.traaPass);
    //     if (values.taauPass)
    //         this.taauPass.setValues(values.taauPass);
    //     super.setValues(values);
    //     return this;
    // }
    dispose() {
        this.fxaaPass.dispose();
        this.smaaPass.dispose();
        this.ssaaPass.dispose();
        this.traaPass.dispose();
        this.taauPass.dispose();
        return super.dispose();
    }
};
/**
 * 抗锯齿方法枚举
 * @type {AntiAliasingMethod}
 * @static
 * @memberof AntiAliasingPassProxy
*/
AntiAliasingPassProxy.Method = AntiAliasingMethod;

export default AntiAliasingPassProxy;
export { AntiAliasingMethod, AntiAliasingPassProxy };


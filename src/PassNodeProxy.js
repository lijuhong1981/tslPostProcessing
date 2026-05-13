import Check from "@lijuhong1981/jscheck/src/Check.js";
import { defined } from "@lijuhong1981/jscheck/src/isDefined.js";
import EventSubscriber from "@lijuhong1981/jsevents/src/EventSubscriber.js";
import { Node } from "three/webgpu";
import PostProcessingLibrary from "./PostProcessingLibrary.js";

/**
 * PassNodeProxy是一个针对Node节点对象的代理类，用于管理threejs最新tsl体系下的Node节点对象，对外提供更加友好的接口。
 * @template T extends Node
 * @class
 * @abstract
*/
class PassNodeProxy {
    /**
     * 构造函数
     * @param {PostProcessingLibrary} library - 后处理库实例
     * @constructor
    */
    constructor(library) {
        Check.defined('library', library);
        /**
         * 后处理库实例
         * @type {PostProcessingLibrary}
         * @readonly
        */
        this.library = library;
        /**
         * Pass节点，由子类在构建完成后赋值给该属性。
         * @type {T}
         * @readonly
        */
        this.node = undefined;
        /**
         * 属性值变化事件，当Pass节点的属性值发生变化时触发。
         * @type {EventSubscriber}
         * @readonly
        */
        this.changed = new EventSubscriber();
        this._enabled = false;
    }
    /**
     * 批量设置Pass节点的属性值。
     * @param {Object} values - 包含属性键值对的对象
     * @returns {PassNodeProxy} - 返回当前实例
    */
    setValues(values) {
        Check.defined('values', values);
        for (const key in values) {
            if (key in this) {
                if (typeof this[key].setValues === 'function')
                    this[key].setValues(values[key]);
                else
                    this[key] = values[key];
            }
        }
        return this;
    }
    /**
     * 是否启用该Pass。
     * @type {boolean}
     * @default false
    */
    set enabled(value) {
        Check.typeOf.boolean('enabled', value);
        if (this._enabled === value) return;
        this._enabled = value;
        this.changed.raiseEvent('enabled', value);
    }
    get enabled() {
        return this._enabled;
    }
    /**
     * Pass节点是否已经构建完成。
     * @type {boolean}
     * @readonly
    */
    get isBuilt() {
        return defined(this.node);
    }
    /**
     * 检查Pass节点是否已经构建完成，如果未构建则抛出错误。
     * @throws {Error}
    */
    checkBuilt() {
        if (!this.isBuilt) {
            throw new Error('Pass节点尚未构建');
        }
    }
    /**
     * 构建输出节点，由子类实现该方法。
     * @param {...any} args - 构建参数
     * @returns {Node} - 处理后的节点对象
    */
    build(...args) {
        throw new Error('build方法需要由子类实现');
    }
    /**
     * 重新构建Pass节点，先销毁原有节点再调用build方法进行构建。
     * @param {...any} args - 构建参数
     * @returns {Node} - 处理后的节点对象
    */
    rebuild(...args) {
        this.dispose();
        return this.build(...args);
    }
    /**
     * 销毁Pass节点，释放相关资源。
     * @return {PassNodeProxy} - 返回当前实例
    */
    dispose() {
        this.node && this.node.dispose();
        return this;
    }
};

export default PassNodeProxy;
export { PassNodeProxy };


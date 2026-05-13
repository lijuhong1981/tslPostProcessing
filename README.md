# tslPostProcessing

一个基于[threejs](https://github.com/mrdoob/three.js)最新的tsl与[RenderPipeline](https://threejs.org/docs/#RenderPipeline)开发的后处理控制器。

## 功能

1、整合了GTAO（Ground Truth Ambient Occlusion）、SSGI（Screen Space Global Illumination）、SSR（Screen Space Reflections）、SSS（Screen Space Shadows）、泛光（Bloom）、轮廓（Outline）以及FXAA（快速近似抗锯齿）、SMAA（增强型多重采样抗锯齿）、SSAA（超采样抗锯齿）、TAAU(Temporal Anti-Aliasing Upsampling)、TRAA(Temporal Reprojection Anti-Aliasing)等多种抗锯齿（Anti-Aliasing）后处理特效，并根据所启用的特效自动配置在渲染管线中的渲染顺序；

2、开箱即用，对tsl的API进行了封装，简化后处理节点API的调用；

3、优化了GTAO，解决了对Points、Line、Sprite等对象效果异常的问题；

4、对OulineNode添加了颜色高亮效果；

## 安装

```bash
npm install @lijuhong1981/postprocessing
```

## 使用

```js
import { WebGPURenderer, Scene, PerspectiveCamera, DirectionalLight } from "three/webgpu";
import { PostProcessingLibrary, AntiAliasingMethod } from "@lijuhong1981/postprocessing";

const renderer = new WebGPURenderer();
const scene = new Scene();
const camera = new PerspectiveCamera();
const mainLight = new DirectionalLight();
scene.add(mainLight);
const postProcessor = new PostProcessingLibrary(
    renderer, //渲染器，必填
    scene, //场景，必填
    camera, //相机，必填
    mainLight //主光源，可不传，未设置时SSS无法生效
);
// postProcessor.enabled = true; //是否开启后处理，默认true
postProcessor.aoPass.enabled = true; //开启AO，默认false
// postProcessor.ssgiPass.enabled = true; //开启SSGI，默认false
// postProcessor.ssrPass.enabled = true; //开启SSR，默认false
postProcessor.bloomPass.enabled = true; //开启Bloom，默认false
// postProcessor.aaPass.enabled = true; //开启抗锯齿，如果WebGPURenderer开启了antialias则默认false，否则默认true
// postProcessor.aaPass.method = AntiAliasingMethod.SMAA; //使用SMAA，默认FXAA
// postProcessor.outlinePass.selectedObjects = [...]; //指定选中对象
...
const onAnimate = () => {
    window.requestAnimationFrame(onAnimate);
    ...
    postProcessor.render(); //执行渲染
};
...
onAnimate();
```

## API文档

在线文档（GitHub Pages）：<https://lijuhong1981.github.io/tslPostProcessing/>

本地预览仍然可以直接打开 [./docs/index.html](./docs/index.html)

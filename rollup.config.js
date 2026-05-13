import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from "@rollup/plugin-terser";
import deletePlugin from 'rollup-plugin-delete';

/**
 * @param {string} outputFolder 输出目录路径
 * @param {string} fileName 输出文件名
 * @param {string} format 输出格式
 * @param {boolean} sourcemap 是否生成 sourcemap 文件
 * @param {boolean} deleteFolder 是否在打包前删除 outputFolder 目录
 * @returns {object}
 */
const output = (outputFolder, fileName, format, sourcemap, deleteFolder) => ({
    input: './index.js',
    output: {
        exports: 'named',
        name: 'tslPostProcessing',
        file: outputFolder + fileName,
        format,
        sourcemap,
    },
    plugins: [
        // 打包前删除输出目录
        deleteFolder ? deletePlugin({
            targets: `${outputFolder}*`, // 删除 folderPath 下的所有文件和子目录
            verbose: true, // 显示删除日志
            hook: 'buildStart', // 在构建开始前执行（默认）
        }) : undefined,
        nodeResolve({
            browser: true,
            preferBuiltins: false
        }),
        commonjs({
            include: 'node_modules/**',
            // 显式指定 flv.js 的命名导出
            // namedExports: {
            //     'flv.js': ['default', 'flvjs'],
            // },
            transformMixedEsModules: true, // 转换混合模块，将 require 转换为 import
        }),
        !sourcemap ? terser({
            maxWorkers: 8, // 根据 CPU 核心数调整（如 2/4/8）
        }) : undefined,
    ],
    // 用来指定代码执行环境的参数，解决this执行undefined问题 
    context: 'window',
});

export default [
    output('./dist/', 'postprocessing.js', 'umd', true, true),
    output('./dist/', 'postprocessing.esm.js', 'esm', true, false),
    output('./dist/', 'postprocessing.min.js', 'umd', false, false),
    output('./dist/', 'postprocessing.esm.min.js', 'esm', false, false),
]
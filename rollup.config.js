export default {
    input: 'src/index.js',
    output: {
        file: 'publish/index.js',  // 直接输出到 publish 根目录
        format: 'esm',
        banner: '#!/usr/bin/env node\n'
    },
    external: [
        'child_process',
        'fs',
        'fs/promises',
        'path'
    ]
}; 
export default {
    input: 'src/index.js',
    output: {
        file: 'publish/index.js',
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
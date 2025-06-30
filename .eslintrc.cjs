module.exports = {
    env: {
        es6: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
    ],
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
    },
    root: true,
    ignorePatterns: [
        'dist/**/*',
        'node_modules/**/*',
        '**/*.js',
        '**/*.d.ts',
    ],
    rules: {
        'prefer-const': 'error',
        'no-console': 'off',
        'no-debugger': 'error',
        'eqeqeq': ['error', 'always'],
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
};

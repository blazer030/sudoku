module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
        'airbnb-base'
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parser: '@typescript-eslint/parser',
    plugins: ['react-refresh'],
    rules: {
        'react-refresh/only-export-components': [
            'warn',
            { allowConstantExport: true },
        ],
        "quotes": [2, "double"],
        "indent": ["off", 2],
        "import/prefer-default-export": "off",
    },
    settings: {
        "import/resolver": {
            "typescript": {}
        },
        "import/core-modules": [
            "vite",
            "@vitejs/plugin-react",
            "vite-tsconfig-paths",
            "vite-plugin-eslint"
        ]
    }
}

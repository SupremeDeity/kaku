import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
        rules: {
            "@typescript-eslint/no-explicit-any": "off"
        },
    }
)

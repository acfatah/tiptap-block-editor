import {
  betterTailwindcssPlugin,
  defineConfig,
  markdown,
  preset,
  tailwind,
  vue,
} from '@acfatah/eslint-preset'
import pluginVitest from '@vitest/eslint-plugin'

export default defineConfig(
  {
    vue: true,

    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      '**/tsconfig.*',
      'logs',
    ],
  },

  {
    plugins: {
      ...betterTailwindcssPlugin,
    },

    rules: {
      ...preset,
      ...tailwind,
      ...vue,
      ...markdown,

      'vue/object-property-newline': ['error', {
        allowAllPropertiesOnSameLine: true,
      }],
    },

    settings: {
      // https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/settings/settings.md
      'better-tailwindcss': {
        entryPoint: 'src/styles/global.css',
        variables: ['size', 'variant'],
      },
    },
  },

  {
    rules: pluginVitest.configs.recommended.rules,
    files: ['src/**/__tests__/*', 'tests/**/*'],
  },
)

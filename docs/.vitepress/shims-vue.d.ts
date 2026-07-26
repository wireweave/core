// Allows plain `tsc --noEmit` (CI's `pnpm -r exec tsc --noEmit`) to resolve
// single-file component imports. `vue-tsc` (the `typecheck` script) infers the
// precise component types directly from each `.vue` file and takes precedence.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

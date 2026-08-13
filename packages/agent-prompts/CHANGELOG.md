# Changelog

## 0.2.0-beta.1

### Minor Changes

- [#39](https://github.com/wireweave/wireweave/pull/39) [`f4a7b36`](https://github.com/wireweave/wireweave/commit/f4a7b36061f8310ffcb9a933dd457c6d3b0d89cc) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: publish the verified named layout, slot, page-uses, and site-render contract for Wireweave beta.

  Component definition/invocation reuse remains out of scope until the full end-to-end contract is implemented and verified.

## 0.2.0-beta.0

### Minor Changes

- [`23b0b5b`](https://github.com/wireweave/wireweave/commit/23b0b5beec314911c21695f39eafaab1826a8b90) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: document interaction wiring in both grammar prompts — `navigate` / `opens` / `toggles` / `action` on every clickable component entry (button, link, card, icon, avatar, badge, image, nav/dropdown item), `id` on modal/drawer as the opens/toggles target anchor, a dedicated INTERACTION WIRING section with one compact example per pattern, and a constraints rule that every clickable element declares exactly one interaction. Closes the gap where LLMs generating Wireweave DSL never saw the wiring syntax and produced screens with no first-class navigation.

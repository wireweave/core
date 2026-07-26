# Changelog

## 0.2.0-beta.0

### Minor Changes

- [`23b0b5b`](https://github.com/wireweave/wireweave/commit/23b0b5beec314911c21695f39eafaab1826a8b90) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: document interaction wiring in both grammar prompts — `navigate` / `opens` / `toggles` / `action` on every clickable component entry (button, link, card, icon, avatar, badge, image, nav/dropdown item), `id` on modal/drawer as the opens/toggles target anchor, a dedicated INTERACTION WIRING section with one compact example per pattern, and a constraints rule that every clickable element declares exactly one interaction. Closes the gap where LLMs generating Wireweave DSL never saw the wiring syntax and produced screens with no first-class navigation.

# Changelog

## [1.4.1-beta.1](https://github.com/wireweave/core/compare/v1.4.1-beta.0...v1.4.1-beta.1) (2026-01-17)

### Bug Fixes

* support page width/height attributes in renderToSvg ([110c227](https://github.com/wireweave/core/commit/110c2275e9d6778c064a1816c8fa42eb722f32e0))

## [1.4.1-beta.0](https://github.com/wireweave/core/compare/v1.4.0...v1.4.1-beta.0) (2026-01-17)

### Bug Fixes

* use XML-compatible boolean attribute format for SVG foreignObject ([7e11028](https://github.com/wireweave/core/commit/7e110286fa5c0dff211e4505ba11ee8246a4a70b))

## [1.4.0](https://github.com/wireweave/core/compare/v1.4.0-beta.2...v1.4.0) (2026-01-17)

## [1.4.0-beta.2](https://github.com/wireweave/core/compare/v1.4.0-beta.1...v1.4.0-beta.2) (2026-01-17)

### Bug Fixes

* use theme background color for badge text instead of hardcoded white ([f847845](https://github.com/wireweave/core/commit/f8478457496df8d4a9361f6a1cc8cbd5ff9d16ca))

## [1.4.0-beta.1](https://github.com/wireweave/core/compare/v1.4.0-beta.0...v1.4.0-beta.1) (2026-01-17)

### Bug Fixes

* apply background option only to page element, not theme colors ([7312799](https://github.com/wireweave/core/commit/731279946e033a19d7c91f07f030160a91afce47))

## [1.4.0-beta.0](https://github.com/wireweave/core/compare/v1.3.0...v1.4.0-beta.0) (2026-01-17)

### Features

* **renderer:** add background option to RenderOptions ([626e71b](https://github.com/wireweave/core/commit/626e71b11fdd7ae08d10285a46e13badbda73465))

## [1.3.0](https://github.com/wireweave/core/compare/v1.3.0-beta.0...v1.3.0) (2026-01-17)

## [1.3.0-beta.0](https://github.com/wireweave/core/compare/v1.2.0-beta.3...v1.3.0-beta.0) (2026-01-17)

## [1.2.0-beta.3](https://github.com/wireweave/core/compare/v1.2.0...v1.2.0-beta.3) (2026-01-17)

### Features

* **renderer:** add theme support to SVG rendering ([3e0967b](https://github.com/wireweave/core/commit/3e0967ba2b1e481412d7f2de6c56cddd967a2b47))

### Refactoring

* remove UX validation engine and rules ([8f33508](https://github.com/wireweave/core/commit/8f33508a2f0e2ca31cddd724f32a9414b9ec42bd))

### Documentation

* add core package documentation ([0b4d81f](https://github.com/wireweave/core/commit/0b4d81f4f07f263797fb894e2a56e11361b3d249))

## [1.2.0](https://github.com/wireweave/core/compare/v1.2.0-beta.2...v1.2.0) (2026-01-14)

## [1.2.0-beta.2](https://github.com/wireweave/core/compare/v1.2.0-beta.1...v1.2.0-beta.2) (2026-01-14)

### Documentation

* update README with new API documentation ([1a11246](https://github.com/wireweave/core/commit/1a112460420f96d36b260c85c067828b0d6ae2db))

## [1.2.0-beta.1](https://github.com/wireweave/core/compare/v1.2.0-beta.0...v1.2.0-beta.1) (2026-01-14)

## [1.2.0-beta.0](https://github.com/wireweave/core/compare/v1.1.0-beta.0...v1.2.0-beta.0) (2026-01-14)

### Features

* **grammar:** add simplified syntax for table and dropdown components ([3186c06](https://github.com/wireweave/core/commit/3186c06a8ef185f0e7a208acbed746fed34c7eb5))
* introduce analyze, diff, export, and ux-rules modules ([b704e2a](https://github.com/wireweave/core/commit/b704e2a3884b6bbbb9fe8568ee120efe049f1e04))

### Bug Fixes

* remove console.warn to fix DTS build error ([3152399](https://github.com/wireweave/core/commit/31523993552a37aada4bdd396889d4caca20bb6a))

### Refactoring

* **analyze:** restructure analysis module and metrics ([73ffabf](https://github.com/wireweave/core/commit/73ffabf4bbe10d48afb7387ee16f0f168e0c4acb))
* **diff:** modularize document comparison logic ([10390d5](https://github.com/wireweave/core/commit/10390d5116fb6624094d96851d8552b388f7894e))
* **export:** modularize Figma and JSON export functionality ([b7271f5](https://github.com/wireweave/core/commit/b7271f5c7aa8184bd5533644a09eda797756c633))
* **renderer:** modularize HTML rendering and remove legacy SVG renderer ([5688d98](https://github.com/wireweave/core/commit/5688d981a99fc10949490239b1f819444fe2ae58))

## 1.1.0-beta.0 (2026-01-10)

### Features

* add DSL spec and validation to core ([5bc446b](https://github.com/wireweave/core/commit/5bc446bbb9ee5c67b9230120c196ba36f1e3f29a))
* improve SVG renderer layout calculations ([79f03f5](https://github.com/wireweave/core/commit/79f03f5761ac2f9546c362f10a2a5882f4457951))

### Bug Fixes

* allow release-it to run on develop branch ([00ef735](https://github.com/wireweave/core/commit/00ef73546b404f2d2d721b3340ffed7db923be41))
* use npm latest version for beta versioning ([3467b78](https://github.com/wireweave/core/commit/3467b78b057fd78a76863c09a330bb4153fb4c67))

### Refactoring

* use release-it preRelease for beta versioning ([0c2ed10](https://github.com/wireweave/core/commit/0c2ed105fc6ee705a26b60eeaf895dfd3ae67ab7))

## 1.1.0 (2026-01-07)

### Features

* add npm publish workflow with release-it ([cfde2cd](https://github.com/wireweave/core/commit/cfde2cd6d9bff50b60c2e741395f13a5d890cc1a))
* switch to OIDC trusted publishing ([81f1a99](https://github.com/wireweave/core/commit/81f1a99748b66024bbac052865ec9a8339019286))

### Bug Fixes

* add provenance flag for release-it npm publish ([25669ba](https://github.com/wireweave/core/commit/25669ba107250b50bd29ec55b866623523907b37))
* add repository field for npm trusted publishing ([0953696](https://github.com/wireweave/core/commit/09536962d993f0a16e00746e1d3c5dbf6a616553))
* inline tsconfig base for standalone build ([f823d45](https://github.com/wireweave/core/commit/f823d4583d7f2437cf471fcf696f5581b1126ac0))
* remove registry-url for OIDC trusted publishing ([b56a01f](https://github.com/wireweave/core/commit/b56a01f6bf02a83e9b924f185cbe96d6d3c7b24b))
* remove src from npm package files ([2eebd43](https://github.com/wireweave/core/commit/2eebd432b30a5e3eb5158bad09e1c54c072705d1))
* restore registry-url for OIDC ([caf569e](https://github.com/wireweave/core/commit/caf569ef322c2e16dd5480d0ae1b625121a8fcaa))
* skip npm auth check for OIDC trusted publishing ([4cd26da](https://github.com/wireweave/core/commit/4cd26dacf8b4236c074b8d0d6dcc296aa9ca3113))
* update npm to latest for trusted publishing ([36bd5bf](https://github.com/wireweave/core/commit/36bd5bf2a9d33968e3833c3ffdc10883452fc4cf))
* use GitHub raw URL for logo in README ([1893d13](https://github.com/wireweave/core/commit/1893d1366f6bb72575c764323a220d40efbad885))

### Performance

* disable sourcemap to reduce package size ([14d788f](https://github.com/wireweave/core/commit/14d788f3202d1c0fb6b4c9c6a8757b77b3029c75))

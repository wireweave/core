import { describe, it, expect } from 'vitest'
import { ATTRIBUTE_SPECS } from '@wireweave/core/spec'
import { EDITOR_ONLY_ATTRIBUTES, PENDING_CORE_ATTRIBUTES } from '../src/core-spec-gaps.js'
import {
  ALL_COMPONENTS,
  COMPONENT_MAP,
  NODE_TYPE_MAP,
  VALID_COMPONENT_NAMES,
  ATTRIBUTES,
  ATTRIBUTE_MAP,
  BOX_ATTRIBUTES,
  CONTAINER_ATTRIBUTES,
  VALID_ATTRIBUTE_NAMES,
  CATEGORY_LABELS,
  VALUE_KEYWORDS,
  getComponent,
  getComponentByNodeType,
  getAttribute,
  getValidChildren,
  isValidChild,
  getComponentAttributes,
  getComponentsByCategory,
  getAttributeTypeLabel,
  formatAttributeValues,
  isComponent,
  isAttribute,
  getComponentNames,
  getAttributeNames,
  getCategories,
} from '../src/index.js'

describe('Components', () => {
  it('should have components defined', () => {
    expect(ALL_COMPONENTS.length).toBeGreaterThan(0)
  })

  // The lookup structures are projections of ALL_COMPONENTS. Comparing sizes
  // only catches a duplicate key; it passes a map keyed on the wrong field, or
  // one whose entries point at the wrong component. Assert reachability in both
  // directions instead, so the lookup has to actually resolve.
  it('reaches every component through COMPONENT_MAP, and nothing else', () => {
    for (const comp of ALL_COMPONENTS) {
      expect(COMPONENT_MAP.get(comp.name), `"${comp.name}" is not reachable by name`).toBe(comp)
    }
    const known = new Set(ALL_COMPONENTS.map((c) => c.name))
    expect([...COMPONENT_MAP.keys()].filter((key) => !known.has(key))).toEqual([])
  })

  it('reaches every component through NODE_TYPE_MAP, and nothing else', () => {
    for (const comp of ALL_COMPONENTS) {
      expect(NODE_TYPE_MAP.get(comp.nodeType), `"${comp.nodeType}" is not reachable`).toBe(comp)
    }
    const known = new Set(ALL_COMPONENTS.map((c) => c.nodeType))
    expect([...NODE_TYPE_MAP.keys()].filter((key) => !known.has(key))).toEqual([])
  })

  it('admits exactly the component names as valid', () => {
    expect([...VALID_COMPONENT_NAMES].sort()).toEqual(ALL_COMPONENTS.map((c) => c.name).sort())
  })

  it('should have required fields for every component', () => {
    for (const comp of ALL_COMPONENTS) {
      expect(comp.name).toBeTruthy()
      expect(comp.nodeType).toBeTruthy()
      expect(comp.category).toBeTruthy()
      expect(comp.description).toBeTruthy()
      expect(comp.example).toBeTruthy()
      expect(typeof comp.hasChildren).toBe('boolean')
      expect(Array.isArray(comp.attributes)).toBe(true)
    }
  })

  it('should have unique component names', () => {
    const names = ALL_COMPONENTS.map((c) => c.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('should have unique node types', () => {
    const types = ALL_COMPONENTS.map((c) => c.nodeType)
    expect(new Set(types).size).toBe(types.length)
  })
})

describe('Attributes', () => {
  it('should have attributes defined', () => {
    expect(ATTRIBUTES.length).toBeGreaterThan(0)
  })

  it('reaches every attribute through ATTRIBUTE_MAP, and nothing else', () => {
    for (const attr of ATTRIBUTES) {
      expect(ATTRIBUTE_MAP.get(attr.name), `"${attr.name}" is not reachable by name`).toBe(attr)
    }
    const known = new Set(ATTRIBUTES.map((a) => a.name))
    expect([...ATTRIBUTE_MAP.keys()].filter((key) => !known.has(key))).toEqual([])
  })

  it('admits exactly the attribute names as valid', () => {
    expect([...VALID_ATTRIBUTE_NAMES].sort()).toEqual(ATTRIBUTES.map((a) => a.name).sort())
  })

  // The vocabulary is the union of three source registries. `core-spec-sync`
  // asserts nothing appears here that those registries do not declare; this is
  // the opposite direction — dropping a registry from the derivation leaves a
  // strictly smaller, still self-consistent vocabulary that every other
  // assertion in this file accepts.
  it('carries every attribute its source registries declare', () => {
    const declared = [
      ...ATTRIBUTE_SPECS.map((spec) => spec.name),
      ...EDITOR_ONLY_ATTRIBUTES.map((attr) => attr.name),
      ...PENDING_CORE_ATTRIBUTES.map((attr) => attr.name),
    ]
    expect(declared.filter((name) => !ATTRIBUTE_MAP.has(name))).toEqual([])
  })

  it('should have enum values for enum type attributes', () => {
    const enums = ATTRIBUTES.filter((a) => a.type === 'enum')
    for (const attr of enums) {
      expect(attr.values).toBeDefined()
      expect(attr.values!.length).toBeGreaterThan(0)
    }
  })

  it('resolves both shared attribute lists to real attributes', () => {
    // Both lists name attributes rather than declaring them, so either can point
    // at something the registry does not have. `spec-reference-closure.test.ts`
    // asserts the same closure at the core boundary; this one holds it at the
    // package's own re-export, which is what editors actually read.
    for (const name of [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES]) {
      expect(ATTRIBUTE_MAP.has(name), `"${name}" is listed but not declared`).toBe(true)
    }
  })

  it('keeps the box and container lists disjoint', () => {
    // The merged "common" list these replaced could not express the difference.
    // If a name appears in both, the distinction has quietly collapsed back.
    const box = new Set(BOX_ATTRIBUTES)
    expect(CONTAINER_ATTRIBUTES.filter((name) => box.has(name))).toEqual([])
  })

  it('exposes the at(x, y) functional attribute', () => {
    const at = ATTRIBUTE_MAP.get('at')
    expect(at).toBeDefined()
    expect(at!.type).toBe('function')
    expect(at!.example).toMatch(/^at\(/)
  })

  it('page component lists at as a valid attribute', () => {
    const page = getComponent('page')
    expect(page).toBeDefined()
    expect(page!.attributes).toContain('at')
  })
})

describe('Keywords', () => {
  it('should have category labels for all categories', () => {
    const categories = getCategories()
    for (const cat of categories) {
      expect(CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]).toBeTruthy()
    }
  })

  it('should have value keywords defined', () => {
    expect(VALUE_KEYWORDS.length).toBeGreaterThan(0)
  })
})

describe('Utils', () => {
  it('getComponent should return component by name', () => {
    expect(getComponent('page')).toBeDefined()
    expect(getComponent('page')!.nodeType).toBe('Page')
  })

  it('getComponent should be case-insensitive', () => {
    expect(getComponent('Page')).toBeDefined()
    expect(getComponent('PAGE')).toBeDefined()
  })

  it('getComponent should return undefined for unknown', () => {
    expect(getComponent('nonexistent')).toBeUndefined()
  })

  it('getComponentByNodeType should return component', () => {
    expect(getComponentByNodeType('Page')).toBeDefined()
    expect(getComponentByNodeType('Page')!.name).toBe('page')
  })

  it('getAttribute should return attribute by name', () => {
    expect(getAttribute('border')).toBeDefined()
    expect(getAttribute('border')!.type).toBe('boolean')
  })

  it('getValidChildren should return children for page', () => {
    const children = getValidChildren('page')
    expect(children.length).toBeGreaterThan(0)
  })

  it('getValidChildren should return empty for leaf components', () => {
    const children = getValidChildren('button')
    expect(children).toEqual([])
  })

  it('isValidChild should validate parent-child relationships', () => {
    expect(isValidChild('header', 'page')).toBe(true)
    expect(isValidChild('page', 'button')).toBe(false)
  })

  it('getComponentAttributes should return attributes for a component', () => {
    const attrs = getComponentAttributes('button')
    expect(attrs.length).toBeGreaterThan(0)
    expect(attrs.some((a) => a.name === 'primary')).toBe(true)
  })

  it('getComponentsByCategory should return components', () => {
    const layouts = getComponentsByCategory('layout')
    expect(layouts.length).toBeGreaterThan(0)
    expect(layouts.every((c) => c.category === 'layout')).toBe(true)
  })

  it('getAttributeTypeLabel should format types', () => {
    expect(
      getAttributeTypeLabel({ name: 'x', type: 'boolean', description: '', example: '' }),
    ).toBe('boolean')
    expect(getAttributeTypeLabel({ name: 'x', type: 'number', description: '', example: '' })).toBe(
      'number',
    )
    expect(getAttributeTypeLabel({ name: 'x', type: 'string', description: '', example: '' })).toBe(
      'string',
    )
    expect(
      getAttributeTypeLabel({
        name: 'x',
        type: 'enum',
        values: ['a', 'b'],
        description: '',
        example: '',
      }),
    ).toBe('a | b')
  })

  it('formatAttributeValues should format values', () => {
    expect(
      formatAttributeValues({ name: 'x', type: 'boolean', description: '', example: '' }),
    ).toContain('boolean')
    expect(
      formatAttributeValues({
        name: 'x',
        type: 'enum',
        values: ['a', 'b'],
        description: '',
        example: '',
      }),
    ).toContain('a | b')
  })

  it('isComponent should identify components', () => {
    expect(isComponent('page')).toBe(true)
    expect(isComponent('nonexistent')).toBe(false)
  })

  it('isAttribute should identify attributes', () => {
    expect(isAttribute('border')).toBe(true)
    expect(isAttribute('nonexistent')).toBe(false)
  })

  it('getComponentNames should return all names', () => {
    const names = getComponentNames()
    expect(names.length).toBe(ALL_COMPONENTS.length)
  })

  it('getAttributeNames should return all names', () => {
    const names = getAttributeNames()
    expect(names.length).toBe(ATTRIBUTES.length)
  })

  it('getCategories should return unique categories', () => {
    const categories = getCategories()
    expect(new Set(categories).size).toBe(categories.length)
    expect(categories.length).toBeGreaterThan(0)
  })
})

/**
 * wireweave Grammar - Core
 *
 * Peggy grammar for parsing wireframe DSL
 * v1.0 - 36 components, black/white/gray style
 */

{
  // Helper: Create AST node with location info
  function createNode(type, props = {}) {
    return {
      type,
      ...props,
      loc: location()
    };
  }

  // Helper: Create a node that only exists inside a specific parent's block —
  // `nav { item … group { … } }`, `dropdown { divider }`. Identical to
  // createNode; the separate name is what tells the element extractor that the
  // enclosing rule's keyword names the *parent*, not this node. Nodes reaching
  // the AST go through one of these two, so reading their arguments is a
  // complete inventory of the node types the parser can emit — see
  // `__tests__/grammar-spec-ssot.test.ts`. A bare `{ type: … }` object literal
  // would be a node type nothing downstream can discover, so intermediate
  // values that never reach the AST are keyed on `kind` instead. Rules that
  // still return a bare object are enumerated with their reason in that same
  // test and the list may only shrink.
  function createBlockNode(type, props = {}) {
    return {
      type,
      ...props,
      loc: location()
    };
  }

  // Helper: Flatten array of attributes into object
  // attrs entries can be a single { name, value } or an array of them
  // (functional-form attributes like at(x, y) emit multiple).
  function attrsToObject(attrs) {
    if (!attrs || attrs.length === 0) return {};
    const result = {};
    for (const attr of attrs.flat()) {
      result[attr.name] = attr.value;
    }
    return result;
  }

  function namedValuesToObject(values) {
    const result = {};
    for (const value of values || []) result[value.name] = value.value;
    return result;
  }

  function createComponentParameter(name, valueType) {
    return { name, valueType };
  }

  function createNamedValue(name, value) {
    return { name, value };
  }

  function createComponentSlotFill(name, children, loc) {
    return { name, children, loc };
  }
}

// ============================================================
// Entry Point
// ============================================================

Document
  = _ children:(TopLevelElement _)* {
      return createNode('Document', {
        children: children.map(c => c[0]).filter(c => c !== null)
      });
    }

TopLevelElement
  = Page
  / LayoutDefinition
  / ComponentDefinition
  / Comment { return null; }

// ============================================================
// Page
// ============================================================

Page
  = "page" _ label:StringLiteral? _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Page', {
        title: label || null,
        ...attrsToObject(attrs),
        children
      });
    }

// ============================================================
// Reuse Definitions (layout / component / slot)
// ============================================================
//
// A `layout` or `component` is a *definition*, not a screen: it names a tree
// once so that pages can reference it instead of restating it. The name is an
// `Identifier` rather than a `StringLiteral` because it is a reference target,
// not display prose — `page "Home" uses=app` already spells the reference as a
// bare identifier, and definition and reference must share one lexical class.
//
// `slot` marks the position inside a `layout` where a referencing page's own
// content belongs. It is a bare positional marker: it carries no name and no
// block, so a layout body reads `header { … } slot footer { … }`. What a slot
// *means* at render time (and whether more than one is meaningful) is a
// renderer concern, not a grammar one.

LayoutDefinition
  = "layout" !IdentifierChar _ name:Identifier _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Layout', {
        name,
        ...attrsToObject(attrs),
        children
      });
    }

ComponentDefinition
  = "component" !IdentifierChar _ name:Identifier _ parameters:ComponentParameters? _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Component', {
        name,
        parameters: parameters || [],
        ...attrsToObject(attrs),
        children
      });
    }

ComponentParameters
  = "(" _ parameters:ComponentParameterList? _ ")" { return parameters || []; }

ComponentParameterList
  = head:ComponentParameter tail:(_ "," _ ComponentParameter)* {
      return [head, ...tail.map(item => item[3])];
    }

ComponentParameter
  = name:Identifier _ ":" _ valueType:("string" / "number" / "boolean") {
      return createComponentParameter(name, valueType);
    }

ComponentUse
  = "use" !IdentifierChar _ name:Identifier _ inputs:ComponentArguments? _ namespace:ComponentNamespace? _ fills:ComponentFillBlock? {
      return createNode('ComponentUse', {
        name,
        ...(namespace ? { namespace } : {}),
        inputs: namedValuesToObject(inputs),
        fills: fills || []
      });
    }

ComponentArguments
  = "(" _ values:ComponentArgumentList? _ ")" { return values || []; }

ComponentArgumentList
  = head:ComponentArgument tail:(_ "," _ ComponentArgument)* {
      return [head, ...tail.map(item => item[3])];
    }

ComponentArgument
  = name:Identifier _ "=" _ value:ComponentInputValue { return createNamedValue(name, value); }

ComponentInputValue
  = StringLiteral
  / Number
  / Boolean
  / Identifier

ComponentNamespace
  = "from" !IdentifierChar _ "=" _ namespace:StringLiteral { return namespace; }

ComponentFillBlock
  = "{" _ fills:(ComponentSlotFill _)* "}" { return fills.map(item => item[0]); }

ComponentSlotFill
  = "fill" !IdentifierChar _ name:Identifier _ "{" _ children:Children _ "}" {
      return createComponentSlotFill(name, children, location());
    }

Slot
  = "slot" !IdentifierChar name:SlotName? _ attrs:Attributes? {
      return createNode('Slot', {
        ...(name ? { name } : {}),
        ...attrsToObject(attrs)
      });
    }

// A named component slot is explicit on the same line as `slot`. Requiring the
// name to end that line/block keeps a legacy bare layout slot from consuming
// the next child keyword after `_` has crossed a newline (`slot\nfooter { … }`).
SlotName
  = [ \t]+ !ChildKeyword name:Identifier &([ \t]*("\r\n" / "\n" / "\r" / "}" / "//" / "/*" / !.)) {
      return name;
    }

// ============================================================
// Children (Block Content)
// ============================================================

Children
  = children:(Child _)* {
      return children.map(c => c[0]).filter(c => c !== null);
    }

Child
  = ComponentUse
  / Repeat
  / LayoutElement
  / ContainerElement
  / UIElement
  / Slot
  / Comment { return null; }

// ============================================================
// Repeat
// ============================================================

// `repeat N { … }` folds authored duplication: six identical skeleton cards are
// one body written once, not six copies to keep in sync. It is deliberately a
// *count* and nothing else — no index variable, because an index is what turns
// "six of the same card" into "the i-th card differs", and that is data binding.
// Wireweave draws wireframes, where six identical placeholders are the honest
// picture. Keeping the count in the AST (rather than expanding at parse time)
// is what lets the printer write `repeat 6` back out instead of six bodies.
Repeat
  = "repeat" _ count:Integer _ "{" _ children:Children _ "}" {
      return createNode('Repeat', {
        count,
        children
      });
    }

// ============================================================
// Layout Elements
// ============================================================

LayoutElement
  = Header
  / Main
  / Footer
  / Sidebar
  / Row
  / Col
  / Stack
  / Relative

Header
  = "header" _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Header', {
        ...attrsToObject(attrs),
        children
      });
    }

Main
  = "main" _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Main', {
        ...attrsToObject(attrs),
        children
      });
    }

Footer
  = "footer" _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Footer', {
        ...attrsToObject(attrs),
        children
      });
    }

Sidebar
  = "sidebar" _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Sidebar', {
        ...attrsToObject(attrs),
        children
      });
    }

Row
  = "row" _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Row', {
        ...attrsToObject(attrs),
        children
      });
    }

Col
  = "col" _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Col', {
        ...attrsToObject(attrs),
        children
      });
    }

Stack
  = "stack" _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Stack', {
        ...attrsToObject(attrs),
        children
      });
    }

Relative
  = "relative" _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Relative', {
        ...attrsToObject(attrs),
        children
      });
    }

// ============================================================
// Container Elements
// ============================================================

ContainerElement
  = Card
  / Modal
  / Drawer
  / Accordion
  / Section

Card
  = "card" _ label:StringLiteral? _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Card', {
        title: label || null,
        ...attrsToObject(attrs),
        children
      });
    }

Modal
  = "modal" _ label:StringLiteral? _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Modal', {
        title: label || null,
        ...attrsToObject(attrs),
        children
      });
    }

Drawer
  = "drawer" _ label:StringLiteral? _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Drawer', {
        title: label || null,
        ...attrsToObject(attrs),
        children
      });
    }

Accordion
  = "accordion" _ label:StringLiteral? _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Accordion', {
        title: label || null,
        ...attrsToObject(attrs),
        children
      });
    }

Section
  = "section" _ label:StringLiteral? _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Section', {
        title: label || null,
        ...attrsToObject(attrs),
        children
      });
    }

// ============================================================
// UI Elements (Text, Title, Button, Input, etc.)
// ============================================================

UIElement
  = Text
  / Title
  / Link
  / Button
  / Input
  / Textarea
  / Select
  / Checkbox
  / Radio
  / Switch
  / Slider
  / Image
  / Placeholder
  / Avatar
  / Badge
  / Icon
  / Table
  / List
  / Alert
  / Toast
  / Progress
  / Spinner
  / Tooltip
  / Popover
  / Dropdown
  / Nav
  / Tabs
  / Breadcrumb
  / Divider
  / Marker
  / Annotations

// Text Components
Text
  = "text" _ label:StringLiteral _ attrs:Attributes? {
      return createNode('Text', {
        content: label,
        ...attrsToObject(attrs)
      });
    }

Title
  = "title" _ label:StringLiteral _ attrs:Attributes? {
      return createNode('Title', {
        content: label,
        ...attrsToObject(attrs)
      });
    }

Link
  = "link" _ label:StringLiteral _ attrs:Attributes? {
      return createNode('Link', {
        content: label,
        ...attrsToObject(attrs)
      });
    }

// Button
Button
  = "button" _ label:StringLiteral _ attrs:Attributes? {
      return createNode('Button', {
        content: label,
        ...attrsToObject(attrs)
      });
    }

// Input Components
Input
  = "input" _ label:StringLiteral? _ attrs:Attributes? {
      const obj = attrsToObject(attrs);
      const inputType = obj.type;
      delete obj.type;
      return createNode('Input', {
        label: label || null,
        ...(inputType !== undefined ? { inputType } : {}),
        ...obj
      });
    }

Textarea
  = "textarea" _ label:StringLiteral? _ attrs:Attributes? {
      return createNode('Textarea', {
        label: label || null,
        ...attrsToObject(attrs)
      });
    }

Select
  = "select" _ label:StringLiteral? _ options:Array? _ attrs:Attributes? {
      return createNode('Select', {
        label: label || null,
        options: options || [],
        ...attrsToObject(attrs)
      });
    }

Checkbox
  = "checkbox" _ label:StringLiteral? _ attrs:Attributes? {
      return createNode('Checkbox', {
        label: label || null,
        ...attrsToObject(attrs)
      });
    }

Radio
  = "radio" _ label:StringLiteral? _ attrs:Attributes? {
      return createNode('Radio', {
        label: label || null,
        ...attrsToObject(attrs)
      });
    }

Switch
  = "switch" _ label:StringLiteral? _ attrs:Attributes? {
      return createNode('Switch', {
        label: label || null,
        ...attrsToObject(attrs)
      });
    }

Slider
  = "slider" _ label:StringLiteral? _ attrs:Attributes? {
      return createNode('Slider', {
        label: label || null,
        ...attrsToObject(attrs)
      });
    }

// Display Components
Image
  = "image" _ src:StringLiteral? _ attrs:Attributes? {
      return createNode('Image', {
        src: src || null,
        ...attrsToObject(attrs)
      });
    }

Placeholder
  = "placeholder" _ label:StringLiteral? _ attrs:Attributes? _ block:("{" _ Children _ "}")? {
      return createNode('Placeholder', {
        label: label || null,
        ...attrsToObject(attrs),
        children: block ? block[2] : []
      });
    }

Avatar
  = "avatar" _ label:StringLiteral? _ attrs:Attributes? {
      return createNode('Avatar', {
        name: label || null,
        ...attrsToObject(attrs)
      });
    }

Badge
  = "badge" _ label:StringLiteral _ attrs:Attributes? {
      return createNode('Badge', {
        content: label,
        ...attrsToObject(attrs)
      });
    }

Icon
  = "icon" _ name:StringLiteral _ attrs:Attributes? {
      return createNode('Icon', {
        name: name,
        ...attrsToObject(attrs)
      });
    }

// Data Components
Table
  // Simplified syntax: table [["Name", "Email"], ["John", "j@x"], ["Jane", "n@x"]]
  // First array = columns, rest = rows
  = "table" _ data:NestedArray _ attrs:Attributes? {
      const columns = data.length > 0 ? data[0] : [];
      const rows = data.slice(1);
      return createNode('Table', {
        columns,
        rows,
        ...attrsToObject(attrs)
      });
    }
  // Verbose syntax: table { columns [...] row [...] }
  / "table" _ attrs:Attributes? _ "{" _ rows:TableContent _ "}" {
      return createNode('Table', {
        ...attrsToObject(attrs),
        ...rows
      });
    }

// Nested array for simplified table syntax: [[...], [...], ...]
NestedArray
  = "[" _ first:Array _ rest:("," _ Array _)* ","? _ "]" {
      return [first, ...rest.map(r => r[2])];
    }

TableContent
  = items:(TableRow _)* {
      const columns = [];
      const rows = [];
      for (const item of items.map(i => i[0]).filter(i => i !== null)) {
        if (item.kind === 'columns') columns.push(...item.values);
        else if (item.kind === 'row') rows.push(item.values);
      }
      return { columns, rows };
    }

// A table row is consumed by TableContent and never reaches the AST, so it is
// tagged with `kind` rather than `type` — `type` is reserved for real nodes.
TableRow
  = "columns" _ values:Array { return { kind: 'columns', values }; }
  / "row" _ values:Array { return { kind: 'row', values }; }
  / Comment { return null; }

List
  = "list" _ items:Array? _ attrs:Attributes? _ block:ListBlock? {
      return createNode('List', {
        items: items || (block ? block : []),
        ...attrsToObject(attrs)
      });
    }

ListBlock
  = "{" _ items:(ListItem _)* "}" {
      return items.map(i => i[0]).filter(i => i !== null);
    }

ListItem
  = "item" _ label:StringLiteral _ attrs:Attributes? _ nested:ListBlock? {
      return createBlockNode('ListItem', {
        content: label,
        ...attrsToObject(attrs),
        children: nested || []
      });
    }
  / Comment { return null; }

// Feedback Components
Alert
  = "alert" _ label:StringLiteral _ attrs:Attributes? {
      return createNode('Alert', {
        content: label,
        ...attrsToObject(attrs)
      });
    }

Toast
  = "toast" _ label:StringLiteral _ attrs:Attributes? {
      return createNode('Toast', {
        content: label,
        ...attrsToObject(attrs)
      });
    }

Progress
  = "progress" _ attrs:Attributes? {
      return createNode('Progress', {
        ...attrsToObject(attrs)
      });
    }

Spinner
  = "spinner" _ label:StringLiteral? _ attrs:Attributes? {
      return createNode('Spinner', {
        label: label || null,
        ...attrsToObject(attrs)
      });
    }

// Overlay Components
Tooltip
  = "tooltip" _ label:StringLiteral _ attrs:Attributes? {
      return createNode('Tooltip', {
        content: label,
        ...attrsToObject(attrs),
        children: []
      });
    }

Popover
  = "popover" _ label:StringLiteral? _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('Popover', {
        title: label || null,
        ...attrsToObject(attrs),
        children
      });
    }

Dropdown
  // Simplified syntax: dropdown ["Edit", "Delete", "---", "Cancel"]
  // "---" represents a divider
  = "dropdown" _ items:Array _ attrs:Attributes? {
      const processedItems = items.map(item => {
        if (typeof item === 'string') {
          if (item === '---' || item === '-' || item === 'divider') {
            return createBlockNode('Divider', {});
          }
          return createBlockNode('DropdownItem', { label: item });
        }
        // Object item with label, icon, etc. Array syntax puts every item on
        // the one `dropdown [...]` construct, so they share its `loc`.
        return createBlockNode('DropdownItem', item);
      });
      return createNode('Dropdown', {
        ...attrsToObject(attrs),
        items: processedItems
      });
    }
  // Verbose syntax: dropdown { item "..." divider ... }
  / "dropdown" _ attrs:Attributes? _ "{" _ items:DropdownContent _ "}" {
      return createNode('Dropdown', {
        ...attrsToObject(attrs),
        items
      });
    }

DropdownContent
  = items:(DropdownItem _)* {
      return items.map(i => i[0]).filter(i => i !== null);
    }

DropdownItem
  = "item" _ label:StringLiteral _ attrs:Attributes? {
      return createBlockNode('DropdownItem', { label, ...attrsToObject(attrs) });
    }
  / "divider" { return createBlockNode('Divider', {}); }
  / Comment { return null; }

// Navigation Components
Nav
  = "nav" _ items:Array? _ attrs:Attributes? _ block:NavBlock? {
      return createNode('Nav', {
        items: items || [],
        ...attrsToObject(attrs),
        children: block || []
      });
    }

NavBlock
  = "{" _ content:(NavBlockItem _)* "}" {
      return content.map(c => c[0]).filter(c => c !== null);
    }

NavBlockItem
  = NavGroup
  / NavItem
  / "divider" _ { return createBlockNode('Divider', {}); }
  / Comment { return null; }

NavGroup
  = "group" _ label:StringLiteral _ attrs:Attributes? _ "{" _ items:(NavGroupItem _)* "}" {
      return createBlockNode('NavGroup', {
        label,
        ...attrsToObject(attrs),
        items: items.map(i => i[0]).filter(i => i !== null)
      });
    }

NavGroupItem
  = NavItem
  / "divider" _ { return createBlockNode('Divider', {}); }
  / Comment { return null; }

NavItem
  = "item" _ label:StringLiteral _ attrs:Attributes? {
      return createBlockNode('NavItem', {
        label,
        ...attrsToObject(attrs)
      });
    }

Tabs
  = "tabs" _ items:Array? _ attrs:Attributes? _ block:TabsBlock? {
      return createNode('Tabs', {
        items: items || [],
        ...attrsToObject(attrs),
        children: block || []
      });
    }

TabsBlock
  = "{" _ tabs:(TabItem _)* "}" {
      return tabs.map(t => t[0]).filter(t => t !== null);
    }

TabItem
  = "tab" _ label:StringLiteral _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return {
        label,
        ...attrsToObject(attrs),
        children
      };
    }
  / Comment { return null; }

Breadcrumb
  = "breadcrumb" _ items:Array _ attrs:Attributes? {
      return createNode('Breadcrumb', {
        items: items,
        ...attrsToObject(attrs)
      });
    }

// Divider
Divider
  = "divider" _ attrs:Attributes? {
      return createNode('Divider', {
        ...attrsToObject(attrs)
      });
    }

// ============================================================
// Annotation Components
// ============================================================

// Marker - Number marker for referencing in annotations
// Usage: marker 1 anchor=top-right color=blue
Marker
  = "marker" _ num:Integer _ attrs:Attributes? {
      return createNode('Marker', {
        number: num,
        ...attrsToObject(attrs)
      });
    }

// Annotations - Documentation panel for screen specifications
// Usage: annotations title="화면 설명" { item 1 "제목" { text "설명" } }
Annotations
  = "annotations" _ attrs:Attributes? _ "{" _ items:AnnotationContent _ "}" {
      return createNode('Annotations', {
        ...attrsToObject(attrs),
        children: items
      });
    }

AnnotationContent
  = items:(AnnotationItem _)* {
      return items.map(i => i[0]).filter(i => i !== null);
    }

// AnnotationItem - Individual annotation entry
// Usage: item 1 "이메일 입력" { text "- 유효성 검사 적용" }
AnnotationItem
  = "item" _ num:Integer _ title:StringLiteral _ attrs:Attributes? _ "{" _ children:Children _ "}" {
      return createNode('AnnotationItem', {
        number: num,
        title: title,
        ...attrsToObject(attrs),
        children
      });
    }
  / "item" _ num:Integer _ title:StringLiteral _ attrs:Attributes? {
      return createNode('AnnotationItem', {
        number: num,
        title: title,
        ...attrsToObject(attrs),
        children: []
      });
    }
  / Comment { return null; }

// Integer for marker numbers
Integer "integer"
  = digits:[0-9]+ {
      return parseInt(digits.join(''), 10);
    }

// ============================================================
// Attributes
// ============================================================

Attributes
  = attrs:Attribute+ { return attrs; }

Attribute
  = _ "at" !IdentifierChar _ "(" _ x:Number _ "," _ y:Number _ ")" {
      // Canvas coordinates for `page` placement: `page "X" at(0, 0) { ... }`
      // Emits two attributes (x, y) to be flattened by attrsToObject.
      return [
        { name: 'x', value: x },
        { name: 'y', value: y }
      ];
    }
  / _ name:AttributeName _ "=" _ value:AttributeValue {
      return { name, value };
    }
  / _ flag:AttributeName &(_ (ChildKeyword / AttributeName / "=" / "{" / "}" / "[" / "//" / "/*" / !.)) {
      return { name: flag, value: true };
    }

// Attribute names - special handling for context-sensitive keywords
AttributeName
  = !ChildKeyword name:Identifier { return name; }

// Keywords that start a child component (these cannot be attribute names)
// Note: 'placeholder', 'icon', 'title' are valid as attribute names
ChildKeyword
  = ("page" / "header" / "main" / "footer" / "sidebar" / "row" / "col" / "stack" / "relative"
    / "card" / "modal" / "drawer" / "accordion" / "section"
    / "text" / "link" / "button"
    / "input" / "textarea" / "select" / "checkbox" / "radio" / "switch" / "slider"
    / "image" / "avatar" / "badge"
    / "table" / "columns" / "list" / "item"
    / "alert" / "toast" / "progress" / "spinner"
    / "tooltip" / "popover" / "dropdown" / "divider"
    / "nav" / "tabs" / "tab" / "breadcrumb" / "group"
    / "marker" / "annotations"
    / "repeat"
    / "layout" / "component" / "use" / "fill" / "slot") !IdentifierChar

IdentifierChar
  = [a-zA-Z0-9_-]

AttributeValue
  = StringLiteral
  / ValueWithUnit    // Must come before Number to match "16px" before "16"
  / Number
  / Boolean
  / Identifier
  / Array
  / Object

// ============================================================
// Literals
// ============================================================

StringLiteral "string"
  = '"' chars:DoubleStringChar* '"' { return chars.join(''); }
  / "'" chars:SingleStringChar* "'" { return chars.join(''); }

DoubleStringChar
  = !'"' !"\\" char:. { return char; }
  / "\\" seq:EscapeSequence { return seq; }

SingleStringChar
  = !"'" !"\\" char:. { return char; }
  / "\\" seq:EscapeSequence { return seq; }

EscapeSequence
  = "n" { return "\n"; }
  / "r" { return "\r"; }
  / "t" { return "\t"; }
  / "\\" { return "\\"; }
  / '"' { return '"'; }
  / "'" { return "'"; }

Number "number"
  = sign:"-"? digits:[0-9]+ decimal:("." [0-9]+)? {
      const num = (sign || '') + digits.join('') + (decimal ? '.' + decimal[1].join('') : '');
      return parseFloat(num);
    }

ValueWithUnit "value with unit"
  = sign:"-"? digits:[0-9]+ decimal:("." [0-9]+)? unit:("px" / "%" / "em" / "rem" / "vh" / "vw") {
      const num = (sign || '') + digits.join('') + (decimal ? '.' + decimal[1].join('') : '');
      return { value: parseFloat(num), unit: unit };
    }

Boolean "boolean"
  = "true" { return true; }
  / "false" { return false; }

Identifier "identifier"
  = head:[a-zA-Z_] tail:[a-zA-Z0-9_-]* {
      return head + tail.join('');
    }

// ============================================================
// Collections
// ============================================================

Array
  = "[" _ items:ArrayItems? _ "]" { return items || []; }

ArrayItems
  = head:ArrayItem tail:(_ ","? _ ArrayItem)* (_ ",")? {
      return [head, ...tail.map(t => t[3])];
    }

ArrayItem
  = StringLiteral
  / Number
  / Boolean
  / Object
  / Identifier

Object
  = "{" _ props:ObjectProperties? _ "}" {
      const result = {};
      if (props) {
        for (const p of props) {
          result[p.name] = p.value;
        }
      }
      return result;
    }

ObjectProperties
  = head:ObjectProperty tail:(_ ","? _ ObjectProperty)* {
      return [head, ...tail.map(t => t[3])];
    }

ObjectProperty
  = name:Identifier _ "=" _ value:AttributeValue {
      return { name, value };
    }
  / name:Identifier {
      return { name, value: true };
    }

// ============================================================
// Whitespace & Comments
// ============================================================

_ "whitespace"
  = (Whitespace / Comment)*

Whitespace
  = [ \t\n\r]+

Comment "comment"
  = LineComment
  / BlockComment

LineComment
  = "//" [^\n]* ("\n" / !.)

BlockComment
  = "/*" (!"*/" .)* "*/"

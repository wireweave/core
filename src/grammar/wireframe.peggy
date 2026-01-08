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

  // Helper: Flatten array of attributes into object
  // Renames 'type' to 'inputType' to avoid conflict with AST node type
  function attrsToObject(attrs, renameType = false) {
    if (!attrs || attrs.length === 0) return {};
    const result = {};
    for (const attr of attrs) {
      if (renameType && attr.name === 'type') {
        result.inputType = attr.value;
      } else {
        result[attr.name] = attr.value;
      }
    }
    return result;
  }
}

// ============================================================
// Entry Point
// ============================================================

Document
  = _ children:TopLevelElement* _ {
      return createNode('Document', { children: children.filter(c => c !== null) });
    }

TopLevelElement
  = Page
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
// Children (Block Content)
// ============================================================

Children
  = children:(Child _)* {
      return children.map(c => c[0]).filter(c => c !== null);
    }

Child
  = LayoutElement
  / ContainerElement
  / UIElement
  / Comment { return null; }

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
      return createNode('Input', {
        label: label || null,
        ...attrsToObject(attrs, true)
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
  = "placeholder" _ label:StringLiteral? _ attrs:Attributes? {
      return createNode('Placeholder', {
        label: label || null,
        ...attrsToObject(attrs)
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
  = "table" _ attrs:Attributes? _ "{" _ rows:TableContent _ "}" {
      return createNode('Table', {
        ...attrsToObject(attrs),
        ...rows
      });
    }

TableContent
  = items:(TableRow _)* {
      const columns = [];
      const rows = [];
      for (const item of items.map(i => i[0]).filter(i => i !== null)) {
        if (item.type === 'columns') columns.push(...item.values);
        else if (item.type === 'row') rows.push(item.values);
      }
      return { columns, rows };
    }

TableRow
  = "columns" _ values:Array { return { type: 'columns', values }; }
  / "row" _ values:Array { return { type: 'row', values }; }
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
      return {
        content: label,
        ...attrsToObject(attrs),
        children: nested || []
      };
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
  = "dropdown" _ attrs:Attributes? _ "{" _ items:DropdownContent _ "}" {
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
      return { label, ...attrsToObject(attrs) };
    }
  / "divider" { return { type: 'divider' }; }
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
  / "divider" _ { return { type: 'divider' }; }
  / Comment { return null; }

NavGroup
  = "group" _ label:StringLiteral _ attrs:Attributes? _ "{" _ items:(NavGroupItem _)* "}" {
      return {
        type: 'group',
        label,
        ...attrsToObject(attrs),
        items: items.map(i => i[0]).filter(i => i !== null)
      };
    }

NavGroupItem
  = NavItem
  / "divider" _ { return { type: 'divider' }; }
  / Comment { return null; }

NavItem
  = "item" _ label:StringLiteral _ attrs:Attributes? {
      return {
        type: 'item',
        label,
        ...attrsToObject(attrs)
      };
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
// Attributes
// ============================================================

Attributes
  = attrs:Attribute+ { return attrs; }

Attribute
  = _ name:AttributeName _ "=" _ value:AttributeValue {
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
  = ("page" / "header" / "main" / "footer" / "sidebar" / "row" / "col"
    / "card" / "modal" / "drawer" / "accordion" / "section"
    / "text" / "link" / "button"
    / "input" / "textarea" / "select" / "checkbox" / "radio" / "switch" / "slider"
    / "image" / "avatar" / "badge"
    / "table" / "columns" / "list" / "item"
    / "alert" / "toast" / "progress" / "spinner"
    / "tooltip" / "popover" / "dropdown" / "divider"
    / "nav" / "tabs" / "tab" / "breadcrumb" / "group") !IdentifierChar

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

"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/parser/index.ts
var parser_exports = {};
__export(parser_exports, {
  getErrors: () => getErrors,
  isValid: () => isValid,
  parse: () => parse,
  tryParse: () => tryParse
});
module.exports = __toCommonJS(parser_exports);

// src/parser/generated-parser.js
var peg$SyntaxError = class extends SyntaxError {
  constructor(message, expected, found, location) {
    super(message);
    this.expected = expected;
    this.found = found;
    this.location = location;
    this.name = "SyntaxError";
  }
  format(sources) {
    let str = "Error: " + this.message;
    if (this.location) {
      let src = null;
      const st = sources.find((s2) => s2.source === this.location.source);
      if (st) {
        src = st.text.split(/\r\n|\n|\r/g);
      }
      const s = this.location.start;
      const offset_s = this.location.source && typeof this.location.source.offset === "function" ? this.location.source.offset(s) : s;
      const loc = this.location.source + ":" + offset_s.line + ":" + offset_s.column;
      if (src) {
        const e = this.location.end;
        const filler = "".padEnd(offset_s.line.toString().length, " ");
        const line = src[s.line - 1];
        const last = s.line === e.line ? e.column : line.length + 1;
        const hatLen = last - s.column || 1;
        str += "\n --> " + loc + "\n" + filler + " |\n" + offset_s.line + " | " + line + "\n" + filler + " | " + "".padEnd(s.column - 1, " ") + "".padEnd(hatLen, "^");
      } else {
        str += "\n at " + loc;
      }
    }
    return str;
  }
  static buildMessage(expected, found) {
    function hex(ch) {
      return ch.codePointAt(0).toString(16).toUpperCase();
    }
    const nonPrintable = Object.prototype.hasOwnProperty.call(RegExp.prototype, "unicode") ? new RegExp("[\\p{C}\\p{Mn}\\p{Mc}]", "gu") : null;
    function unicodeEscape(s) {
      if (nonPrintable) {
        return s.replace(nonPrintable, (ch) => "\\u{" + hex(ch) + "}");
      }
      return s;
    }
    function literalEscape(s) {
      return unicodeEscape(s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, (ch) => "\\x0" + hex(ch)).replace(/[\x10-\x1F\x7F-\x9F]/g, (ch) => "\\x" + hex(ch)));
    }
    function classEscape(s) {
      return unicodeEscape(s.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, (ch) => "\\x0" + hex(ch)).replace(/[\x10-\x1F\x7F-\x9F]/g, (ch) => "\\x" + hex(ch)));
    }
    const DESCRIBE_EXPECTATION_FNS = {
      literal(expectation) {
        return '"' + literalEscape(expectation.text) + '"';
      },
      class(expectation) {
        const escapedParts = expectation.parts.map(
          (part) => Array.isArray(part) ? classEscape(part[0]) + "-" + classEscape(part[1]) : classEscape(part)
        );
        return "[" + (expectation.inverted ? "^" : "") + escapedParts.join("") + "]" + (expectation.unicode ? "u" : "");
      },
      any() {
        return "any character";
      },
      end() {
        return "end of input";
      },
      other(expectation) {
        return expectation.description;
      }
    };
    function describeExpectation(expectation) {
      return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
    }
    function describeExpected(expected2) {
      const descriptions = expected2.map(describeExpectation);
      descriptions.sort();
      if (descriptions.length > 0) {
        let j = 1;
        for (let i = 1; i < descriptions.length; i++) {
          if (descriptions[i - 1] !== descriptions[i]) {
            descriptions[j] = descriptions[i];
            j++;
          }
        }
        descriptions.length = j;
      }
      switch (descriptions.length) {
        case 1:
          return descriptions[0];
        case 2:
          return descriptions[0] + " or " + descriptions[1];
        default:
          return descriptions.slice(0, -1).join(", ") + ", or " + descriptions[descriptions.length - 1];
      }
    }
    function describeFound(found2) {
      return found2 ? '"' + literalEscape(found2) + '"' : "end of input";
    }
    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
  }
};
function peg$parse(input, options) {
  options = options !== void 0 ? options : {};
  const peg$FAILED = {};
  const peg$source = options.grammarSource;
  const peg$startRuleFunctions = {
    Document: peg$parseDocument
  };
  let peg$startRuleFunction = peg$parseDocument;
  const peg$c0 = "page";
  const peg$c1 = "{";
  const peg$c2 = "}";
  const peg$c3 = "header";
  const peg$c4 = "main";
  const peg$c5 = "footer";
  const peg$c6 = "sidebar";
  const peg$c7 = "row";
  const peg$c8 = "col";
  const peg$c9 = "card";
  const peg$c10 = "modal";
  const peg$c11 = "drawer";
  const peg$c12 = "accordion";
  const peg$c13 = "section";
  const peg$c14 = "text";
  const peg$c15 = "title";
  const peg$c16 = "link";
  const peg$c17 = "button";
  const peg$c18 = "input";
  const peg$c19 = "textarea";
  const peg$c20 = "select";
  const peg$c21 = "checkbox";
  const peg$c22 = "radio";
  const peg$c23 = "switch";
  const peg$c24 = "slider";
  const peg$c25 = "image";
  const peg$c26 = "placeholder";
  const peg$c27 = "avatar";
  const peg$c28 = "badge";
  const peg$c29 = "icon";
  const peg$c30 = "table";
  const peg$c31 = "columns";
  const peg$c32 = "list";
  const peg$c33 = "item";
  const peg$c34 = "alert";
  const peg$c35 = "toast";
  const peg$c36 = "progress";
  const peg$c37 = "spinner";
  const peg$c38 = "tooltip";
  const peg$c39 = "popover";
  const peg$c40 = "dropdown";
  const peg$c41 = "divider";
  const peg$c42 = "nav";
  const peg$c43 = "tabs";
  const peg$c44 = "tab";
  const peg$c45 = "breadcrumb";
  const peg$c46 = "=";
  const peg$c47 = "//";
  const peg$c48 = "/*";
  const peg$c49 = '"';
  const peg$c50 = "'";
  const peg$c51 = "\\";
  const peg$c52 = "n";
  const peg$c53 = "r";
  const peg$c54 = "t";
  const peg$c55 = "-";
  const peg$c56 = ".";
  const peg$c57 = "px";
  const peg$c58 = "%";
  const peg$c59 = "em";
  const peg$c60 = "rem";
  const peg$c61 = "vh";
  const peg$c62 = "vw";
  const peg$c63 = "true";
  const peg$c64 = "false";
  const peg$c65 = "[";
  const peg$c66 = "]";
  const peg$c67 = ",";
  const peg$c68 = "\n";
  const peg$c69 = "*/";
  const peg$r0 = /^[=[{}]/;
  const peg$r1 = /^[a-zA-Z0-9_\-]/;
  const peg$r2 = /^[0-9]/;
  const peg$r3 = /^[a-zA-Z_]/;
  const peg$r4 = /^[ \t\n\r]/;
  const peg$r5 = /^[^\n]/;
  const peg$e0 = peg$literalExpectation("page", false);
  const peg$e1 = peg$literalExpectation("{", false);
  const peg$e2 = peg$literalExpectation("}", false);
  const peg$e3 = peg$literalExpectation("header", false);
  const peg$e4 = peg$literalExpectation("main", false);
  const peg$e5 = peg$literalExpectation("footer", false);
  const peg$e6 = peg$literalExpectation("sidebar", false);
  const peg$e7 = peg$literalExpectation("row", false);
  const peg$e8 = peg$literalExpectation("col", false);
  const peg$e9 = peg$literalExpectation("card", false);
  const peg$e10 = peg$literalExpectation("modal", false);
  const peg$e11 = peg$literalExpectation("drawer", false);
  const peg$e12 = peg$literalExpectation("accordion", false);
  const peg$e13 = peg$literalExpectation("section", false);
  const peg$e14 = peg$literalExpectation("text", false);
  const peg$e15 = peg$literalExpectation("title", false);
  const peg$e16 = peg$literalExpectation("link", false);
  const peg$e17 = peg$literalExpectation("button", false);
  const peg$e18 = peg$literalExpectation("input", false);
  const peg$e19 = peg$literalExpectation("textarea", false);
  const peg$e20 = peg$literalExpectation("select", false);
  const peg$e21 = peg$literalExpectation("checkbox", false);
  const peg$e22 = peg$literalExpectation("radio", false);
  const peg$e23 = peg$literalExpectation("switch", false);
  const peg$e24 = peg$literalExpectation("slider", false);
  const peg$e25 = peg$literalExpectation("image", false);
  const peg$e26 = peg$literalExpectation("placeholder", false);
  const peg$e27 = peg$literalExpectation("avatar", false);
  const peg$e28 = peg$literalExpectation("badge", false);
  const peg$e29 = peg$literalExpectation("icon", false);
  const peg$e30 = peg$literalExpectation("table", false);
  const peg$e31 = peg$literalExpectation("columns", false);
  const peg$e32 = peg$literalExpectation("list", false);
  const peg$e33 = peg$literalExpectation("item", false);
  const peg$e34 = peg$literalExpectation("alert", false);
  const peg$e35 = peg$literalExpectation("toast", false);
  const peg$e36 = peg$literalExpectation("progress", false);
  const peg$e37 = peg$literalExpectation("spinner", false);
  const peg$e38 = peg$literalExpectation("tooltip", false);
  const peg$e39 = peg$literalExpectation("popover", false);
  const peg$e40 = peg$literalExpectation("dropdown", false);
  const peg$e41 = peg$literalExpectation("divider", false);
  const peg$e42 = peg$literalExpectation("nav", false);
  const peg$e43 = peg$literalExpectation("tabs", false);
  const peg$e44 = peg$literalExpectation("tab", false);
  const peg$e45 = peg$literalExpectation("breadcrumb", false);
  const peg$e46 = peg$literalExpectation("=", false);
  const peg$e47 = peg$classExpectation(["=", "[", "{", "}"], false, false, false);
  const peg$e48 = peg$literalExpectation("//", false);
  const peg$e49 = peg$literalExpectation("/*", false);
  const peg$e50 = peg$anyExpectation();
  const peg$e51 = peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "_", "-"], false, false, false);
  const peg$e52 = peg$otherExpectation("string");
  const peg$e53 = peg$literalExpectation('"', false);
  const peg$e54 = peg$literalExpectation("'", false);
  const peg$e55 = peg$literalExpectation("\\", false);
  const peg$e56 = peg$literalExpectation("n", false);
  const peg$e57 = peg$literalExpectation("r", false);
  const peg$e58 = peg$literalExpectation("t", false);
  const peg$e59 = peg$otherExpectation("number");
  const peg$e60 = peg$literalExpectation("-", false);
  const peg$e61 = peg$classExpectation([["0", "9"]], false, false, false);
  const peg$e62 = peg$literalExpectation(".", false);
  const peg$e63 = peg$otherExpectation("value with unit");
  const peg$e64 = peg$literalExpectation("px", false);
  const peg$e65 = peg$literalExpectation("%", false);
  const peg$e66 = peg$literalExpectation("em", false);
  const peg$e67 = peg$literalExpectation("rem", false);
  const peg$e68 = peg$literalExpectation("vh", false);
  const peg$e69 = peg$literalExpectation("vw", false);
  const peg$e70 = peg$otherExpectation("boolean");
  const peg$e71 = peg$literalExpectation("true", false);
  const peg$e72 = peg$literalExpectation("false", false);
  const peg$e73 = peg$otherExpectation("identifier");
  const peg$e74 = peg$classExpectation([["a", "z"], ["A", "Z"], "_"], false, false, false);
  const peg$e75 = peg$literalExpectation("[", false);
  const peg$e76 = peg$literalExpectation("]", false);
  const peg$e77 = peg$literalExpectation(",", false);
  const peg$e78 = peg$classExpectation([" ", "	", "\n", "\r"], false, false, false);
  const peg$e79 = peg$otherExpectation("comment");
  const peg$e80 = peg$classExpectation(["\n"], true, false, false);
  const peg$e81 = peg$literalExpectation("\n", false);
  const peg$e82 = peg$literalExpectation("*/", false);
  function peg$f0(children) {
    return createNode("Document", { children: children.filter((c) => c !== null) });
  }
  function peg$f1() {
    return null;
  }
  function peg$f2(label, attrs, children) {
    return createNode("Page", {
      title: label || null,
      ...attrsToObject(attrs),
      children
    });
  }
  function peg$f3(children) {
    return children.map((c) => c[0]).filter((c) => c !== null);
  }
  function peg$f4() {
    return null;
  }
  function peg$f5(attrs, children) {
    return createNode("Header", {
      ...attrsToObject(attrs),
      children
    });
  }
  function peg$f6(attrs, children) {
    return createNode("Main", {
      ...attrsToObject(attrs),
      children
    });
  }
  function peg$f7(attrs, children) {
    return createNode("Footer", {
      ...attrsToObject(attrs),
      children
    });
  }
  function peg$f8(attrs, children) {
    return createNode("Sidebar", {
      ...attrsToObject(attrs),
      children
    });
  }
  function peg$f9(attrs, children) {
    return createNode("Row", {
      ...attrsToObject(attrs),
      children
    });
  }
  function peg$f10(attrs, children) {
    return createNode("Col", {
      ...attrsToObject(attrs),
      children
    });
  }
  function peg$f11(label, attrs, children) {
    return createNode("Card", {
      title: label || null,
      ...attrsToObject(attrs),
      children
    });
  }
  function peg$f12(label, attrs, children) {
    return createNode("Modal", {
      title: label || null,
      ...attrsToObject(attrs),
      children
    });
  }
  function peg$f13(label, attrs, children) {
    return createNode("Drawer", {
      title: label || null,
      ...attrsToObject(attrs),
      children
    });
  }
  function peg$f14(label, attrs, children) {
    return createNode("Accordion", {
      title: label || null,
      ...attrsToObject(attrs),
      children
    });
  }
  function peg$f15(label, attrs, children) {
    return createNode("Section", {
      title: label || null,
      ...attrsToObject(attrs),
      children
    });
  }
  function peg$f16(label, attrs) {
    return createNode("Text", {
      content: label,
      ...attrsToObject(attrs)
    });
  }
  function peg$f17(label, attrs) {
    return createNode("Title", {
      content: label,
      ...attrsToObject(attrs)
    });
  }
  function peg$f18(label, attrs) {
    return createNode("Link", {
      content: label,
      ...attrsToObject(attrs)
    });
  }
  function peg$f19(label, attrs) {
    return createNode("Button", {
      content: label,
      ...attrsToObject(attrs)
    });
  }
  function peg$f20(label, attrs) {
    return createNode("Input", {
      label: label || null,
      ...attrsToObject(attrs, true)
    });
  }
  function peg$f21(label, attrs) {
    return createNode("Textarea", {
      label: label || null,
      ...attrsToObject(attrs)
    });
  }
  function peg$f22(label, options2, attrs) {
    return createNode("Select", {
      label: label || null,
      options: options2 || [],
      ...attrsToObject(attrs)
    });
  }
  function peg$f23(label, attrs) {
    return createNode("Checkbox", {
      label: label || null,
      ...attrsToObject(attrs)
    });
  }
  function peg$f24(label, attrs) {
    return createNode("Radio", {
      label: label || null,
      ...attrsToObject(attrs)
    });
  }
  function peg$f25(label, attrs) {
    return createNode("Switch", {
      label: label || null,
      ...attrsToObject(attrs)
    });
  }
  function peg$f26(label, attrs) {
    return createNode("Slider", {
      label: label || null,
      ...attrsToObject(attrs)
    });
  }
  function peg$f27(src, attrs) {
    return createNode("Image", {
      src: src || null,
      ...attrsToObject(attrs)
    });
  }
  function peg$f28(label, attrs) {
    return createNode("Placeholder", {
      label: label || null,
      ...attrsToObject(attrs)
    });
  }
  function peg$f29(label, attrs) {
    return createNode("Avatar", {
      name: label || null,
      ...attrsToObject(attrs)
    });
  }
  function peg$f30(label, attrs) {
    return createNode("Badge", {
      content: label,
      ...attrsToObject(attrs)
    });
  }
  function peg$f31(name, attrs) {
    return createNode("Icon", {
      name,
      ...attrsToObject(attrs)
    });
  }
  function peg$f32(attrs, rows) {
    return createNode("Table", {
      ...attrsToObject(attrs),
      ...rows
    });
  }
  function peg$f33(items) {
    const columns = [];
    const rows = [];
    for (const item of items.map((i) => i[0]).filter((i) => i !== null)) {
      if (item.type === "columns") columns.push(...item.values);
      else if (item.type === "row") rows.push(item.values);
    }
    return { columns, rows };
  }
  function peg$f34(values) {
    return { type: "columns", values };
  }
  function peg$f35(values) {
    return { type: "row", values };
  }
  function peg$f36() {
    return null;
  }
  function peg$f37(items, attrs, block) {
    return createNode("List", {
      items: items || (block ? block : []),
      ...attrsToObject(attrs)
    });
  }
  function peg$f38(items) {
    return items.map((i) => i[0]).filter((i) => i !== null);
  }
  function peg$f39(label, attrs, nested) {
    return {
      content: label,
      ...attrsToObject(attrs),
      children: nested || []
    };
  }
  function peg$f40() {
    return null;
  }
  function peg$f41(label, attrs) {
    return createNode("Alert", {
      content: label,
      ...attrsToObject(attrs)
    });
  }
  function peg$f42(label, attrs) {
    return createNode("Toast", {
      content: label,
      ...attrsToObject(attrs)
    });
  }
  function peg$f43(attrs) {
    return createNode("Progress", {
      ...attrsToObject(attrs)
    });
  }
  function peg$f44(label, attrs) {
    return createNode("Spinner", {
      label: label || null,
      ...attrsToObject(attrs)
    });
  }
  function peg$f45(label, attrs) {
    return createNode("Tooltip", {
      content: label,
      ...attrsToObject(attrs),
      children: []
    });
  }
  function peg$f46(label, attrs, children) {
    return createNode("Popover", {
      title: label || null,
      ...attrsToObject(attrs),
      children
    });
  }
  function peg$f47(attrs, items) {
    return createNode("Dropdown", {
      ...attrsToObject(attrs),
      items
    });
  }
  function peg$f48(items) {
    return items.map((i) => i[0]).filter((i) => i !== null);
  }
  function peg$f49(label, attrs) {
    return { label, ...attrsToObject(attrs) };
  }
  function peg$f50() {
    return { type: "divider" };
  }
  function peg$f51() {
    return null;
  }
  function peg$f52(items, attrs) {
    return createNode("Nav", {
      items: items || [],
      ...attrsToObject(attrs)
    });
  }
  function peg$f53(items, attrs, block) {
    return createNode("Tabs", {
      items: items || [],
      ...attrsToObject(attrs),
      children: block || []
    });
  }
  function peg$f54(tabs) {
    return tabs.map((t) => t[0]).filter((t) => t !== null);
  }
  function peg$f55(label, attrs, children) {
    return {
      label,
      ...attrsToObject(attrs),
      children
    };
  }
  function peg$f56() {
    return null;
  }
  function peg$f57(items, attrs) {
    return createNode("Breadcrumb", {
      items,
      ...attrsToObject(attrs)
    });
  }
  function peg$f58(attrs) {
    return createNode("Divider", {
      ...attrsToObject(attrs)
    });
  }
  function peg$f59(attrs) {
    return attrs;
  }
  function peg$f60(name, value) {
    return { name, value };
  }
  function peg$f61(flag) {
    return { name: flag, value: true };
  }
  function peg$f62(name) {
    return name;
  }
  function peg$f63(chars) {
    return chars.join("");
  }
  function peg$f64(chars) {
    return chars.join("");
  }
  function peg$f65(char) {
    return char;
  }
  function peg$f66(seq) {
    return seq;
  }
  function peg$f67(char) {
    return char;
  }
  function peg$f68(seq) {
    return seq;
  }
  function peg$f69() {
    return "\n";
  }
  function peg$f70() {
    return "\r";
  }
  function peg$f71() {
    return "	";
  }
  function peg$f72() {
    return "\\";
  }
  function peg$f73() {
    return '"';
  }
  function peg$f74() {
    return "'";
  }
  function peg$f75(sign, digits, decimal) {
    const num = (sign || "") + digits.join("") + (decimal ? "." + decimal[1].join("") : "");
    return parseFloat(num);
  }
  function peg$f76(sign, digits, decimal, unit) {
    const num = (sign || "") + digits.join("") + (decimal ? "." + decimal[1].join("") : "");
    return { value: parseFloat(num), unit };
  }
  function peg$f77() {
    return true;
  }
  function peg$f78() {
    return false;
  }
  function peg$f79(head, tail) {
    return head + tail.join("");
  }
  function peg$f80(items) {
    return items || [];
  }
  function peg$f81(head, tail) {
    return [head, ...tail.map((t) => t[3])];
  }
  function peg$f82(props) {
    const result = {};
    if (props) {
      for (const p of props) {
        result[p.name] = p.value;
      }
    }
    return result;
  }
  function peg$f83(head, tail) {
    return [head, ...tail.map((t) => t[3])];
  }
  function peg$f84(name, value) {
    return { name, value };
  }
  function peg$f85(name) {
    return { name, value: true };
  }
  let peg$currPos = options.peg$currPos | 0;
  let peg$savedPos = peg$currPos;
  const peg$posDetailsCache = [{ line: 1, column: 1 }];
  let peg$maxFailPos = peg$currPos;
  let peg$maxFailExpected = options.peg$maxFailExpected || [];
  let peg$silentFails = options.peg$silentFails | 0;
  let peg$result;
  if (options.startRule) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error(`Can't start parsing from rule "` + options.startRule + '".');
    }
    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }
  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }
  function offset() {
    return peg$savedPos;
  }
  function range() {
    return {
      source: peg$source,
      start: peg$savedPos,
      end: peg$currPos
    };
  }
  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }
  function expected(description, location2) {
    location2 = location2 !== void 0 ? location2 : peg$computeLocation(peg$savedPos, peg$currPos);
    throw peg$buildStructuredError(
      [peg$otherExpectation(description)],
      input.substring(peg$savedPos, peg$currPos),
      location2
    );
  }
  function error(message, location2) {
    location2 = location2 !== void 0 ? location2 : peg$computeLocation(peg$savedPos, peg$currPos);
    throw peg$buildSimpleError(message, location2);
  }
  function peg$getUnicode(pos = peg$currPos) {
    const cp = input.codePointAt(pos);
    if (cp === void 0) {
      return "";
    }
    return String.fromCodePoint(cp);
  }
  function peg$literalExpectation(text2, ignoreCase) {
    return { type: "literal", text: text2, ignoreCase };
  }
  function peg$classExpectation(parts, inverted, ignoreCase, unicode) {
    return { type: "class", parts, inverted, ignoreCase, unicode };
  }
  function peg$anyExpectation() {
    return { type: "any" };
  }
  function peg$endExpectation() {
    return { type: "end" };
  }
  function peg$otherExpectation(description) {
    return { type: "other", description };
  }
  function peg$computePosDetails(pos) {
    let details = peg$posDetailsCache[pos];
    let p;
    if (details) {
      return details;
    } else {
      if (pos >= peg$posDetailsCache.length) {
        p = peg$posDetailsCache.length - 1;
      } else {
        p = pos;
        while (!peg$posDetailsCache[--p]) {
        }
      }
      details = peg$posDetailsCache[p];
      details = {
        line: details.line,
        column: details.column
      };
      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }
        p++;
      }
      peg$posDetailsCache[pos] = details;
      return details;
    }
  }
  function peg$computeLocation(startPos, endPos, offset2) {
    const startPosDetails = peg$computePosDetails(startPos);
    const endPosDetails = peg$computePosDetails(endPos);
    const res = {
      source: peg$source,
      start: {
        offset: startPos,
        line: startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line: endPosDetails.line,
        column: endPosDetails.column
      }
    };
    if (offset2 && peg$source && typeof peg$source.offset === "function") {
      res.start = peg$source.offset(res.start);
      res.end = peg$source.offset(res.end);
    }
    return res;
  }
  function peg$fail(expected2) {
    if (peg$currPos < peg$maxFailPos) {
      return;
    }
    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }
    peg$maxFailExpected.push(expected2);
  }
  function peg$buildSimpleError(message, location2) {
    return new peg$SyntaxError(message, null, null, location2);
  }
  function peg$buildStructuredError(expected2, found, location2) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected2, found),
      expected2,
      found,
      location2
    );
  }
  function peg$parseDocument() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = [];
    s3 = peg$parseTopLevelElement();
    while (s3 !== peg$FAILED) {
      s2.push(s3);
      s3 = peg$parseTopLevelElement();
    }
    s3 = peg$parse_();
    peg$savedPos = s0;
    s0 = peg$f0(s2);
    return s0;
  }
  function peg$parseTopLevelElement() {
    let s0, s1;
    s0 = peg$parsePage();
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseComment();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$f1();
      }
      s0 = s1;
    }
    return s0;
  }
  function peg$parsePage() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c0) {
      s1 = peg$c0;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e0);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      s6 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 123) {
        s7 = peg$c1;
        peg$currPos++;
      } else {
        s7 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e1);
        }
      }
      if (s7 !== peg$FAILED) {
        s8 = peg$parse_();
        s9 = peg$parseChildren();
        s10 = peg$parse_();
        if (input.charCodeAt(peg$currPos) === 125) {
          s11 = peg$c2;
          peg$currPos++;
        } else {
          s11 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e2);
          }
        }
        if (s11 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f2(s3, s5, s9);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseChildren() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = [];
    s2 = peg$currPos;
    s3 = peg$parseChild();
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      s3 = [s3, s4];
      s2 = s3;
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      s2 = peg$currPos;
      s3 = peg$parseChild();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s3 = [s3, s4];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    }
    peg$savedPos = s0;
    s1 = peg$f3(s1);
    s0 = s1;
    return s0;
  }
  function peg$parseChild() {
    let s0, s1;
    s0 = peg$parseLayoutElement();
    if (s0 === peg$FAILED) {
      s0 = peg$parseContainerElement();
      if (s0 === peg$FAILED) {
        s0 = peg$parseUIElement();
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseComment();
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f4();
          }
          s0 = s1;
        }
      }
    }
    return s0;
  }
  function peg$parseLayoutElement() {
    let s0;
    s0 = peg$parseHeader();
    if (s0 === peg$FAILED) {
      s0 = peg$parseMain();
      if (s0 === peg$FAILED) {
        s0 = peg$parseFooter();
        if (s0 === peg$FAILED) {
          s0 = peg$parseSidebar();
          if (s0 === peg$FAILED) {
            s0 = peg$parseRow();
            if (s0 === peg$FAILED) {
              s0 = peg$parseCol();
            }
          }
        }
      }
    }
    return s0;
  }
  function peg$parseHeader() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c3) {
      s1 = peg$c3;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e3);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseAttributes();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 123) {
        s5 = peg$c1;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e1);
        }
      }
      if (s5 !== peg$FAILED) {
        s6 = peg$parse_();
        s7 = peg$parseChildren();
        if (s7 !== peg$FAILED) {
          s8 = peg$parse_();
          if (input.charCodeAt(peg$currPos) === 125) {
            s9 = peg$c2;
            peg$currPos++;
          } else {
            s9 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e2);
            }
          }
          if (s9 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f5(s3, s7);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseMain() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c4) {
      s1 = peg$c4;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e4);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseAttributes();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 123) {
        s5 = peg$c1;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e1);
        }
      }
      if (s5 !== peg$FAILED) {
        s6 = peg$parse_();
        s7 = peg$parseChildren();
        if (s7 !== peg$FAILED) {
          s8 = peg$parse_();
          if (input.charCodeAt(peg$currPos) === 125) {
            s9 = peg$c2;
            peg$currPos++;
          } else {
            s9 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e2);
            }
          }
          if (s9 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f6(s3, s7);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseFooter() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c5) {
      s1 = peg$c5;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e5);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseAttributes();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 123) {
        s5 = peg$c1;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e1);
        }
      }
      if (s5 !== peg$FAILED) {
        s6 = peg$parse_();
        s7 = peg$parseChildren();
        if (s7 !== peg$FAILED) {
          s8 = peg$parse_();
          if (input.charCodeAt(peg$currPos) === 125) {
            s9 = peg$c2;
            peg$currPos++;
          } else {
            s9 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e2);
            }
          }
          if (s9 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f7(s3, s7);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseSidebar() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c6) {
      s1 = peg$c6;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e6);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseAttributes();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 123) {
        s5 = peg$c1;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e1);
        }
      }
      if (s5 !== peg$FAILED) {
        s6 = peg$parse_();
        s7 = peg$parseChildren();
        if (s7 !== peg$FAILED) {
          s8 = peg$parse_();
          if (input.charCodeAt(peg$currPos) === 125) {
            s9 = peg$c2;
            peg$currPos++;
          } else {
            s9 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e2);
            }
          }
          if (s9 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f8(s3, s7);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseRow() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c7) {
      s1 = peg$c7;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e7);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseAttributes();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 123) {
        s5 = peg$c1;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e1);
        }
      }
      if (s5 !== peg$FAILED) {
        s6 = peg$parse_();
        s7 = peg$parseChildren();
        if (s7 !== peg$FAILED) {
          s8 = peg$parse_();
          if (input.charCodeAt(peg$currPos) === 125) {
            s9 = peg$c2;
            peg$currPos++;
          } else {
            s9 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e2);
            }
          }
          if (s9 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f9(s3, s7);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseCol() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c8) {
      s1 = peg$c8;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e8);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseAttributes();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 123) {
        s5 = peg$c1;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e1);
        }
      }
      if (s5 !== peg$FAILED) {
        s6 = peg$parse_();
        s7 = peg$parseChildren();
        if (s7 !== peg$FAILED) {
          s8 = peg$parse_();
          if (input.charCodeAt(peg$currPos) === 125) {
            s9 = peg$c2;
            peg$currPos++;
          } else {
            s9 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e2);
            }
          }
          if (s9 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f10(s3, s7);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseContainerElement() {
    let s0;
    s0 = peg$parseCard();
    if (s0 === peg$FAILED) {
      s0 = peg$parseModal();
      if (s0 === peg$FAILED) {
        s0 = peg$parseDrawer();
        if (s0 === peg$FAILED) {
          s0 = peg$parseAccordion();
          if (s0 === peg$FAILED) {
            s0 = peg$parseSection();
          }
        }
      }
    }
    return s0;
  }
  function peg$parseCard() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c9) {
      s1 = peg$c9;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e9);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      s6 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 123) {
        s7 = peg$c1;
        peg$currPos++;
      } else {
        s7 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e1);
        }
      }
      if (s7 !== peg$FAILED) {
        s8 = peg$parse_();
        s9 = peg$parseChildren();
        if (s9 !== peg$FAILED) {
          s10 = peg$parse_();
          if (input.charCodeAt(peg$currPos) === 125) {
            s11 = peg$c2;
            peg$currPos++;
          } else {
            s11 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e2);
            }
          }
          if (s11 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f11(s3, s5, s9);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseModal() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c10) {
      s1 = peg$c10;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e10);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      s6 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 123) {
        s7 = peg$c1;
        peg$currPos++;
      } else {
        s7 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e1);
        }
      }
      if (s7 !== peg$FAILED) {
        s8 = peg$parse_();
        s9 = peg$parseChildren();
        if (s9 !== peg$FAILED) {
          s10 = peg$parse_();
          if (input.charCodeAt(peg$currPos) === 125) {
            s11 = peg$c2;
            peg$currPos++;
          } else {
            s11 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e2);
            }
          }
          if (s11 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f12(s3, s5, s9);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseDrawer() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c11) {
      s1 = peg$c11;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e11);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      s6 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 123) {
        s7 = peg$c1;
        peg$currPos++;
      } else {
        s7 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e1);
        }
      }
      if (s7 !== peg$FAILED) {
        s8 = peg$parse_();
        s9 = peg$parseChildren();
        if (s9 !== peg$FAILED) {
          s10 = peg$parse_();
          if (input.charCodeAt(peg$currPos) === 125) {
            s11 = peg$c2;
            peg$currPos++;
          } else {
            s11 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e2);
            }
          }
          if (s11 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f13(s3, s5, s9);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseAccordion() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 9) === peg$c12) {
      s1 = peg$c12;
      peg$currPos += 9;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e12);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      s6 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 123) {
        s7 = peg$c1;
        peg$currPos++;
      } else {
        s7 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e1);
        }
      }
      if (s7 !== peg$FAILED) {
        s8 = peg$parse_();
        s9 = peg$parseChildren();
        if (s9 !== peg$FAILED) {
          s10 = peg$parse_();
          if (input.charCodeAt(peg$currPos) === 125) {
            s11 = peg$c2;
            peg$currPos++;
          } else {
            s11 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e2);
            }
          }
          if (s11 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f14(s3, s5, s9);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseSection() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c13) {
      s1 = peg$c13;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e13);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      s6 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 123) {
        s7 = peg$c1;
        peg$currPos++;
      } else {
        s7 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e1);
        }
      }
      if (s7 !== peg$FAILED) {
        s8 = peg$parse_();
        s9 = peg$parseChildren();
        if (s9 !== peg$FAILED) {
          s10 = peg$parse_();
          if (input.charCodeAt(peg$currPos) === 125) {
            s11 = peg$c2;
            peg$currPos++;
          } else {
            s11 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e2);
            }
          }
          if (s11 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f15(s3, s5, s9);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseUIElement() {
    let s0;
    s0 = peg$parseText();
    if (s0 === peg$FAILED) {
      s0 = peg$parseTitle();
      if (s0 === peg$FAILED) {
        s0 = peg$parseLink();
        if (s0 === peg$FAILED) {
          s0 = peg$parseButton();
          if (s0 === peg$FAILED) {
            s0 = peg$parseInput();
            if (s0 === peg$FAILED) {
              s0 = peg$parseTextarea();
              if (s0 === peg$FAILED) {
                s0 = peg$parseSelect();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseCheckbox();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseRadio();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseSwitch();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseSlider();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseImage();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parsePlaceholder();
                            if (s0 === peg$FAILED) {
                              s0 = peg$parseAvatar();
                              if (s0 === peg$FAILED) {
                                s0 = peg$parseBadge();
                                if (s0 === peg$FAILED) {
                                  s0 = peg$parseIcon();
                                  if (s0 === peg$FAILED) {
                                    s0 = peg$parseTable();
                                    if (s0 === peg$FAILED) {
                                      s0 = peg$parseList();
                                      if (s0 === peg$FAILED) {
                                        s0 = peg$parseAlert();
                                        if (s0 === peg$FAILED) {
                                          s0 = peg$parseToast();
                                          if (s0 === peg$FAILED) {
                                            s0 = peg$parseProgress();
                                            if (s0 === peg$FAILED) {
                                              s0 = peg$parseSpinner();
                                              if (s0 === peg$FAILED) {
                                                s0 = peg$parseTooltip();
                                                if (s0 === peg$FAILED) {
                                                  s0 = peg$parsePopover();
                                                  if (s0 === peg$FAILED) {
                                                    s0 = peg$parseDropdown();
                                                    if (s0 === peg$FAILED) {
                                                      s0 = peg$parseNav();
                                                      if (s0 === peg$FAILED) {
                                                        s0 = peg$parseTabs();
                                                        if (s0 === peg$FAILED) {
                                                          s0 = peg$parseBreadcrumb();
                                                          if (s0 === peg$FAILED) {
                                                            s0 = peg$parseDivider();
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return s0;
  }
  function peg$parseText() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c14) {
      s1 = peg$c14;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e14);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s5 = peg$parseAttributes();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f16(s3, s5);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseTitle() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c15) {
      s1 = peg$c15;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e15);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s5 = peg$parseAttributes();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f17(s3, s5);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseLink() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c16) {
      s1 = peg$c16;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e16);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s5 = peg$parseAttributes();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f18(s3, s5);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseButton() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c17) {
      s1 = peg$c17;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e17);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s5 = peg$parseAttributes();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f19(s3, s5);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseInput() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c18) {
      s1 = peg$c18;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e18);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f20(s3, s5);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseTextarea() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c19) {
      s1 = peg$c19;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e19);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f21(s3, s5);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseSelect() {
    let s0, s1, s2, s3, s4, s5, s6, s7;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c20) {
      s1 = peg$c20;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e20);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseArray();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      s6 = peg$parse_();
      s7 = peg$parseAttributes();
      if (s7 === peg$FAILED) {
        s7 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f22(s3, s5, s7);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseCheckbox() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c21) {
      s1 = peg$c21;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e21);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f23(s3, s5);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseRadio() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c22) {
      s1 = peg$c22;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e22);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f24(s3, s5);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseSwitch() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c23) {
      s1 = peg$c23;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e23);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f25(s3, s5);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseSlider() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c24) {
      s1 = peg$c24;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e24);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f26(s3, s5);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseImage() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c25) {
      s1 = peg$c25;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e25);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f27(s3, s5);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePlaceholder() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 11) === peg$c26) {
      s1 = peg$c26;
      peg$currPos += 11;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e26);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f28(s3, s5);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseAvatar() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c27) {
      s1 = peg$c27;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e27);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f29(s3, s5);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseBadge() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c28) {
      s1 = peg$c28;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e28);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s5 = peg$parseAttributes();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f30(s3, s5);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseIcon() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c29) {
      s1 = peg$c29;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e29);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s5 = peg$parseAttributes();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f31(s3, s5);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseTable() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c30) {
      s1 = peg$c30;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e30);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseAttributes();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 123) {
        s5 = peg$c1;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e1);
        }
      }
      if (s5 !== peg$FAILED) {
        s6 = peg$parse_();
        s7 = peg$parseTableContent();
        s8 = peg$parse_();
        if (input.charCodeAt(peg$currPos) === 125) {
          s9 = peg$c2;
          peg$currPos++;
        } else {
          s9 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e2);
          }
        }
        if (s9 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f32(s3, s7);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseTableContent() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = [];
    s2 = peg$currPos;
    s3 = peg$parseTableRow();
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      s3 = [s3, s4];
      s2 = s3;
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      s2 = peg$currPos;
      s3 = peg$parseTableRow();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s3 = [s3, s4];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    }
    peg$savedPos = s0;
    s1 = peg$f33(s1);
    s0 = s1;
    return s0;
  }
  function peg$parseTableRow() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c31) {
      s1 = peg$c31;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e31);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseArray();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f34(s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c7) {
        s1 = peg$c7;
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e7);
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        s3 = peg$parseArray();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f35(s3);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseComment();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$f36();
        }
        s0 = s1;
      }
    }
    return s0;
  }
  function peg$parseList() {
    let s0, s1, s2, s3, s4, s5, s6, s7;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c32) {
      s1 = peg$c32;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e32);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseArray();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      s6 = peg$parse_();
      s7 = peg$parseListBlock();
      if (s7 === peg$FAILED) {
        s7 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f37(s3, s5, s7);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseListBlock() {
    let s0, s1, s2, s3, s4, s5, s6;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 123) {
      s1 = peg$c1;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e1);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = [];
      s4 = peg$currPos;
      s5 = peg$parseListItem();
      if (s5 !== peg$FAILED) {
        s6 = peg$parse_();
        s5 = [s5, s6];
        s4 = s5;
      } else {
        peg$currPos = s4;
        s4 = peg$FAILED;
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$currPos;
        s5 = peg$parseListItem();
        if (s5 !== peg$FAILED) {
          s6 = peg$parse_();
          s5 = [s5, s6];
          s4 = s5;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
      }
      if (input.charCodeAt(peg$currPos) === 125) {
        s4 = peg$c2;
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e2);
        }
      }
      if (s4 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f38(s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseListItem() {
    let s0, s1, s2, s3, s4, s5, s6, s7;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c33) {
      s1 = peg$c33;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e33);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s5 = peg$parseAttributes();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        s6 = peg$parse_();
        s7 = peg$parseListBlock();
        if (s7 === peg$FAILED) {
          s7 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f39(s3, s5, s7);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseComment();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$f40();
      }
      s0 = s1;
    }
    return s0;
  }
  function peg$parseAlert() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c34) {
      s1 = peg$c34;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e34);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s5 = peg$parseAttributes();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f41(s3, s5);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseToast() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c35) {
      s1 = peg$c35;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e35);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s5 = peg$parseAttributes();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f42(s3, s5);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseProgress() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c36) {
      s1 = peg$c36;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e36);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseAttributes();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f43(s3);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseSpinner() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c37) {
      s1 = peg$c37;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e37);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f44(s3, s5);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseTooltip() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c38) {
      s1 = peg$c38;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e38);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s5 = peg$parseAttributes();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f45(s3, s5);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePopover() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c39) {
      s1 = peg$c39;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e39);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      s6 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 123) {
        s7 = peg$c1;
        peg$currPos++;
      } else {
        s7 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e1);
        }
      }
      if (s7 !== peg$FAILED) {
        s8 = peg$parse_();
        s9 = peg$parseChildren();
        if (s9 !== peg$FAILED) {
          s10 = peg$parse_();
          if (input.charCodeAt(peg$currPos) === 125) {
            s11 = peg$c2;
            peg$currPos++;
          } else {
            s11 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e2);
            }
          }
          if (s11 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f46(s3, s5, s9);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseDropdown() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c40) {
      s1 = peg$c40;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e40);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseAttributes();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 123) {
        s5 = peg$c1;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e1);
        }
      }
      if (s5 !== peg$FAILED) {
        s6 = peg$parse_();
        s7 = peg$parseDropdownContent();
        s8 = peg$parse_();
        if (input.charCodeAt(peg$currPos) === 125) {
          s9 = peg$c2;
          peg$currPos++;
        } else {
          s9 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e2);
          }
        }
        if (s9 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f47(s3, s7);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseDropdownContent() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = [];
    s2 = peg$currPos;
    s3 = peg$parseDropdownItem();
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      s3 = [s3, s4];
      s2 = s3;
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      s2 = peg$currPos;
      s3 = peg$parseDropdownItem();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s3 = [s3, s4];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    }
    peg$savedPos = s0;
    s1 = peg$f48(s1);
    s0 = s1;
    return s0;
  }
  function peg$parseDropdownItem() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c33) {
      s1 = peg$c33;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e33);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s5 = peg$parseAttributes();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f49(s3, s5);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7) === peg$c41) {
        s1 = peg$c41;
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e41);
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$f50();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseComment();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$f51();
        }
        s0 = s1;
      }
    }
    return s0;
  }
  function peg$parseNav() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c42) {
      s1 = peg$c42;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e42);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseArray();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f52(s3, s5);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseTabs() {
    let s0, s1, s2, s3, s4, s5, s6, s7;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c43) {
      s1 = peg$c43;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e43);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseArray();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      s5 = peg$parseAttributes();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      s6 = peg$parse_();
      s7 = peg$parseTabsBlock();
      if (s7 === peg$FAILED) {
        s7 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f53(s3, s5, s7);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseTabsBlock() {
    let s0, s1, s2, s3, s4, s5, s6;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 123) {
      s1 = peg$c1;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e1);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = [];
      s4 = peg$currPos;
      s5 = peg$parseTabItem();
      if (s5 !== peg$FAILED) {
        s6 = peg$parse_();
        s5 = [s5, s6];
        s4 = s5;
      } else {
        peg$currPos = s4;
        s4 = peg$FAILED;
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$currPos;
        s5 = peg$parseTabItem();
        if (s5 !== peg$FAILED) {
          s6 = peg$parse_();
          s5 = [s5, s6];
          s4 = s5;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
      }
      if (input.charCodeAt(peg$currPos) === 125) {
        s4 = peg$c2;
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e2);
        }
      }
      if (s4 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f54(s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseTabItem() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c44) {
      s1 = peg$c44;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e44);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseStringLiteral();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s5 = peg$parseAttributes();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        s6 = peg$parse_();
        if (input.charCodeAt(peg$currPos) === 123) {
          s7 = peg$c1;
          peg$currPos++;
        } else {
          s7 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e1);
          }
        }
        if (s7 !== peg$FAILED) {
          s8 = peg$parse_();
          s9 = peg$parseChildren();
          if (s9 !== peg$FAILED) {
            s10 = peg$parse_();
            if (input.charCodeAt(peg$currPos) === 125) {
              s11 = peg$c2;
              peg$currPos++;
            } else {
              s11 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e2);
              }
            }
            if (s11 !== peg$FAILED) {
              peg$savedPos = s0;
              s0 = peg$f55(s3, s5, s9);
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseComment();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$f56();
      }
      s0 = s1;
    }
    return s0;
  }
  function peg$parseBreadcrumb() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 10) === peg$c45) {
      s1 = peg$c45;
      peg$currPos += 10;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e45);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseArray();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s5 = peg$parseAttributes();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f57(s3, s5);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseDivider() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c41) {
      s1 = peg$c41;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e41);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseAttributes();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f58(s3);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseAttributes() {
    let s0, s1, s2;
    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parseAttribute();
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parseAttribute();
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f59(s1);
    }
    s0 = s1;
    return s0;
  }
  function peg$parseAttribute() {
    let s0, s1, s2, s3, s4, s5, s6, s7;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$parseAttributeName();
    if (s2 !== peg$FAILED) {
      s3 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 61) {
        s4 = peg$c46;
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e46);
        }
      }
      if (s4 !== peg$FAILED) {
        s5 = peg$parse_();
        s6 = peg$parseAttributeValue();
        if (s6 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f60(s2, s6);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parse_();
      s2 = peg$parseAttributeName();
      if (s2 !== peg$FAILED) {
        s3 = peg$currPos;
        peg$silentFails++;
        s4 = peg$currPos;
        s5 = peg$parse_();
        s6 = peg$parseChildKeyword();
        if (s6 === peg$FAILED) {
          s6 = peg$parseAttributeName();
          if (s6 === peg$FAILED) {
            s6 = input.charAt(peg$currPos);
            if (peg$r0.test(s6)) {
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e47);
              }
            }
            if (s6 === peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c47) {
                s6 = peg$c47;
                peg$currPos += 2;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e48);
                }
              }
              if (s6 === peg$FAILED) {
                if (input.substr(peg$currPos, 2) === peg$c48) {
                  s6 = peg$c48;
                  peg$currPos += 2;
                } else {
                  s6 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$e49);
                  }
                }
                if (s6 === peg$FAILED) {
                  s6 = peg$currPos;
                  peg$silentFails++;
                  if (input.length > peg$currPos) {
                    s7 = input.charAt(peg$currPos);
                    peg$currPos++;
                  } else {
                    s7 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$e50);
                    }
                  }
                  peg$silentFails--;
                  if (s7 === peg$FAILED) {
                    s6 = void 0;
                  } else {
                    peg$currPos = s6;
                    s6 = peg$FAILED;
                  }
                }
              }
            }
          }
        }
        if (s6 !== peg$FAILED) {
          s5 = [s5, s6];
          s4 = s5;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
        peg$silentFails--;
        if (s4 !== peg$FAILED) {
          peg$currPos = s3;
          s3 = void 0;
        } else {
          s3 = peg$FAILED;
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f61(s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }
    return s0;
  }
  function peg$parseAttributeName() {
    let s0, s1, s2;
    s0 = peg$currPos;
    s1 = peg$currPos;
    peg$silentFails++;
    s2 = peg$parseChildKeyword();
    peg$silentFails--;
    if (s2 === peg$FAILED) {
      s1 = void 0;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseIdentifier();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f62(s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseChildKeyword() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c0) {
      s1 = peg$c0;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e0);
      }
    }
    if (s1 === peg$FAILED) {
      if (input.substr(peg$currPos, 6) === peg$c3) {
        s1 = peg$c3;
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e3);
        }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c4) {
          s1 = peg$c4;
          peg$currPos += 4;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e4);
          }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 6) === peg$c5) {
            s1 = peg$c5;
            peg$currPos += 6;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e5);
            }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 7) === peg$c6) {
              s1 = peg$c6;
              peg$currPos += 7;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e6);
              }
            }
            if (s1 === peg$FAILED) {
              if (input.substr(peg$currPos, 3) === peg$c7) {
                s1 = peg$c7;
                peg$currPos += 3;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e7);
                }
              }
              if (s1 === peg$FAILED) {
                if (input.substr(peg$currPos, 3) === peg$c8) {
                  s1 = peg$c8;
                  peg$currPos += 3;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$e8);
                  }
                }
                if (s1 === peg$FAILED) {
                  if (input.substr(peg$currPos, 4) === peg$c9) {
                    s1 = peg$c9;
                    peg$currPos += 4;
                  } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$e9);
                    }
                  }
                  if (s1 === peg$FAILED) {
                    if (input.substr(peg$currPos, 5) === peg$c10) {
                      s1 = peg$c10;
                      peg$currPos += 5;
                    } else {
                      s1 = peg$FAILED;
                      if (peg$silentFails === 0) {
                        peg$fail(peg$e10);
                      }
                    }
                    if (s1 === peg$FAILED) {
                      if (input.substr(peg$currPos, 6) === peg$c11) {
                        s1 = peg$c11;
                        peg$currPos += 6;
                      } else {
                        s1 = peg$FAILED;
                        if (peg$silentFails === 0) {
                          peg$fail(peg$e11);
                        }
                      }
                      if (s1 === peg$FAILED) {
                        if (input.substr(peg$currPos, 9) === peg$c12) {
                          s1 = peg$c12;
                          peg$currPos += 9;
                        } else {
                          s1 = peg$FAILED;
                          if (peg$silentFails === 0) {
                            peg$fail(peg$e12);
                          }
                        }
                        if (s1 === peg$FAILED) {
                          if (input.substr(peg$currPos, 7) === peg$c13) {
                            s1 = peg$c13;
                            peg$currPos += 7;
                          } else {
                            s1 = peg$FAILED;
                            if (peg$silentFails === 0) {
                              peg$fail(peg$e13);
                            }
                          }
                          if (s1 === peg$FAILED) {
                            if (input.substr(peg$currPos, 4) === peg$c14) {
                              s1 = peg$c14;
                              peg$currPos += 4;
                            } else {
                              s1 = peg$FAILED;
                              if (peg$silentFails === 0) {
                                peg$fail(peg$e14);
                              }
                            }
                            if (s1 === peg$FAILED) {
                              if (input.substr(peg$currPos, 4) === peg$c16) {
                                s1 = peg$c16;
                                peg$currPos += 4;
                              } else {
                                s1 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                  peg$fail(peg$e16);
                                }
                              }
                              if (s1 === peg$FAILED) {
                                if (input.substr(peg$currPos, 6) === peg$c17) {
                                  s1 = peg$c17;
                                  peg$currPos += 6;
                                } else {
                                  s1 = peg$FAILED;
                                  if (peg$silentFails === 0) {
                                    peg$fail(peg$e17);
                                  }
                                }
                                if (s1 === peg$FAILED) {
                                  if (input.substr(peg$currPos, 5) === peg$c18) {
                                    s1 = peg$c18;
                                    peg$currPos += 5;
                                  } else {
                                    s1 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                      peg$fail(peg$e18);
                                    }
                                  }
                                  if (s1 === peg$FAILED) {
                                    if (input.substr(peg$currPos, 8) === peg$c19) {
                                      s1 = peg$c19;
                                      peg$currPos += 8;
                                    } else {
                                      s1 = peg$FAILED;
                                      if (peg$silentFails === 0) {
                                        peg$fail(peg$e19);
                                      }
                                    }
                                    if (s1 === peg$FAILED) {
                                      if (input.substr(peg$currPos, 6) === peg$c20) {
                                        s1 = peg$c20;
                                        peg$currPos += 6;
                                      } else {
                                        s1 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                          peg$fail(peg$e20);
                                        }
                                      }
                                      if (s1 === peg$FAILED) {
                                        if (input.substr(peg$currPos, 8) === peg$c21) {
                                          s1 = peg$c21;
                                          peg$currPos += 8;
                                        } else {
                                          s1 = peg$FAILED;
                                          if (peg$silentFails === 0) {
                                            peg$fail(peg$e21);
                                          }
                                        }
                                        if (s1 === peg$FAILED) {
                                          if (input.substr(peg$currPos, 5) === peg$c22) {
                                            s1 = peg$c22;
                                            peg$currPos += 5;
                                          } else {
                                            s1 = peg$FAILED;
                                            if (peg$silentFails === 0) {
                                              peg$fail(peg$e22);
                                            }
                                          }
                                          if (s1 === peg$FAILED) {
                                            if (input.substr(peg$currPos, 6) === peg$c23) {
                                              s1 = peg$c23;
                                              peg$currPos += 6;
                                            } else {
                                              s1 = peg$FAILED;
                                              if (peg$silentFails === 0) {
                                                peg$fail(peg$e23);
                                              }
                                            }
                                            if (s1 === peg$FAILED) {
                                              if (input.substr(peg$currPos, 6) === peg$c24) {
                                                s1 = peg$c24;
                                                peg$currPos += 6;
                                              } else {
                                                s1 = peg$FAILED;
                                                if (peg$silentFails === 0) {
                                                  peg$fail(peg$e24);
                                                }
                                              }
                                              if (s1 === peg$FAILED) {
                                                if (input.substr(peg$currPos, 5) === peg$c25) {
                                                  s1 = peg$c25;
                                                  peg$currPos += 5;
                                                } else {
                                                  s1 = peg$FAILED;
                                                  if (peg$silentFails === 0) {
                                                    peg$fail(peg$e25);
                                                  }
                                                }
                                                if (s1 === peg$FAILED) {
                                                  if (input.substr(peg$currPos, 6) === peg$c27) {
                                                    s1 = peg$c27;
                                                    peg$currPos += 6;
                                                  } else {
                                                    s1 = peg$FAILED;
                                                    if (peg$silentFails === 0) {
                                                      peg$fail(peg$e27);
                                                    }
                                                  }
                                                  if (s1 === peg$FAILED) {
                                                    if (input.substr(peg$currPos, 5) === peg$c28) {
                                                      s1 = peg$c28;
                                                      peg$currPos += 5;
                                                    } else {
                                                      s1 = peg$FAILED;
                                                      if (peg$silentFails === 0) {
                                                        peg$fail(peg$e28);
                                                      }
                                                    }
                                                    if (s1 === peg$FAILED) {
                                                      if (input.substr(peg$currPos, 5) === peg$c30) {
                                                        s1 = peg$c30;
                                                        peg$currPos += 5;
                                                      } else {
                                                        s1 = peg$FAILED;
                                                        if (peg$silentFails === 0) {
                                                          peg$fail(peg$e30);
                                                        }
                                                      }
                                                      if (s1 === peg$FAILED) {
                                                        if (input.substr(peg$currPos, 7) === peg$c31) {
                                                          s1 = peg$c31;
                                                          peg$currPos += 7;
                                                        } else {
                                                          s1 = peg$FAILED;
                                                          if (peg$silentFails === 0) {
                                                            peg$fail(peg$e31);
                                                          }
                                                        }
                                                        if (s1 === peg$FAILED) {
                                                          if (input.substr(peg$currPos, 4) === peg$c32) {
                                                            s1 = peg$c32;
                                                            peg$currPos += 4;
                                                          } else {
                                                            s1 = peg$FAILED;
                                                            if (peg$silentFails === 0) {
                                                              peg$fail(peg$e32);
                                                            }
                                                          }
                                                          if (s1 === peg$FAILED) {
                                                            if (input.substr(peg$currPos, 4) === peg$c33) {
                                                              s1 = peg$c33;
                                                              peg$currPos += 4;
                                                            } else {
                                                              s1 = peg$FAILED;
                                                              if (peg$silentFails === 0) {
                                                                peg$fail(peg$e33);
                                                              }
                                                            }
                                                            if (s1 === peg$FAILED) {
                                                              if (input.substr(peg$currPos, 5) === peg$c34) {
                                                                s1 = peg$c34;
                                                                peg$currPos += 5;
                                                              } else {
                                                                s1 = peg$FAILED;
                                                                if (peg$silentFails === 0) {
                                                                  peg$fail(peg$e34);
                                                                }
                                                              }
                                                              if (s1 === peg$FAILED) {
                                                                if (input.substr(peg$currPos, 5) === peg$c35) {
                                                                  s1 = peg$c35;
                                                                  peg$currPos += 5;
                                                                } else {
                                                                  s1 = peg$FAILED;
                                                                  if (peg$silentFails === 0) {
                                                                    peg$fail(peg$e35);
                                                                  }
                                                                }
                                                                if (s1 === peg$FAILED) {
                                                                  if (input.substr(peg$currPos, 8) === peg$c36) {
                                                                    s1 = peg$c36;
                                                                    peg$currPos += 8;
                                                                  } else {
                                                                    s1 = peg$FAILED;
                                                                    if (peg$silentFails === 0) {
                                                                      peg$fail(peg$e36);
                                                                    }
                                                                  }
                                                                  if (s1 === peg$FAILED) {
                                                                    if (input.substr(peg$currPos, 7) === peg$c37) {
                                                                      s1 = peg$c37;
                                                                      peg$currPos += 7;
                                                                    } else {
                                                                      s1 = peg$FAILED;
                                                                      if (peg$silentFails === 0) {
                                                                        peg$fail(peg$e37);
                                                                      }
                                                                    }
                                                                    if (s1 === peg$FAILED) {
                                                                      if (input.substr(peg$currPos, 7) === peg$c38) {
                                                                        s1 = peg$c38;
                                                                        peg$currPos += 7;
                                                                      } else {
                                                                        s1 = peg$FAILED;
                                                                        if (peg$silentFails === 0) {
                                                                          peg$fail(peg$e38);
                                                                        }
                                                                      }
                                                                      if (s1 === peg$FAILED) {
                                                                        if (input.substr(peg$currPos, 7) === peg$c39) {
                                                                          s1 = peg$c39;
                                                                          peg$currPos += 7;
                                                                        } else {
                                                                          s1 = peg$FAILED;
                                                                          if (peg$silentFails === 0) {
                                                                            peg$fail(peg$e39);
                                                                          }
                                                                        }
                                                                        if (s1 === peg$FAILED) {
                                                                          if (input.substr(peg$currPos, 8) === peg$c40) {
                                                                            s1 = peg$c40;
                                                                            peg$currPos += 8;
                                                                          } else {
                                                                            s1 = peg$FAILED;
                                                                            if (peg$silentFails === 0) {
                                                                              peg$fail(peg$e40);
                                                                            }
                                                                          }
                                                                          if (s1 === peg$FAILED) {
                                                                            if (input.substr(peg$currPos, 7) === peg$c41) {
                                                                              s1 = peg$c41;
                                                                              peg$currPos += 7;
                                                                            } else {
                                                                              s1 = peg$FAILED;
                                                                              if (peg$silentFails === 0) {
                                                                                peg$fail(peg$e41);
                                                                              }
                                                                            }
                                                                            if (s1 === peg$FAILED) {
                                                                              if (input.substr(peg$currPos, 3) === peg$c42) {
                                                                                s1 = peg$c42;
                                                                                peg$currPos += 3;
                                                                              } else {
                                                                                s1 = peg$FAILED;
                                                                                if (peg$silentFails === 0) {
                                                                                  peg$fail(peg$e42);
                                                                                }
                                                                              }
                                                                              if (s1 === peg$FAILED) {
                                                                                if (input.substr(peg$currPos, 4) === peg$c43) {
                                                                                  s1 = peg$c43;
                                                                                  peg$currPos += 4;
                                                                                } else {
                                                                                  s1 = peg$FAILED;
                                                                                  if (peg$silentFails === 0) {
                                                                                    peg$fail(peg$e43);
                                                                                  }
                                                                                }
                                                                                if (s1 === peg$FAILED) {
                                                                                  if (input.substr(peg$currPos, 3) === peg$c44) {
                                                                                    s1 = peg$c44;
                                                                                    peg$currPos += 3;
                                                                                  } else {
                                                                                    s1 = peg$FAILED;
                                                                                    if (peg$silentFails === 0) {
                                                                                      peg$fail(peg$e44);
                                                                                    }
                                                                                  }
                                                                                  if (s1 === peg$FAILED) {
                                                                                    if (input.substr(peg$currPos, 10) === peg$c45) {
                                                                                      s1 = peg$c45;
                                                                                      peg$currPos += 10;
                                                                                    } else {
                                                                                      s1 = peg$FAILED;
                                                                                      if (peg$silentFails === 0) {
                                                                                        peg$fail(peg$e45);
                                                                                      }
                                                                                    }
                                                                                  }
                                                                                }
                                                                              }
                                                                            }
                                                                          }
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      peg$silentFails++;
      s3 = peg$parseIdentifierChar();
      peg$silentFails--;
      if (s3 === peg$FAILED) {
        s2 = void 0;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseIdentifierChar() {
    let s0;
    s0 = input.charAt(peg$currPos);
    if (peg$r1.test(s0)) {
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e51);
      }
    }
    return s0;
  }
  function peg$parseAttributeValue() {
    let s0;
    s0 = peg$parseStringLiteral();
    if (s0 === peg$FAILED) {
      s0 = peg$parseValueWithUnit();
      if (s0 === peg$FAILED) {
        s0 = peg$parseNumber();
        if (s0 === peg$FAILED) {
          s0 = peg$parseBoolean();
          if (s0 === peg$FAILED) {
            s0 = peg$parseIdentifier();
            if (s0 === peg$FAILED) {
              s0 = peg$parseArray();
              if (s0 === peg$FAILED) {
                s0 = peg$parseObject();
              }
            }
          }
        }
      }
    }
    return s0;
  }
  function peg$parseStringLiteral() {
    let s0, s1, s2, s3;
    peg$silentFails++;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 34) {
      s1 = peg$c49;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e53);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parseDoubleStringChar();
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parseDoubleStringChar();
      }
      if (input.charCodeAt(peg$currPos) === 34) {
        s3 = peg$c49;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e53);
        }
      }
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f63(s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 39) {
        s1 = peg$c50;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e54);
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseSingleStringChar();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseSingleStringChar();
        }
        if (input.charCodeAt(peg$currPos) === 39) {
          s3 = peg$c50;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e54);
          }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f64(s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e52);
      }
    }
    return s0;
  }
  function peg$parseDoubleStringChar() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    s1 = peg$currPos;
    peg$silentFails++;
    if (input.charCodeAt(peg$currPos) === 34) {
      s2 = peg$c49;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e53);
      }
    }
    peg$silentFails--;
    if (s2 === peg$FAILED) {
      s1 = void 0;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      peg$silentFails++;
      if (input.charCodeAt(peg$currPos) === 92) {
        s3 = peg$c51;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e55);
        }
      }
      peg$silentFails--;
      if (s3 === peg$FAILED) {
        s2 = void 0;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        if (input.length > peg$currPos) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e50);
          }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f65(s3);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 92) {
        s1 = peg$c51;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e55);
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseEscapeSequence();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f66(s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }
    return s0;
  }
  function peg$parseSingleStringChar() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    s1 = peg$currPos;
    peg$silentFails++;
    if (input.charCodeAt(peg$currPos) === 39) {
      s2 = peg$c50;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e54);
      }
    }
    peg$silentFails--;
    if (s2 === peg$FAILED) {
      s1 = void 0;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      peg$silentFails++;
      if (input.charCodeAt(peg$currPos) === 92) {
        s3 = peg$c51;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e55);
        }
      }
      peg$silentFails--;
      if (s3 === peg$FAILED) {
        s2 = void 0;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        if (input.length > peg$currPos) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e50);
          }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f67(s3);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 92) {
        s1 = peg$c51;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e55);
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseEscapeSequence();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f68(s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }
    return s0;
  }
  function peg$parseEscapeSequence() {
    let s0, s1;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 110) {
      s1 = peg$c52;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e56);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f69();
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 114) {
        s1 = peg$c53;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e57);
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$f70();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 116) {
          s1 = peg$c54;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e58);
          }
        }
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$f71();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 92) {
            s1 = peg$c51;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e55);
            }
          }
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f72();
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 34) {
              s1 = peg$c49;
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e53);
              }
            }
            if (s1 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$f73();
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.charCodeAt(peg$currPos) === 39) {
                s1 = peg$c50;
                peg$currPos++;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e54);
                }
              }
              if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$f74();
              }
              s0 = s1;
            }
          }
        }
      }
    }
    return s0;
  }
  function peg$parseNumber() {
    let s0, s1, s2, s3, s4, s5, s6;
    peg$silentFails++;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 45) {
      s1 = peg$c55;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e60);
      }
    }
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    s2 = [];
    s3 = input.charAt(peg$currPos);
    if (peg$r2.test(s3)) {
      peg$currPos++;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e61);
      }
    }
    if (s3 !== peg$FAILED) {
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = input.charAt(peg$currPos);
        if (peg$r2.test(s3)) {
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e61);
          }
        }
      }
    } else {
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 46) {
        s4 = peg$c56;
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e62);
        }
      }
      if (s4 !== peg$FAILED) {
        s5 = [];
        s6 = input.charAt(peg$currPos);
        if (peg$r2.test(s6)) {
          peg$currPos++;
        } else {
          s6 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e61);
          }
        }
        if (s6 !== peg$FAILED) {
          while (s6 !== peg$FAILED) {
            s5.push(s6);
            s6 = input.charAt(peg$currPos);
            if (peg$r2.test(s6)) {
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e61);
              }
            }
          }
        } else {
          s5 = peg$FAILED;
        }
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f75(s1, s2, s3);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e59);
      }
    }
    return s0;
  }
  function peg$parseValueWithUnit() {
    let s0, s1, s2, s3, s4, s5, s6;
    peg$silentFails++;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 45) {
      s1 = peg$c55;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e60);
      }
    }
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    s2 = [];
    s3 = input.charAt(peg$currPos);
    if (peg$r2.test(s3)) {
      peg$currPos++;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e61);
      }
    }
    if (s3 !== peg$FAILED) {
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = input.charAt(peg$currPos);
        if (peg$r2.test(s3)) {
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e61);
          }
        }
      }
    } else {
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 46) {
        s4 = peg$c56;
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e62);
        }
      }
      if (s4 !== peg$FAILED) {
        s5 = [];
        s6 = input.charAt(peg$currPos);
        if (peg$r2.test(s6)) {
          peg$currPos++;
        } else {
          s6 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e61);
          }
        }
        if (s6 !== peg$FAILED) {
          while (s6 !== peg$FAILED) {
            s5.push(s6);
            s6 = input.charAt(peg$currPos);
            if (peg$r2.test(s6)) {
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e61);
              }
            }
          }
        } else {
          s5 = peg$FAILED;
        }
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      if (input.substr(peg$currPos, 2) === peg$c57) {
        s4 = peg$c57;
        peg$currPos += 2;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e64);
        }
      }
      if (s4 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 37) {
          s4 = peg$c58;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e65);
          }
        }
        if (s4 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c59) {
            s4 = peg$c59;
            peg$currPos += 2;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e66);
            }
          }
          if (s4 === peg$FAILED) {
            if (input.substr(peg$currPos, 3) === peg$c60) {
              s4 = peg$c60;
              peg$currPos += 3;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e67);
              }
            }
            if (s4 === peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c61) {
                s4 = peg$c61;
                peg$currPos += 2;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e68);
                }
              }
              if (s4 === peg$FAILED) {
                if (input.substr(peg$currPos, 2) === peg$c62) {
                  s4 = peg$c62;
                  peg$currPos += 2;
                } else {
                  s4 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$e69);
                  }
                }
              }
            }
          }
        }
      }
      if (s4 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f76(s1, s2, s3, s4);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e63);
      }
    }
    return s0;
  }
  function peg$parseBoolean() {
    let s0, s1;
    peg$silentFails++;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c63) {
      s1 = peg$c63;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e71);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f77();
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5) === peg$c64) {
        s1 = peg$c64;
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e72);
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$f78();
      }
      s0 = s1;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e70);
      }
    }
    return s0;
  }
  function peg$parseIdentifier() {
    let s0, s1, s2, s3;
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = input.charAt(peg$currPos);
    if (peg$r3.test(s1)) {
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e74);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = input.charAt(peg$currPos);
      if (peg$r1.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e51);
        }
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = input.charAt(peg$currPos);
        if (peg$r1.test(s3)) {
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e51);
          }
        }
      }
      peg$savedPos = s0;
      s0 = peg$f79(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e73);
      }
    }
    return s0;
  }
  function peg$parseArray() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 91) {
      s1 = peg$c65;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e75);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseArrayItems();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 93) {
        s5 = peg$c66;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e76);
        }
      }
      if (s5 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f80(s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseArrayItems() {
    let s0, s1, s2, s3, s4, s5, s6, s7;
    s0 = peg$currPos;
    s1 = peg$parseArrayItem();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 44) {
        s5 = peg$c67;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e77);
        }
      }
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      s6 = peg$parse_();
      s7 = peg$parseArrayItem();
      if (s7 !== peg$FAILED) {
        s4 = [s4, s5, s6, s7];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parse_();
        if (input.charCodeAt(peg$currPos) === 44) {
          s5 = peg$c67;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e77);
          }
        }
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        s6 = peg$parse_();
        s7 = peg$parseArrayItem();
        if (s7 !== peg$FAILED) {
          s4 = [s4, s5, s6, s7];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      s3 = peg$currPos;
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 44) {
        s5 = peg$c67;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e77);
        }
      }
      if (s5 !== peg$FAILED) {
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f81(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseArrayItem() {
    let s0;
    s0 = peg$parseStringLiteral();
    if (s0 === peg$FAILED) {
      s0 = peg$parseNumber();
      if (s0 === peg$FAILED) {
        s0 = peg$parseBoolean();
        if (s0 === peg$FAILED) {
          s0 = peg$parseObject();
          if (s0 === peg$FAILED) {
            s0 = peg$parseIdentifier();
          }
        }
      }
    }
    return s0;
  }
  function peg$parseObject() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 123) {
      s1 = peg$c1;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e1);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseObjectProperties();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 125) {
        s5 = peg$c2;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e2);
        }
      }
      if (s5 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f82(s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseObjectProperties() {
    let s0, s1, s2, s3, s4, s5, s6, s7;
    s0 = peg$currPos;
    s1 = peg$parseObjectProperty();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 44) {
        s5 = peg$c67;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e77);
        }
      }
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      s6 = peg$parse_();
      s7 = peg$parseObjectProperty();
      if (s7 !== peg$FAILED) {
        s4 = [s4, s5, s6, s7];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parse_();
        if (input.charCodeAt(peg$currPos) === 44) {
          s5 = peg$c67;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e77);
          }
        }
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        s6 = peg$parse_();
        s7 = peg$parseObjectProperty();
        if (s7 !== peg$FAILED) {
          s4 = [s4, s5, s6, s7];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f83(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseObjectProperty() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parseIdentifier();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 61) {
        s3 = peg$c46;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e46);
        }
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s5 = peg$parseAttributeValue();
        if (s5 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f84(s1, s5);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseIdentifier();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$f85(s1);
      }
      s0 = s1;
    }
    return s0;
  }
  function peg$parse_() {
    let s0, s1;
    peg$silentFails++;
    s0 = [];
    s1 = peg$parseWhitespace();
    if (s1 === peg$FAILED) {
      s1 = peg$parseComment();
    }
    while (s1 !== peg$FAILED) {
      s0.push(s1);
      s1 = peg$parseWhitespace();
      if (s1 === peg$FAILED) {
        s1 = peg$parseComment();
      }
    }
    peg$silentFails--;
    return s0;
  }
  function peg$parseWhitespace() {
    let s0, s1;
    s0 = [];
    s1 = input.charAt(peg$currPos);
    if (peg$r4.test(s1)) {
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e78);
      }
    }
    if (s1 !== peg$FAILED) {
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = input.charAt(peg$currPos);
        if (peg$r4.test(s1)) {
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e78);
          }
        }
      }
    } else {
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseComment() {
    let s0, s1;
    peg$silentFails++;
    s0 = peg$parseLineComment();
    if (s0 === peg$FAILED) {
      s0 = peg$parseBlockComment();
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e79);
      }
    }
    return s0;
  }
  function peg$parseLineComment() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c47) {
      s1 = peg$c47;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e48);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = input.charAt(peg$currPos);
      if (peg$r5.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e80);
        }
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = input.charAt(peg$currPos);
        if (peg$r5.test(s3)) {
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e80);
          }
        }
      }
      if (input.charCodeAt(peg$currPos) === 10) {
        s3 = peg$c68;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e81);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = peg$currPos;
        peg$silentFails++;
        if (input.length > peg$currPos) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e50);
          }
        }
        peg$silentFails--;
        if (s4 === peg$FAILED) {
          s3 = void 0;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (s3 !== peg$FAILED) {
        s1 = [s1, s2, s3];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseBlockComment() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c48) {
      s1 = peg$c48;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e49);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$currPos;
      peg$silentFails++;
      if (input.substr(peg$currPos, 2) === peg$c69) {
        s5 = peg$c69;
        peg$currPos += 2;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e82);
        }
      }
      peg$silentFails--;
      if (s5 === peg$FAILED) {
        s4 = void 0;
      } else {
        peg$currPos = s4;
        s4 = peg$FAILED;
      }
      if (s4 !== peg$FAILED) {
        if (input.length > peg$currPos) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e50);
          }
        }
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c69) {
          s5 = peg$c69;
          peg$currPos += 2;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e82);
          }
        }
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = void 0;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e50);
            }
          }
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (input.substr(peg$currPos, 2) === peg$c69) {
        s3 = peg$c69;
        peg$currPos += 2;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e82);
        }
      }
      if (s3 !== peg$FAILED) {
        s1 = [s1, s2, s3];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function createNode(type, props = {}) {
    return {
      type,
      ...props,
      loc: location()
    };
  }
  function attrsToObject(attrs, renameType = false) {
    if (!attrs || attrs.length === 0) return {};
    const result = {};
    for (const attr of attrs) {
      if (renameType && attr.name === "type") {
        result.inputType = attr.value;
      } else {
        result[attr.name] = attr.value;
      }
    }
    return result;
  }
  peg$result = peg$startRuleFunction();
  const peg$success = peg$result !== peg$FAILED && peg$currPos === input.length;
  function peg$throw() {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }
    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? peg$getUnicode(peg$maxFailPos) : null,
      peg$maxFailPos < input.length ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1) : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
    );
  }
  if (options.peg$library) {
    return (
      /** @type {any} */
      {
        peg$result,
        peg$currPos,
        peg$FAILED,
        peg$maxFailExpected,
        peg$maxFailPos,
        peg$success,
        peg$throw: peg$success ? void 0 : peg$throw
      }
    );
  }
  if (peg$success) {
    return peg$result;
  } else {
    peg$throw();
  }
}

// src/parser/index.ts
function parse(source, options) {
  try {
    return peg$parse(source, options);
  } catch (error) {
    throw enhanceError(error);
  }
}
function tryParse(source, options) {
  try {
    const document = parse(source, options);
    return { success: true, document, errors: [] };
  } catch (error) {
    const parseError = error;
    return {
      success: false,
      document: null,
      errors: [
        {
          message: parseError.message,
          location: parseError.location ? {
            line: parseError.location.start.line,
            column: parseError.location.start.column,
            offset: parseError.location.start.offset
          } : null,
          expected: parseError.expected?.map((e) => e.description || e.text || String(e)),
          found: parseError.found
        }
      ]
    };
  }
}
function enhanceError(error) {
  if (error && typeof error === "object" && "location" in error) {
    const pegError = error;
    const enhanced = new Error(formatErrorMessage(pegError));
    enhanced.name = "ParseError";
    enhanced.location = pegError.location;
    enhanced.expected = pegError.expected || [];
    enhanced.found = pegError.found;
    return enhanced;
  }
  throw error;
}
function formatErrorMessage(error) {
  const { location, expected, found } = error;
  const line = location?.start?.line ?? "?";
  const column = location?.start?.column ?? "?";
  let expectedDesc = "something";
  if (expected && expected.length > 0) {
    const descriptions = expected.map((e) => e.description || e.text || String(e)).filter((d, i, arr) => arr.indexOf(d) === i).slice(0, 5);
    if (descriptions.length === 1) {
      expectedDesc = descriptions[0];
    } else if (descriptions.length === 2) {
      expectedDesc = `${descriptions[0]} or ${descriptions[1]}`;
    } else {
      const last = descriptions.pop();
      expectedDesc = `${descriptions.join(", ")}, or ${last}`;
    }
    if (expected.length > 5) {
      expectedDesc += ` (and ${expected.length - 5} more)`;
    }
  }
  const foundDesc = found === null ? "end of input" : `"${escapeString(found)}"`;
  return `Syntax error at line ${line}, column ${column}: Expected ${expectedDesc} but found ${foundDesc}`;
}
function escapeString(str) {
  return str.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t").replace(/"/g, '\\"');
}
function isValid(source) {
  try {
    parse(source);
    return true;
  } catch {
    return false;
  }
}
function getErrors(source) {
  const result = tryParse(source);
  return result.errors;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getErrors,
  isValid,
  parse,
  tryParse
});
//# sourceMappingURL=parser.cjs.map
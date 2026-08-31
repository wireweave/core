/**
 * The inline runtime shipped inside a `renderSite` document.
 *
 * A wireframe's declared intent — `navigate` / `opens` / `toggles` / `action` —
 * reaches the markup as four `data-*` attributes. This is the script that acts
 * on them. It is emitted into the one document `renderSite` produces, has no
 * dependencies of any kind, and is the only JavaScript in the output.
 *
 * ## What it is not
 *
 * It is not a router and keeps no history stack. `navigate` shows a screen and
 * rewrites the fragment; that is all. Going back is an authored intent
 * (`action="back"`), not something the runtime infers from a sequence of
 * clicks — a wireframe describes screens and the moves between them, and a
 * synthetic back button that appears on every screen is a move nobody drew.
 *
 * ## Two scopes, two lookups
 *
 * `navigate` addresses a **page inside the document**; `opens` / `toggles`
 * address an **overlay inside a page**. They are resolved by two separate
 * lookups, deliberately: screens come from the registry below, overlays are
 * found by querying inside the active screen's own subtree. The same string can
 * therefore name a screen and an overlay without either shadowing the other,
 * and no unified table exists for the two to collide in.
 *
 * ## Ambiguity
 *
 * Screen resolution is total and first-wins, matching the model that built the
 * registry: an unknown target leaves the element alone (an anchor keeps its
 * default, a button does nothing) rather than throwing, so one bad reference
 * cannot take the whole prototype down. Reporting the bad reference belongs to
 * `validation/`, which can name a source location.
 *
 * ## Judgments this script does not make
 *
 * Whether a `navigate` target is a URL or a page name is decided at render time
 * and arrives as `EXTERNAL_NAVIGATE_ATTR`. Nothing below re-reads the string's
 * shape. The rule has one home (`interaction/target.ts`), one caller in the
 * renderer, and here only a consumer.
 */

import type { StateDeclaration } from '../../ast'
import type { InteractionDiagnostic, NormalizedInteractionHandler } from '../../interaction/model'
import {
  ENABLED_GUARD_ATTR,
  EXTERNAL_NAVIGATE_ATTR,
  INERT_HREF,
  INTERACTIVE_ATTR_NAMES,
  TYPED_INTERACTION_ATTR,
  VARIANT_SCOPE_ATTR,
  VISIBLE_GUARD_ATTR,
} from '../html/interactive'

/**
 * The attribute a screen host or a shell publishes its id scope under.
 *
 * Part of the same document ↔ script contract as {@link SiteRuntimeRegistry},
 * and declared here for that reason: the script is the reader, and a name only
 * has to be agreed once for the writer to satisfy it. The renderer imports it.
 */
export const ID_SCOPE_ATTR = 'data-id-scope'

/** Everything the runtime needs about the document it was emitted into. */
export interface SiteRuntimeRegistry {
  /** Every addressable name → screen index, as `buildSiteModel` resolved it. */
  names: Record<string, number>
  /** Screen index → the fragment that addresses it. */
  fragments: string[]
  /** Screen shown when the fragment selects none. */
  entry: number
  /** Typed initial state in deterministic declaration order. */
  states: StateDeclaration[]
  /** Each distinct normalized handler, interned once for the whole document. */
  handlers: NormalizedInteractionHandler[]
  /** Screen index → handler ids declared by that screen's content. */
  screenHandlers: Record<string, number[]>
  /** Layout name → handler ids declared by that shared shell's chrome. */
  shellHandlers: Record<string, number[]>
  /** Static authoring/runtime diagnostics generated from that source. */
  diagnostics: InteractionDiagnostic[]
}

const [NAVIGATE_ATTR, OPENS_ATTR, TOGGLES_ATTR, ACTION_ATTR] = INTERACTIVE_ATTR_NAMES

/**
 * Serialise a value for embedding in a `<script>` block.
 *
 * `</script>` inside a JavaScript string literal still closes the element — the
 * HTML tokeniser never looks inside the script's syntax — so the sequence is
 * escaped out of existence. `<!--` gets the same treatment for the same reason.
 */
function embedJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003C')
}

/**
 * The runtime source, with the document's registry and class prefix baked in.
 *
 * Written as ES5 in an IIFE: the output is a file a reviewer opens directly
 * from disk, sometimes in whatever browser a stakeholder happens to have, and a
 * prototype that fails to parse is worth less than one that looks dated.
 */
export function siteRuntime(registry: SiteRuntimeRegistry, prefix: string): string {
  return `(function () {
  'use strict';
  var P = ${embedJson(prefix)};
  var R = ${embedJson(registry)};
  var ON = P + '-on';
  var CLOSED = P + '-closed';
  var NAV_ACTIVE = P + '-nav-link-active';
  var site = document.querySelector('.' + P + '-site');
  if (!site) return;

  var screens = {};
  var order = [];
  var shellOf = {};
  var hosts = site.querySelectorAll('[data-screen]');
  for (var i = 0; i < hosts.length; i++) {
    var key = hosts[i].getAttribute('data-screen');
    // First-wins: two pages can share a name, and the model already decided
    // which one that name resolves to. The DOM must not disagree with it.
    if (!Object.prototype.hasOwnProperty.call(screens, key)) {
      screens[key] = hosts[i];
      order.push(key);
      shellOf[key] = shellFor(hosts[i]);
    }
  }
  var shells = site.querySelectorAll('.' + P + '-shell');
  var state = {};
  var initial = {};
  var stateTypes = {};
  for (var st = 0; st < R.states.length; st++) {
    var declaration = R.states[st];
    state[declaration.name] = declaration.initial;
    initial[declaration.name] = declaration.initial;
    stateTypes[declaration.name] = declaration.valueType;
  }

  function diagnostic(code, detail) {
    site.setAttribute('data-wf-runtime-diagnostic', code + ':' + detail);
  }

  function hasState(name) {
    return Object.prototype.hasOwnProperty.call(state, name);
  }

  function guardPasses(guard) {
    return !guard || (hasState(guard.state) && state[guard.state] === guard.equals);
  }

  function valueMatches(name, value) {
    return hasState(name) && typeof value === stateTypes[name];
  }

  function parseJson(value, fallback) {
    if (!value) return fallback;
    try {
      return JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  }

  function handlerId(signature) {
    for (var i = 0; i < R.handlers.length; i++) {
      if (JSON.stringify(R.handlers[i]) === signature) return i;
    }
    return -1;
  }

  function contains(ids, id) {
    for (var i = 0; i < ids.length; i++) if (ids[i] === id) return true;
    return false;
  }

  function shellHandlersFor(key) {
    var shell = shellOf[key];
    if (!shell) return [];
    return R.shellHandlers[shell.getAttribute('data-layout')] || [];
  }

  function interactionFor(key, element, signature) {
    var id = handlerId(signature);
    if (id < 0) return null;
    var ids = isChrome(element) ? shellHandlersFor(key) : R.screenHandlers[String(key)] || [];
    return contains(ids, id) ? R.handlers[id] : null;
  }

  function routeAllowed(key, target) {
    var groups = [R.screenHandlers[String(key)] || [], shellHandlersFor(key)];
    for (var i = 0; i < groups.length; i++) {
      for (var j = 0; j < groups[i].length; j++) {
        var handler = R.handlers[groups[i][j]];
        if (!handler || !guardPasses(handler.guard)) continue;
        for (var e = 0; e < handler.effects.length; e++) {
          var effect = handler.effects[e];
          if (effect.kind === 'navigate' && effect.target === target) return true;
        }
      }
    }
    return false;
  }

  /** The shell a screen is hosted in, or null when it stands alone. */
  function shellFor(node) {
    var el = node.parentNode;
    while (el && el !== site) {
      if (el.classList && el.classList.contains(P + '-shell')) return el;
      el = el.parentNode;
    }
    return null;
  }

  /** True for an element that belongs to a shell's own chrome, not to a screen. */
  function isChrome(el) {
    return !(el.closest && el.closest('[data-screen]'));
  }

  /**
   * The id prefix a container namespaces its contents under.
   *
   * Read from the document rather than rebuilt from the scheme that produced
   * it: the renderer decides how scopes are spelled, and a second spelling in
   * here could disagree with the first without anything noticing.
   */
  function scopeOf(el) {
    return (el && el.getAttribute(${embedJson(ID_SCOPE_ATTR)})) || '';
  }

  /** Match one id exactly, whatever characters an author put in it. */
  function idSelector(id) {
    return '[id="' + String(id).replace(/["\\\\]/g, '\\\\$&') + '"]';
  }

  /** Screen key for a navigate target or a fragment, or null. */
  function resolve(target) {
    if (target === null || target === undefined) return null;
    var name = String(target).trim();
    if (name === '') return null;
    if (Object.prototype.hasOwnProperty.call(R.names, name)) return String(R.names[name]);
    return Object.prototype.hasOwnProperty.call(screens, name) ? name : null;
  }

  /**
   * The overlay an intent addresses, from the point of view of one screen.
   *
   * An overlay id is scoped to the thing that declares it, and composition gives
   * a screen two declaring contexts: the page itself, and the shell it is hosted
   * in. A \`drawer\` written into a layout belongs to every screen that uses that
   * layout, so the screen is searched first and its shell second — nearest
   * declaration wins, and a page can shadow a shell's overlay with its own.
   *
   * The shell is searched for chrome only. Its hosted screens are descendants of
   * it, so an unfiltered query there would let one screen's trigger reach into
   * another screen that happens to reuse the id.
   *
   * The two searches use two different selectors, because the two contexts
   * namespace their ids separately: the authored name is composed with the
   * scope each container publishes. The trigger's attribute is never rewritten
   * — \`opens="confirm"\` means the \`confirm\` its author could see, and which
   * element that is depends on where the search is standing.
   */
  function overlayFor(key, id) {
    if (!id) return null;

    var screen = screens[key];
    if (screen) {
      var own = screen.querySelector(idSelector(scopeOf(screen) + id));
      if (own) return own;
    }

    var shell = shellOf[key];
    if (shell) {
      var candidates = shell.querySelectorAll(idSelector(scopeOf(shell) + id));
      for (var i = 0; i < candidates.length; i++) {
        if (isChrome(candidates[i])) return candidates[i];
      }
    }
    return null;
  }

  /** Every element that opens or toggles something, from one screen's view. */
  function triggersFor(key) {
    var selector = '[' + ${embedJson(OPENS_ATTR)} + '],[' + ${embedJson(TOGGLES_ATTR)} + ']';
    var found = [];
    var i;

    var screen = screens[key];
    if (screen) {
      var own = screen.querySelectorAll(selector);
      for (i = 0; i < own.length; i++) found.push(own[i]);
    }

    var shell = shellOf[key];
    if (shell) {
      var chrome = shell.querySelectorAll(selector);
      for (i = 0; i < chrome.length; i++) {
        if (isChrome(chrome[i])) found.push(chrome[i]);
      }
    }
    return found;
  }

  /**
   * Close every overlay something points at, from one screen's point of view.
   *
   * An overlay nothing points at is left visible: a wireframe that draws a
   * modal in order to describe it is not waiting for a click.
   */
  function closeOverlays(key) {
    var triggers = triggersFor(key);
    for (var i = 0; i < triggers.length; i++) {
      var id =
        triggers[i].getAttribute(${embedJson(OPENS_ATTR)}) ||
        triggers[i].getAttribute(${embedJson(TOGGLES_ATTR)});
      var overlay = overlayFor(key, id);
      if (overlay) overlay.classList.add(CLOSED);
    }
  }

  function initOverlays() {
    for (var i = 0; i < order.length; i++) closeOverlays(order[i]);
  }

  function applyOutcomes() {
    var visible = site.querySelectorAll('[' + ${embedJson(VISIBLE_GUARD_ATTR)} + ']');
    for (var i = 0; i < visible.length; i++) {
      var visibleGuard = parseJson(visible[i].getAttribute(${embedJson(VISIBLE_GUARD_ATTR)}), null);
      if (guardPasses(visibleGuard)) visible[i].removeAttribute('hidden');
      else visible[i].setAttribute('hidden', 'hidden');
    }

    var enabled = site.querySelectorAll('[' + ${embedJson(ENABLED_GUARD_ATTR)} + ']');
    for (var j = 0; j < enabled.length; j++) {
      var enabledGuard = parseJson(enabled[j].getAttribute(${embedJson(ENABLED_GUARD_ATTR)}), null);
      if (guardPasses(enabledGuard)) {
        enabled[j].removeAttribute('disabled');
        enabled[j].removeAttribute('aria-disabled');
      } else {
        enabled[j].setAttribute('disabled', 'disabled');
        enabled[j].setAttribute('aria-disabled', 'true');
      }
    }
  }

  function applyVariantScopes() {
    var screen = current === null ? null : screens[current];
    var variant = screen ? screen.getAttribute('data-wf-variant') : null;
    var scoped = site.querySelectorAll('[' + ${embedJson(VARIANT_SCOPE_ATTR)} + ']');
    for (var i = 0; i < scoped.length; i++) {
      var names = parseJson(scoped[i].getAttribute(${embedJson(VARIANT_SCOPE_ATTR)}), []);
      var visible = variant !== null && names.indexOf(variant) >= 0;
      if (visible) scoped[i].removeAttribute('hidden');
      else scoped[i].setAttribute('hidden', 'hidden');
    }
  }

  function applyEffects(handler) {
    for (var i = 0; i < handler.effects.length; i++) {
      var effect = handler.effects[i];
      if (effect.kind === 'navigate') {
        var route = resolve(effect.target);
        if (route !== null) show(route, true);
        else diagnostic('unknown-route', effect.target);
      } else if (effect.kind === 'set') {
        if (valueMatches(effect.state, effect.value)) state[effect.state] = effect.value;
        else diagnostic('invalid-set', effect.state);
      } else if (effect.kind === 'reset') {
        if (hasState(effect.state)) state[effect.state] = initial[effect.state];
        else diagnostic('unknown-state', effect.state);
      } else if (effect.kind === 'toggle') {
        if (stateTypes[effect.state] === 'boolean') state[effect.state] = !state[effect.state];
        else diagnostic('invalid-toggle', effect.state);
      } else if (effect.kind === 'open') {
        var opened = overlayFor(current, effect.target);
        if (opened) opened.classList.remove(CLOSED);
        else diagnostic('unknown-overlay', effect.target);
      } else if (effect.kind === 'close') {
        var closed = overlayFor(current, effect.target);
        if (closed) closed.classList.add(CLOSED);
        else diagnostic('unknown-overlay', effect.target);
      }
    }
    applyOutcomes();
  }

  var current = null;

  /**
   * The one place \`active\` is decided.
   *
   * Every shell nav item carries its own \`navigate\` target, including the item
   * for the screen being shown, and the class is applied to whichever of them
   * resolves to the current screen. Authoring it by hand is what produced items
   * marked active while pointing somewhere else; there is nothing to author
   * here, so there is nothing to get wrong.
   *
   * Only the shell's own chrome is derived. Links inside a screen belong to
   * that screen's content, where an authored \`active\` still means what its
   * author meant.
   */
  function markActive(key) {
    for (var i = 0; i < shells.length; i++) {
      var links = shells[i].querySelectorAll('[' + ${embedJson(NAVIGATE_ATTR)} + ']');
      for (var j = 0; j < links.length; j++) {
        if (!isChrome(links[j])) continue;
        // An external target names no screen, so it can never be the current
        // one. Same marker, same skip: the registry is not consulted.
        if (links[j].hasAttribute(${embedJson(EXTERNAL_NAVIGATE_ATTR)})) continue;
        var target = resolve(links[j].getAttribute(${embedJson(NAVIGATE_ATTR)}));
        if (target === key) links[j].classList.add(NAV_ACTIVE);
        else links[j].classList.remove(NAV_ACTIVE);
      }
    }
  }

  function show(key, writeFragment) {
    var screen = screens[key];
    if (!screen) return false;
    if (key === current) return true;

    for (var i = 0; i < order.length; i++) {
      var k = order[i];
      if (k === key) screens[k].classList.add(ON);
      else screens[k].classList.remove(ON);
    }
    var shell = shellOf[key];
    for (var s = 0; s < shells.length; s++) {
      if (shells[s] === shell) shells[s].classList.add(ON);
      else shells[s].classList.remove(ON);
    }

    // Which screen is current is *state*; \`data-screen\` is the *identity* of a
    // screen host. Writing the state under the identity attribute makes the site
    // root answer \`[data-screen]\` and shadow every host below it, which is
    // precisely the conflation this feature exists to remove.
    site.setAttribute('data-current-screen', key);
    current = key;
    closeOverlays(key);
    markActive(key);
    applyVariantScopes();
    applyOutcomes();

    if (writeFragment) {
      var fragment = R.fragments[Number(key)] || key;
      // The resulting hashchange re-enters show() with the key already current,
      // which returns early — the fragment and the screen cannot fight.
      if (location.hash.slice(1) !== fragment) location.hash = fragment;
    }
    return true;
  }

  function fromFragment() {
    var raw = location.hash.slice(1);
    if (raw === '') return null;
    var decoded = raw;
    try {
      decoded = decodeURIComponent(raw);
    } catch (e) {
      decoded = raw;
    }
    return resolve(decoded);
  }

  document.addEventListener('click', function (event) {
    var typed = event.target.closest ? event.target.closest('[' + ${embedJson(TYPED_INTERACTION_ATTR)} + ']') : null;
    if (typed) {
      var signatures = parseJson(typed.getAttribute(${embedJson(TYPED_INTERACTION_ATTR)}), []);
      var matched = false;
      for (var typedIndex = 0; typedIndex < signatures.length; typedIndex++) {
        var normalized = interactionFor(current, typed, signatures[typedIndex]);
        if (!normalized) continue;
        matched = true;
        if (guardPasses(normalized.guard)) applyEffects(normalized);
      }
      if (matched) {
        event.preventDefault();
        return;
      }
    }

    var mover = event.target.closest ? event.target.closest('[' + ${embedJson(NAVIGATE_ATTR)} + ']') : null;
    // The marker is a decision the renderer already made, not a hint to check.
    // Reading it here — rather than re-deriving "is this a URL" from the string —
    // is what keeps that rule in one place; a second copy in generated JS is a
    // drift surface, and the two disagreeing is how a runtime ends up hunting
    // for a screen named "https://…". Marked elements skip the registry
    // entirely: the lookup is not attempted, not merely discarded.
    if (mover && !mover.hasAttribute(${embedJson(EXTERNAL_NAVIGATE_ATTR)})) {
      var navigateTarget = mover.getAttribute(${embedJson(NAVIGATE_ATTR)});
      var key = routeAllowed(current, navigateTarget) ? resolve(navigateTarget) : null;
      if (key !== null) {
        event.preventDefault();
        show(key, true);
        return;
      }
    }

    var opener = event.target.closest ? event.target.closest('[' + ${embedJson(OPENS_ATTR)} + ']') : null;
    if (opener) {
      var opened = overlayFor(current, opener.getAttribute(${embedJson(OPENS_ATTR)}));
      if (opened) {
        event.preventDefault();
        opened.classList.remove(CLOSED);
        return;
      }
    }

    var toggler = event.target.closest ? event.target.closest('[' + ${embedJson(TOGGLES_ATTR)} + ']') : null;
    if (toggler) {
      var toggled = overlayFor(current, toggler.getAttribute(${embedJson(TOGGLES_ATTR)}));
      if (toggled) {
        event.preventDefault();
        toggled.classList.toggle(CLOSED);
        return;
      }
    }

    var actor = event.target.closest ? event.target.closest('[' + ${embedJson(ACTION_ATTR)} + ']') : null;
    if (actor) {
      // Only the two structural actions are the runtime's business. Every other
      // value is an opaque handler id the wireframe never promised to run.
      var action = (actor.getAttribute(${embedJson(ACTION_ATTR)}) || '').trim();
      if (action === 'close' || action === 'back') {
        event.preventDefault();
        closeOverlays(current);
        return;
      }
      if (action !== '') diagnostic('unknown-action', action);
    }

    // Clicking a modal's own backdrop dismisses it, the way a real one does.
    var backdrop = event.target;
    if (backdrop && backdrop.classList && backdrop.classList.contains(P + '-modal-backdrop')) {
      backdrop.classList.add(CLOSED);
    }

    // Every branch above cancels the default only when it RESOLVES an intent,
    // which is right for them — an unresolved intent must not silently look
    // handled. But that leaves the anchors the renderer marked as having no
    // destination at all, and a wireframe is mostly those: nav labels, tabs,
    // breadcrumbs, placeholder links. Their default action is a navigation, and
    // in the \`srcdoc\` frame every consumer mounts this output in, the inert
    // \`href\` resolves against the EMBEDDER's URL — so the click walks the frame
    // out of the wireframe and loads the host app inside itself, refetching its
    // assets. Measured on a 20-screen demo: 44 such anchors, frame URL
    // \`about:srcdoc\` -> \`<host page>#\`.
    //
    // The test is the renderer's own statement (\`INERT_HREF\`), read back, not a
    // guess about what the string means: an authored \`href\`, and a URL-shaped
    // \`navigate\` moved into one, are real destinations and are left alone. An
    // authored fragment link is left alone too — the hashchange handler below is
    // how that is supposed to work.
    var link = event.target.closest ? event.target.closest('a[href]') : null;
    if (link && link.getAttribute('href') === ${embedJson(INERT_HREF)}) event.preventDefault();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && current !== null) closeOverlays(current);
  });

  window.addEventListener('hashchange', function () {
    var key = fromFragment();
    if (key !== null) show(key, false);
  });

  initOverlays();
  var start = fromFragment();
  if (start === null) start = String(R.entry);
  if (!show(start, false)) show(String(R.entry), false);
})();`
}

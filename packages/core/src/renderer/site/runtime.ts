import type { StateDeclaration } from '../../ast'
import type { InteractionDiagnostic, NormalizedInteractionHandler } from '../../interaction/model'
import { ENABLED_GUARD_ATTR, TYPED_INTERACTION_ATTR, VISIBLE_GUARD_ATTR } from '../html/interactive'

export const ID_SCOPE_ATTR = 'data-id-scope'

export interface SiteRuntimeRegistry {
  names: Record<string, number>
  fragments: string[]
  entry: number
  states: StateDeclaration[]
  handlers: NormalizedInteractionHandler[]
  screenHandlers: Record<string, number[]>
  shellHandlers: Record<string, number[]>
  diagnostics: InteractionDiagnostic[]
}

function embedJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003C')
}

/** Generate the dependency-free runtime embedded by renderSite. */
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

  function shellFor(node) {
    var el = node.parentNode;
    while (el && el !== site) {
      if (el.classList && el.classList.contains(P + '-shell')) return el;
      el = el.parentNode;
    }
    return null;
  }

  for (var i = 0; i < hosts.length; i++) {
    var key = hosts[i].getAttribute('data-screen');
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
    try { return JSON.parse(value); } catch (e) { return fallback; }
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

  function isChrome(el) {
    return !(el.closest && el.closest('[data-screen]'));
  }

  function scopeOf(el) {
    return (el && el.getAttribute(${embedJson(ID_SCOPE_ATTR)})) || '';
  }

  function idSelector(id) {
    return '[id="' + String(id).replace(/["\\\\]/g, '\\\\$&') + '"]';
  }

  function resolve(target) {
    if (target === null || target === undefined) return null;
    var name = String(target).trim();
    if (name === '') return null;
    if (Object.prototype.hasOwnProperty.call(R.names, name)) return String(R.names[name]);
    return Object.prototype.hasOwnProperty.call(screens, name) ? name : null;
  }

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

  function triggersFor(key) {
    var selector = '[data-opens],[data-toggles]';
    var found = [];
    var screen = screens[key];
    var i;
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

  function closeOverlays(key) {
    var triggers = triggersFor(key);
    for (var i = 0; i < triggers.length; i++) {
      var id = triggers[i].getAttribute('data-opens') || triggers[i].getAttribute('data-toggles');
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

  function markActive(key) {
    for (var i = 0; i < shells.length; i++) {
      var links = shells[i].querySelectorAll('[data-navigate]');
      for (var j = 0; j < links.length; j++) {
        if (!isChrome(links[j])) continue;
        if (resolve(links[j].getAttribute('data-navigate')) === key) {
          links[j].classList.add(NAV_ACTIVE);
        } else {
          links[j].classList.remove(NAV_ACTIVE);
        }
      }
    }
  }

  var current = null;
  function show(key, writeFragment) {
    var screen = screens[key];
    if (!screen) return false;
    for (var i = 0; i < order.length; i++) {
      screens[order[i]].classList.toggle(ON, order[i] === key);
    }
    var shell = shellOf[key];
    for (var s = 0; s < shells.length; s++) shells[s].classList.toggle(ON, shells[s] === shell);
    site.setAttribute('data-current-screen', key);
    current = key;
    closeOverlays(key);
    markActive(key);
    applyOutcomes();
    if (writeFragment) {
      var fragment = R.fragments[Number(key)] || key;
      if (location.hash.slice(1) !== fragment) location.hash = fragment;
    }
    return true;
  }

  function fromFragment() {
    var raw = location.hash.slice(1);
    if (raw === '') return null;
    try { raw = decodeURIComponent(raw); } catch (e) { /* keep the raw fragment */ }
    return resolve(raw);
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    var typed = target.closest ? target.closest('[' + ${embedJson(TYPED_INTERACTION_ATTR)} + ']') : null;
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

    var mover = target.closest ? target.closest('[data-navigate]') : null;
    if (mover) {
      var destination = resolve(mover.getAttribute('data-navigate'));
      if (destination !== null) {
        event.preventDefault();
        show(destination, true);
        return;
      }
    }

    var opener = target.closest ? target.closest('[data-opens]') : null;
    if (opener) {
      var opened = overlayFor(current, opener.getAttribute('data-opens'));
      if (opened) {
        event.preventDefault();
        opened.classList.remove(CLOSED);
        return;
      }
    }

    var toggler = target.closest ? target.closest('[data-toggles]') : null;
    if (toggler) {
      var toggled = overlayFor(current, toggler.getAttribute('data-toggles'));
      if (toggled) {
        event.preventDefault();
        toggled.classList.toggle(CLOSED);
        return;
      }
    }

    var actor = target.closest ? target.closest('[data-action]') : null;
    if (actor) {
      var action = (actor.getAttribute('data-action') || '').trim();
      if (action === 'close' || action === 'back') {
        event.preventDefault();
        closeOverlays(current);
        return;
      }
      if (action !== '') diagnostic('unknown-action', action);
    }

    if (target.classList && target.classList.contains(P + '-modal-backdrop')) {
      target.classList.add(CLOSED);
    }
    var link = target.closest ? target.closest('a[href]') : null;
    if (link && link.getAttribute('href') === '#') event.preventDefault();
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

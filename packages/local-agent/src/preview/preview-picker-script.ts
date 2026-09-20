import { PREVIEW_SELECTION_CHANNEL, PREVIEW_SELECTION_LIMITS } from '@pairdock/shared-contracts';

export const PREVIEW_PICKER_SCRIPT_PATH = '/__pairdock/preview-picker.js';

// Keep this as browser JavaScript: serializing a transpiled function can capture tsx helpers.
export function getPreviewPickerScript(): string {
  return String.raw`(() => {
  if (window.parent === window) return;
  if (!['http:', 'https:'].includes(window.location.protocol)) return;

  const channel = ${JSON.stringify(PREVIEW_SELECTION_CHANNEL)};
  const limits = ${JSON.stringify(PREVIEW_SELECTION_LIMITS)};
  let parentOrigin = null;
  let nonce = null;
  let enabled = false;
  let hovered = null;
  let overlay = null;
  let outline = null;
  let label = null;
  let animationFrame = null;
  let suppressClick = false;
  let suppressTouchEnd = false;
  let suppressedKeyup = null;
  const privateContent = 'input,textarea,select,option,script,style,noscript,template,[contenteditable],[hidden],[aria-hidden="true"],[data-private],[data-sensitive]';

  function send(type, selection) {
    if (!parentOrigin || !nonce) return;
    const message = { channel, type, nonce };
    if (selection) message.selection = selection;
    window.parent.postMessage(message, parentOrigin);
  }

  function activeElement() {
    let element = document.activeElement;
    while (element && element.shadowRoot && element.shadowRoot.activeElement) {
      element = element.shadowRoot.activeElement;
    }
    if (element === document.body || element === document.documentElement) return null;
    return element instanceof Element ? element : null;
  }

  function renderHighlight() {
    animationFrame = null;
    if (!outline || !label) return;
    if (!hovered || !hovered.isConnected) {
      outline.style.display = 'none';
      label.style.display = 'none';
      return;
    }
    const rect = hovered.getBoundingClientRect();
    outline.style.display = 'block';
    outline.style.left = rect.left + 'px';
    outline.style.top = rect.top + 'px';
    outline.style.width = rect.width + 'px';
    outline.style.height = rect.height + 'px';
    label.textContent = hovered.localName + ' · Cliquer pour annoter · Échap pour quitter';
    label.style.display = 'block';
    label.style.left = Math.max(4, Math.min(rect.left, window.innerWidth - 320)) + 'px';
    label.style.top = Math.max(4, Math.min(rect.top - 30, window.innerHeight - 28)) + 'px';
  }

  function scheduleHighlight() {
    if (enabled && animationFrame === null) {
      animationFrame = window.requestAnimationFrame(renderHighlight);
    }
  }

  function setMode(nextEnabled) {
    if (nextEnabled === enabled) return;
    enabled = nextEnabled;
    hovered = null;
    if (!enabled) {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      if (overlay) overlay.remove();
      overlay = null;
      outline = null;
      label = null;
      return;
    }
    overlay = document.createElement('div');
    overlay.setAttribute('data-pairdock-preview-picker-overlay', '');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.setProperty('all', 'initial', 'important');
    overlay.style.setProperty('position', 'fixed', 'important');
    overlay.style.setProperty('inset', '0', 'important');
    overlay.style.setProperty('pointer-events', 'none', 'important');
    overlay.style.setProperty('z-index', '2147483647', 'important');
    const shadow = overlay.attachShadow({ mode: 'closed' });
    outline = document.createElement('div');
    outline.style.cssText = 'display:none;position:fixed;box-sizing:border-box;pointer-events:none;border:2px solid #5fdf9b;background:rgba(95,223,155,.13);border-radius:3px;';
    label = document.createElement('div');
    label.style.cssText = 'display:none;position:fixed;box-sizing:border-box;pointer-events:none;padding:5px 8px;max-width:calc(100vw - 8px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-radius:5px;background:#17442d;color:#fff;font:12px/16px system-ui,sans-serif;';
    shadow.append(outline, label);
    document.documentElement.append(overlay);
    hovered = activeElement();
    renderHighlight();
  }

  function eventElement(event) {
    return event.composedPath().find((node) => node instanceof Element && node !== overlay) || null;
  }

  function hasPrivateAncestor(element) {
    let current = element;
    while (current) {
      if (current.matches(privateContent)) return true;
      const root = current.getRootNode();
      current = current.parentElement || (root instanceof ShadowRoot ? root.host : null);
    }
    return false;
  }

  function visibleText(element) {
    if (hasPrivateAncestor(element)) return '';
    let text = '';
    let node = element.firstChild;
    let visited = 0;
    while (node && visited < 1000 && text.length < limits.text) {
      visited += 1;
      let skipChildren = false;
      if (node instanceof Element) {
        const style = window.getComputedStyle(node);
        skipChildren = node.matches(privateContent) || style.display === 'none' || style.visibility === 'hidden';
      } else if (node.nodeType === 3) {
        const content = (node.nodeValue || '').slice(0, limits.text * 4).replace(/\s+/g, ' ').trim();
        if (content) text += (text ? ' ' : '') + content;
      }
      if (!skipChildren && node.firstChild) {
        node = node.firstChild;
        continue;
      }
      while (node !== element && !node.nextSibling) node = node.parentNode;
      node = node === element ? null : node.nextSibling;
    }
    return text.slice(0, limits.text).trim();
  }

  function selectorFor(element) {
    const scopes = [];
    let current = element;
    for (let scopeDepth = 0; current && scopeDepth < 4; scopeDepth += 1) {
      const root = current.getRootNode();
      const path = [];
      for (let depth = 0; current && depth < 8; depth += 1) {
        const id = current.getAttribute('id');
        if (id && id.length <= 256) {
          const idSelector = '#' + CSS.escape(id);
          if (root.querySelectorAll(idSelector).length === 1) {
            path.unshift(idSelector);
            break;
          }
        }
        let index = 1;
        let sibling = current.previousElementSibling;
        while (sibling) {
          if (sibling.localName === current.localName) index += 1;
          sibling = sibling.previousElementSibling;
        }
        path.unshift(CSS.escape(current.localName) + ':nth-of-type(' + index + ')');
        if (root.querySelectorAll(path.join(' > ')).length === 1) break;
        current = current.parentElement;
      }
      scopes.unshift(path.join(' > '));
      current = root instanceof ShadowRoot ? root.host : null;
    }
    return scopes.join(' >>> ').slice(0, limits.selector);
  }

  function escapeHtml(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function shallowHtml(element, tagName, text) {
    let html = '<' + tagName;
    const attributes = ['id', 'class', 'role'];
    if (!hasPrivateAncestor(element)) attributes.push('aria-label');
    for (const name of attributes) {
      const value = element.getAttribute(name);
      if (value) html += ' ' + name + '="' + escapeHtml(value.slice(0, 160)) + '"';
    }
    html += '>';
    if (!['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'].includes(tagName)) {
      html += escapeHtml(text) + '</' + tagName + '>';
    }
    return html.slice(0, limits.html);
  }

  function selectElement(element) {
    if (!element || !element.isConnected || element === overlay) return;
    const tagName = element.localName.slice(0, limits.tagName);
    const text = visibleText(element);
    const rect = element.getBoundingClientRect();
    const selection = {
      tagName,
      selector: selectorFor(element),
      text,
      html: shallowHtml(element, tagName, text),
      url: (window.location.origin + window.location.pathname).slice(0, limits.url),
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      viewport: { width: Math.max(1, window.innerWidth), height: Math.max(1, window.innerHeight) },
    };
    setMode(false);
    send('selected', selection);
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    const data = event.data;
    if (!data || typeof data !== 'object' || data.channel !== channel) return;
    if (typeof data.nonce !== 'string' || !data.nonce || data.nonce.length > 128) return;
    if (!/^https?:\/\//.test(event.origin)) return;
    if (parentOrigin && event.origin !== parentOrigin) return;
    if (data.type === 'connect') {
      if (nonce !== data.nonce) setMode(false);
      parentOrigin = event.origin;
      nonce = data.nonce;
      send('ready');
      return;
    }
    if (!parentOrigin || data.nonce !== nonce) return;
    if (data.type === 'set-mode' && typeof data.enabled === 'boolean') setMode(data.enabled);
  });

  window.addEventListener('keydown', (event) => {
    if (suppressedKeyup === event.key) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (!enabled) return;
    event.stopImmediatePropagation();
    if (event.key !== 'Tab') event.preventDefault();
    if (event.key === 'Escape') {
      suppressedKeyup = event.key;
      setMode(false);
      send('cancelled');
    } else if (event.key === 'Enter' || event.key === ' ') {
      suppressedKeyup = event.key;
      selectElement(activeElement() || hovered);
    }
  }, true);
  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'touchcancel', 'click', 'auxclick', 'dblclick', 'contextmenu', 'keypress', 'keyup']) {
    window.addEventListener(type, (event) => {
      if (type === 'pointerdown') {
        suppressClick = false;
        suppressTouchEnd = false;
      }
      if ((type === 'touchend' || type === 'touchcancel') && suppressTouchEnd) {
        suppressTouchEnd = false;
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (type === 'keyup' && event.key === suppressedKeyup) {
        suppressedKeyup = null;
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (type === 'click' && suppressClick) {
        suppressClick = false;
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (!enabled) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (type === 'pointerup' && (event.pointerType === 'touch' || event.pointerType === 'pen')) {
        suppressClick = true;
        suppressTouchEnd = event.pointerType === 'touch';
        selectElement(eventElement(event));
      } else if (type === 'click') {
        selectElement(eventElement(event));
      }
    }, { capture: true, passive: false });
  }
  for (const type of ['pointermove', 'focusin']) {
    window.addEventListener(type, (event) => {
      if (!enabled) return;
      hovered = eventElement(event);
      scheduleHighlight();
    }, true);
  }
  window.addEventListener('scroll', scheduleHighlight, true);
  window.addEventListener('resize', scheduleHighlight);
  window.addEventListener('blur', () => { suppressedKeyup = null; });
  window.addEventListener('pagehide', () => setMode(false));
})();`;
}

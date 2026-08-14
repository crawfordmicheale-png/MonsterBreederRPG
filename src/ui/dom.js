// Minimal DOM helpers. No framework — the whole UI is a few hundred lines of
// element construction, which keeps the bundle at zero bytes of dependencies.

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  }
  append(node, children);
  return node;
}

function append(node, children) {
  for (const child of children.flat(4)) {
    if (child === null || child === undefined || child === false) continue;
    node.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export const div = (props, ...kids) => el('div', props, ...kids);
export const span = (props, ...kids) => el('span', props, ...kids);
export const p = (props, ...kids) => el('p', props, ...kids);

export function button(label, props = {}) {
  return el('button', { type: 'button', class: 'btn', ...props }, label);
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function meter(value, max, cls = '') {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return div({ class: `meter ${cls}` }, el('i', { style: { width: `${pct}%` } }));
}

export function labelledMeter(label, value, max, cls = '', valueText = null) {
  return div(
    {},
    div({ class: 'meter-label' }, span({}, label), span({}, valueText ?? `${Math.round(value)}/${Math.round(max)}`)),
    meter(value, max, cls)
  );
}

export function tag(text, cls = '') {
  return span({ class: `tag ${cls}` }, text);
}

let toastHost = null;

export function toast(message, ms = 2400) {
  if (!toastHost) {
    toastHost = div({ class: 'toast-host' });
    document.body.appendChild(toastHost);
  }
  const node = div({ class: 'toast' }, message);
  toastHost.appendChild(node);
  setTimeout(() => {
    node.style.opacity = '0';
    node.style.transition = 'opacity .3s';
    setTimeout(() => node.remove(), 320);
  }, ms);
}

/** Bottom sheet. Returns a close function. */
export function sheet(contentFn) {
  const inner = div({ class: 'sheet-inner' });
  const host = div(
    {
      class: 'sheet',
      onclick: (e) => {
        if (e.target === host) close();
      },
    },
    inner
  );
  const close = () => host.remove();
  inner.appendChild(div({ class: 'grabber' }));
  const content = contentFn(close);
  if (content) inner.appendChild(content);
  document.body.appendChild(host);
  return { close, inner };
}

export function confirmSheet(title, body, confirmLabel, onConfirm) {
  return sheet((close) =>
    div(
      { class: 'stack' },
      el('h3', {}, title),
      p({ class: 'muted' }, body),
      div(
        { class: 'btn-row' },
        button(confirmLabel, {
          class: 'btn primary',
          onclick: () => {
            close();
            onConfirm();
          },
        }),
        button('Not yet', { class: 'btn ghost', onclick: close })
      )
    )
  );
}

export function formatList(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function titleCase(s) {
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

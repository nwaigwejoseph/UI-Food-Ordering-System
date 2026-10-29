/* ==========================================================================
   U.I Cafe — app.js (loaded first on every page)
   Shared helpers: storage, cart store, toast, confirm dialog, UI wiring.

   BACKEND HANDOFF
   ---------------
   This front end never talks to a server. Everything the backend needs is a
   hook. Define any of these AFTER app.js and the demo behaviour is skipped:

     UICafe.hooks.onLogin({ matric, password, remember })  // signin.html
     UICafe.hooks.onSignup({ name, matric, password })      // signup.html
     UICafe.hooks.onCheckout(cartItems, total)              // cart.html  (create the order)
     UICafe.hooks.onPay({ order, method })                  // payment.html
     UICafe.hooks.onCancelOrder(orderId)                    // order / payment / admin pages
     UICafe.hooks.onMarkReady(orderId)                      // admin.html

   Each hook may return a Promise. Throw an Error to show its message in a toast.
   Set UICafe.config.DEMO_MODE = false once the real backend is connected.
   ========================================================================== */
(function () {
    'use strict';

    const UICafe = (window.UICafe = window.UICafe || {});

    UICafe.config = Object.assign({
        DEMO_MODE: true, // preview-only: fakes login / orders in this browser (localStorage)
        KEYS: { cart: 'uicafe.cart', order: 'uicafe.order', lastOrderId: 'uicafe.lastOrderId', session: 'uicafe.session' }
    }, UICafe.config);
    UICafe.hooks = UICafe.hooks || {};

    const K = UICafe.config.KEYS;
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    UICafe.$ = $;
    UICafe.$$ = $$;
    UICafe.money = (n) => '₦' + (Number(n) || 0).toLocaleString('en-US');
    UICafe.plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
    UICafe.icon = (name) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'i');
        svg.setAttribute('aria-hidden', 'true');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', '#i-' + name);
        svg.appendChild(use);
        return svg;
    };

    /* ---------- safe storage (private mode / blocked storage must not crash the UI) ---------- */
    UICafe.store = {
        get(key, fallback) {
            try {
                const raw = localStorage.getItem(key);
                return raw === null ? fallback : JSON.parse(raw);
            } catch (e) { return fallback; }
        },
        set(key, value) {
            try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
        },
        remove(key) {
            try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
        }
    };
    const store = UICafe.store;

    /* ---------- cart ---------- */
    const TINT = { Rice: '#ffedd5', Swallow: '#fef3c7', Protein: '#fee2e2', Drink: '#dbeafe', Snack: '#fef9c3', Other: '#ecfccb' };
    const EMOJI = { Rice: '🍛', Swallow: '🍲', Protein: '🍗', Drink: '🥤', Snack: '🥟', Other: '🍽️' };
    UICafe.tint = (c) => TINT[c] || '#ffedd5';
    UICafe.emoji = (c) => EMOJI[c] || '🍽️';

    const Cart = {
        items() {
            const v = store.get(K.cart, []);
            return Array.isArray(v) ? v : [];
        },
        save(items) {
            store.set(K.cart, items);
            document.dispatchEvent(new CustomEvent('uicafe:cart-change'));
        },
        key(id, soupId) { return soupId ? id + ':' + soupId : String(id); },
        add(meal, soup) {
            const items = this.items();
            const key = this.key(meal.id, soup && soup.id);
            const line = items.find((i) => i.key === key);
            const max = meal.stock > 0 ? meal.stock : Infinity;
            if (line) {
                if (line.qty >= max) return { ok: false, max };
                line.qty += 1;
            } else {
                items.push({
                    key, id: meal.id, soupId: soup ? soup.id : null,
                    name: soup ? meal.name + ' + ' + soup.shortName : meal.name,
                    price: meal.price, stock: meal.stock, qty: 1,
                    category: meal.category || '', img: meal.img || ''
                });
            }
            this.save(items);
            return { ok: true };
        },
        setQty(key, qty) {
            let items = this.items();
            const line = items.find((i) => i.key === key);
            if (!line) return { ok: false };
            const max = line.stock > 0 ? line.stock : Infinity;
            if (qty > max) return { ok: false, max };
            if (qty <= 0) items = items.filter((i) => i.key !== key);
            else line.qty = qty;
            this.save(items);
            return { ok: true };
        },
        clear() { this.save([]); },
        count() { return this.items().reduce((n, i) => n + i.qty, 0); },
        total() { return this.items().reduce((s, i) => s + i.price * i.qty, 0); }
    };
    UICafe.cart = Cart;

    /* ---------- demo-only order store (replaced by the backend later) ---------- */
    UICafe.orders = {
        current() { return store.get(K.order, null); },
        save(order) { store.set(K.order, order); },
        setStatus(status) {
            const o = this.current();
            if (o) { o.status = status; this.save(o); }
        },
        create(items, total) {
            const id = Number(store.get(K.lastOrderId, 1023)) + 1;
            store.set(K.lastOrderId, id);
            const order = { id, items, total, status: 'Pending', createdAt: Date.now() };
            this.save(order);
            return order;
        }
    };

    /* ---------- toast ---------- */
    let toastTimer;
    UICafe.toast = function (message, opts) {
        opts = opts || {};
        let region = $('#toast-region');
        if (!region) {
            region = document.createElement('div');
            region.id = 'toast-region';
            region.className = 'toast-region';
            region.setAttribute('role', 'status');
            region.setAttribute('aria-live', 'polite');
            document.body.appendChild(region);
        }
        region.replaceChildren();
        const el = document.createElement('div');
        el.className = 'toast';
        const text = document.createElement('span');
        text.textContent = message;
        el.appendChild(text);
        if (opts.actionLabel) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'toast__action';
            b.textContent = opts.actionLabel;
            b.addEventListener('click', () => {
                clearTimeout(toastTimer);
                region.replaceChildren();
                if (opts.onAction) opts.onAction();
            });
            el.appendChild(b);
        }
        region.appendChild(el);
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => region.replaceChildren(), opts.duration || 3500);
    };

    /* ---------- confirm dialog (returns a Promise<boolean>) ---------- */
    UICafe.confirm = function (message, opts) {
        opts = opts || {};
        return new Promise((resolve) => {
            const dlg = document.createElement('dialog');
            dlg.className = 'dialog';
            dlg.setAttribute('aria-labelledby', 'confirm-msg');
            const form = document.createElement('form');
            form.method = 'dialog';
            form.className = 'confirm';
            const p = document.createElement('p');
            p.id = 'confirm-msg';
            p.className = 'confirm__msg';
            p.textContent = message;
            const row = document.createElement('div');
            row.className = 'confirm__actions';
            const no = document.createElement('button');
            no.value = 'no';
            no.className = 'btn btn-secondary';
            no.textContent = opts.cancelLabel || 'Keep it';
            const yes = document.createElement('button');
            yes.value = 'yes';
            yes.className = 'btn btn-primary';
            yes.textContent = opts.confirmLabel || 'Yes, continue';
            row.append(no, yes);
            form.append(p, row);
            dlg.append(form);
            document.body.appendChild(dlg);
            dlg.addEventListener('close', () => {
                const ok = dlg.returnValue === 'yes';
                dlg.remove();
                resolve(ok);
            });
            dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close('no'); });
            dlg.showModal();
            no.focus();
        });
    };

    /* ---------- cart badge + checkout bar on the menu ---------- */
    function renderBadges() {
        const n = Cart.count();
        $$('.cart-count').forEach((el) => {
            el.textContent = n > 99 ? '99+' : String(n);
            el.hidden = n === 0;
        });
        $$('.cart-link').forEach((a) => a.setAttribute('aria-label', 'Cart, ' + UICafe.plural(n, 'item', 'items')));
        const bar = $('#quickbar');
        if (bar) {
            bar.hidden = n === 0;
            $('#quick-label').textContent = 'Subtotal (' + UICafe.plural(n, 'item', 'items') + ')';
            $('#quick-total').textContent = UICafe.money(Cart.total());
        }
    }
    document.addEventListener('uicafe:cart-change', renderBadges);
    window.addEventListener('storage', (e) => {
        if (e.key === K.cart) document.dispatchEvent(new CustomEvent('uicafe:cart-change'));
    });
    renderBadges();

    /* ---------- show / hide password (any .toggle-password button) ---------- */
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-password');
        if (!btn) return;
        const input = document.getElementById(btn.getAttribute('aria-controls'));
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-pressed', String(show));
        btn.setAttribute('aria-label', (show ? 'Hide ' : 'Show ') + (btn.dataset.label || 'password'));
        const use = $('use', btn);
        if (use) use.setAttribute('href', show ? '#i-eye' : '#i-eye-off');
    });

    /* ---------- photo fallback: missing image -> emoji tile (any [data-emoji] wrapper) ---------- */
    function useFallback(img) {
        const box = img.closest('[data-emoji]');
        if (!box) return;
        box.classList.add('is-empty');
        img.remove();
    }
    document.addEventListener('error', (e) => {
        if (e.target && e.target.tagName === 'IMG') useFallback(e.target);
    }, true);
    const sweep = () => $$('[data-emoji] img').forEach((img) => { if (img.complete && img.naturalWidth === 0) useFallback(img); });
    sweep();
    window.addEventListener('load', sweep);
})();

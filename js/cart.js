/* U.I Cafe — cart.js: renders the cart, quantity buttons, clear, checkout */
(function () {
    'use strict';
    const list = UICafe.$('#cart-items');
    if (!list) return;
    const { $, cart, money, toast } = UICafe;

    const body = $('#cart-body');
    const emptyState = $('#cart-empty');
    const summary = $('#cart-summary');
    const checkout = $('#checkout-btn');
    const clearBtn = $('#btn-clear-cart');

    function el(tag, cls, text) {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined) n.textContent = text;
        return n;
    }

    function stepBtn(cls, label, icon) {
        const b = el('button', cls);
        b.type = 'button';
        b.setAttribute('aria-label', label);
        b.appendChild(UICafe.icon(icon));
        return b;
    }

    function row(item) {
        const li = el('li', 'cart-item');
        li.dataset.key = item.key;

        const thumb = el('div', 'thumb');
        thumb.style.setProperty('--tint', UICafe.tint(item.category));
        thumb.dataset.emoji = UICafe.emoji(item.category);
        if (item.img) {
            const img = el('img');
            img.src = item.img;
            img.alt = '';
            img.width = 42; img.height = 41;
            thumb.appendChild(img);
        } else {
            thumb.classList.add('is-empty');
        }
        const info = el('div');
        info.append(el('h2', 'cart-item__name', item.name), el('p', 'cart-item__price', money(item.price * item.qty)));
        const main = el('div', 'cart-item__main');
        main.append(thumb, info);

        const qty = el('div', 'qty');
        const value = el('span', 'qty__value', String(item.qty));
        value.setAttribute('aria-label', 'Quantity');
        qty.append(
            stepBtn('btn-qty-minus', 'Decrease quantity of ' + item.name, 'minus'), value,
            stepBtn('btn-qty-plus', 'Increase quantity of ' + item.name, 'plus')
        );
        li.append(main, qty);
        return li;
    }

    function render() {
        const items = cart.items();
        const has = items.length > 0;
        const count = cart.count();
        list.replaceChildren(...items.map(row));
        body.hidden = !has;
        summary.hidden = !has;
        emptyState.hidden = has;
        $('#cart-count-label').textContent = UICafe.plural(count, 'item', 'items') + ' selected';
        const total = money(cart.total());
        $('#cart-subtotal').textContent = total;
        $('#cart-total').textContent = total;
        $('#checkout-total').textContent = total;
        checkout.disabled = !has;
        // thumbnails whose photo is missing fall back to the emoji tile
        list.querySelectorAll('.thumb img').forEach((img) => {
            if (img.complete && img.naturalWidth === 0) { img.parentElement.classList.add('is-empty'); img.remove(); }
        });
    }

    list.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-qty-minus, .btn-qty-plus');
        if (!btn) return;
        const li = btn.closest('.cart-item');
        const key = li.dataset.key;
        const line = cart.items().find((i) => i.key === key);
        if (!line) return;
        const isPlus = btn.classList.contains('btn-qty-plus');
        const snapshot = cart.items();

        const res = cart.setQty(key, line.qty + (isPlus ? 1 : -1));
        if (!res.ok) { toast('Only ' + res.max + ' of ' + line.name + ' left in stock.'); return; }

        if (!isPlus && line.qty === 1) {
            toast(line.name + ' removed', { actionLabel: 'Undo', onAction: () => cart.save(snapshot) });
            (checkout.disabled ? clearBtn : checkout).focus();
        } else {
            const again = list.querySelector('[data-key="' + CSS.escape(key) + '"] ' + (isPlus ? '.btn-qty-plus' : '.btn-qty-minus'));
            if (again) again.focus();
        }
    });

    clearBtn.addEventListener('click', () => {
        const snapshot = cart.items();
        if (!snapshot.length) return;
        cart.clear();
        toast('Cart cleared', { actionLabel: 'Undo', onAction: () => cart.save(snapshot) });
    });

    checkout.addEventListener('click', async () => {
        const items = cart.items();
        if (!items.length) return;
        checkout.disabled = true;
        try {
            if (typeof UICafe.hooks.onCheckout === 'function') {
                await UICafe.hooks.onCheckout(items, cart.total());
            } else if (UICafe.config.DEMO_MODE) {
                UICafe.orders.create(items, cart.total()); // DEMO ONLY: the backend creates the real order
                window.location.assign('payment.html');
                return;
            } else {
                toast('Checkout is not connected yet.');
            }
        } catch (err) {
            toast((err && err.message) || 'Could not place your order. Please try again.');
        }
        checkout.disabled = cart.items().length === 0;
    });

    document.addEventListener('uicafe:cart-change', render);
    render();
})();

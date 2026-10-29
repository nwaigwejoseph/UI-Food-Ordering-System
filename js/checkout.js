/* U.I Cafe — checkout.js: payment.html and payment-result.html (payment is simulated) */
(function () {
    'use strict';
    const { $, $$, cart, orders, money, toast } = UICafe;
    const params = new URLSearchParams(window.location.search);

    /* marks the order Cancelled (demo), tells the backend hook, returns to the menu */
    async function cancelOrder(orderId) {
        const ok = await UICafe.confirm('Cancel this order? This cannot be undone.', {
            confirmLabel: 'Cancel order', cancelLabel: 'Keep order'
        });
        if (!ok) return;
        try {
            if (typeof UICafe.hooks.onCancelOrder === 'function') await UICafe.hooks.onCancelOrder(orderId);
            else if (UICafe.config.DEMO_MODE) orders.setStatus('Cancelled');
            window.location.assign('menu.html');
        } catch (err) {
            toast((err && err.message) || 'Could not cancel the order.');
        }
    }

    /* ----- payment.html ----- */
    const payBtn = $('#btn-pay');
    if (payBtn) {
        const order = orders.current();
        const usable = order && order.status === 'Pending' && order.items && order.items.length;
        const items = usable ? order.items : [];
        const total = usable ? order.total : 0;

        if (!usable) {
            $('#pay-empty').hidden = false;
        } else {
            $('#pay-body').hidden = false;
            $('#pay-bar').hidden = false;
            const count = items.reduce((n, i) => n + i.qty, 0);
            $('#pay-items').textContent = UICafe.plural(count, 'item', 'items') + ' in cart';
            $('#pay-lines').replaceChildren(...items.map((i) => {
                const li = document.createElement('li');
                const a = document.createElement('span');
                a.textContent = i.qty + '× ' + i.name;
                const b = document.createElement('span');
                b.textContent = money(i.price * i.qty);
                li.append(a, b);
                return li;
            }));
            $('#pay-subtotal').textContent = money(total);
            $('#pay-total').textContent = money(total);
            $('#pay-label').textContent = 'Pay ' + money(total);
        }

        // payment method cards
        const radios = $$('input[name="method"]');
        const methodError = $('#method-error');
        radios.forEach((r) => r.addEventListener('change', () => {
            radios.forEach((x) => x.closest('.method').classList.toggle('is-selected', x.checked));
            methodError.textContent = '';
        }));

        payBtn.addEventListener('click', async () => {
            const chosen = radios.find((r) => r.checked);
            if (!chosen) {
                methodError.textContent = 'Select a payment method to continue.';
                radios[0].focus();
                return;
            }
            payBtn.disabled = true;
            const label = $('#pay-label');
            const original = label.textContent;
            label.textContent = 'Processing…';
            try {
                if (typeof UICafe.hooks.onPay === 'function') {
                    await UICafe.hooks.onPay({ order, method: chosen.value });
                } else if (UICafe.config.DEMO_MODE) {
                    // DEMO ONLY: fake a short delay. Add ?simulate=fail to the URL to preview a failed payment.
                    await new Promise((r) => setTimeout(r, 1000));
                    const failed = params.get('simulate') === 'fail';
                    if (!failed) { orders.setStatus('Paid'); cart.clear(); }
                    window.location.assign('payment-result.html?status=' + (failed ? 'failed' : 'success') + '&order=' + order.id);
                    return;
                } else {
                    toast('Payment is not connected yet.');
                }
            } catch (err) {
                toast((err && err.message) || 'Payment could not be completed.');
            }
            payBtn.disabled = false;
            label.textContent = original;
        });

        $('#btn-cancel').addEventListener('click', () => cancelOrder(order && order.id));
    }

    /* ----- payment-result.html (?status=success|failed&order=1024) ----- */
    const result = $('#payment-result');
    if (result) {
        const failed = params.get('status') === 'failed';
        const current = orders.current();
        const orderId = params.get('order') || (current && current.id) || '';

        const icon = $('#result-icon');
        icon.className = 'result__icon' + (failed ? ' result__icon--failed' : '');
        $('use', icon).setAttribute('href', failed ? '#i-alert' : '#i-check');
        $('#result-title').textContent = failed ? 'Payment failed' : 'Payment Successful';
        $('#result-order').textContent = 'Order #' + orderId;
        const pill = $('#result-pill');
        pill.textContent = failed ? 'Pending' : 'PAID';
        pill.className = 'status-pill ' + (failed ? 'st-pending' : 'st-paid');
        $('#result-note-label').textContent = failed ? 'What happened' : 'Estimated Preparation';
        $('#result-note-value').textContent = failed
            ? 'Transaction was declined by payment gateway. Your bank account has not been charged.'
            : '~4-7 mins';
        if (failed) $('#result-note-value').style.cssText = 'font-size:.8125rem;font-weight:500;color:inherit';
        const primary = $('#result-primary');
        primary.textContent = failed ? 'Try again' : 'View my orders';
        primary.href = failed ? 'payment.html' : 'order.html';
        $('#result-secondary').hidden = failed;
        document.title = (failed ? 'Payment failed' : 'Payment successful') + ' | U.I Cafe';

        const cancel = $('#btn-cancel-order');
        cancel.hidden = !failed;
        cancel.addEventListener('click', () => cancelOrder(orderId));
    }
})();

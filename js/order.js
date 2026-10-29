/* U.I Cafe — order.js: order status tracker (Pending -> Paid -> Ready) */
(function () {
    'use strict';
    const tracker = UICafe.$('#order-tracker');
    if (!tracker) return;
    const { $, $$, money, toast } = UICafe;

    const STEPS = ['Pending', 'Paid', 'Ready'];
    const STATUS_CLASS = { Pending: 'st-pending', Paid: 'st-paid', Ready: 'st-ready', Cancelled: 'st-cancelled' };
    const order = UICafe.orders.current();

    // Priority: ?status= (preview) > data-status (backend) > saved demo order
    const params = new URLSearchParams(window.location.search);
    const norm = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '');
    let status = norm(params.get('status')) || norm(tracker.dataset.status) || (order ? order.status : '');
    const id = params.get('order') || (order && order.id) || '';

    const cancelBtn = $('#btn-cancel-order');
    const ETA = {
        Pending: ['Awaiting payment', 'Pay to start preparing your order'],
        Paid: ['5 – 8 Minutes Left', 'Your order is being prepared'],
        Ready: ['Ready for pickup', 'Show your token at the counter']
    };

    function renderItems() {
        const items = order && order.items ? order.items : [];
        $('#order-card').hidden = !items.length;
        $('#order-lines').replaceChildren(...items.map((i) => {
            const li = document.createElement('li');
            const a = document.createElement('span');
            a.textContent = (i.qty > 1 ? i.qty + '× ' : '') + i.name;
            const b = document.createElement('span');
            b.textContent = money(i.price * i.qty);
            li.append(a, b);
            return li;
        }));
        $('#order-total').textContent = money(order ? order.total : 0);
    }

    function render() {
        const inFlow = STEPS.includes(status);
        const known = inFlow || status === 'Cancelled';
        $('#order-empty').hidden = known;
        $('#journey').hidden = !inFlow;
        $('#order-eta').hidden = !inFlow;
        $('#order-cancelled').hidden = status !== 'Cancelled';
        $('#order-actions').hidden = !known;
        cancelBtn.hidden = status !== 'Pending'; // only a Pending order may be cancelled

        const token = $('#order-token');
        token.hidden = !(known && id);
        token.textContent = '#' + id;
        $('#order-card-token').textContent = 'Token: #' + id;
        const st = $('#order-card-status');
        st.textContent = status;
        st.className = 'status-pill ' + (STATUS_CLASS[status] || '');

        if (inFlow) {
            $('#eta-main').textContent = ETA[status][0];
            $('#eta-sub').textContent = ETA[status][1];
            const created = order && order.createdAt ? new Date(order.createdAt) : new Date();
            $('#order-time').textContent = created.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            $('#stage-label').textContent = 'Stage ' + (STEPS.indexOf(status) + 1) + ' of 3';
        }

        const idx = STEPS.indexOf(status);
        $$('.tracker__step', tracker).forEach((li, i) => {
            const dot = $('.tracker__dot', li);
            const done = i < idx || (i === idx && status === 'Ready'); // Ready is the final state
            li.classList.toggle('is-done', done);
            li.classList.toggle('is-current', i === idx && !done);
            if (i === idx) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
            dot.replaceChildren(done ? UICafe.icon('check') : document.createTextNode(String(i + 1)));
        });
        renderItems();
    }

    cancelBtn.addEventListener('click', async () => {
        const ok = await UICafe.confirm('Cancel this order? This cannot be undone.', {
            confirmLabel: 'Cancel order', cancelLabel: 'Keep order'
        });
        if (!ok) return;
        try {
            if (typeof UICafe.hooks.onCancelOrder === 'function') await UICafe.hooks.onCancelOrder(id);
            else if (UICafe.config.DEMO_MODE) UICafe.orders.setStatus('Cancelled');
            status = 'Cancelled';
            render();
            toast('Order cancelled');
        } catch (err) {
            toast((err && err.message) || 'Could not cancel the order.');
        }
    });

    render();
})();

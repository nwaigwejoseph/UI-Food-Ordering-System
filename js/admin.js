/* U.I Cafe — admin.js: order table actions and summary counts.
   Allowed moves (same as the database): Pending -> Cancelled, Paid -> Ready. */
(function () {
    'use strict';
    const body = UICafe.$('#orders-body');
    if (!body) return;
    const { $, $$, toast } = UICafe;

    const FLOW = {
        Pending: { label: 'Cancel', next: 'Cancelled', cls: 'btn-action--cancel' },
        Paid: { label: 'Mark Ready', next: 'Ready', cls: 'btn-action--ready' }
    };
    const PILL = { Pending: 'st-pending', Paid: 'st-paid', Ready: 'st-ready', Cancelled: 'st-cancelled' };

    function renderRow(tr) {
        const status = tr.dataset.status;
        const pill = document.createElement('span');
        pill.className = 'status-pill ' + (PILL[status] || '');
        pill.textContent = status;
        $('.cell-status', tr).replaceChildren(pill);

        const cell = $('.cell-action', tr);
        const step = FLOW[status];
        if (step) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'btn-action ' + step.cls;
            b.dataset.orderId = tr.dataset.orderId;
            b.textContent = step.label;
            b.setAttribute('aria-label', step.label + ' for order ' + tr.dataset.orderId);
            cell.replaceChildren(b);
        } else {
            const s = document.createElement('span');
            s.className = 'no-action';
            s.textContent = 'No Action';
            cell.replaceChildren(s);
        }
    }

    function renderCounts() {
        const count = (s) => $$('tr[data-status="' + s + '"]', body).length;
        $('#count-pending').textContent = count('Pending');
        $('#count-preparing').textContent = count('Paid'); // Paid = being prepared
        $('#count-ready').textContent = count('Ready');
        $('#orders-foot').replaceChildren(
            document.createTextNode('Showing '),
            Object.assign(document.createElement('b'), { textContent: String($$('tr', body).length) }),
            document.createTextNode(' recent orders')
        );
    }

    body.addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-action');
        if (!btn) return;
        const tr = btn.closest('tr');
        const id = tr.dataset.orderId;
        const step = FLOW[tr.dataset.status];
        if (!step) return;

        if (step.next === 'Cancelled') {
            const ok = await UICafe.confirm('Cancel order #' + id + '? This cannot be undone.', {
                confirmLabel: 'Cancel order', cancelLabel: 'Keep order'
            });
            if (!ok) return;
        }
        btn.disabled = true;
        try {
            const hook = step.next === 'Ready' ? UICafe.hooks.onMarkReady : UICafe.hooks.onCancelOrder;
            if (typeof hook === 'function') await hook(id);
            tr.dataset.status = step.next; // DEMO: the backend response should decide this
            renderRow(tr);
            renderCounts();
            toast('Order #' + id + (step.next === 'Ready' ? ' marked ready' : ' cancelled'));
        } catch (err) {
            btn.disabled = false;
            toast((err && err.message) || 'Could not update the order.');
        }
    });

    $$('tr', body).forEach(renderRow);
    renderCounts();
})();

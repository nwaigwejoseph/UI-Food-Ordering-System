/* U.I Cafe — menu.js: search, category filter, add to cart, soup picker */
(function () {
    'use strict';
    const grid = UICafe.$('#menu-grid');
    if (!grid) return;
    const { $, $$, cart } = UICafe;

    const cards = $$('.meal-card', grid);
    const search = $('#search-meals');
    const chips = $$('.chip');
    const emptyNote = $('#menu-empty');
    const status = $('#results-status');
    const clearBtn = $('#search-clear');
    const funnel = $('#search-funnel');
    let category = 'All';
    let query = '';

    /* ----- filter + search ----- */
    function apply() {
        const q = query.trim().toLowerCase();
        let shown = 0;
        cards.forEach((card) => {
            const isSoup = card.dataset.category === 'Soup';
            // Soups only appear under the Soup chip (they can't be ordered on their own)
            const inCategory = category === 'All' ? !isSoup : card.dataset.category === category;
            const ok = inCategory && (!q || card.dataset.name.toLowerCase().includes(q));
            card.hidden = !ok;
            if (ok) shown++;
        });
        emptyNote.hidden = shown > 0;
        status.textContent = UICafe.plural(shown, 'meal', 'meals') + ' shown';
    }

    function setCategory(name) {
        category = name;
        chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.category === name)));
        const active = chips.find((c) => c.dataset.category === name);
        if (active) active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
        apply();
    }
    chips.forEach((chip) => chip.addEventListener('click', () => setCategory(chip.dataset.category)));

    let timer;
    function onType() {
        clearBtn.hidden = !search.value;
        funnel.hidden = !!search.value;
        clearTimeout(timer);
        timer = setTimeout(() => { query = search.value; apply(); }, 120);
    }
    search.addEventListener('input', onType);
    clearBtn.addEventListener('click', () => { search.value = ''; onType(); search.focus(); });
    $('#search-form').addEventListener('submit', (e) => e.preventDefault());

    /* ----- add to cart ----- */
    function addToCart(meal, soup, btn) {
        const res = cart.add(meal, soup);
        if (!res.ok) {
            UICafe.toast('Only ' + res.max + ' of ' + meal.name + ' left in stock.');
            return;
        }
        UICafe.toast(meal.name + ' added to cart', {
            actionLabel: 'View cart',
            onAction: () => { window.location.href = 'cart.html'; }
        });
        if (btn) {
            const label = btn.textContent;
            btn.textContent = 'Added ✓';
            setTimeout(() => { btn.textContent = label; }, 1200);
        }
    }

    grid.addEventListener('click', (e) => {
        const hint = e.target.closest('.soup-hint-btn');
        if (hint) { UICafe.toast('Soups are free with any swallow. Pick a swallow to choose one.'); setCategory('Swallow'); return; }

        const btn = e.target.closest('.add-cart-btn');
        if (!btn || btn.disabled) return;
        const card = btn.closest('.meal-card');
        const img = $('img', card);
        const meal = {
            id: Number(card.dataset.id),
            name: card.dataset.name,
            price: Number(card.dataset.price),
            stock: Number(card.dataset.stock) || 0,
            category: card.dataset.category,
            img: img ? img.getAttribute('src') : ''
        };
        if (meal.category === 'Swallow') openSoup(meal);
        else addToCart(meal, null, btn);
    });

    /* ----- soup picker: a swallow must always come with a soup ----- */
    const dlg = $('#soup-modal');
    const soupForm = $('#soup-form');
    const radios = $$('input[name="soup"]', soupForm);
    let pending = null;

    function syncSelected() {
        radios.forEach((r) => r.closest('.btn-soup-select').classList.toggle('is-selected', r.checked));
    }
    radios.forEach((r) => r.addEventListener('change', syncSelected));

    function openSoup(meal) {
        pending = meal;
        $('#soup-for').textContent = meal.name;
        radios[0].checked = true;
        syncSelected();
        dlg.showModal();
    }

    soupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const chosen = radios.find((r) => r.checked);
        if (!chosen || !pending) return;
        const soup = { id: Number(chosen.value), shortName: chosen.dataset.name.replace(/ soup$/i, '') };
        const meal = pending;
        pending = null;
        dlg.close();
        addToCart(meal, soup, null);
    });
    $$('.btn-cancel-operation', dlg).forEach((b) => b.addEventListener('click', () => dlg.close()));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => { pending = null; });

    apply();
})();

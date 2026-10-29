/* U.I Cafe — auth.js: validation for signin.html and signup.html (no network calls) */
(function () {
    'use strict';
    const { $, $$ } = UICafe;
    const form = $('form[data-form]');
    if (!form) return;

    const type = form.dataset.form; // "signin" | "signup"
    const MATRIC = /^[A-Za-z0-9\/-]{3,20}$/; // e.g. 219084, STAFF-001, UI/ST/441

    const rules = {
        name: (v) => (v.trim().length >= 2 ? '' : 'Enter your full name.'),
        matric: (v) => (!v.trim() ? 'Enter your Matric/Staff ID.'
            : MATRIC.test(v.trim()) ? '' : 'Use letters, numbers, / or - (3 to 20 characters).'),
        'login-password': (v) => (v ? '' : 'Enter your password.'),
        'new-password': (v) => (v.length >= 8 ? '' : 'Use at least 8 characters.'),
        confirm: (v) => (v === $('[data-rule="new-password"]', form).value ? '' : 'Passwords do not match.')
    };

    function check(input) {
        const msg = rules[input.dataset.rule](input.value);
        const out = document.getElementById(input.id + '-error');
        if (out) out.textContent = msg;
        input.setAttribute('aria-invalid', msg ? 'true' : 'false');
        return msg;
    }

    $$('[data-rule]', form).forEach((input) => {
        input.addEventListener('blur', () => { if (input.value) check(input); });
        input.addEventListener('input', () => {
            if (input.getAttribute('aria-invalid') === 'true') check(input);
            if (input.dataset.rule === 'new-password') {
                const c = $('[data-rule="confirm"]', form);
                if (c && c.value) check(c);
            }
        });
    });

    const submitBtn = $('button[type="submit"]', form);
    const labelEl = $('.label', submitBtn);
    function setBusy(busy) {
        if (busy) { submitBtn.dataset.label = labelEl.textContent; labelEl.textContent = 'Please wait…'; }
        else if (submitBtn.dataset.label) { labelEl.textContent = submitBtn.dataset.label; }
        submitBtn.disabled = busy;
        submitBtn.setAttribute('aria-busy', String(busy));
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let firstBad = null;
        $$('[data-rule]', form).forEach((input) => {
            if (check(input) && !firstBad) firstBad = input;
        });
        if (firstBad) { firstBad.focus(); return; }

        const val = (name) => (form.elements[name] ? form.elements[name].value : '');
        const matric = val('matric_number').trim();
        setBusy(true);

        try {
            if (type === 'signin') {
                const remember = !!(form.elements.remember && form.elements.remember.checked);
                const payload = { matric, password: val('password'), remember };
                if (typeof UICafe.hooks.onLogin === 'function') {
                    await UICafe.hooks.onLogin(payload);
                } else if (UICafe.config.DEMO_MODE) {
                    // DEMO ONLY: staff IDs go to the admin page, everyone else to the menu.
                    const role = /^staff-/i.test(matric) ? 'admin' : 'student';
                    UICafe.store.set(UICafe.config.KEYS.session, { matric, role });
                    window.location.assign(role === 'admin' ? 'admin.html' : 'menu.html');
                    return;
                } else {
                    UICafe.toast('Sign in is not connected yet.');
                }
            } else {
                const payload = { name: val('full_name').trim(), matric, password: val('password') };
                if (typeof UICafe.hooks.onSignup === 'function') {
                    await UICafe.hooks.onSignup(payload);
                } else if (UICafe.config.DEMO_MODE) {
                    UICafe.toast('Account created. Please sign in.');
                    setTimeout(() => window.location.assign('signin.html'), 900);
                    return;
                } else {
                    UICafe.toast('Sign up is not connected yet.');
                }
            }
        } catch (err) {
            UICafe.toast((err && err.message) || 'Something went wrong. Please try again.');
        }
        setBusy(false);
    });

    const forgot = $('#forgot-password');
    if (forgot) {
        forgot.addEventListener('click', () =>
            UICafe.toast('Please contact the cafeteria admin to reset your password.'));
    }
})();

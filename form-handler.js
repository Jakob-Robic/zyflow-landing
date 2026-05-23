// Zyflow form handler — mirrors Framer form submissions to Vercel API
// Strategy: document-level click delegation (survives React hydration),
// read values at click time, fire API in background. Framer owns the UI.
(function () {
  function postToApi(endpoint, payload) {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.success) console.warn('[Zyflow] API error:', data.error);
      })
      .catch(function (err) { console.warn('[Zyflow] fetch failed:', err); });
  }

  function handleWaitlistForm(form) {
    var input = form.querySelector('input[name="Email"]');
    if (!input) return;
    var email = input.value.trim();
    if (!email || email.indexOf('@') < 0) return;
    postToApi('/api/waitlist', { email: email });
  }

  function handleContactForm(form) {
    var get = function (sel) {
      var el = form.querySelector(sel);
      return el ? el.value.trim() : '';
    };
    var name = get('input[name="Name"]');
    var subject = get('input[name="Subject"]');
    var email = get('input[name="Email"]');
    var message = get('textarea[name="Message"]');
    if (!name || !email || !message) return;
    postToApi('/api/contact', { name: name, subject: subject, email: email, message: message });
  }

  document.addEventListener('click', function (e) {
    var waitlistBtn = e.target.closest('form.framer-o5csdi button, form.framer-1hq1u9z button');
    if (waitlistBtn) {
      handleWaitlistForm(waitlistBtn.closest('form'));
      return;
    }

    var contactBtn = e.target.closest('form.framer-16m9ew3 button');
    if (contactBtn) {
      handleContactForm(contactBtn.closest('form'));
    }
  });
})();

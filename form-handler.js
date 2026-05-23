// Zyflow form handler — mirrors Framer form submissions to Vercel API
// Strategy: listen for button click (not submit), read values immediately,
// fire API in the background. Let Framer handle its own form UI entirely.
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

  document.addEventListener('DOMContentLoaded', function () {

    // Waitlist forms — email only
    document.querySelectorAll('form.framer-o5csdi').forEach(function (form) {
      var btn = form.querySelector('button');
      var input = form.querySelector('input[name="Email"]');
      if (!btn || !input) return;

      btn.addEventListener('click', function () {
        var email = input.value.trim();
        if (!email || email.indexOf('@') < 0) return; // basic validation, let Framer show its own error
        postToApi('/api/waitlist', { email: email });
      });
    });

    // Contact form
    var contactForm = document.querySelector('form.framer-16m9ew3');
    if (contactForm) {
      var btn = contactForm.querySelector('button');
      if (btn) {
        btn.addEventListener('click', function () {
          var get = function (sel) {
            var el = contactForm.querySelector(sel);
            return el ? el.value.trim() : '';
          };
          var name    = get('input[name="Name"]');
          var subject = get('input[name="Subject"]');
          var email   = get('input[name="Email"]');
          var message = get('textarea[name="Message"]');
          if (!name || !email || !message) return; // required fields missing
          postToApi('/api/contact', { name: name, subject: subject, email: email, message: message });
        });
      }
    }

  });
})();

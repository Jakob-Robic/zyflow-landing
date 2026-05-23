// Zyflow form handler — intercepts Framer forms and posts to Vercel API
(function () {
  function showMessage(form, text, isError) {
    var existing = form.querySelector('.zyflow-msg');
    if (existing) existing.remove();
    var msg = document.createElement('p');
    msg.className = 'zyflow-msg';
    msg.style.cssText = 'margin-top:12px;font-size:14px;font-weight:500;color:' + (isError ? '#e53e3e' : '#38a169');
    msg.textContent = text;
    form.appendChild(msg);
    setTimeout(function () { if (msg.parentNode) msg.remove(); }, 5000);
  }

  function handleForm(form, endpoint, getPayload) {
    form.addEventListener('submit', function (e) {
      console.log('[Zyflow] Form submit intercepted:', endpoint, getPayload(form));
      e.preventDefault();
      e.stopImmediatePropagation();

      var btn = form.querySelector('button[type="submit"], button');
      var originalText = btn ? btn.textContent : '';
      if (btn) btn.textContent = 'Sending…';

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getPayload(form)),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (btn) btn.textContent = originalText;
          if (data.success) {
            showMessage(form, '✓ Got it — thank you!', false);
            form.reset();
          } else {
            showMessage(form, data.error || 'Something went wrong. Please try again.', true);
          }
        })
        .catch(function () {
          if (btn) btn.textContent = originalText;
          showMessage(form, 'Connection error. Please try again.', true);
        });
    }, true); // capture phase — fires before Framer's handlers
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Waitlist forms (email only)
    document.querySelectorAll('form.framer-o5csdi').forEach(function (form) {
      handleForm(form, '/api/waitlist', function (f) {
        return { email: f.querySelector('input[name="Email"]').value };
      });
    });

    // Contact form
    var contactForm = document.querySelector('form.framer-16m9ew3');
    if (contactForm) {
      handleForm(contactForm, '/api/contact', function (f) {
        return {
          name: (f.querySelector('input[name="Name"]') || {}).value || '',
          subject: (f.querySelector('input[name="Subject"]') || {}).value || '',
          email: (f.querySelector('input[name="Email"]') || {}).value || '',
          message: (f.querySelector('textarea[name="Message"]') || {}).value || '',
        };
      });
    }
  });
})();

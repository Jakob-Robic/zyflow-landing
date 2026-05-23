// Zyflow form handler — intercepts Framer forms and posts to Vercel API
(function () {
  function showError(form, text) {
    var existing = form.querySelector('.zyflow-msg');
    if (existing) existing.remove();
    var msg = document.createElement('p');
    msg.className = 'zyflow-msg';
    msg.style.cssText = 'margin-top:12px;font-size:14px;font-weight:500;color:#e53e3e';
    msg.textContent = text;
    form.appendChild(msg);
    setTimeout(function () { if (msg.parentNode) msg.remove(); }, 5000);
  }

  function handleForm(form, endpoint, getPayload) {
    form.addEventListener('submit', function (e) {
      // Capture phase: prevent browser navigation, but let event keep propagating so
      // React's bubble-phase delegation still fires → Framer button state updates normally.
      // Do NOT call stopImmediatePropagation — that would kill React's handlers.
      e.preventDefault();

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getPayload(form)),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.success) {
            showError(form, data.error || 'Something went wrong. Please try again.');
          }
          // Success: Framer shows its own confirmation state — no custom message needed
        })
        .catch(function () {
          showError(form, 'Connection error. Please try again.');
        });
    }, true); // capture phase — fires before React's bubble delegation, preventing navigation
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

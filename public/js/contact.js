document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', submitContact);
});

async function submitContact(e) {
  e.preventDefault();
  const btn = e.submitter || e.target.querySelector('button[type="submit"]');
  const original = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting'; }
  try {
    const payload = {
      name: document.getElementById('cName').value.trim(),
      email: document.getElementById('cEmail').value.trim(),
      phone: document.getElementById('cPhone').value.trim(),
      message: document.getElementById('cMessage').value.trim(),
    };
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      showAlert('Thank you! We will contact you soon.', 'success');
      e.target.reset();
    } else {
      showAlert(data.error || 'Failed to send request', 'danger');
    }
  } catch (err) {
    console.error('Contact submit error', err);
    showAlert('Network error. Please try again.', 'danger');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = original; }
  }
}

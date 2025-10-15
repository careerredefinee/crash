let __workshops = [];

document.addEventListener('DOMContentLoaded', () => {
  ensureWorkshopRegisterModal();
  loadAllWorkshops();
});

async function loadAllWorkshops() {
  const container = document.getElementById('workshopsAll');
  if (!container) return;
  container.innerHTML = '<div class="text-muted">Loading...</div>';
  try {
    const res = await fetch('/api/workshops');
    const data = await res.json();
    const items = data.workshops || [];
    __workshops = items;
    if (!items.length) {
      container.innerHTML = '<p class="text-muted">No workshops available yet.</p>';
      return;
    }
    container.innerHTML = items.map(w => workshopCard(w)).join('');
  } catch (e) {
    console.error('Failed to load workshops', e);
    container.innerHTML = '<p class="text-danger">Failed to load workshops.</p>';
  }
}

function workshopCard(w) {
  const img = w.image ? `<img src="${w.image}" class="card-img-top" alt="${w.title}" style="height:200px; object-fit:cover;">`
    : `<div class="card-img-top d-flex align-items-center justify-content-center bg-light" style="height:200px;"><i class="fas fa-people-group text-secondary fs-1"></i></div>`;
  const pricing = (w.price && w.price > 0)
    ? `<span class="fw-bold">₹${w.price}</span> ${w.strikePrice && w.strikePrice > 0 ? `<span class="text-muted text-decoration-line-through ms-2">₹${w.strikePrice}</span>` : ''}`
    : 'Free';
  const dateText = w.dateTime ? new Date(w.dateTime).toLocaleString() : 'Coming soon';
  return `
  <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
    <div class="card h-100 shadow-sm">
      ${img}
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">${w.title || 'Workshop'}</h5>
        <p class="card-text text-muted small">${(w.description||'').substring(0,120)}${(w.description||'').length>120?'...':''}</p>
        <div class="small text-muted mb-2"><i class="fa-regular fa-calendar me-1"></i>${dateText}</div>
        <div class="mt-auto d-flex justify-content-between align-items-center">
          <div>${pricing}</div>
          <button class="btn btn-primary btn-sm" onclick="openWorkshopRegister('${w._id}', '${(w.title||'').replace(/'/g, "&#39;")}')">Register</button>
        </div>
      </div>
    </div>
  </div>`;
}

// Modal helpers (shared)
function ensureWorkshopRegisterModal() {
  if (document.getElementById('wsRegisterModal')) return;
  const html = `
  <div class=\"modal fade\" id=\"wsRegisterModal\" tabindex=\"-1\">
    <div class=\"modal-dialog\">
      <div class=\"modal-content\">
        <div class=\"modal-header\">
          <h5 class=\"modal-title\">Register - <span id=\"wsRegTitle\"></span></h5>
          <button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"modal\"></button>
        </div>
        <div class=\"modal-body\">
          <form id=\"wsRegForm\">
            <input type=\"hidden\" id=\"wsRegId\">\n            <div class=\"mb-3\">\n              <label class=\"form-label\">Name</label>\n              <input type=\"text\" class=\"form-control\" id=\"wsRegName\" required>\n            </div>\n            <div class=\"mb-3\">\n              <label class=\"form-label\">WhatsApp Number</label>\n              <input type=\"tel\" class=\"form-control\" id=\"wsRegWhatsapp\" required>\n            </div>\n            <div class=\"mb-3\">\n              <label class=\"form-label\">Gmail</label>\n              <input type=\"email\" class=\"form-control\" id=\"wsRegEmail\" required>\n            </div>\n            <div class=\"mb-3\">\n              <label class=\"form-label\">Message</label>\n              <textarea class=\"form-control\" id=\"wsRegMessage\" rows=\"3\"></textarea>\n            </div>\n            <div class=\"d-grid\">\n              <button type=\"submit\" class=\"btn btn-primary\">Submit</button>\n            </div>\n          </form>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('wsRegForm').addEventListener('submit', submitWorkshopRegisterForm);
}

window.openWorkshopRegister = function(id, title) {
  document.getElementById('wsRegId').value = id;
  document.getElementById('wsRegTitle').textContent = title || 'Workshop';
  ['wsRegName','wsRegWhatsapp','wsRegEmail','wsRegMessage'].forEach(i=>document.getElementById(i).value='');
  new bootstrap.Modal(document.getElementById('wsRegisterModal')).show();
}

async function submitWorkshopRegisterForm(e) {
  e.preventDefault();
  const btn = e.submitter || e.target.querySelector('button[type="submit"]');
  const original = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting'; }
  try {
    const id = document.getElementById('wsRegId').value;
    const payload = {
      name: document.getElementById('wsRegName').value.trim(),
      whatsapp: document.getElementById('wsRegWhatsapp').value.trim(),
      email: document.getElementById('wsRegEmail').value.trim(),
      message: document.getElementById('wsRegMessage').value.trim()
    };
    const res = await fetch(`/api/workshops/${id}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showAlert('Registration submitted. We will contact you soon.', 'success');
      const m = bootstrap.Modal.getInstance(document.getElementById('wsRegisterModal'));
      if (m) m.hide();
      e.target.reset();
    } else {
      showAlert(data.error || 'Failed to submit registration', 'danger');
    }
  } catch (err) {
    console.error('Register failed', err);
    showAlert('Network error. Please try again later.', 'danger');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = original; }
  }
}

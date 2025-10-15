let __crashCourses = [];

document.addEventListener('DOMContentLoaded', () => {
  ensureEnrollModal();
  loadAllCrashCourses();
});

async function loadAllCrashCourses() {
  const container = document.getElementById('crashCoursesAll');
  if (!container) return;
  container.innerHTML = '<div class="text-muted">Loading...</div>';
  try {
    const res = await fetch('/api/crash-courses');
    const data = await res.json();
    const courses = data.courses || [];
    __crashCourses = courses;
    if (!courses.length) {
      container.innerHTML = '<p class="text-muted">No crash courses available yet.</p>';
      return;
    }
    container.innerHTML = courses.map(c => crashCourseCard(c)).join('');
  } catch (e) {
    console.error('Failed to load crash courses', e);
    container.innerHTML = '<p class="text-danger">Failed to load crash courses.</p>';
  }
}

function crashCourseCard(c) {
  const img = c.image ? `<img src="${c.image}" class="card-img-top" alt="${c.title}" style="height:200px; object-fit:cover;">`
    : `<div class="card-img-top d-flex align-items-center justify-content-center bg-light" style="height:200px;"><i class="fas fa-graduation-cap text-secondary fs-1"></i></div>`;
  const duration = c.duration ? `<span class="badge bg-secondary me-2">${c.duration}</span>` : '';
  const pricing = (c.price && c.price > 0)
    ? `<span class="fw-bold">₹${c.price}</span> ${c.strikePrice && c.strikePrice > 0 ? `<span class="text-muted text-decoration-line-through ms-2">₹${c.strikePrice}</span>` : ''}`
    : '';
  return `
  <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
    <div class="card h-100 shadow-sm">
      ${img}
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">${c.title || 'Crash Course'}</h5>
        <p class="card-text text-muted small">${(c.description||'').substring(0,120)}${(c.description||'').length>120?'...':''}</p>
        <div class="mt-auto d-flex justify-content-between align-items-center">
          <div>${duration}${pricing}</div>
          <button class="btn btn-primary btn-sm" onclick="openEnroll('${c._id}')">Enroll</button>
        </div>
      </div>
    </div>
  </div>`;
}

function ensureEnrollModal() {
  if (document.getElementById('crEnrollModal')) return;
  const modalHtml = `
  <div class="modal fade" id="crEnrollModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Enroll - <span id="crEnrollTitle"></span></h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="crEnrollForm">
            <input type="hidden" id="crEnrollCourseId">
            <div class="mb-3">
              <label class="form-label">Name</label>
              <input type="text" class="form-control" id="crName" required>
            </div>
            <div class="mb-3">
              <label class="form-label">WhatsApp Number</label>
              <input type="tel" class="form-control" id="crWhatsapp" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Gmail</label>
              <input type="email" class="form-control" id="crEmail" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Message</label>
              <textarea class="form-control" id="crMessage" rows="3"></textarea>
            </div>
            <div class="d-grid">
              <button type="submit" class="btn btn-primary">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const form = document.getElementById('crEnrollForm');
  form.addEventListener('submit', submitEnrollForm);
}

window.openEnroll = function(courseId) {
  const course = __crashCourses.find(x => x._id === courseId);
  if (!course) return;
  document.getElementById('crEnrollCourseId').value = courseId;
  document.getElementById('crEnrollTitle').innerText = course.title || 'Crash Course';
  document.getElementById('crName').value = '';
  document.getElementById('crWhatsapp').value = '';
  document.getElementById('crEmail').value = '';
  document.getElementById('crMessage').value = '';
  const modal = new bootstrap.Modal(document.getElementById('crEnrollModal'));
  modal.show();
}

async function submitEnrollForm(e) {
  e.preventDefault();
  const btn = e.submitter || e.target.querySelector('button[type="submit"]');
  const original = btn ? btn.innerHTML : null;
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting'; }
  try {
    const id = document.getElementById('crEnrollCourseId').value;
    const payload = {
      name: document.getElementById('crName').value.trim(),
      whatsapp: document.getElementById('crWhatsapp').value.trim(),
      email: document.getElementById('crEmail').value.trim(),
      message: document.getElementById('crMessage').value.trim()
    };
    const res = await fetch(`/api/crash-courses/${id}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showAlert('Enrollment submitted. We will contact you soon.', 'success');
      const modalEl = document.getElementById('crEnrollModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      e.target.reset();
    } else {
      showAlert(data.error || 'Failed to submit enrollment', 'danger');
    }
  } catch (err) {
    console.error('Enroll failed', err);
    showAlert('Network error. Please try again later.', 'danger');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = original || 'Submit'; }
  }
}

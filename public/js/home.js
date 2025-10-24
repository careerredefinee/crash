// Home page specific JavaScript

document.addEventListener('DOMContentLoaded', function() {
    renderRecentCrashCourses();
    renderRecentWorkshops();
    initializeAnimations();
    ensureWorkshopRegisterModal();
    ensureCrashEnrollModal();
});

// --- Show success modal (for comments)
function showSuccessModal(title, message, soundUrl) {
    const titleEl = document.getElementById("successTitle");
    const msgEl = document.getElementById("successMessage");
    if (titleEl) titleEl.textContent = title || "Success!";
    if (msgEl) msgEl.textContent = message || "Action completed successfully.";

    const svg = document.getElementById("successTick");
    if (svg) {
        const oldSvg = svg.innerHTML;
        svg.innerHTML = oldSvg;
    }

    if (soundUrl) {
        new Audio(soundUrl).play().catch(() => {});
    }

    if (window.bootstrap) {
        const modalEl = document.getElementById("globalSuccessModal");
        if (modalEl) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    }
}

// --- Like button animation (pop effect)
function animateLikeButton(button) {
    const icon = button.querySelector("i");
    icon.style.transition = "transform 0.3s ease, color 0.3s ease";
    icon.style.transform = "scale(1.5)";
    icon.style.color = "red";

    setTimeout(() => {
        icon.style.transform = "scale(1)";
    }, 300);

    // Play popup click sound
    new Audio("https://actions.google.com/sounds/v1/cartoon/pop.ogg").play().catch(() => {});
}

// --- Render recent crash courses (limit 4)
async function renderRecentCrashCourses() {
    const container = document.getElementById('recentCrashCourses');
    if (!container) return;
    container.innerHTML = '<div class="text-muted">Loading...</div>';
    try {
        const res = await fetch('/api/crash-courses?limit=4');
        const data = await res.json();
        const courses = data.courses || [];
        if (!courses.length) {
            container.innerHTML = '<p class="text-muted">No crash courses yet.</p>';
            return;
        }
        container.innerHTML = courses.map(c => createCrashCourseCard(c)).join('');
    } catch (e) {
        console.error('Crash courses load error:', e);
        container.innerHTML = '<p class="text-danger">Failed to load crash courses.</p>';
    }
}

function createCrashCourseCard(c) {
    const currentPrice = (c.price && c.price > 0) ? `<span class="fw-bold">₹${c.price}</span>` : '';
    const strikePrice = (c.strikePrice && c.strikePrice > 0) ? `<span class="text-muted text-decoration-line-through">₹${c.strikePrice}</span>` : '';
    const durationHtml = c.duration ? `<span class="badge bg-secondary">${c.duration}</span>` : '';
    const img = c.image ? `<img src="${c.image}" class="card-img-top" alt="${c.title}" style="height:180px; object-fit:cover;">` :
        `<div class="card-img-top d-flex align-items-center justify-content-center bg-light" style="height:180px;"><i class="fas fa-graduation-cap text-secondary fs-1"></i></div>`;
    return `
    <div class="col-md-3 mb-4">
      <div class="card h-100 shadow-sm">
        ${img}
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${c.title || 'Crash Course'}</h5>
          <p class="card-text text-muted small">${(c.description || '').substring(0,100)}${(c.description||'').length>100?'...':''}</p>
          <div class="mt-auto">
            ${durationHtml ? `<div class="mb-2">${durationHtml}</div>` : ''}
            <div class="d-flex align-items-center gap-2">${strikePrice}${currentPrice}</div>
            <div class="mt-2 d-flex justify-content-between align-items-center">
              <a class="btn btn-outline-secondary btn-sm" href="/crash-courses/${c._id}/view">View More</a>
              <button class="btn btn-primary btn-sm" onclick="openCrashEnroll('${c._id}', '${(c.title||'Crash Course').replace(/'/g, "&#39;")}')">Enroll</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function ensureCrashEnrollModal() {
  if (document.getElementById('crEnrollModalHome')) return;
  const modalHtml = `
  <div class="modal fade" id="crEnrollModalHome" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Enroll - <span id="crEnrollTitleHome"></span></h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="crEnrollFormHome">
            <input type="hidden" id="crEnrollCourseIdHome">
            <div class="mb-3">
              <label class="form-label">Name</label>
              <input type="text" class="form-control" id="crNameHome" required>
            </div>
            <div class="mb-3">
              <label class="form-label">WhatsApp Number</label>
              <input type="tel" class="form-control" id="crWhatsappHome" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Gmail</label>
              <input type="email" class="form-control" id="crEmailHome" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Message</label>
              <textarea class="form-control" id="crMessageHome" rows="3"></textarea>
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
  document.getElementById('crEnrollFormHome').addEventListener('submit', submitCrashEnrollHome);
}

window.openCrashEnroll = function(id, title) {
  document.getElementById('crEnrollCourseIdHome').value = id;
  document.getElementById('crEnrollTitleHome').textContent = title || 'Crash Course';
  ['crNameHome','crWhatsappHome','crEmailHome','crMessageHome'].forEach(i=>document.getElementById(i).value='');
  new bootstrap.Modal(document.getElementById('crEnrollModalHome')).show();
}

async function submitCrashEnrollHome(e) {
  e.preventDefault();
  const btn = e.submitter || e.target.querySelector('button[type="submit"]');
  const original = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting'; }
  try {
    const id = document.getElementById('crEnrollCourseIdHome').value;
    const payload = {
      name: document.getElementById('crNameHome').value.trim(),
      whatsapp: document.getElementById('crWhatsappHome').value.trim(),
      email: document.getElementById('crEmailHome').value.trim(),
      message: document.getElementById('crMessageHome').value.trim()
    };
    const res = await fetch(`/api/crash-courses/${id}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showAlert('Enrollment submitted. We will contact you soon.', 'success');
      const m = bootstrap.Modal.getInstance(document.getElementById('crEnrollModalHome'));
      if (m) m.hide();
      e.target.reset();
    } else {
      showAlert(data.error || 'Failed to submit enrollment', 'danger');
    }
  } catch (err) {
    console.error('Crash enroll failed', err);
    showAlert('Network error. Please try again later.', 'danger');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = original; }
  }
}

// --- Render recent workshops (limit 4)
async function renderRecentWorkshops() {
    const container = document.getElementById('recentWorkshops');
    if (!container) return;
    container.innerHTML = '<div class="text-muted">Loading...</div>';
    try {
        const res = await fetch('/api/workshops?limit=4');
        const data = await res.json();
        const items = data.workshops || [];
        if (!items.length) {
            container.innerHTML = '<p class="text-muted">No workshops yet.</p>';
            return;
        }
        container.innerHTML = items.map(w => createWorkshopCard(w)).join('');
    } catch (e) {
        console.error('Workshops load error:', e);
        container.innerHTML = '<p class="text-danger">Failed to load workshops.</p>';
    }
}

function createWorkshopCard(w) {
    const img = w.image ? `<img src="${w.image}" class="card-img-top" alt="${w.title}" style="height:180px; object-fit:cover;">` :
        `<div class="card-img-top d-flex align-items-center justify-content-center bg-light" style="height:180px;"><i class="fas fa-people-group text-secondary fs-1"></i></div>`;
    const currentPrice = (w.price && w.price > 0) ? `<span class="fw-bold">₹${w.price}</span>` : '';
    const strikePrice = (w.strikePrice && w.strikePrice > 0) ? `<span class="text-muted text-decoration-line-through">₹${w.strikePrice}</span>` : '';
    const priceHtml = (strikePrice || currentPrice) ? `<div class="d-flex align-items-center gap-2">${strikePrice}${currentPrice}</div>` : '';
    const dateText = w.dateTime ? new Date(w.dateTime).toLocaleString() : 'Coming soon';
    return `
    <div class="col-md-3 mb-4">
      <div class="card h-100 shadow-sm">
        ${img}
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${w.title || 'Workshop'}</h5>
          <p class="card-text text-muted small">${(w.description || '').substring(0,100)}${(w.description||'').length>100?'...':''}</p>
          <div class="mb-2 text-muted small"><i class="fa-regular fa-calendar me-1"></i>${dateText}</div>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <div>${priceHtml}</div>
            <button class="btn btn-outline-primary btn-sm" onclick="openWorkshopRegister('${w._id}', '${(w.title||'').replace(/'/g, "&#39;")}')">Register</button>
          </div>
        </div>
      </div>
    </div>`;
}

function ensureWorkshopRegisterModal() {
  if (document.getElementById('wsRegisterModal')) return;
  const html = `
  <div class="modal fade" id="wsRegisterModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Register - <span id="wsRegTitle"></span></h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="wsRegForm">
            <input type="hidden" id="wsRegId">
            <div class="mb-3">
              <label class="form-label">Name</label>
              <input type="text" class="form-control" id="wsRegName" required>
            </div>
            <div class="mb-3">
              <label class="form-label">WhatsApp Number</label>
              <input type="tel" class="form-control" id="wsRegWhatsapp" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Gmail</label>
              <input type="email" class="form-control" id="wsRegEmail" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Message</label>
              <textarea class="form-control" id="wsRegMessage" rows="3"></textarea>
            </div>
            <div class="d-grid">
              <button type="submit" class="btn btn-primary">Submit</button>
            </div>
          </form>
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

// --- Render comments
function renderCommentsInline(comments) {
    if (!comments || !comments.length) return '<p class="text-muted">No comments yet</p>';
    return comments.map(c =>
        `<div class="border p-2 mb-2"><strong>${c.user?.name || 'Anonymous'}:</strong> ${c.comment}</div>`
    ).join('');
}

// --- Toggle comments
function toggleComments(id) {
    const section = document.getElementById(`comment-section-${id}`);
    section.style.display = (section.style.display === 'none' || !section.style.display) ? 'block' : 'none';
}

// --- Like blog
async function likeAdminBlog(id) {
    const user = await checkAuth();
    if (!user) {
        showAlert('Please login to like posts', 'warning');
        return;
    }
    try {
        const res = await fetch(`/api/blogs/${id}/like`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            document.getElementById(`like-count-${id}`).textContent = data.likesCount;
            animateLikeButton(document.getElementById(`like-btn-${id}`));
        }
    } catch (error) {
        console.error('Error liking blog:', error);
        showAlert('Failed to like post', 'danger');
    }
}

// --- Comment on blog
async function commentAdminBlog(id) {
    const user = await checkAuth();
    if (!user) {
        showAlert('Please login to comment', 'warning');
        return;
    }
    const comment = document.getElementById(`comment-input-${id}`).value.trim();
    if (!comment) return alert('Enter a comment');

    try {
        const res = await fetch(`/api/blogs/${id}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById(`comment-input-${id}`).value = '';
            loadAdminBlogs();
            showSuccessModal(
                "Comment Added!",
                "Your comment has been posted successfully.",
                "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
            );
        } else {
            showAlert('Failed to add comment', 'danger');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        showAlert('Failed to add comment', 'danger');
    }
}


// Initialize animations
function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.service-card, .stat-card, .feature-item, .blog-card').forEach(el => {
        observer.observe(el);
    });
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .service-card,
        .stat-card,
        .feature-item,
        .blog-card {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease;
        }
        
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}

// Handle hero section buttons
document.addEventListener('click', function(e) {
    if (e.target.matches('.hero-section .btn')) {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        
        if (href === '/courses' || href === '/services') {
            window.location.href = href;
        }
    }
});

// Add parallax effect to hero section
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const heroSection = document.querySelector('.hero-section');
    
    if (heroSection) {
        const rate = scrolled * -0.5;
        heroSection.style.transform = `translateY(${rate}px)`;
    }
});

// Statistics counter animation
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        element.textContent = Math.floor(start);
        
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        }
    }, 16);
}

// Trigger counter animation when stats come into view
const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statElement = entry.target.querySelector('h3');
            const targetValue = parseInt(statElement.textContent.replace(/\D/g, ''));
            
            if (targetValue) {
                animateCounter(statElement, targetValue);
                statObserver.unobserve(entry.target);
            }
        }
    });
});

document.querySelectorAll('.stat-card').forEach(card => {
    statObserver.observe(card);
});
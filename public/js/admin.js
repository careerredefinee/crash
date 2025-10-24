// Admin page JavaScript

// Show alert message
function showAlert(message, type = 'info') {
    // Check if alert container exists, if not create it
    let alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainer';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '20px';
        alertContainer.style.right = '20px';
        alertContainer.style.zIndex = '9999';
        document.body.appendChild(alertContainer);
    }
    // Create alert element
    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type} alert-dismissible fade show`;
    alertEl.role = 'alert';
    alertEl.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Add to container and auto-remove after 5 seconds
    alertContainer.appendChild(alertEl);
    setTimeout(() => {
        alertEl.classList.remove('show');
        setTimeout(() => alertEl.remove(), 150);
    }, 5000);
}

function showLoading(btn) {
    if (!btn) return '';
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing';
    btn.disabled = true;
    return original;
}

function hideLoading(btn, original) {
    if (!btn) return;
    btn.innerHTML = original;
    btn.disabled = false;
}

// Load workshops
async function loadWorkshops() {
    try {
        const res = await fetch('/api/workshops');
        const payload = await res.json();
        const workshops = payload.workshops || [];
        const grid = document.getElementById('workshopsGrid');
        if (!grid) return;
        grid.innerHTML = '';
        workshops.forEach(ws => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4 mb-4';
            const imgHtml = ws.image ? `<img src="${ws.image}" class="card-img-top" style="height:200px;object-fit:cover;">` : '';
            const priceHtml = ws.price && ws.price > 0
                ? `₹${ws.price}${ws.strikePrice ? ` <span class='text-muted text-decoration-line-through ms-1'>₹${ws.strikePrice}</span>` : ''}`
                : 'Free';
            const dateText = ws.dateTime ? new Date(ws.dateTime).toLocaleString() : 'Coming soon';
            col.innerHTML = `
                <div class="card">
                    ${imgHtml}
                    <div class="card-body">
                        <h6 class="card-title">${ws.title}</h6>
                        <p class="card-text text-muted small">${truncateText(ws.description || '', 80)}</p>
                        <div class="small text-muted mb-2"><i class="fa-regular fa-calendar me-1"></i>${dateText}</div>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-success fw-bold">${priceHtml}</span>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-primary" onclick="startEditWorkshop('${ws._id}')">
                                    <i class="fas fa-pen"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteWorkshop('${ws._id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;
            grid.appendChild(col);
        });
    } catch (err) {
        console.error('Error loading workshops:', err);
    }
}

// Add workshop handler (multipart form)
async function handleAddWorkshop(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const original = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving'; }
    try {
        const fd = new FormData();
        fd.append('title', document.getElementById('wsTitle').value.trim());
        fd.append('description', document.getElementById('wsDesc').value.trim());
        const price = document.getElementById('wsPrice').value;
        const strike = document.getElementById('wsStrike').value;
        const dt = document.getElementById('wsDateTime').value;
        const img = document.getElementById('wsImage').files[0];
        if (price) fd.append('price', price);
        if (strike) fd.append('strikePrice', strike);
        if (dt) fd.append('dateTime', dt);
        if (img) fd.append('image', img);
        const res = await fetch('/api/admin/workshops', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data.success) {
            showAlert('Workshop added', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addWorkshopModal'));
            if (modal) modal.hide();
            form.reset();
            await loadWorkshops();
            await loadDashboardStats();
        } else {
            showAlert(data.error || 'Failed to add workshop', 'danger');
        }
    } catch (err) {
        console.error('Add workshop error', err);
        showAlert('Failed to add workshop', 'danger');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = original; }
    }
}

// Delete workshop
async function deleteWorkshop(id) {
    if (!confirm('Delete this workshop?')) return;
    try {
        const res = await fetch(`/api/admin/workshops/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && data.success) {
            showAlert('Workshop deleted', 'success');
            await loadWorkshops();
            await loadDashboardStats();
        } else {
            showAlert(data.error || 'Failed to delete workshop', 'danger');
        }
    } catch (err) {
        console.error('Delete workshop error', err);
    }
}

// Load Crash Course Enrollments
async function loadCrashEnrollments() {
    try {
        const res = await fetch('/api/admin/crash-course-enrollments');
        const data = await res.json();
        const tbody = document.getElementById('crashEnrollTbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        const list = data.enrollments || [];
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No enrollments</td></tr>';
            return;
        }
        list.forEach(it => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${it.course?.title || '-'}</td>
                <td>${it.name}</td>
                <td>${it.whatsapp}</td>
                <td>${it.email}</td>
                <td>${it.message || ''}</td>
                <td>${new Date(it.createdAt).toLocaleString()}</td>
                <td><button class="btn btn-sm btn-danger" onclick="deleteCrashEnrollment('${it._id}')"><i class="fas fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('loadCrashEnrollments error', err);
    }
}

async function deleteCrashEnrollment(id) {
    if (!confirm('Delete this enrollment?')) return;
    try {
        const res = await fetch(`/api/admin/crash-course-enrollments/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && data.success) {
            showAlert('Enrollment deleted', 'success');
            loadCrashEnrollments();
        } else {
            showAlert(data.error || 'Failed to delete enrollment', 'danger');
        }
    } catch (err) {
        console.error('deleteCrashEnrollment error', err);
    }
}

// Load Workshop Registrations
async function loadWorkshopRegistrations() {
    try {
        const res = await fetch('/api/admin/workshop-registrations');
        const data = await res.json();
        const tbody = document.getElementById('workRegTbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        const list = data.registrations || [];
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No registrations</td></tr>';
            return;
        }
        list.forEach(it => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${it.workshop?.title || '-'}</td>
                <td>${it.name}</td>
                <td>${it.whatsapp}</td>
                <td>${it.email}</td>
                <td>${it.message || ''}</td>
                <td>${new Date(it.createdAt).toLocaleString()}</td>
                <td><button class="btn btn-sm btn-danger" onclick="deleteWorkshopRegistration('${it._id}')"><i class="fas fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('loadWorkshopRegistrations error', err);
    }
}

async function deleteWorkshopRegistration(id) {
    if (!confirm('Delete this registration?')) return;
    try {
        const res = await fetch(`/api/admin/workshop-registrations/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && data.success) {
            showAlert('Registration deleted', 'success');
            loadWorkshopRegistrations();
        } else {
            showAlert(data.error || 'Failed to delete registration', 'danger');
        }
    } catch (err) {
        console.error('deleteWorkshopRegistration error', err);
    }
}

function showAddWorkshopModal() {
    const modal = new bootstrap.Modal(document.getElementById('addWorkshopModal'));
    modal.show();
}

// Helper to format Date to input[type=datetime-local] value (local time)
function toDatetimeLocalValue(date) {
    if (!date) return '';
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

let editingWorkshopId = null;

async function startEditWorkshop(id) {
    try {
        const res = await fetch(`/api/workshops/${id}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
            showAlert(data.error || 'Failed to fetch workshop', 'danger');
            return;
        }
        const ws = data.workshop;
        editingWorkshopId = ws._id;
        const modalEl = document.getElementById('editWorkshopModal');
        const titleEl = document.getElementById('ewTitle');
        const descEl = document.getElementById('ewDesc');
        const priceEl = document.getElementById('ewPrice');
        const strikeEl = document.getElementById('ewStrike');
        const dtEl = document.getElementById('ewDateTime');

        if (!modalEl || !titleEl || !descEl || !priceEl || !strikeEl || !dtEl) {
            showAlert('Edit modal not ready. Please refresh the page and try again.', 'danger');
            return;
        }

        titleEl.value = ws.title || '';
        descEl.value = ws.description || '';
        priceEl.value = typeof ws.price === 'number' ? ws.price : '';
        strikeEl.value = typeof ws.strikePrice === 'number' ? ws.strikePrice : '';
        dtEl.value = ws.dateTime ? toDatetimeLocalValue(ws.dateTime) : '';

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    } catch (err) {
        console.error('startEditWorkshop error', err);
        showAlert('Failed to start editing workshop', 'danger');
    }
}

async function handleEditWorkshop(e) {
    e.preventDefault();
    if (!editingWorkshopId) {
        showAlert('No workshop selected', 'danger');
        return;
    }
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const original = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving'; }
    try {
        const fd = new FormData();
        fd.append('title', document.getElementById('ewTitle').value.trim());
        fd.append('description', document.getElementById('ewDesc').value.trim());
        const price = document.getElementById('ewPrice').value;
        const strike = document.getElementById('ewStrike').value;
        const dt = document.getElementById('ewDateTime').value;
        const img = document.getElementById('ewImage').files[0];
        if (price !== '') fd.append('price', price);
        if (strike !== '') fd.append('strikePrice', strike);
        // Allow clearing date (Coming soon)
        fd.append('dateTime', dt);
        if (img) fd.append('image', img);

        const res = await fetch(`/api/admin/workshops/${editingWorkshopId}`, { method: 'PUT', body: fd });
        const data = await res.json();
        if (res.ok && data.success) {
            showAlert('Workshop updated', 'success');
            const modalEl = document.getElementById('editWorkshopModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            form.reset();
            editingWorkshopId = null;
            await loadWorkshops();
            await loadDashboardStats?.();
        } else {
            showAlert(data.error || 'Failed to update workshop', 'danger');
        }
    } catch (err) {
        console.error('handleEditWorkshop error', err);
        showAlert('Failed to update workshop', 'danger');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = original; }
    }
}

// Check if user is authenticated and admin
async function checkAdminAuth() {
    try {
        const response = await fetch('/api/check-auth', {
            credentials: 'include' // Include cookies for session
        });
        
        if (!response.ok) {
            throw new Error('Not authenticated');
        }
        
        const data = await response.json();
        if (!data.user || !data.user.isAdmin) {
            throw new Error('Admin access required');
        }
        
        return data.user;
    } catch (error) {
        console.error('Authentication check failed:', error);
        window.location.href = '/login.html';
        return null;
    }
}

let currentAdmin = null;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check admin authentication
        currentAdmin = await checkAdminAuth();
        if (!currentAdmin) return;

        // Set admin name in the UI
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl) {
            adminNameEl.textContent = currentAdmin.name || 'Admin';
        }

        // Initialize DataTables if they exist
        if (typeof $.fn.DataTable !== 'undefined' && $('#resumesTable').length) {
            if ($.fn.DataTable.isDataTable('#resumesTable')) {
                $('#resumesTable').DataTable().destroy();
            }
        }

        // Load only required sections
        const loaders = [
            loadDashboardStats,
            loadUsers,
            loadCourses,
            loadWorkshops,
            loadCallRequests,
            loadCrashEnrollments,
            loadWorkshopRegistrations
        ];

        // Execute loaders sequentially with error handling
        for (const loader of loaders) {
            try {
                if (typeof loader === 'function') {
                    await loader();
                }
            } catch (error) {
                console.error(`Error in ${loader.name}:`, error);
                // Continue with other loaders even if one fails
            }
        }
        
        // Initialize tooltips
        if (typeof $ !== 'undefined' && typeof $.fn.tooltip === 'function') {
            $('[data-bs-toggle="tooltip"]').tooltip();
        }
        
        // Set up tab event listeners
        const callRequestsTab = document.querySelector('a[href="#callrequests"]');
        const enrollmentsTab = document.querySelector('a[href="#enrollments"]');
        const resumesTab = document.querySelector('a[href="#resumes"]');
        
        if (callRequestsTab) {
            callRequestsTab.addEventListener('shown.bs.tab', loadCallRequests);
        }
        
        if (resumesTab) {
            resumesTab.addEventListener('shown.bs.tab', loadResumes);
        }
        
        // Fallback: manual tab switching + deep-linking via hash
        function activateTab(hash) {
            if (!hash) return;
            const link = document.querySelector(`a[data-bs-toggle="tab"][href="${hash}"]`);
            const pane = document.querySelector(hash);
            if (!pane) return;
            // Deactivate all
            document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(a => a.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active','show'));
            // Activate selected
            if (link) link.classList.add('active');
            pane.classList.add('active','show');
            // Lazy-load per-tab content
            if (hash === '#workshops') loadWorkshops();
            if (hash === '#courses') loadCourses?.();
            if (hash === '#users') loadUsers?.();
            if (hash === '#enrollments') { loadCrashEnrollments(); loadWorkshopRegistrations(); }
            if (hash === '#callrequests') loadCallRequests();
            if (hash === '#reminders') loadReminders?.();
        }

        // Click handling on sidebar links
        document.querySelectorAll('.sidebar a[data-bs-toggle="tab"]').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const href = a.getAttribute('href');
                history.replaceState(null, '', href);
                activateTab(href);
            });
        });

        // On load, open hash tab if present
        if (location.hash) {
            activateTab(location.hash);
        }
        
        // Initialize forms with null checks
        const addCourseForm = document.getElementById('addCourseForm');
        const addWorkshopForm = document.getElementById('addWorkshopForm');
        const editWorkshopForm = document.getElementById('editWorkshopForm');
        
        if (addCourseForm) {
            addCourseForm.addEventListener('submit', handleAddCourse);
        }
        
        if (addWorkshopForm) {
            addWorkshopForm.addEventListener('submit', handleAddWorkshop);
        }
        if (editWorkshopForm) {
            editWorkshopForm.addEventListener('submit', handleEditWorkshop);
        }
        
    } catch (error) {
        console.error('Error initializing admin dashboard:', error);
        showAlert('Failed to initialize admin dashboard. Please try again.', 'danger');
    }
});

// Expose functions globally for inline onclick usage in admin.html
window.showAddWorkshopModal = showAddWorkshopModal;
window.showAddCourseModal = showAddCourseModal;
window.handleAddWorkshop = handleAddWorkshop;
window.startEditWorkshop = startEditWorkshop;
window.handleEditWorkshop = handleEditWorkshop;
window.deleteWorkshop = deleteWorkshop;
window.showAddReminderModal = showAddReminderModal;
window.submitReminder = submitReminder;
window.editReminderLink = editReminderLink;
window.deleteReminder = deleteReminder;

// Load dashboard statistics (only required widgets)
async function loadDashboardStats() {
    try {
        const [usersRes, coursesRes, workshopsRes] = await Promise.all([
            fetch('/api/admin/users'),
            fetch('/api/crash-courses'),
            fetch('/api/workshops')
        ]);
        const users = await usersRes.json();
        const coursesPayload = await coursesRes.json();
        const workshopsPayload = await workshopsRes.json();
        const usersEl = document.getElementById('totalUsers');
        if (usersEl) usersEl.textContent = (users || []).length;
        const coursesEl = document.getElementById('totalCourses');
        if (coursesEl) coursesEl.textContent = (coursesPayload.courses || []).length;
        const wsCountEl = document.getElementById('totalworkshops');
        if (wsCountEl) wsCountEl.textContent = (workshopsPayload.workshops || []).length;
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        const users = await response.json();
        
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name || 'N/A'}</td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>${formatDate(user.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Load courses
async function loadCourses() {
    try {
        const response = await fetch('/api/crash-courses');
        const payload = await response.json();
        const courses = payload.courses || [];
        
        const coursesGrid = document.getElementById('coursesGrid');
        coursesGrid.innerHTML = '';
        
        courses.forEach(course => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4 mb-4';
            col.innerHTML = `
                <div class="card">
                    ${course.image ? `<img src="${course.image}" class="card-img-top" style="height: 200px; object-fit: cover;">` : ''}

                    <div class="card-body">
                        <h6 class="card-title">${course.title}</h6>
                        <p class="card-text text-muted small">${truncateText(course.description || '', 80)}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-success fw-bold">₹${course.price || 0}${course.strikePrice ? ` <span class='text-muted text-decoration-line-through ms-1'>₹${course.strikePrice}</span>` : ''}</span>
                            <button class="btn btn-sm btn-danger" onclick="deleteCourse('${course._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            coursesGrid.appendChild(col);
        });
        
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// Load jobs
async function loadJobs() {
    try {
        const response = await fetch('/api/jobs');
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to load jobs');
        }
        
        const jobs = data.jobs || [];
        const jobsGrid = document.getElementById('jobsGrid');
        if (!jobsGrid) return;
        
        jobsGrid.innerHTML = '';
        
        jobs.forEach(job => {
            const col = document.createElement('div');
            col.className = 'col-md-6 mb-4';
            col.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title">${job.title}</h6>
                        <p class="text-primary mb-1">${job.company}</p>
                        <p class="text-muted small mb-2">${job.location} • ${job.salary}</p>
                        <p class="card-text small">${truncateText(job.description, 100)}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">${timeAgo(job.createdAt)}</small>
                            <button class="btn btn-sm btn-danger" onclick="deleteJob('${job._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            jobsGrid.appendChild(col);
        });
        
    } catch (error) {
        console.error('Error loading jobs:', error);
    }
}

// Load course queries
async function loadCourseQueries() {
    try {
        const response = await fetch('/api/admin/course-queries');
        const queries = await response.json();
        
        const tbody = document.getElementById('queriesTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        queries.forEach(query => {
            const row = document.createElement('tr');
            const statusClass = query.status === 'replied' ? 'success' : query.status === 'pending' ? 'warning' : 'secondary';
            
            row.innerHTML = `
                <td><strong>${query.name || 'Anonymous'}</strong><br><small class="text-muted">${query.email || 'No email'}</small></td>
                <td>${query.courseTitle || 'N/A'}</td>
                <td>
                    <div class="query-message" style="max-width: 300px;">
                        ${truncateText(query.message, 100)}
                        ${query.phone ? `<br><small class="text-muted">Phone: ${query.phone}</small>` : ''}
                        ${query.reply ? `<br><span class='badge bg-success mt-2'><i class='fas fa-reply me-1'></i>Admin Reply: ${truncateText(query.reply, 80)}</span>` : ''}
                    </div>
                </td>
                <td>${formatDate(query.createdAt)}</td>
                <td>
                    <span class="badge bg-${statusClass}">${query.status.charAt(0).toUpperCase() + query.status.slice(1)}</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        ${query.status === 'pending' ? `
                            <button class="btn btn-outline-primary" onclick="showReplyQueryModal('${query._id}', '${query.name || ''}', '${query.message.replace(/'/g, '\'') || ''}')" title="Reply">
                                <i class="fas fa-reply"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-outline-danger" onclick="deleteQuery('${query._id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Modal for replying to queries
        if (!document.getElementById('replyQueryModal')) {
            const modal = document.createElement('div');
            modal.innerHTML = `
            <div class="modal fade" id="replyQueryModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Reply to Query</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-2"><b id="replyQueryUser"></b></div>
                            <div class="mb-2" id="replyQueryMessage"></div>
                            <textarea class="form-control" id="replyQueryAnswer" rows="3" placeholder="Type your answer..."></textarea>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="submitQueryReply()">Send Answer</button>
                        </div>
                    </div>
                </div>
            </div>`;
            document.body.appendChild(modal);
        }

        window.showReplyQueryModal = function(queryId, userName, userMessage) {
            window._currentQueryId = queryId;
            document.getElementById('replyQueryUser').innerText = userName || '';
            document.getElementById('replyQueryMessage').innerText = userMessage || '';
            document.getElementById('replyQueryAnswer').value = '';
            const modal = new bootstrap.Modal(document.getElementById('replyQueryModal'));
            modal.show();
        };

        window.submitQueryReply = async function() {
            const answer = document.getElementById('replyQueryAnswer').value;
            if (!answer || !window._currentQueryId) return;
            try {
                const res = await fetch(`/api/admin/course-queries/reply/${window._currentQueryId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ answer })
                });
                if (res.ok) {
                    // Refresh queries
                    loadCourseQueries();
                    const modal = bootstrap.Modal.getInstance(document.getElementById('replyQueryModal'));
                    modal.hide();
                } else {
                    alert('Failed to send answer.');
                }
            } catch (err) {
                alert('Error sending answer.');
            }
        };
        
    } catch (error) {
        console.error('Error loading course queries:', error);
    }
}

// Load blogs
async function loadBlogs() {
    try {
        const response = await fetch('/api/blogs');
        const blogs = await response.json();
        
        const blogsGrid = document.getElementById('blogsGrid');
        blogsGrid.innerHTML = '';
        
        blogs.forEach(blog => {
            const col = document.createElement('div');
            col.className = 'col-md-6 mb-4';
            col.innerHTML = `
                <div class="card">
                    ${blog.image ? `<img src="${blog.image}" class="card-img-top" style="height: 150px; object-fit: cover;">` : ''}
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title mb-0">${blog.title}</h6>
                            <span class="badge ${blog.isAdmin ? 'bg-primary' : 'bg-secondary'}">${blog.isAdmin ? 'Admin' : 'User'}</span>
                        </div>
                        <p class="card-text small">${truncateText(blog.content, 100)}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                ${blog.likes?.length || 0} likes • ${blog.comments?.length || 0} comments
                            </small>
                            <button class="btn btn-sm btn-danger" onclick="deleteBlog('${blog._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            blogsGrid.appendChild(col);
        });
        
    } catch (error) {
        console.error('Error loading blogs:', error);
    }
}

// Load appointments
async function loadAppointments() {
    try {
        const response = await fetch('/api/appointments');
        const appointments = await response.json();

        const tbody = document.getElementById('appointmentsTableBody');
        tbody.innerHTML = '';

        appointments.forEach(appointment => {
            const row = document.createElement('tr');
            let statusLabel = '';
            if (appointment.status === 'approved') {
                statusLabel = '<span class="badge bg-success">Approved</span>';
            } else if (appointment.status === 'rejected') {
                statusLabel = '<span class="badge bg-danger">Rejected</span>';
            } else {
                statusLabel = `<span class="badge bg-secondary">${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>`;
            }

            // Meeting link cell
            let linkCell = '-';
            if (appointment.status === 'approved') {
                if (appointment.meetingLink) {
                    linkCell = `<a href="${appointment.meetingLink}" target="_blank">Meeting Link</a> 
                                <button class="btn btn-sm btn-outline-info ms-2" 
                                    onclick="editInlineMeetingLink('${appointment._id}', '${appointment.meetingLink.replace(/'/g, "\\'") || ''}')">
                                    <i class="fas fa-edit"></i>
                                </button>`;
                } else {
                    linkCell = `<span class="text-muted">No meeting link</span>`;
                }
            }

            row.innerHTML = `
                <td>${appointment.user?.name || 'N/A'}</td>
                <td>${formatDate(appointment.date)}</td>
                <td>${appointment.time}</td>
                <td>${truncateText(appointment.reason, 50)}</td>
                <td>${statusLabel}</td>
                <td>
                    <div class="btn-group btn-group-sm mb-1">
                        <button class="btn btn-success" 
                            onclick="showMeetingLinkInput('${appointment._id}')"
                            ${appointment.status === 'approved' ? 'disabled' : ''}>
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-warning" 
                            onclick="sendStatusUpdate('${appointment._id}', { status: 'rejected' })"
                            ${appointment.status === 'rejected' ? 'disabled' : ''}>
                            <i class="fas fa-times"></i>
                        </button>
                        <button class="btn btn-danger" 
                            onclick="deleteAppointment('${appointment._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div id="linkCell_${appointment._id}">${linkCell}</div>
                </td>
            `;
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

// Show meeting link input instead of approving instantly
function showMeetingLinkInput(appointmentId) {
    const linkCell = document.getElementById(`linkCell_${appointmentId}`);
    if (linkCell) {
        linkCell.innerHTML = `
            <input type='text' id='inlineMeetingLinkInput_${appointmentId}' 
                class='form-control d-inline-block w-auto' placeholder='Paste meeting link'>
            <button class='btn btn-sm btn-success ms-1' onclick="saveAndApprove('${appointmentId}')">Save & Approve</button>
            <button class='btn btn-sm btn-secondary ms-1' onclick="loadAppointments()">Cancel</button>
        `;
    }
}

// Save meeting link and approve
async function saveAndApprove(appointmentId) {
    const input = document.getElementById(`inlineMeetingLinkInput_${appointmentId}`);
    if (!input) return;

    const meetingLink = input.value.trim();
    if (!meetingLink) {
        showAlert('Please enter a meeting link', 'warning');
        return;
    }

    await sendStatusUpdate(appointmentId, { status: 'approved', meetingLink });
}

// Send PUT request to server
async function sendStatusUpdate(appointmentId, bodyData) {
    try {
        const res = await fetch(`/api/appointments/${appointmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        if (res.ok) {
            showAlert(`Appointment ${bodyData.status} successfully`, 'success');
            loadAppointments();
        } else {
            const error = await res.json();
            showAlert(error.error || `Failed to ${bodyData.status} appointment`, 'danger');
        }
    } catch (err) {
        console.error(err);
        showAlert(`Failed to ${bodyData.status} appointment`, 'danger');
    }
}


async function deleteAppointment(appointmentId) {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
        const response = await fetch(`/api/appointments/${appointmentId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Appointment deleted successfully!', 'success');
            loadAppointments();
            loadDashboardStats();
        } else {
            showAlert('Failed to delete appointment', 'danger');
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        showAlert('Failed to delete appointment', 'danger');
    }
}

async function loadComments() {
  try {
    const res = await fetch('/api/admin/comments');
    const comments = await res.json();

    const tbody = document.getElementById('commentsTableBody');
    tbody.innerHTML = '';

    if (!comments.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No comments found</td></tr>`;
      return;
    }

    comments.forEach(c => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${c.userName}</td>
        <td>${c.userEmail}</td>
        <td>${c.comment}</td>
        <td>${c.blogTitle}</td>
        <td>${new Date(c.createdAt).toLocaleString()}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteComment('${c.blogId}', '${c.commentId}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error('Failed to load comments:', err);
  }
}

async function deleteComment(blogId, commentId) {
  if (!confirm('Are you sure you want to delete this comment?')) return;
  try {
    const res = await fetch(`/api/admin/comments/${blogId}/${commentId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showAlert('Comment deleted successfully!', 'success');
      loadComments();
    } else {
      showAlert('Failed to delete comment', 'danger');
    }
  } catch (err) {
    console.error('Error deleting comment:', err);
    showAlert('Failed to delete comment', 'danger');
  }
}

// Load reviews
async function loadReviews() {
    try {
        const response = await fetch('/api/reviews');
        const reviews = await response.json();
        
        const reviewsGrid = document.getElementById('reviewsGrid');
        reviewsGrid.innerHTML = '';
        
        reviews.forEach(review => {
            const col = document.createElement('div');
            col.className = 'col-md-6 mb-4';
            col.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h6 class="mb-1">${review.user?.name || 'Anonymous'}</h6>
                                <div class="rating">
                                    ${generateStarRating(review.rating)}
                                </div>
                            </div>
                            <button class="btn btn-sm btn-danger" onclick="deleteReview('${review._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <p class="card-text small">${review.comment}</p>
                        <small class="text-muted">${timeAgo(review.createdAt)}</small>
                    </div>
                </div>
            `;
            reviewsGrid.appendChild(col);
        });
        
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Load payments for review
async function loadPayments() {
    const paymentsContainer = document.getElementById('paymentsContainer');
    if (!paymentsContainer) {
        console.log('Payments container not found, skipping payments load');
        return;
    }

    try {
        const response = await fetch('/api/admin/payments');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const payments = await response.json();
        allPayments = payments || [];
        displayPayments(allPayments);
    } catch (error) {
        console.error('Error loading payments:', error);
        const errorMessage = `Failed to load payments: ${error.message}`;
        showAlert(errorMessage, 'danger');
        paymentsContainer.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${errorMessage}
            </div>
        `;
    }
}

// Load premium data
async function loadPremiumData() {
    try {
        // Load premium stats
        const [usersRes, assessmentsRes, materialsRes, groupsRes, paymentsRes] = await Promise.all([
            fetch('/api/admin/premium/users'),
            fetch('/api/admin/premium/assessments'),
            fetch('/api/admin/premium/materials'),
            fetch('/api/admin/premium/groups'),
            fetch('/api/admin/premium/payments')
        ]);
        
        const users = await usersRes.json();
        const assessments = await assessmentsRes.json();
        const materials = await materialsRes.json();
        const groups = await groupsRes.json();
        const payments = await paymentsRes.json();
        
        // Update premium stats
        if (document.getElementById('totalPremiumUsers')) {
            document.getElementById('totalPremiumUsers').textContent = users.length;
            document.getElementById('activePremiumUsers').textContent = users.filter(u => u.isActive).length;
            document.getElementById('totalAssessments').textContent = assessments.length;
            document.getElementById('totalGroups').textContent = groups.length;
        }
        
        // Load premium users table
        loadPremiumUsers(users);
        loadPremiumAssessments(assessments);
        loadPremiumMaterials(materials);
        loadPremiumGroups(groups);
        loadPremiumPayments(payments);
        
    } catch (error) {
        console.error('Error loading premium data:', error);
    }
}

// Load premium users
function loadPremiumUsers(users) {
    const tbody = document.getElementById('premiumUsersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${user.premiumId}</strong></td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>
                <span class="badge bg-${user.isActive ? 'success' : 'secondary'}">
                    ${user.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-warning" onclick="resetPremiumPassword('${user._id}')" title="Reset Password">
                        <i class="fas fa-key"></i>
                    </button>
                    <button class="btn btn-outline-${user.isActive ? 'secondary' : 'success'}" 
                            onclick="togglePremiumUserStatus('${user._id}', ${!user.isActive})" 
                            title="${user.isActive ? 'Deactivate' : 'Activate'}">
                        <i class="fas fa-${user.isActive ? 'pause' : 'play'}"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deletePremiumUser('${user._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Load premium payments with delete functionality
function loadPremiumPayments(payments) {
    const tbody = document.getElementById('premiumPaymentsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    payments.forEach(payment => {
        const row = document.createElement('tr');
        const statusClass = payment.status === 'approved' ? 'success' : payment.status === 'rejected' ? 'danger' : 'warning';
        
        row.innerHTML = `
            <td>${formatDate(payment.createdAt)}</td>
            <td>
                <div>
                    <strong>${payment.userName || 'N/A'}</strong><br>
                    <small class="text-muted">${payment.userEmail || 'No email'}</small>
                </div>
            </td>
            <td>₹${payment.amount}</td>
            <td>
                ${payment.screenshot ? `
                    <img src="${payment.screenshot}" alt="Payment Screenshot" 
                         style="width: 50px; height: 50px; object-fit: cover; cursor: pointer;" 
                         onclick="showImageModal('${payment.screenshot}')">
                ` : 'No screenshot'}
            </td>
            <td>
                <span class="badge bg-${statusClass}">${payment.status}</span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    ${payment.status === 'pending' ? `
                        <button class="btn btn-outline-success" onclick="reviewPremiumPayment('${payment._id}', 'approved')" title="Approve">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="reviewPremiumPayment('${payment._id}', 'rejected')" title="Reject">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-outline-danger" onclick="deletePremiumPayment('${payment._id}')" title="Delete Payment & Screenshot">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function loadCallRequests() {
    try {
        const res = await fetch('/api/admin/call-requests');
        const requests = await res.json();

        const tbody = document.getElementById('callRequestsTableBody');
        tbody.innerHTML = '';

        if (!requests.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No call requests found</td></tr>`;
            return;
        }

        requests.forEach(r => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${r.name}</td>
                <td>${r.email}</td>
                <td>${r.message || '-'}</td>
                <td>${new Date(r.createdAt).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteCallRequest('${r._id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Error loading call requests:', err);
    }
}

async function deleteCallRequest(id) {
    if (!confirm('Are you sure you want to delete this call request?')) return;
    const resp = await fetch(`/api/admin/call-requests/${id}`, { method: 'DELETE' });
    const data = await resp.json();

    if (data.success) {
        showAlert("Call request deleted successfully!", 'success');
        loadCallRequests();
    } else {
        showAlert("Failed to delete call request", 'danger');
    }
}

// Load premium assessments
async function loadPremiumAssessments() {
    try {
        let assessments = [];
        
        // Try to fetch from backend first
        try {
            const response = await fetch('/api/admin/premium/assessments');
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (response.ok && data.success) {
                    assessments = data.assessments;
                }
            }
        } catch (error) {
            console.warn('Backend not available, loading from localStorage');
        }
        
        // If no backend data, load from localStorage
        if (assessments.length === 0) {
            assessments = JSON.parse(localStorage.getItem('premiumAssessments') || '[]');
        }
        
        const container = document.getElementById('assessmentsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (assessments.length === 0) {
            container.innerHTML = '<p class="text-muted">No assessments created yet.</p>';
            return;
        }
        
        assessments.forEach(assessment => {
            const div = document.createElement('div');
            div.className = 'card mb-3';
            const assessmentId = assessment._id || assessment.id || 'unknown';
            
            div.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="card-title">${assessment.title || 'Untitled Assessment'}</h6>
                            <p class="card-text text-muted">${assessment.description || 'No description'}</p>
                            <small class="text-muted">
                                <i class="fas fa-question-circle"></i> ${assessment.questions?.length || 0} questions
                                | <i class="fas fa-clock"></i> ${assessment.timeLimit || assessment.duration || 'No time limit'}
                                | <i class="fas fa-tag"></i> ${assessment.category || 'General'}
                            </small>
                        </div>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="editAssessment('${assessmentId}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteAssessment('${assessmentId}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
        
    } catch (error) {
        console.error('Error loading premium assessments:', error);
    }
}

// Helper function to get file icon based on file type
function getFileIcon(fileType) {
    const icons = {
        'pdf': 'file-pdf text-danger',
        'doc': 'file-word text-primary',
        'docx': 'file-word text-primary',
        'xls': 'file-excel text-success',
        'xlsx': 'file-excel text-success',
        'ppt': 'file-powerpoint text-warning',
        'pptx': 'file-powerpoint text-warning',
        'jpg': 'file-image text-info',
        'jpeg': 'file-image text-info',
        'png': 'file-image text-info',
        'gif': 'file-image text-info',
        'mp4': 'file-video text-purple',
        'avi': 'file-video text-purple',
        'mov': 'file-video text-purple',
        'zip': 'file-archive text-secondary',
        'rar': 'file-archive text-secondary',
        'txt': 'file-alt text-muted'
    };
    return icons[fileType?.toLowerCase()] || 'file text-muted';
}

// Load premium materials
async function loadPremiumMaterials() {
    try {
        let materials = [];
        
        // Try to fetch from backend first
        try {
            const response = await fetch('/api/admin/premium/materials');
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (response.ok && data.success) {
                    materials = data.materials;
                }
            }
        } catch (error) {
            console.warn('Backend not available, loading from localStorage');
        }
        
        // If no backend data, load from localStorage
        if (materials.length === 0) {
            materials = JSON.parse(localStorage.getItem('premiumMaterials') || '[]');
        }
        
        const container = document.getElementById('materialsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (materials.length === 0) {
            container.innerHTML = '<p class="text-muted">No materials uploaded yet.</p>';
            return;
        }
        
        materials.forEach(material => {
            const div = document.createElement('div');
            div.className = 'card mb-3';
            const materialId = material._id || material.id || 'unknown';
            const fileIcon = getFileIcon(material.fileType || 'pdf');
            
            div.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="card-title">
                                <i class="fas fa-${fileIcon} me-2"></i>
                                ${material.title || 'Untitled Material'}
                            </h6>
                            <p class="card-text text-muted">${material.description || 'No description'}</p>
                            <small class="text-muted">
                                <i class="fas fa-calendar"></i> ${formatDate(material.createdAt)}
                                | <i class="fas fa-tag"></i> ${material.category || 'General'}
                                | <i class="fas fa-download"></i> ${material.downloadCount || 0} downloads
                            </small>
                        </div>
                        <div class="btn-group btn-group-sm">
                            ${material.fileUrl ? `
                                <button class="btn btn-outline-primary" onclick="downloadMaterial('${materialId}')" title="Download">
                                    <i class="fas fa-download"></i>
                                </button>
                            ` : ''}
                            <button class="btn btn-outline-danger" onclick="deleteMaterial('${materialId}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
        
    } catch (error) {
        console.error('Error loading premium materials:', error);
    }
}

// Load premium groups
async function loadPremiumGroups() {
    try {
        let groups = [];
        
        // Try to fetch from backend first
        try {
            const response = await fetch('/api/admin/premium/groups');
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (response.ok && data.success) {
                    groups = data.groups;
                }
            }
        } catch (error) {
            console.warn('Backend not available, loading from localStorage');
        }
        
        // If no backend data, load from localStorage
        if (groups.length === 0) {
            groups = JSON.parse(localStorage.getItem('premiumGroups') || '[]');
        }
        
        const container = document.getElementById('groupsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (groups.length === 0) {
            container.innerHTML = '<p class="text-muted">No study groups created yet.</p>';
            return;
        }
        
        groups.forEach(group => {
            const div = document.createElement('div');
            div.className = 'card mb-3';
            const groupId = group._id || group.id || 'unknown';
            
            div.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="card-title">
                                <i class="fas fa-users text-primary me-2"></i>
                                ${group.name || 'Untitled Group'}
                            </h6>
                            <p class="card-text text-muted">${group.description || 'No description'}</p>
                            <small class="text-muted">
                                <i class="fas fa-user-friends"></i> ${group.members?.length || 0}/${group.maxMembers || '∞'} members
                                | <i class="fas fa-calendar"></i> ${formatDate(group.createdAt)}
                                ${group.createdBy?.name ? `| <i class="fas fa-user"></i> ${group.createdBy.name}` : ''}
                            </small>
                        </div>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-info" onclick="manageGroupMembers('${groupId}')" title="Manage Members">
                                <i class="fas fa-users-cog"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteGroup('${groupId}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
        
    } catch (error) {
        console.error('Error loading premium groups:', error);
    }
}

// Utility function to truncate text
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Utility function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Premium Management Functions

// Show create premium user modal
function showCreatePremiumUserModal() {
    const modalHTML = `
        <div class="modal fade" id="createPremiumUserModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="fas fa-crown me-2"></i>Create Premium User
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="createPremiumUserForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Name *</label>
                                        <input type="text" class="form-control" id="premiumUserName" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Email *</label>
                                        <input type="email" class="form-control" id="premiumUserEmail" required>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Phone</label>
                                        <input type="tel" class="form-control" id="premiumUserPhone">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Password *</label>
                                        <input type="password" class="form-control" id="premiumUserPassword" required>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Subscription Plan</label>
                                        <select class="form-control" id="premiumUserPlan">
                                            <option value="basic">Basic Premium - ₹999/month</option>
                                            <option value="advanced">Advanced Premium - ₹1999/month</option>
                                            <option value="enterprise">Enterprise Premium - ₹4999/month</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Access Level</label>
                                        <select class="form-control" id="premiumUserAccess">
                                            <option value="standard">Standard Access</option>
                                            <option value="priority">Priority Access</option>
                                            <option value="vip">VIP Access</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Premium Features</label>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="feature1" checked>
                                            <label class="form-check-label" for="feature1">All Premium Courses</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="feature2" checked>
                                            <label class="form-check-label" for="feature2">1-on-1 Mentorship</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="feature3" checked>
                                            <label class="form-check-label" for="feature3">Priority Job Assistance</label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="feature4" checked>
                                            <label class="form-check-label" for="feature4">Advanced Analytics</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="feature5" checked>
                                            <label class="form-check-label" for="feature5">Exclusive Study Groups</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="feature6" checked>
                                            <label class="form-check-label" for="feature6">Premium Support</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-warning" onclick="createPremiumUser()">Create Premium User</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('createPremiumUserModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('createPremiumUserModal'));
    modal.show();
}

// Create premium user
async function createPremiumUser() {
    const formData = {
        name: document.getElementById('premiumUserName').value,
        email: document.getElementById('premiumUserEmail').value,
        phone: document.getElementById('premiumUserPhone').value,
        password: document.getElementById('premiumUserPassword').value,
        plan: document.getElementById('premiumUserPlan').value,
        accessLevel: document.getElementById('premiumUserAccess').value,
        features: {
            allCourses: document.getElementById('feature1').checked,
            mentorship: document.getElementById('feature2').checked,
            jobAssistance: document.getElementById('feature3').checked,
            analytics: document.getElementById('feature4').checked,
            studyGroups: document.getElementById('feature5').checked,
            premiumSupport: document.getElementById('feature6').checked
        }
    };
    
    if (!formData.name || !formData.email || !formData.password) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/premium/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        // Check if response is JSON or HTML
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (response.ok) {
                showAlert('Premium user created successfully with selected features!', 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('createPremiumUserModal'));
                if (modal) {
                    modal.hide();
                }
                loadPremiumUsers();
                loadPremiumStats();
            } else {
                showAlert(data.message || 'Failed to create premium user', 'danger');
            }
        } else {
            // Backend not available, store locally
            console.warn('Backend API not available, storing premium user locally');
            storePremiumUserLocally(formData);
            showAlert('Premium user created and stored locally! Backend integration needed.', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('createPremiumUserModal'));
            if (modal) {
                modal.hide();
            }
            loadPremiumUsers();
            loadPremiumStats();
        }
        
    } catch (error) {
        console.error('Error creating premium user:', error);
        // Store locally as fallback
        storePremiumUserLocally(formData);
        showAlert('Premium user created locally! Backend integration needed.', 'success');
        const modal = bootstrap.Modal.getInstance(document.getElementById('createPremiumUserModal'));
        if (modal) {
            modal.hide();
        }
        loadPremiumUsers();
        loadPremiumStats();
    }
}

// Store premium user locally when backend is not available
function storePremiumUserLocally(formData) {
    try {
        // Get existing premium users from localStorage
        const existingUsers = JSON.parse(localStorage.getItem('premiumUsers') || '[]');
        
        // Add new user with timestamp and ID
        const newUser = {
            ...formData,
            id: 'PU' + Date.now(),
            status: 'Active',
            createdAt: new Date().toISOString(),
            source: 'local'
        };
        
        existingUsers.push(newUser);
        
        // Store back to localStorage
        localStorage.setItem('premiumUsers', JSON.stringify(existingUsers));
        
        console.log('Premium user stored locally:', newUser);
    } catch (error) {
        console.error('Error storing premium user locally:', error);
    }
}

// Load premium users
async function loadPremiumUsers() {
    try {
        let users = [];
        
        // Try to fetch from backend first
        try {
            const response = await fetch('/api/admin/premium/users');
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (response.ok && data.success) {
                    users = data.users;
                }
            }
        } catch (error) {
            console.warn('Backend not available, loading from localStorage');
        }
        
        // If no backend data, load from localStorage
        if (users.length === 0) {
            users = JSON.parse(localStorage.getItem('premiumUsers') || '[]');
        }
        
        const tbody = document.getElementById('premiumUsersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No premium users found</td></tr>`;
            return;
        }
        
        users.forEach(user => {
            const row = document.createElement('tr');
            const userId = user._id || user.id || 'unknown';
            const userStatus = user.status || (user.isActive ? 'Active' : 'Inactive');
            const statusClass = userStatus === 'Active' ? 'success' : 'secondary';
            
            row.innerHTML = `
                <td><strong>${user.premiumId || userId}</strong></td>
                <td>${user.name || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>
                    <span class="badge bg-${statusClass}">
                        ${userStatus}
                    </span>
                </td>
                <td>${formatDate(user.createdAt)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-warning" onclick="resetPremiumPassword('${userId}')" title="Reset Password">
                            <i class="fas fa-key"></i>
                        </button>
                        <button class="btn btn-outline-${userStatus === 'Active' ? 'secondary' : 'success'}" 
                                onclick="togglePremiumUserStatus('${userId}', ${userStatus !== 'Active'})" 
                                title="${userStatus === 'Active' ? 'Deactivate' : 'Activate'}">
                            <i class="fas fa-${userStatus === 'Active' ? 'pause' : 'play'}"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deletePremiumUser('${userId}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading premium users:', error);
        const tableBody = document.getElementById('premiumUsersTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-danger">
                        <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                        <p>Error loading premium users</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Load premium stats
async function loadPremiumStats() {
    try {
        let stats = {
            totalUsers: 0,
            activeUsers: 0,
            assessments: 0,
            groups: 0
        };
        
        // Try to fetch from backend first
        try {
            const response = await fetch('/api/admin/premium/stats');
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (response.ok) {
                    stats = data;
                }
            }
        } catch (error) {
            console.warn('Backend not available, calculating from localStorage');
        }
        
        // If no backend data, calculate from localStorage
        if (stats.totalUsers === 0) {
            const localUsers = JSON.parse(localStorage.getItem('premiumUsers') || '[]');
            const localAssessments = JSON.parse(localStorage.getItem('premiumAssessments') || '[]');
            const localGroups = JSON.parse(localStorage.getItem('premiumGroups') || '[]');
            
            stats = {
                totalUsers: localUsers.length,
                activeUsers: localUsers.filter(u => u.status === 'Active').length,
                assessments: localAssessments.length,
                groups: localGroups.length
            };
        }
        
        // Update DOM elements safely - using correct IDs from admin.html
        const totalElement = document.getElementById('premiumUsersCount');
        const activeElement = document.getElementById('activeUsersCount');
        const assessmentsElement = document.getElementById('assessmentsCount');
        const groupsElement = document.getElementById('groupsCount');
        
        if (totalElement) totalElement.textContent = stats.totalUsers || 0;
        if (activeElement) activeElement.textContent = stats.activeUsers || 0;
        if (assessmentsElement) assessmentsElement.textContent = stats.assessments || 0;
        if (groupsElement) groupsElement.textContent = stats.groups || 0;
        
    } catch (error) {
        console.error('Error loading premium stats:', error);
    }
}

// Show create assessment modal
function showCreateAssessmentModal() {
    const modalHTML = `
        <div class="modal fade" id="createAssessmentModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-clipboard-check me-2"></i>Create Assessment
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="createAssessmentForm">
                            <div class="row">
                                <div class="col-md-8">
                                    <div class="mb-3">
                                        <label class="form-label">Assessment Title *</label>
                                        <input type="text" class="form-control" id="assessmentTitle" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Description</label>
                                        <textarea class="form-control" id="assessmentDescription" rows="3"></textarea>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Category</label>
                                        <select class="form-control" id="assessmentCategory">
                                            <option value="data-science">Data Science</option>
                                            <option value="web-development">Web Development</option>
                                            <option value="ai-ml">AI & Machine Learning</option>
                                            <option value="cloud-computing">Cloud Computing</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Time Limit (minutes)</label>
                                        <input type="number" class="form-control" id="timeLimit" value="30">
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="createAssessment()">Create Assessment</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('createAssessmentModal'));
    modal.show();
}

// Create assessment
function createAssessment() {
    const title = document.getElementById('assessmentTitle').value;
    if (!title) {
        showAlert('Please enter assessment title', 'warning');
        return;
    }
    
    showAlert('Assessment created successfully!', 'success');
    const modal = bootstrap.Modal.getInstance(document.getElementById('createAssessmentModal'));
    if (modal) modal.hide();
}

// Show upload material modal
function showUploadMaterialModal() {
    const modalHTML = `
        <div class="modal fade" id="uploadMaterialModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-upload me-2"></i>Upload Study Material
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="uploadMaterialForm">
                            <div class="mb-3">
                                <label class="form-label">Material Title *</label>
                                <input type="text" class="form-control" id="materialTitle" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Upload File</label>
                                <input type="file" class="form-control" id="materialFile" accept=".pdf,.doc,.docx,.ppt,.pptx">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Category</label>
                                <select class="form-control" id="materialCategory">
                                    <option value="data-science">Data Science</option>
                                    <option value="web-development">Web Development</option>
                                    <option value="ai-ml">AI & Machine Learning</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-info" onclick="uploadMaterial()">Upload Material</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('uploadMaterialModal'));
    modal.show();
}

// Upload material
function uploadMaterial() {
    const title = document.getElementById('materialTitle').value;
    if (!title) {
        showAlert('Please enter material title', 'warning');
        return;
    }
    
    showAlert('Material uploaded successfully!', 'success');
    const modal = bootstrap.Modal.getInstance(document.getElementById('uploadMaterialModal'));
    if (modal) modal.hide();
}

// Show create group modal
function showCreateGroupModal() {
    const modalHTML = `
        <div class="modal fade" id="createGroupModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-users me-2"></i>Create Study Group
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="createGroupForm">
                            <div class="mb-3">
                                <label class="form-label">Group Name *</label>
                                <input type="text" class="form-control" id="groupName" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" id="groupDescription" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Max Members</label>
                                <select class="form-control" id="groupMaxMembers">
                                    <option value="10">10 members</option>
                                    <option value="15">15 members</option>
                                    <option value="20">20 members</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-success" onclick="createGroup()">Create Group</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('createGroupModal'));
    modal.show();
}

// Create group
function createGroup() {
    const name = document.getElementById('groupName').value;
    if (!name) {
        showAlert('Please enter group name', 'warning');
        return;
    }
    
    showAlert('Study group created successfully!', 'success');
    const modal = bootstrap.Modal.getInstance(document.getElementById('createGroupModal'));
    if (modal) modal.hide();
}

// Load resumes for admin
async function loadResumes() {
    const tbody = document.getElementById('resumesTableBody');
    if (!tbody) {
        console.error('Resumes table body not found');
        return;
    }

    try {
        // Show loading state
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 mb-0">Loading resumes...</p>
                </td>
            </tr>
        `;
        
        // Fetch resumes from the backend
        const response = await fetch('/api/admin/resumes');
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to load resumes:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ensure data is an array
        const resumes = Array.isArray(data) ? data : [];
        
        // Clear loading state
        tbody.innerHTML = '';
        
        if (resumes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <p class="text-muted mb-0">No resumes found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Add each resume to the table
        resumes.forEach(resume => {
            const row = document.createElement('tr');
            const fileName = resume.fileUrl.split('/').pop() || 'Resume';
            const fileType = fileName.split('.').pop().toLowerCase();
            const fileIcon = getFileIcon(fileType);
            
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <div class="flex-shrink-0 me-2">
                            <i class="fas ${fileIcon} fa-lg text-primary"></i>
                        </div>
                        <div>
                            <div class="fw-medium">${resume.user?.name || 'Unknown User'}</div>
                            <small class="text-muted">${resume.user?.email || ''}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="text-truncate" style="max-width: 200px;" title="${fileName}">
                        ${fileName}
                    </div>
                </td>
                <td>${formatDate(resume.createdAt)}</td>
                <td>
                    <span class="badge bg-${resume.analyzed ? 'success' : 'secondary'}">
                        ${resume.analyzed ? 'Analyzed' : 'Pending'}
                    </span>
                </td>
                <td class="text-end">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="viewResume('${resume._id}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="analyzeResumeAdmin('${resume._id}')" title="Analyze" ${resume.analyzed ? 'disabled' : ''}>
                            <i class="fas fa-search"></i>
                        </button>
                        <a href="${resume.fileUrl}" class="btn btn-outline-secondary" download title="Download">
                            <i class="fas fa-download"></i>
                        </a>
                        <button class="btn btn-outline-danger" onclick="deleteResume('${resume._id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Initialize pagination if needed
        // initResumesPagination(resumes);
        
    } catch (error) {
        console.error('Error loading resumes:', error);
        const tbody = document.getElementById('resumesTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-danger">
                        <i class="fas fa-exclamation-circle fa-2x mb-3"></i>
                        <p>${error.message || 'Failed to load resumes. Please try again later.'}</p>
                        <button class="btn btn-sm btn-outline-primary" onclick="loadResumes()">
                            <i class="fas fa-sync-alt me-1"></i> Retry
                        </button>
                    </td>
                </tr>
            `;
        }
    }
}

// View resume in a modal
function viewResume(resumeId) {
    // Open in a new tab for now - can be enhanced with a modal later
    window.open(`/resume-viewer.html?id=${resumeId}`, '_blank');
}

// Analyze resume using Gemini AI
async function analyzeResumeAdmin(resumeId) {
    try {
        const response = await fetch(`/api/resumes/${resumeId}/analyze`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('Failed to analyze resume');
        }
        
        const result = await response.json();
        
        // Show success message
        showAlert('Resume analyzed successfully!', 'success');
        
        // Reload the resumes list
        loadResumes();
        
        // Show the analysis result in a modal
        showAnalysisResult(result.analysis);
        
    } catch (error) {
        console.error('Error analyzing resume:', error);
        showAlert(`Failed to analyze resume: ${error.message}`, 'danger');
    }
}

// Show analysis result in a modal
function showAnalysisResult(analysis) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'analysisResultModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">Resume Analysis Result</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="analysis-result">
                        ${analysis}
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="window.print()">
                        <i class="fas fa-print me-1"></i> Print
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // Remove modal from DOM after it's hidden
    modal.addEventListener('hidden.bs.modal', function () {
        document.body.removeChild(modal);
    });
}

// Delete resume
async function deleteResume(resumeId) {
    if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/resumes/${resumeId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete resume');
        }
        
        // Show success message
        showAlert('Resume deleted successfully!', 'success');
        
        // Reload the resumes list
        loadResumes();
        
    } catch (error) {
        console.error('Error deleting resume:', error);
        showAlert(`Failed to delete resume: ${error.message}`, 'danger');
    }
}

// Search resumes
function searchResumes() {
    const searchTerm = document.getElementById('resumeSearchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#resumesTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Load premium data when admin page loads
async function loadPremiumData() {
    try {
        // Load premium stats and users when page loads
        const statsElement = document.getElementById('premiumStats');
        if (statsElement) {
            await loadPremiumStats();
        }
        await loadPremiumUsers();
        
        // Set up premium tab event listeners
        const premiumTab = document.querySelector('a[href="#premium"]');
        if (premiumTab) {
            premiumTab.addEventListener('shown.bs.tab', function() {
                loadPremiumStats();
                loadPremiumUsers();
            });
        }
        const resumesTab = document.querySelector('a[href="#resumes"]');
        if (resumesTab) {
            resumesTab.addEventListener('shown.bs.tab', () => {
                const target = '#resumes';
                loadResumes();
            });
        }
        const enrollmentsTab = document.querySelector('a[href="#enrollments"]');
        if (enrollmentsTab) {
            enrollmentsTab.addEventListener('shown.bs.tab', () => {
                loadCrashEnrollments();
                loadWorkshopRegistrations();
            });
        }
        
        // Ensure premium management section is visible at top
        const premiumSection = document.getElementById('premium');
        if (premiumSection) {
            // Add CSS to ensure content displays at top
            premiumSection.style.display = 'block';
            premiumSection.style.position = 'relative';
            premiumSection.style.top = '0';
            premiumSection.style.zIndex = '1';
        }
        
    } catch (error) {
        console.error('Error loading premium data:', error);
    }
}

// Premium user management functions
function editPremiumUser(userId) {
    showAlert(`Edit premium user: ${userId}`, 'info');
}

function togglePremiumUserStatus(userId) {
    showAlert(`Toggled status for user: ${userId}`, 'success');
}

async function deletePremiumUser(userId) {
    if (confirm('Are you sure you want to delete this premium user? This action cannot be undone.')) {
        try {
            // Try to delete from backend first
            let deleted = false;
            try {
                const response = await fetch(`/api/admin/premium/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    if (response.ok) {
                        deleted = true;
                    }
                }
            } catch (error) {
                console.warn('Backend not available, deleting from localStorage');
            }
            
            // If backend not available or failed, delete from localStorage
            if (!deleted) {
                const existingUsers = JSON.parse(localStorage.getItem('premiumUsers') || '[]');
                const filteredUsers = existingUsers.filter(user => user.id !== userId);
                localStorage.setItem('premiumUsers', JSON.stringify(filteredUsers));
                deleted = true;
            }
            
            if (deleted) {
                showAlert(`Premium user ${userId} deleted successfully`, 'success');
                loadPremiumUsers();
                loadPremiumStats();
            } else {
                showAlert('Failed to delete premium user', 'danger');
            }
            
        } catch (error) {
            console.error('Error deleting premium user:', error);
            showAlert('Error deleting premium user', 'danger');
        }
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Filter payments by status
function filterPayments(status) {
    // Update active button
    document.querySelectorAll('#payments .btn-group .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Reload payments with filter
    loadPayments().then(() => {
        if (status !== 'all') {
            const paymentCards = document.querySelectorAll('#paymentsGrid .payment-card');
            paymentCards.forEach(card => {
                const cardStatus = card.getAttribute('data-status');
                if (cardStatus !== status) {
                    card.style.display = 'none';
                } else {
                    card.style.display = 'block';
                }
            });
        }
    });
}

// Display payments
function displayPayments(payments) {
    const paymentsContainer = document.getElementById('paymentsContainer');
    if (!paymentsContainer) {
        console.error('Payments container not found');
        return;
    }
    
    // Clear the container first
    paymentsContainer.innerHTML = '';
    
    // Check if payments is an array and has items
    if (!Array.isArray(payments) || payments.length === 0) {
        paymentsContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                No payments found.
            </div>
        `;
        return;
    }
    
    // Create a table for better data display
    const table = document.createElement('table');
    table.className = 'table table-striped table-hover';
    table.innerHTML = `
        <thead class="table-dark">
            <tr>
                <th>ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="paymentsTableBody">
            <!-- Payments will be inserted here -->
        </tbody>
    `;
    
    const tbody = table.querySelector('#paymentsTableBody');
    
    // Process each payment
    payments.forEach(payment => {
        if (!payment || typeof payment !== 'object') return;
        
        const statusBadgeClass = getStatusBadgeClass(payment.status || 'pending');
        const statusText = (payment.status || 'pending').toUpperCase();
        const paymentDate = formatDate(payment.createdAt) || 'N/A';
        const userName = payment.user?.name || 'Unknown User';
        const amount = payment.amount ? `₹${payment.amount}` : '₹0';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment._id || 'N/A'}</td>
            <td>${userName}</td>
            <td>${amount}</td>
            <td><span class="badge ${statusBadgeClass}">${statusText}</span></td>
            <td>${paymentDate}</td>
            <td>
                ${payment.status === 'pending' ? `
                    <button class="btn btn-sm btn-success me-1" onclick="reviewPayment('${payment._id}', 'approved')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="reviewPayment('${payment._id}', 'rejected')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                ` : ''}
                ${payment.screenshot ? `
                    <button class="btn btn-sm btn-info ms-1" onclick="showImageModal('${payment.screenshot}')">
                        <i class="fas fa-image"></i> View
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Add filter controls
    const filterControls = document.createElement('div');
    filterControls.className = 'mb-3';
    filterControls.innerHTML = `
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-outline-primary" onclick="filterPayments('all')">All</button>
            <button type="button" class="btn btn-outline-success" onclick="filterPayments('approved')">Approved</button>
            <button type="button" class="btn btn-outline-warning" onclick="filterPayments('pending')">Pending</button>
            <button type="button" class="btn btn-outline-danger" onclick="filterPayments('rejected')">Rejected</button>
        </div>
    `;
    
    // Add everything to the container
    paymentsContainer.appendChild(filterControls);
    paymentsContainer.appendChild(table);
}

// Review payment (approve/reject)
async function reviewPayment(paymentId, status) {
    if (!paymentId) {
        console.error('No payment ID provided for review');
        showAlert('Error: No payment ID provided', 'danger');
        return;
    }

    // For rejected payments, show a modal or more user-friendly prompt
    let notes = '';
    if (status === 'rejected') {
        const notesInput = prompt('Please provide a reason for rejection:');
        if (notesInput === null) {
            console.log('User cancelled payment rejection');
            return; // User cancelled the prompt
        }
        notes = notesInput.trim();
        
        if (!notes) {
            showAlert('Please provide a reason for rejection', 'warning');
            return;
        }
    }
    
    try {
        // Show loading state
        const button = document.querySelector(`button[onclick*="reviewPayment('${paymentId}', '${status}')"]`);
        const originalText = button ? button.innerHTML : '';
        
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        }
        
        const response = await fetch(`/api/admin/payments/${paymentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
            },
            body: JSON.stringify({ 
                status, 
                adminNotes: notes 
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update payment status');
        }
        
        showAlert(`Payment ${status} successfully!`, 'success');
        
        // Reload payments after a short delay to show the success message
        setTimeout(() => {
            loadPayments();
        }, 1000);
        
    } catch (error) {
        console.error('Error reviewing payment:', error);
        showAlert(`Failed to update payment status: ${error.message}`, 'danger');
    } finally {
        // Reset button state if it exists
        const button = document.querySelector(`button[onclick*="reviewPayment('${paymentId}', '${status}')"]`);
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText || 
                (status === 'approved' ? '<i class="fas fa-check"></i> Approve' : '<i class="fas fa-times"></i> Reject');
        }
    }
}

// Show image modal
function showImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Payment Screenshot</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <img src="${imageUrl}" class="img-fluid" alt="Payment Screenshot">
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

// Helper functions
function getStatusBadgeClass(status) {
    switch (status) {
        case 'approved': return 'bg-success';
        case 'rejected': return 'bg-danger';
        default: return 'bg-warning';
    }
}

function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star text-warning"></i>';
        } else {
            stars += '<i class="fas fa-star text-muted"></i>';
        }
    }
    return stars;
}

// Modal functions
function showAddCourseModal() {
    const modal = new bootstrap.Modal(document.getElementById('addCourseModal'));
    modal.show();
}

// Toggle price field based on course type
function togglePriceField() {
    const courseTypePaid = document.getElementById('courseTypePaid');
    const priceField = document.getElementById('priceField');
    const coursePrice = document.getElementById('coursePrice');
    
    if (courseTypePaid.checked) {
        priceField.style.display = 'block';
        coursePrice.required = true;
    } else {
        priceField.style.display = 'none';
        coursePrice.required = false;
        coursePrice.value = '';
    }
}

function showAddJobModal() {
    const modal = new bootstrap.Modal(document.getElementById('addJobModal'));
    modal.show();
}

function showAddBlogModal() {
    const modal = new bootstrap.Modal(document.getElementById('addBlogModal'));
    modal.show();
}

function showAddCourseModal() {
    const modal = new bootstrap.Modal(document.getElementById('addCourseModal'));
    modal.show();
}

// Form handlers
async function handleAddCourse(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('courseTitle').value);
    formData.append('description', document.getElementById('courseDescription').value);
    formData.append('price', document.getElementById('coursePrice').value);
    formData.append('strikePrice', document.getElementById('courseStrikePrice').value);
    formData.append('duration', document.getElementById('courseDuration').value);

    const imageFile = document.getElementById('courseImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    const vmFile = document.getElementById('courseViewMoreFile')?.files?.[0];
    if (vmFile) {
        formData.append('viewMoreFile', vmFile);
    }
    const vmHtml = document.getElementById('courseViewMoreHtml')?.value;
    if (vmHtml) {
        formData.append('viewMoreHtml', vmHtml);
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    const originalContent = showLoading(submitBtn);
    
    try {
        const response = await fetch('/api/admin/crash-courses', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Crash course added successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addCourseModal')).hide();
            document.getElementById('addCourseForm').reset();
            loadCourses();
            loadDashboardStats();
        } else {
            showAlert(data.error || 'Failed to add crash course', 'danger');
        }
    } catch (error) {
        console.error('Error adding crash course:', error);
        showAlert('Failed to add crash course', 'danger');
    } finally {
        hideLoading(submitBtn, originalContent);
        submitBtn.disabled = false;
    }
}

async function handleAddJob(e) {
    e.preventDefault();
    
    // Get the form element
    const form = e.target;
    if (!form) {
        console.error('Form element not found');
        return;
    }
    
    // Get form fields safely
    const getValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
    };
    
    const jobData = {
        title: getValue('jobTitle'),
        company: getValue('jobCompany'),
        location: getValue('jobLocation'),
        salary: getValue('jobSalary'),
        description: getValue('jobDescription'),
        requirements: getValue('jobRequirements'),
        link: getValue('jobLink')
    };
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalContent = showLoading(submitBtn);
    
    try {
        const response = await fetch('/api/jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jobData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Job added successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addJobModal')).hide();
            document.getElementById('addJobForm').reset();
            loadJobs();
            loadDashboardStats();
        } else {
            showAlert('Failed to add job', 'danger');
        }
    } catch (error) {
        console.error('Error adding job:', error);
        showAlert('Failed to add job', 'danger');
    } finally {
        hideLoading(submitBtn, originalContent);
    }
}



async function createPremiumUser() {
    // Get the submit button and store its original content
    const submitBtn = document.querySelector('#createPremiumUserModal .btn-warning[onclick="createPremiumUser()"]');
    if (!submitBtn) {
        console.error('Submit button not found');
        showAlert('Error: Could not find submit button', 'danger');
        return;
    }
    
    // Disable the button and show loading state
    const originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Creating...';
    
    try {
        const formData = {
            name: document.getElementById('premiumUserName')?.value,
            email: document.getElementById('premiumUserEmail')?.value,
            phone: document.getElementById('premiumUserPhone')?.value,
            password: document.getElementById('premiumUserPassword')?.value,
            plan: document.getElementById('premiumUserPlan')?.value,
            accessLevel: document.getElementById('premiumUserAccess')?.value,
            features: {
                allCourses: document.getElementById('feature1')?.checked || false,
                mentorship: document.getElementById('feature2')?.checked || false,
                jobAssistance: document.getElementById('feature3')?.checked || false,
                analytics: document.getElementById('feature4')?.checked || false,
                studyGroups: document.getElementById('feature5')?.checked || false,
                premiumSupport: document.getElementById('feature6')?.checked || false
            }
        };
        
        // Validate required fields
        if (!formData.name || !formData.email || !formData.password) {
            showAlert('Please fill in all required fields', 'warning');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            showAlert('Please enter a valid email address', 'warning');
            return;
        }
        
        const response = await fetch('/api/admin/premium/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Premium user created successfully!', 'success');
            
            // Close the modal if it exists
            const modal = bootstrap.Modal.getInstance(document.getElementById('createPremiumUserModal'));
            if (modal) {
                modal.hide();
            }
            
            // Reset the form
            const form = document.getElementById('createPremiumUserForm');
            if (form) form.reset();
            
            // Refresh the premium users list and stats
            await Promise.all([
                loadPremiumUsers(),
                loadPremiumStats()
            ]);
        } else {
            const errorMessage = data.message || 'Failed to create premium user';
            showAlert(errorMessage, 'danger');
        }
    } catch (error) {
        console.error('Error creating premium user:', error);
        showAlert('An unexpected error occurred. Please try again.', 'danger');
    } finally {
        // Reset the button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
        }
    }
}

async function handleAddBlog(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('blogTitle').value);
    formData.append('content', document.getElementById('blogContent').value);
    
    const imageFile = document.getElementById('blogImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    const originalContent = showLoading(submitBtn);
    
    try {
        const response = await fetch('/api/blogs', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Blog added successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addBlogModal')).hide();
            document.getElementById('addBlogForm').reset();
            loadBlogs();
            loadDashboardStats();
        } else {
            showAlert('Failed to add blog', 'danger');
        }
    } catch (error) {
        console.error('Error adding blog:', error);
        showAlert('Failed to add blog', 'danger');
    } finally {
        hideLoading(submitBtn, originalContent);
        submitBtn.disabled = false;
    }
}

// Delete functions
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('User deleted successfully!', 'success');
            loadUsers();
            loadDashboardStats();
        } else {
            showAlert('Failed to delete user', 'danger');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('Failed to delete user', 'danger');
    }
}

async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    try {
        const response = await fetch(`/api/admin/crash-courses/${courseId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Course deleted successfully!', 'success');
            loadCourses();
            loadDashboardStats();
        } else {
            showAlert('Failed to delete course', 'danger');
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        showAlert('Failed to delete course', 'danger');
    }
}

async function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
        const response = await fetch(`/api/jobs/${jobId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Job deleted successfully!', 'success');
            loadJobs();
            loadDashboardStats();
        } else {
            showAlert('Failed to delete job', 'danger');
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        showAlert('Failed to delete job', 'danger');
    }
}


async function deleteBlog(blogId) {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
        const response = await fetch(`/api/blogs/${blogId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Blog deleted successfully!', 'success');
            loadBlogs();
            loadDashboardStats();
        } else {
            showAlert('Failed to delete blog', 'danger');
        }
    } catch (error) {
        console.error('Error deleting blog:', error);
        showAlert('Failed to delete blog', 'danger');
    }
}


async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
        const response = await fetch(`/api/reviews/${reviewId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Review deleted successfully!', 'success');
            loadReviews();
            loadDashboardStats();
        } else {
            showAlert('Failed to delete review', 'danger');
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        showAlert('Failed to delete review', 'danger');
    }
}

// Delete course query
async function deleteQuery(queryId) {
    if (!confirm('Are you sure you want to delete this query?')) return;

    try {
        const response = await fetch(`/api/admin/course-queries/${queryId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Query deleted successfully!', 'success');
            loadCourseQueries();
        } else {
            showAlert('Failed to delete query', 'danger');
        }
    } catch (error) {
        console.error('Error deleting query:', error);
        showAlert('Failed to delete query', 'danger');
    }
}

// Delete premium user
async function deletePremiumUser(userId) {
    if (!confirm('Are you sure you want to delete this premium user? This action cannot be undone.')) return;

    try {
        const response = await fetch(`/api/admin/premium/users/${userId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Premium user deleted successfully!', 'success');
            loadPremiumData();
        } else {
            showAlert('Failed to delete premium user', 'danger');
        }
    } catch (error) {
        console.error('Error deleting premium user:', error);
        showAlert('Failed to delete premium user', 'danger');
    }
}

// Delete premium payment and screenshot
async function deletePremiumPayment(paymentId) {
    if (!confirm('Are you sure you want to delete this payment record and its screenshot? This action cannot be undone.')) return;

    try {
        const response = await fetch(`/api/admin/premium/payments/${paymentId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Payment record and screenshot deleted successfully!', 'success');
            loadPremiumData();
        } else {
            showAlert('Failed to delete payment record', 'danger');
        }
    } catch (error) {
        console.error('Error deleting payment record:', error);
        showAlert('Failed to delete payment record', 'danger');
    }
}

// Toggle premium user status
async function togglePremiumUserStatus(userId, isActive) {
    try {
        const response = await fetch(`/api/admin/premium/users/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isActive })
        });

        const data = await response.json();

        if (data.success) {
            showAlert(`Premium user ${isActive ? 'activated' : 'deactivated'} successfully!`, 'success');
            loadPremiumData();
        } else {
            showAlert('Failed to update user status', 'danger');
        }
    } catch (error) {
        console.error('Error updating user status:', error);
        showAlert('Failed to update user status', 'danger');
    }
}

// Reset premium user password
async function resetPremiumPassword(userId) {
    if (!confirm('Are you sure you want to reset this user\'s password? A new password will be generated.')) return;

    try {
        const response = await fetch(`/api/admin/premium/users/${userId}/reset-password`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            showAlert(`Password reset successfully! New password: ${data.newPassword}`, 'success');
        } else {
            showAlert('Failed to reset password', 'danger');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        showAlert('Failed to reset password', 'danger');
    }
}

// Review premium payment
async function reviewPremiumPayment(paymentId, status) {
    try {
        const response = await fetch(`/api/admin/premium/payments/${paymentId}/review`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (data.success) {
            showAlert(`Payment ${status} successfully!`, 'success');
            loadPremiumData();
        } else {
            showAlert('Failed to review payment', 'danger');
        }
    } catch (error) {
        console.error('Error reviewing payment:', error);
        showAlert('Failed to review payment', 'danger');
    }
}

// Update appointment status
async function updateAppointmentStatus(appointmentId, status) {
    try {
        const response = await fetch(`/api/appointments/${appointmentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(`Appointment ${status} successfully!`, 'success');
            loadAppointments();
        } else {
            showAlert('Failed to update appointment', 'danger');
        }
    } catch (error) {
        console.error('Error updating appointment:', error);
        showAlert('Failed to update appointment', 'danger');
    }
}

// Add custom styles
const style = document.createElement('style');
style.textContent = `
    .sidebar {
        min-height: calc(100vh - 56px);
    }
    
    .sidebar .nav-link {
        color: #333;
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        margin-bottom: 0.25rem;
    }
    
    .sidebar .nav-link:hover,
    .sidebar .nav-link.active {
        background-color: var(--primary-color);
        color: white;
    }
    
    .card {
        transition: all 0.3s ease;
        border: none;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px rgba(0,0,0,0.15);
    }
    
    .table th {
        border-top: none;
        font-weight: 600;
        color: #495057;
    }
    
    .btn-group-sm .btn {
        padding: 0.25rem 0.5rem;
    }
    
    .rating {
        display: flex;
        gap: 0.125rem;
    }
`;
document.head.appendChild(style);

// Email Reminders functionality
async function loadReminders() {
    try {
        const res = await fetch('/api/admin/reminders');
        const payload = await res.json();
        const reminders = (payload && payload.reminders) || [];

        const tbody = document.getElementById('remindersTableBody');
        tbody.innerHTML = '';

        if (!reminders.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No reminders found</td></tr>`;
            return;
        }

        reminders.forEach(r => {
            const row = document.createElement('tr');
            const statusBadges = [];
            if (r.enrollmentEmailSent) statusBadges.push('<span class="badge bg-success">Enrollment</span>');
            if (r.morningReminderSent) statusBadges.push('<span class="badge bg-info">Morning</span>');
            if (r.tenMinuteReminderSent) statusBadges.push('<span class="badge bg-warning">10min</span>');
            
            row.innerHTML = `
                <td>${r.userEmail}</td>
                <td>${r.workshopTitle}</td>
                <td>${new Date(r.workshopDateTime).toLocaleString()}</td>
                <td>${r.meetingLink ? `<a href="${r.meetingLink}" target="_blank">Link</a>` : '-'}</td>
                <td>${statusBadges.join(' ') || '<span class="badge bg-secondary">None</span>'}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" onclick="editReminderLink('${r._id}', '${(r.meetingLink || '').replace(/'/g, "\\'")}')">Edit Link</button>
                      <button class="btn btn-outline-danger" onclick="deleteReminder('${r._id}')">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Error loading reminders:', err);
    }
}

function showAddReminderModal() {
    // Load workshops for dropdown
    loadWorkshopsForReminder();
    const modal = new bootstrap.Modal(document.getElementById('addReminderModal'));
    modal.show();
}

async function loadWorkshopsForReminder() {
    try {
        const res = await fetch('/api/workshops');
        const payload = await res.json();
        const workshops = payload.workshops || [];
        const select = document.getElementById('reminderWorkshop');
        select.innerHTML = '<option value="">Select Workshop</option>';
        
        workshops.forEach(ws => {
            const option = document.createElement('option');
            option.value = ws._id;
            option.textContent = ws.title;
            option.dataset.datetime = ws.dateTime;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading workshops for reminder:', err);
    }
}

async function submitReminder() {
    const email = document.getElementById('reminderEmail').value.trim();
    const workshopId = document.getElementById('reminderWorkshop').value;
    const meetingLink = document.getElementById('reminderMeetingLink').value.trim();

    if (!email || !workshopId) {
        showAlert('Email and workshop are required', 'danger');
        return;
    }

    try {
        const res = await fetch('/api/admin/reminders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: email, workshopId, meetingLink })
        });

        const data = await res.json();
        if (res.ok) {
            showAlert('Reminder added successfully!', 'success');
            document.getElementById('addReminderForm').reset();
            bootstrap.Modal.getInstance(document.getElementById('addReminderModal')).hide();
            loadReminders();
        } else {
            showAlert(data.error || 'Failed to add reminder', 'danger');
        }
    } catch (err) {
        console.error('Error adding reminder:', err);
        showAlert('Network error. Please try again.', 'danger');
    }
}

async function deleteReminder(id) {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    
    try {
        const res = await fetch(`/api/admin/reminders/${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (data.success) {
            showAlert('Reminder deleted successfully!', 'success');
            loadReminders();
        } else {
            showAlert('Failed to delete reminder', 'danger');
        }
    } catch (err) {
        console.error('Error deleting reminder:', err);
        showAlert('Network error. Please try again.', 'danger');
    }
}

function editReminderLink(id, currentLink) {
    const newLink = prompt('Enter meeting link (leave empty to clear):', currentLink || '');
    if (newLink === null) return;
    fetch(`/api/admin/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingLink: String(newLink).trim() })
    })
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
        if (ok && data.success !== false) {
            showAlert('Reminder link updated', 'success');
            loadReminders();
        } else {
            showAlert((data && data.error) || 'Failed to update link', 'danger');
        }
    })
    .catch(err => {
        console.error('Error updating reminder link:', err);
        showAlert('Network error. Please try again.', 'danger');
    });
}

// Add event listener for reminders tab
document.addEventListener('DOMContentLoaded', function() {
    const remindersTab = document.querySelector('a[href="#reminders"]');
    if (remindersTab) {
        remindersTab.addEventListener('shown.bs.tab', loadReminders);
    }
});

// Duplicate DOMContentLoaded initializer removed to avoid calling unsupported loaders
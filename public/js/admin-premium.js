// Admin Premium Management JavaScript

let currentQueries = [];
let currentUsers = [];
let currentAssessments = [];
let currentQuizzes = [];
let currentMaterials = [];
let currentGroups = [];

document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadQueries();
    
    // Tab change event listeners
    document.querySelectorAll('[data-bs-toggle="pill"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            const target = e.target.getAttribute('href').substring(1);
            loadTabData(target);
        });
    });
});

// Load tab data based on active tab
function loadTabData(tabName) {
    switch(tabName) {
        case 'queries':
            loadQueries();
            break;
        case 'users':
            loadPremiumUsers();
            break;
        case 'assessments':
            loadAssessments();
            break;
        case 'quizzes':
            loadQuizzes();
            break;
        case 'materials':
            loadMaterials();
            break;
        case 'groups':
            loadGroups();
            break;
    }
}

// Load course queries
async function loadQueries() {
    try {
        const response = await fetch('/api/admin/course-queries');
        currentQueries = await response.json();
        displayQueries(currentQueries);
    } catch (error) {
        console.error('Error loading queries:', error);
        showAlert('Failed to load queries', 'danger');
    }
}

// Display queries
function displayQueries(queries) {
    const container = document.getElementById('queriesList');
    
    if (queries.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-question-circle fs-1 text-muted mb-3"></i>
                <h5 class="text-muted">No queries found</h5>
                <p class="text-muted">Course queries will appear here when users submit them.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = queries.map(query => `
        <div class="admin-card query-card p-4 mb-3">
            <div class="row">
                <div class="col-md-8">
                    <div class="d-flex align-items-center mb-2">
                        <h6 class="mb-0 me-3">${query.course?.title || 'Unknown Course'}</h6>
                        <span class="badge ${query.status === 'replied' ? 'bg-success' : 'bg-warning'}">${query.status}</span>
                    </div>
                    <p class="text-muted mb-2">${query.message}</p>
                    <div class="row">
                        <div class="col-sm-4">
                            <small class="text-muted"><strong>Name:</strong> ${query.name || 'Anonymous'}</small>
                        </div>
                        <div class="col-sm-4">
                            <small class="text-muted"><strong>Email:</strong> ${query.email || 'Not provided'}</small>
                        </div>
                        <div class="col-sm-4">
                            <small class="text-muted"><strong>Phone:</strong> ${query.phone || 'Not provided'}</small>
                        </div>
                    </div>
                    <small class="text-muted">Submitted: ${formatDate(query.createdAt)}</small>
                </div>
                <div class="col-md-4 text-end">
                    <div class="btn-group-vertical">
                        <button class="btn btn-outline-primary btn-sm mb-2" onclick="replyToQuery('${query._id}')">
                            <i class="fas fa-reply me-1"></i>Reply
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteQuery('${query._id}')">
                            <i class="fas fa-trash me-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
            ${query.reply ? `
                <div class="mt-3 p-3 bg-light rounded">
                    <h6 class="text-success mb-2"><i class="fas fa-reply me-2"></i>Admin Reply:</h6>
                    <p class="mb-1">${query.reply}</p>
                    <small class="text-muted">Replied: ${formatDate(query.repliedAt)}</small>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Filter queries
function filterQueries() {
    const filter = document.getElementById('queryStatusFilter').value;
    let filteredQueries = currentQueries;
    
    if (filter !== 'all') {
        filteredQueries = currentQueries.filter(query => query.status === filter);
    }
    
    displayQueries(filteredQueries);
}

// Reply to query
function replyToQuery(queryId) {
    const query = currentQueries.find(q => q._id === queryId);
    if (!query) return;
    
    const modalHTML = `
        <div class="modal fade" id="replyModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">Reply to Query</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Original Query:</label>
                            <div class="p-3 bg-light rounded">
                                <p class="mb-1">${query.message}</p>
                                <small class="text-muted">From: ${query.name || 'Anonymous'} (${query.email || 'No email'})</small>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">Your Reply:</label>
                            <textarea class="form-control" id="replyMessage" rows="4" placeholder="Type your reply here..." required></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="submitReply('${queryId}')">
                            <i class="fas fa-paper-plane me-1"></i>Send Reply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('replyModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('replyModal'));
    modal.show();
}

// Submit reply
async function submitReply(queryId) {
    const replyMessage = document.getElementById('replyMessage').value.trim();
    
    if (!replyMessage) {
        showAlert('Please enter a reply message', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/course-queries/${queryId}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reply: replyMessage })
        });
        
        if (response.ok) {
            showAlert('Reply sent successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('replyModal')).hide();
            loadQueries(); // Reload queries
        } else {
            const data = await response.json();
            showAlert(data.message || 'Failed to send reply', 'danger');
        }
    } catch (error) {
        console.error('Error sending reply:', error);
        showAlert('Failed to send reply', 'danger');
    }
}

// Delete query
async function deleteQuery(queryId) {
    if (!confirm('Are you sure you want to delete this query?')) return;
    
    try {
        const response = await fetch(`/api/admin/course-queries/${queryId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('Query deleted successfully!', 'success');
            loadQueries(); // Reload queries
        } else {
            showAlert('Failed to delete query', 'danger');
        }
    } catch (error) {
        console.error('Error deleting query:', error);
        showAlert('Failed to delete query', 'danger');
    }
}

// Load premium users
async function loadPremiumUsers() {
    try {
        const response = await fetch('/api/admin/premium-users');
        currentUsers = await response.json();
        displayPremiumUsers(currentUsers);
    } catch (error) {
        console.error('Error loading premium users:', error);
        showAlert('Failed to load premium users', 'danger');
    }
}

// Display premium users
function displayPremiumUsers(users) {
    const container = document.getElementById('premiumUsersList');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-users fs-1 text-muted mb-3"></i>
                <h5 class="text-muted">No premium users found</h5>
                <p class="text-muted">Create premium users to get started.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="admin-card user-card p-4 mb-3">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h6 class="mb-1">${user.name}</h6>
                    <p class="text-muted mb-1">User ID: <code>${user.userId}</code></p>
                    <p class="text-muted mb-1">Email: ${user.email || 'Not provided'}</p>
                    <small class="text-muted">Created: ${formatDate(user.createdAt)}</small>
                    <div class="mt-2">
                        <span class="badge ${user.isActive ? 'bg-success' : 'bg-danger'}">${user.isActive ? 'Active' : 'Inactive'}</span>
                        <span class="badge bg-warning">Premium</span>
                    </div>
                </div>
                <div class="col-md-4 text-end">
                    <div class="btn-group-vertical">
                        <button class="btn btn-outline-warning btn-sm mb-2" onclick="resetUserPassword('${user._id}')">
                            <i class="fas fa-key me-1"></i>Reset Password
                        </button>
                        <button class="btn btn-outline-${user.isActive ? 'danger' : 'success'} btn-sm mb-2" onclick="toggleUserStatus('${user._id}')">
                            <i class="fas fa-${user.isActive ? 'ban' : 'check'} me-1"></i>${user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deletePremiumUser('${user._id}')">
                            <i class="fas fa-trash me-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Show create user modal
function showCreateUserModal() {
    const modalHTML = `
        <div class="modal fade" id="createUserModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">Create Premium User</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="createUserForm">
                            <div class="mb-3">
                                <label class="form-label">Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="userName" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">User ID <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="userId" placeholder="e.g., PREM001" required>
                                <small class="form-text text-muted">This will be used for login</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Password <span class="text-danger">*</span></label>
                                <input type="password" class="form-control" id="userPassword" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email (Optional)</label>
                                <input type="email" class="form-control" id="userEmail">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-warning" onclick="createPremiumUser()">
                            <i class="fas fa-plus me-1"></i>Create User
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('createUserModal'));
    modal.show();
}

// Create premium user
async function createPremiumUser() {
    const formData = {
        name: document.getElementById('userName').value.trim(),
        userId: document.getElementById('userId').value.trim(),
        password: document.getElementById('userPassword').value.trim(),
        email: document.getElementById('userEmail').value.trim()
    };
    
    if (!formData.name || !formData.userId || !formData.password) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/premium-users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Premium user created successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('createUserModal')).hide();
            loadPremiumUsers(); // Reload users
        } else {
            showAlert(data.message || 'Failed to create user', 'danger');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        showAlert('Failed to create user', 'danger');
    }
}

// Continue with more functions for assessments, quizzes, materials, and groups...
// Load assessments
async function loadAssessments() {
    try {
        const response = await fetch('/api/admin/assessments');
        currentAssessments = await response.json();
        displayAssessments(currentAssessments);
    } catch (error) {
        console.error('Error loading assessments:', error);
        showAlert('Failed to load assessments', 'danger');
    }
}

// Display assessments
function displayAssessments(assessments) {
    const container = document.getElementById('assessmentsList');
    
    if (assessments.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-clipboard-check fs-1 text-muted mb-3"></i>
                <h5 class="text-muted">No assessments found</h5>
                <p class="text-muted">Create assessments for premium users.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = assessments.map(assessment => `
        <div class="admin-card assessment-card p-4 mb-3">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h6 class="mb-1">${assessment.title}</h6>
                    <p class="text-muted mb-2">${assessment.description}</p>
                    <div class="d-flex gap-3">
                        <small class="text-muted"><i class="fas fa-question-circle me-1"></i>${assessment.questions.length} Questions</small>
                        <small class="text-muted"><i class="fas fa-clock me-1"></i>${assessment.duration} minutes</small>
                        <small class="text-muted"><i class="fas fa-calendar me-1"></i>${formatDate(assessment.createdAt)}</small>
                    </div>
                </div>
                <div class="col-md-4 text-end">
                    <div class="btn-group-vertical">
                        <button class="btn btn-outline-primary btn-sm mb-2" onclick="editAssessment('${assessment._id}')">
                            <i class="fas fa-edit me-1"></i>Edit
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteAssessment('${assessment._id}')">
                            <i class="fas fa-trash me-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Show create assessment modal
function showCreateAssessmentModal() {
    const modalHTML = `
        <div class="modal fade" id="createAssessmentModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">Create Assessment</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="createAssessmentForm">
                            <div class="mb-3">
                                <label class="form-label">Title <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="assessmentTitle" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" id="assessmentDescription" rows="3"></textarea>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Duration (minutes)</label>
                                        <input type="number" class="form-control" id="assessmentDuration" value="60">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Category</label>
                                        <input type="text" class="form-control" id="assessmentCategory" placeholder="e.g., Data Science">
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Questions (JSON format)</label>
                                <textarea class="form-control" id="assessmentQuestions" rows="8" placeholder='[{"question": "What is AI?", "options": ["A", "B", "C", "D"], "correct": 0}]'></textarea>
                                <small class="form-text text-muted">Enter questions in JSON format with question, options array, and correct answer index</small>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" onclick="createAssessment()">
                            <i class="fas fa-plus me-1"></i>Create Assessment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('createAssessmentModal'));
    modal.show();
}

// Admin logout
async function adminLogout() {
    try {
        await fetch('/api/admin/logout', { method: 'POST' });
        window.location.href = '/admin/login';
    } catch (error) {
        console.error('Admin logout error:', error);
        window.location.href = '/admin/login';
    }
}

// Additional functions for quizzes, materials, and groups would continue here...
// This is a comprehensive foundation for the admin premium management system

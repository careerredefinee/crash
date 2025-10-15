// Premium Features Module
// Advanced premium functionality for Career Redefine platform

// Premium Analytics Dashboard
function loadPremiumAnalytics() {
    const analyticsHTML = `
        <div class="row g-4 mb-4">
            <div class="col-md-3">
                <div class="card bg-light border-primary">
                    <div class="card-body text-center">
                        <i class="fas fa-chart-line fs-1 text-primary mb-2"></i>
                        <h4 class="text-primary" id="courseProgress">0%</h4>
                        <p class="mb-0 text-primary">Course Progress</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-light border-success">
                    <div class="card-body text-center">
                        <i class="fas fa-trophy fs-1 text-success mb-2"></i>
                        <h4 class="text-success" id="certificatesEarned">0</h4>
                        <p class="mb-0 text-success">Certificates Earned</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-light border-warning">
                    <div class="card-body text-center">
                        <i class="fas fa-clock fs-1 text-warning mb-2"></i>
                        <h4 class="text-warning" id="studyHours">0h</h4>
                        <p class="mb-0 text-warning">Study Hours</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-light border-info">
                    <div class="card-body text-center">
                        <i class="fas fa-users fs-1 text-info mb-2"></i>
                        <h4 class="text-info" id="mentorSessions">0</h4>
                        <p class="mb-0 text-info">Mentor Sessions</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row g-4">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="fas fa-chart-area me-2"></i>Learning Progress</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="progressChart" height="100"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="fas fa-star me-2"></i>Achievements</h5>
                    </div>
                    <div class="card-body">
                        <div id="achievementsList">
                            <div class="achievement-item mb-3">
                                <div class="d-flex align-items-center">
                                    <div class="achievement-icon me-3">
                                        <i class="fas fa-medal text-warning"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-0">First Course Completed</h6>
                                        <small class="text-muted">Completed your first course</small>
                                    </div>
                                </div>
                            </div>
                            <div class="achievement-item mb-3">
                                <div class="d-flex align-items-center">
                                    <div class="achievement-icon me-3">
                                        <i class="fas fa-fire text-danger"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-0">7-Day Streak</h6>
                                        <small class="text-muted">Studied for 7 consecutive days</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return analyticsHTML;
}

// Premium Notifications System
function initPremiumNotifications() {
    const notificationHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="fas fa-bell me-2"></i>Premium Notifications</h5>
                <button class="btn btn-sm btn-outline-primary" onclick="markAllNotificationsRead()">
                    Mark All Read
                </button>
            </div>
            <div class="card-body">
                <div id="notificationsList">
                    <div class="notification-item border-start border-warning border-3 ps-3 mb-3">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="mb-1">New Mentor Session Available</h6>
                                <p class="mb-1 text-muted">Your mentor has scheduled a 1-on-1 session for tomorrow at 3 PM</p>
                                <small class="text-muted">2 hours ago</small>
                            </div>
                            <button class="btn btn-sm btn-outline-success">Accept</button>
                        </div>
                    </div>
                    
                    <div class="notification-item border-start border-info border-3 ps-3 mb-3">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="mb-1">Course Update Available</h6>
                                <p class="mb-1 text-muted">New modules added to "Advanced React Development"</p>
                                <small class="text-muted">1 day ago</small>
                            </div>
                            <button class="btn btn-sm btn-outline-primary">View</button>
                        </div>
                    </div>
                    
                    <div class="notification-item border-start border-success border-3 ps-3 mb-3">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="mb-1">Job Match Found</h6>
                                <p class="mb-1 text-muted">3 new job opportunities match your profile</p>
                                <small class="text-muted">2 days ago</small>
                            </div>
                            <button class="btn btn-sm btn-outline-success">View Jobs</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return notificationHTML;
}

// Premium Study Groups Management
function createStudyGroupModal() {
    const modalHTML = `
        <div class="modal fade" id="createStudyGroupModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-users me-2"></i>Create Study Group
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="createStudyGroupForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Group Name *</label>
                                        <input type="text" class="form-control" id="groupName" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Course/Topic *</label>
                                        <select class="form-control" id="groupTopic" required>
                                            <option value="">Select Course</option>
                                            <option value="data-science">Data Science</option>
                                            <option value="web-development">Web Development</option>
                                            <option value="ai-ml">AI & Machine Learning</option>
                                            <option value="cloud-computing">Cloud Computing</option>
                                            <option value="mobile-development">Mobile Development</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" id="groupDescription" rows="3" placeholder="Describe the study group purpose and goals..."></textarea>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Max Members</label>
                                        <select class="form-control" id="groupMaxMembers">
                                            <option value="5">5 members</option>
                                            <option value="10" selected>10 members</option>
                                            <option value="15">15 members</option>
                                            <option value="20">20 members</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Meeting Schedule</label>
                                        <select class="form-control" id="groupSchedule">
                                            <option value="weekly">Weekly</option>
                                            <option value="bi-weekly">Bi-weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="flexible">Flexible</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Group Features</label>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="groupChat" checked>
                                            <label class="form-check-label" for="groupChat">Group Chat</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="videoMeetings" checked>
                                            <label class="form-check-label" for="videoMeetings">Video Meetings</label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="sharedResources" checked>
                                            <label class="form-check-label" for="sharedResources">Shared Resources</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="progressTracking">
                                            <label class="form-check-label" for="progressTracking">Progress Tracking</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="createStudyGroup()">Create Group</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('createStudyGroupModal'));
    modal.show();
}

// Premium Content Creation
function createPremiumContentModal(type) {
    const modalHTML = `
        <div class="modal fade" id="createContentModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="fas fa-plus me-2"></i>Create Premium ${type.charAt(0).toUpperCase() + type.slice(1)}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="createContentForm">
                            <div class="row">
                                <div class="col-md-8">
                                    <div class="mb-3">
                                        <label class="form-label">Title *</label>
                                        <input type="text" class="form-control" id="contentTitle" required>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Description</label>
                                        <textarea class="form-control" id="contentDescription" rows="4"></textarea>
                                    </div>
                                    
                                    ${type === 'assessment' ? `
                                        <div class="mb-3">
                                            <label class="form-label">Questions</label>
                                            <div id="questionsContainer">
                                                <div class="question-item border p-3 mb-3">
                                                    <div class="mb-2">
                                                        <input type="text" class="form-control" placeholder="Question 1" name="question[]">
                                                    </div>
                                                    <div class="row">
                                                        <div class="col-md-6">
                                                            <input type="text" class="form-control mb-2" placeholder="Option A" name="optionA[]">
                                                            <input type="text" class="form-control" placeholder="Option B" name="optionB[]">
                                                        </div>
                                                        <div class="col-md-6">
                                                            <input type="text" class="form-control mb-2" placeholder="Option C" name="optionC[]">
                                                            <input type="text" class="form-control" placeholder="Option D" name="optionD[]">
                                                        </div>
                                                    </div>
                                                    <div class="mt-2">
                                                        <select class="form-control" name="correctAnswer[]">
                                                            <option value="A">Correct Answer: A</option>
                                                            <option value="B">Correct Answer: B</option>
                                                            <option value="C">Correct Answer: C</option>
                                                            <option value="D">Correct Answer: D</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <button type="button" class="btn btn-outline-primary" onclick="addQuestion()">
                                                <i class="fas fa-plus me-1"></i>Add Question
                                            </button>
                                        </div>
                                    ` : ''}
                                    
                                    ${type === 'material' ? `
                                        <div class="mb-3">
                                            <label class="form-label">Upload File</label>
                                            <input type="file" class="form-control" id="contentFile" accept=".pdf,.doc,.docx,.ppt,.pptx">
                                            <small class="text-muted">Supported formats: PDF, DOC, DOCX, PPT, PPTX</small>
                                        </div>
                                    ` : ''}
                                </div>
                                
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Category</label>
                                        <select class="form-control" id="contentCategory">
                                            <option value="data-science">Data Science</option>
                                            <option value="web-development">Web Development</option>
                                            <option value="ai-ml">AI & Machine Learning</option>
                                            <option value="cloud-computing">Cloud Computing</option>
                                            <option value="mobile-development">Mobile Development</option>
                                        </select>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Difficulty Level</label>
                                        <select class="form-control" id="contentDifficulty">
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Access Level</label>
                                        <select class="form-control" id="contentAccess">
                                            <option value="basic">Basic Premium</option>
                                            <option value="advanced">Advanced Premium</option>
                                            <option value="enterprise">Enterprise Premium</option>
                                        </select>
                                    </div>
                                    
                                    ${type === 'assessment' ? `
                                        <div class="mb-3">
                                            <label class="form-label">Time Limit (minutes)</label>
                                            <input type="number" class="form-control" id="timeLimit" value="30">
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Passing Score (%)</label>
                                            <input type="number" class="form-control" id="passingScore" value="70" min="0" max="100">
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-warning" onclick="savePremiumContent('${type}')">
                            <i class="fas fa-save me-1"></i>Create ${type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('createContentModal'));
    modal.show();
}

// Premium Features Functions
async function createStudyGroup() {
    const formData = {
        name: document.getElementById('groupName').value,
        topic: document.getElementById('groupTopic').value,
        description: document.getElementById('groupDescription').value,
        maxMembers: document.getElementById('groupMaxMembers').value,
        schedule: document.getElementById('groupSchedule').value,
        features: {
            chat: document.getElementById('groupChat').checked,
            videoMeetings: document.getElementById('videoMeetings').checked,
            sharedResources: document.getElementById('sharedResources').checked,
            progressTracking: document.getElementById('progressTracking').checked
        }
    };
    
    if (!formData.name || !formData.topic) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/premium/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showAlert('Study group created successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('createStudyGroupModal')).hide();
            loadPremiumGroups();
        } else {
            showAlert('Failed to create study group', 'error');
        }
    } catch (error) {
        console.error('Error creating study group:', error);
        showAlert('Error creating study group', 'error');
    }
}

async function savePremiumContent(type) {
    const formData = new FormData();
    formData.append('title', document.getElementById('contentTitle').value);
    formData.append('description', document.getElementById('contentDescription').value);
    formData.append('category', document.getElementById('contentCategory').value);
    formData.append('difficulty', document.getElementById('contentDifficulty').value);
    formData.append('accessLevel', document.getElementById('contentAccess').value);
    formData.append('type', type);
    
    if (type === 'material') {
        const file = document.getElementById('contentFile').files[0];
        if (file) {
            formData.append('file', file);
        }
    }
    
    if (type === 'assessment') {
        const questions = [];
        const questionElements = document.querySelectorAll('input[name="question[]"]');
        questionElements.forEach((q, index) => {
            questions.push({
                question: q.value,
                options: {
                    A: document.querySelectorAll('input[name="optionA[]"]')[index].value,
                    B: document.querySelectorAll('input[name="optionB[]"]')[index].value,
                    C: document.querySelectorAll('input[name="optionC[]"]')[index].value,
                    D: document.querySelectorAll('input[name="optionD[]"]')[index].value
                },
                correctAnswer: document.querySelectorAll('select[name="correctAnswer[]"]')[index].value
            });
        });
        formData.append('questions', JSON.stringify(questions));
        formData.append('timeLimit', document.getElementById('timeLimit').value);
        formData.append('passingScore', document.getElementById('passingScore').value);
    }
    
    try {
        const response = await fetch(`/api/admin/premium/${type}s`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            showAlert(`Premium ${type} created successfully!`, 'success');
            bootstrap.Modal.getInstance(document.getElementById('createContentModal')).hide();
            if (type === 'assessment') loadPremiumAssessments();
            if (type === 'material') loadPremiumMaterials();
        } else {
            showAlert(`Failed to create ${type}`, 'error');
        }
    } catch (error) {
        console.error(`Error creating ${type}:`, error);
        showAlert(`Error creating ${type}`, 'error');
    }
}

function addQuestion() {
    const container = document.getElementById('questionsContainer');
    const questionCount = container.children.length + 1;
    
    const questionHTML = `
        <div class="question-item border p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <input type="text" class="form-control" placeholder="Question ${questionCount}" name="question[]">
                <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <input type="text" class="form-control mb-2" placeholder="Option A" name="optionA[]">
                    <input type="text" class="form-control" placeholder="Option B" name="optionB[]">
                </div>
                <div class="col-md-6">
                    <input type="text" class="form-control mb-2" placeholder="Option C" name="optionC[]">
                    <input type="text" class="form-control" placeholder="Option D" name="optionD[]">
                </div>
            </div>
            <div class="mt-2">
                <select class="form-control" name="correctAnswer[]">
                    <option value="A">Correct Answer: A</option>
                    <option value="B">Correct Answer: B</option>
                    <option value="C">Correct Answer: C</option>
                    <option value="D">Correct Answer: D</option>
                </select>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', questionHTML);
}

function markAllNotificationsRead() {
    // Mark all notifications as read
    const notifications = document.querySelectorAll('.notification-item');
    notifications.forEach(notification => {
        notification.style.opacity = '0.6';
    });
    showAlert('All notifications marked as read', 'success');
}

// Load premium stats for dashboard
async function loadPremiumStats() {
    try {
        const response = await fetch('/api/admin/premium/stats');
        const stats = await response.json();
        
        document.getElementById('totalPremiumUsers').textContent = stats.totalUsers || 0;
        document.getElementById('activePremiumUsers').textContent = stats.activeUsers || 0;
        document.getElementById('totalAssessments').textContent = stats.assessments || 0;
        document.getElementById('totalGroups').textContent = stats.groups || 0;
        
    } catch (error) {
        console.error('Error loading premium stats:', error);
    }
}

// Initialize premium features
function initPremiumFeatures() {
    loadPremiumStats();
    
    // Add premium styles
    const premiumStyles = `
        <style>
        .achievement-icon {
            width: 40px;
            height: 40px;
            background: #f8f9fa;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
        }
        
        .notification-item {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1rem;
            transition: all 0.3s ease;
        }
        
        .notification-item:hover {
            background: #e9ecef;
        }
        
        .question-item {
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .premium-feature-card {
            border: 2px solid #ffc107;
            background: linear-gradient(135deg, #fff3cd, #ffffff);
        }
        
        .premium-badge {
            background: linear-gradient(135deg, #ffc107, #ff8c00);
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', premiumStyles);
}

// Export functions for global access
window.loadPremiumAnalytics = loadPremiumAnalytics;
window.initPremiumNotifications = initPremiumNotifications;
window.createStudyGroupModal = createStudyGroupModal;
window.createPremiumContentModal = createPremiumContentModal;
window.createStudyGroup = createStudyGroup;
window.savePremiumContent = savePremiumContent;
window.addQuestion = addQuestion;
window.markAllNotificationsRead = markAllNotificationsRead;
window.loadPremiumStats = loadPremiumStats;
window.initPremiumFeatures = initPremiumFeatures;

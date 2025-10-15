// Premium Dashboard JavaScript

let currentUser = null;
let currentSection = 'dashboard';

document.addEventListener('DOMContentLoaded', function() {
    checkPremiumAuth().then(user => {
        if (user) {
            currentUser = user;
            loadDashboardData();
        } else {
            window.location.href = '/premium-login';
        }
    });
});

// Check premium authentication
async function checkPremiumAuth() {
    try {
        const response = await fetch('/api/premium-auth-check');
        const data = await response.json();
        
        if (data.authenticated && data.user.isPremium) {
            return data.user;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Premium auth check error:', error);
        return null;
    }
}

// Premium logout
async function premiumLogout() {
    try {
        await fetch('/api/premium-logout', { method: 'POST' });
        window.location.href = '/premium-login';
    } catch (error) {
        console.error('Premium logout error:', error);
        window.location.href = '/premium-login';
    }
}

// Show section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remove active class from all sidebar items
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(`${sectionName}-section`).style.display = 'block';
    
    // Add active class to clicked sidebar item
    event.target.closest('.sidebar-item').classList.add('active');
    
    currentSection = sectionName;
    
    // Load section data
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'assessments':
            loadAssessments();
            break;
        case 'quizzes':
            loadQuizzes();
            break;
        case 'mock-tests':
            loadMockTests();
            break;
        case 'materials':
            loadMaterials();
            break;
        case 'groups':
            loadGroups();
            break;
        case 'progress':
            loadProgress();
            break;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch('/api/premium/dashboard-stats');
        const stats = await response.json();
        
        if (response.ok) {
            document.getElementById('assessmentCount').textContent = stats.assessments || 0;
            document.getElementById('quizCount').textContent = stats.quizzes || 0;
            document.getElementById('groupCount').textContent = stats.groups || 0;
            document.getElementById('materialCount').textContent = stats.materials || 0;
            
            loadRecentActivities();
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load recent activities
async function loadRecentActivities() {
    try {
        const response = await fetch('/api/premium/recent-activities');
        const activities = await response.json();
        
        const container = document.getElementById('recentActivities');
        
        if (activities.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-clock fs-1 mb-3"></i>
                    <p>No recent activities</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="d-flex align-items-center mb-3 p-3 border rounded">
                <div class="me-3">
                    <i class="fas ${getActivityIcon(activity.type)} text-primary"></i>
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-1">${activity.title}</h6>
                    <p class="mb-0 text-muted small">${activity.description}</p>
                </div>
                <div class="text-muted small">
                    ${timeAgo(activity.createdAt)}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recent activities:', error);
    }
}

// Get activity icon
function getActivityIcon(type) {
    const icons = {
        'assessment': 'fa-clipboard-check',
        'quiz': 'fa-question-circle',
        'mock-test': 'fa-brain',
        'material': 'fa-file-pdf',
        'group': 'fa-users',
        'default': 'fa-bell'
    };
    return icons[type] || icons.default;
}

// Load assessments
async function loadAssessments() {
    try {
        const response = await fetch('/api/premium/assessments');
        const assessments = await response.json();
        
        const container = document.getElementById('assessmentsList');
        
        if (assessments.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="premium-card p-4 text-center">
                        <i class="fas fa-clipboard-check fs-1 text-muted mb-3"></i>
                        <h5 class="text-muted">No assessments available</h5>
                        <p class="text-muted">Check back later for new assessments!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = assessments.map(assessment => `
            <div class="col-md-6 mb-4">
                <div class="premium-card assessment-card p-4">
                    <h5 class="mb-3">${assessment.title}</h5>
                    <p class="text-muted mb-3">${assessment.description}</p>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="badge bg-danger">${assessment.questions} Questions</span>
                        <span class="text-muted">${assessment.duration} mins</span>
                    </div>
                    <button class="btn btn-primary w-100" onclick="startAssessment('${assessment._id}')">
                        <i class="fas fa-play me-2"></i>Start Assessment
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading assessments:', error);
    }
}

// Load quizzes
async function loadQuizzes() {
    try {
        const response = await fetch('/api/premium/quizzes');
        const quizzes = await response.json();
        
        const container = document.getElementById('quizzesList');
        
        if (quizzes.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="premium-card p-4 text-center">
                        <i class="fas fa-question-circle fs-1 text-muted mb-3"></i>
                        <h5 class="text-muted">No quizzes available</h5>
                        <p class="text-muted">Check back later for new quizzes!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = quizzes.map(quiz => `
            <div class="col-md-6 mb-4">
                <div class="premium-card quiz-card p-4">
                    <h5 class="mb-3">${quiz.title}</h5>
                    <p class="text-muted mb-3">${quiz.description}</p>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="badge bg-success">${quiz.questions} Questions</span>
                        <span class="text-muted">${quiz.duration} mins</span>
                    </div>
                    <button class="btn btn-success w-100" onclick="startQuiz('${quiz._id}')">
                        <i class="fas fa-play me-2"></i>Start Quiz
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading quizzes:', error);
    }
}

// Load mock tests
async function loadMockTests() {
    try {
        const response = await fetch('/api/premium/mock-tests');
        const mockTests = await response.json();
        
        const container = document.getElementById('mockTestsList');
        
        if (mockTests.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="premium-card p-4 text-center">
                        <i class="fas fa-brain fs-1 text-muted mb-3"></i>
                        <h5 class="text-muted">No mock tests available</h5>
                        <p class="text-muted">Check back later for new mock tests!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = mockTests.map(test => `
            <div class="col-md-6 mb-4">
                <div class="premium-card p-4">
                    <h5 class="mb-3">${test.title}</h5>
                    <p class="text-muted mb-3">${test.description}</p>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="badge bg-warning">${test.questions} Questions</span>
                        <span class="text-muted">${test.duration} mins</span>
                    </div>
                    <button class="btn btn-warning w-100" onclick="startMockTest('${test._id}')">
                        <i class="fas fa-brain me-2"></i>Start Mock Test
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading mock tests:', error);
    }
}

// Load study materials
async function loadMaterials() {
    try {
        const response = await fetch('/api/premium/materials');
        const materials = await response.json();
        
        const container = document.getElementById('materialsList');
        
        if (materials.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="premium-card p-4 text-center">
                        <i class="fas fa-file-pdf fs-1 text-muted mb-3"></i>
                        <h5 class="text-muted">No study materials available</h5>
                        <p class="text-muted">Check back later for new materials!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = materials.map(material => `
            <div class="col-md-6 mb-4">
                <div class="premium-card pdf-card p-4">
                    <div class="d-flex align-items-center mb-3">
                        <i class="fas fa-file-pdf text-info fs-2 me-3"></i>
                        <div>
                            <h5 class="mb-1">${material.title}</h5>
                            <p class="text-muted mb-0">${material.category || 'General'}</p>
                        </div>
                    </div>
                    <p class="text-muted mb-3">${material.description}</p>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="badge bg-info">${material.fileSize || 'N/A'}</span>
                        <span class="text-muted">${formatDate(material.uploadedAt)}</span>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-info flex-fill" onclick="viewMaterial('${material._id}')">
                            <i class="fas fa-eye me-2"></i>View
                        </button>
                        <button class="btn btn-outline-info" onclick="downloadMaterial('${material._id}')">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading materials:', error);
    }
}

// Load study groups
async function loadGroups() {
    try {
        const response = await fetch('/api/premium/groups');
        const groups = await response.json();
        
        const container = document.getElementById('groupsList');
        
        if (groups.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="premium-card p-4 text-center">
                        <i class="fas fa-users fs-1 text-muted mb-3"></i>
                        <h5 class="text-muted">No study groups available</h5>
                        <p class="text-muted">You haven't been added to any groups yet!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = groups.map(group => `
            <div class="col-md-6 mb-4">
                <div class="premium-card group-card p-4">
                    <div class="d-flex align-items-center mb-3">
                        <i class="fas fa-users text-warning fs-2 me-3"></i>
                        <div>
                            <h5 class="mb-1">${group.name}</h5>
                            <p class="text-muted mb-0">${group.members.length} members</p>
                        </div>
                    </div>
                    <p class="text-muted mb-3">${group.description}</p>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="badge bg-warning">${group.category || 'General'}</span>
                        <span class="text-muted">${formatDate(group.createdAt)}</span>
                    </div>
                    <button class="btn btn-warning w-100" onclick="joinGroupDiscussion('${group._id}')">
                        <i class="fas fa-comments me-2"></i>Join Discussion
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

// Load progress
async function loadProgress() {
    try {
        const response = await fetch('/api/premium/progress');
        const progressData = await response.json();
        
        // Create progress chart
        const ctx = document.getElementById('progressChart').getContext('2d');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: progressData.labels || ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Assessment Scores',
                    data: progressData.assessmentScores || [0, 0, 0, 0],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Quiz Scores',
                    data: progressData.quizScores || [0, 0, 0, 0],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Mock Test Scores',
                    data: progressData.mockTestScores || [0, 0, 0, 0],
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Your Learning Progress'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

// Start assessment
function startAssessment(assessmentId) {
    window.open(`/premium/assessment/${assessmentId}`, '_blank');
}

// Start quiz
function startQuiz(quizId) {
    window.open(`/premium/quiz/${quizId}`, '_blank');
}

// Start mock test
function startMockTest(testId) {
    window.open(`/premium/mock-test/${testId}`, '_blank');
}

// View material
function viewMaterial(materialId) {
    window.open(`material-viewer.html?id=${materialId}`, '_blank');
}

// Download material
async function downloadMaterial(materialId) {
    try {
        const response = await fetch(`/api/premium/materials/${materialId}/download`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `material-${materialId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showAlert('Material downloaded successfully!', 'success');
        } else {
            showAlert('Failed to download material', 'danger');
        }
    } catch (error) {
        console.error('Error downloading material:', error);
        showAlert('Failed to download material', 'danger');
    }
}

// Join group discussion
function joinGroupDiscussion(groupId) {
    window.open(`/premium/group/${groupId}`, '_blank');
}

// Courses page JavaScript

let allCourses = [];
let currentFilter = 'all';
let currentUser = null;

// Show correct profile link and profile image in navbar
function showProfileNav() {
    checkAuth().then(user => {
        currentUser = user;
        // Hide premium dropdown unless premium user
        const premiumDropdown = document.getElementById('premiumToolsDropdown');
        if (premiumDropdown) {
            premiumDropdown.style.display = (user && user.isPremium) ? 'inline-block' : 'none';
        }
        // Only show regular profile link for all users
        const userSection = document.getElementById('userSection');
        if (userSection) {
            const profileLinks = userSection.querySelectorAll('a[href="/profile"]');
            profileLinks.forEach(link => {
                link.parentElement.style.display = '';
            });
        }
    });
}

// Run on DOMContentLoaded
if (document.readyState !== 'loading') {
    showProfileNav();
} else {
    document.addEventListener('DOMContentLoaded', showProfileNav);
}




document.addEventListener('DOMContentLoaded', function() {
    checkAuth().then(user => {
        currentUser = user;
        loadCourses();
    });
});

// Load courses
async function loadCourses() {
    try {
        const response = await fetch('/api/courses');
        allCourses = await response.json();
        
        if (allCourses.length === 0) {
            document.getElementById('coursesContainer').innerHTML = `
                <div class="col-12 text-center">
                    <div class="py-5">
                        <i class="fas fa-graduation-cap fs-1 text-muted mb-3"></i>
                        <h4 class="text-muted">No courses available yet</h4>
                        <p class="text-muted">Check back soon for new courses!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Load user enrollments if logged in
        if (currentUser) {
            await loadUserEnrollments();
        }
        
        displayCourses(allCourses);
        
    } catch (error) {
        console.error('Error loading courses:', error);
        document.getElementById('coursesContainer').innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Failed to load courses. Please try again later.
                </div>
            </div>
        `;
    }
}

// Load user enrollments
async function loadUserEnrollments() {
    try {
        const response = await fetch('/api/enrollments');
        if (response.ok) {
            const enrollments = await response.json();
            // Mark courses as enrolled
            allCourses.forEach(course => {
                const enrollment = enrollments.find(e => e.course._id === course._id);
                if (enrollment) {
                    course.isEnrolled = true;
                    course.enrollment = enrollment;
                }
            });
        }
    } catch (error) {
        console.log('Could not load enrollments:', error);
    }
}

// Display courses based on current filter
function displayCourses(courses) {
    const coursesContainer = document.getElementById('coursesContainer');
    coursesContainer.innerHTML = '';
    
    if (courses.length === 0) {
        coursesContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="py-5">
                    <i class="fas fa-search fs-1 text-muted mb-3"></i>
                    <h4 class="text-muted">No courses found</h4>
                    <p class="text-muted">Try changing your filter or check back later!</p>
                </div>
            </div>
        `;
        return;
    }
    
    courses.forEach(course => {
        const courseCard = createCourseCard(course);
        coursesContainer.appendChild(courseCard);
    });
}

// Filter courses
function filterCourses(type) {
    currentFilter = type;
    
    // Update active tab
    document.querySelectorAll('.course-filter-tabs .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${type}Tab`).classList.add('active');
    
    let filteredCourses = allCourses;
    
    switch (type) {
        case 'free':
            filteredCourses = allCourses.filter(course => !course.isPaid);
            break;
        case 'paid':
            filteredCourses = allCourses.filter(course => course.isPaid);
            break;
        case 'all':
        default:
            filteredCourses = allCourses;
            break;
    }
    
    displayCourses(filteredCourses);
}

// Create course card
function createCourseCard(course) {
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 mb-4';
    col.setAttribute('data-course-type', course.isPaid ? 'paid' : 'free');

    // Determine course status and actions
    const isPaid = course.isPaid;
    const isEnrolled = course.isEnrolled;
    const price = isPaid ? `₹${course.price}` : 'FREE';
    const priceClass = isPaid ? 'text-warning' : 'text-success';

    // Course type badge
    const typeBadge = isPaid ?
        '<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-2"><i class="fas fa-crown me-1"></i>Premium</span>' :
        '<span class="badge bg-success position-absolute top-0 end-0 m-2"><i class="fas fa-gift me-1"></i>Free</span>';

    // Lock overlay for paid courses without payment
    const lockOverlay = isPaid && !isEnrolled ? `
        <div class="course-lock-overlay">
            <div class="lock-content">
                <i class="fas fa-lock fs-1 text-white mb-2"></i>
                <p class="text-white mb-0">Premium Course</p>
            </div>
        </div>
    ` : '';

   // Minimal card (default)
   col.innerHTML = `
   <div class="card course-card ${isPaid ? 'premium-course' : 'free-course'}" style="height: 550px; display: flex; flex-direction: column;">
   
     <!-- Top 50%: Image/Video -->
     <div class="position-relative" style="height: 50%;">
       ${
         course.video
           ? `<iframe src="${course.video}" style="width: 100%; height: 100%; object-fit: cover; border: none;" allowfullscreen></iframe>`
           : (course.image
             ? `<img src="${course.image}" alt="${course.title}" style="width: 100%; height: 100%; object-fit: cover;">`
             : `<div class="bg-primary d-flex align-items-center justify-content-center h-100">
                  <i class="fas fa-graduation-cap text-white fs-3"></i>
                </div>`)
       }
       ${typeBadge || ''}
       ${lockOverlay || ''}
     </div>
   
     <!-- Middle 25%: Course Title + Paid/Free + Short Description -->
     <div class="p-3" style="height: 25%; overflow: hidden;">
       <h5 class="mb-1 text-truncate" title="${course.title}" style="font-size: 1.6rem;">${course.title}</h5>
       ${isPaid ? '<i class="fas fa-lock text-warning me-2" title="Paid Course"></i>' : ''}
       <small class="${priceClass || ''} fw-semibold" style="font-size: 1.4rem;">${price}</small>
       <p class="text-muted small mt-1 mb-0" style="line-height: 1.45; max-height: 5.5em; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; font-size: 1.05rem;">
         ${course.description}
       </p>
     </div>
   
     <!-- Bottom 25%: Duration, Mentor, Like button + action buttons below -->
     <div class="p-3" style="height: 25%; display: flex; flex-direction: column; justify-content: space-between;">
       <div class="d-flex justify-content-between align-items-center mb-3" style="font-size: 1.15rem;">
         <small class="text-muted" title="Duration">
           <i class="fas fa-clock me-1"></i>${course.duration}
         </small>
         <small class="text-muted" title="Instructor">
           <i class="fas fa-user me-1"></i>${course.instructor}
         </small>
         <button class="btn btn-outline-warning btn-sm" style="padding: 0.5rem 0.85rem; font-size: 1.15rem;" onclick="addToWishlist('${course._id}')">
           <i class="fas fa-heart"></i>
         </button>
       </div>
   
       <div class="course-action-buttons d-flex gap-2">
         ${course.link ? `
           <a href="${course.link}" target="_blank" rel="noopener noreferrer"
              class="btn btn-info btn-sm flex-fill" style="font-size: 1.15rem; padding: 0.55rem 0;">
             <i class="fas fa-info-circle me-1"></i> More
           </a>` : ''}
         <button class="btn btn-primary btn-sm flex-fill" style="font-size: 1.15rem; padding: 0.55rem 0;" onclick="openCourseQuery('${course._id}')">
           <i class="fas fa-question-circle me-1"></i> Query
         </button>
         <button class="btn btn-success btn-sm flex-fill" style="font-size: 1.15rem; padding: 0.55rem 0;" onclick="openWhatsAppChat('${course._id}')">
           <i class="fab fa-whatsapp me-1"></i> Chat Us
         </button>
       </div>
     </div>
   
   </div>
   `;
   
   return col;
   }
   


// Open course query modal
function openCourseQuery(courseId) {
    const course = allCourses.find(c => c._id === courseId);
    if (!course) return;
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="courseQueryModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-question-circle me-2"></i>Course Query
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="courseQueryForm">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Course</label>
                                    <input type="text" class="form-control" value="${course.title}" readonly>
                                    <input type="hidden" id="queryCourseId" value="${courseId}">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Category</label>
                                    <input type="text" class="form-control" value="${course.category || 'General'}" readonly>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label fw-bold">Your Query <span class="text-danger">*</span></label>
                                <textarea class="form-control" id="queryMessage" rows="4" placeholder="Please describe your query about this course..." required></textarea>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Name <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="queryName" placeholder="Your name" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Email <span class="text-danger">*</span></label>
                                    <input type="email" class="form-control" id="queryEmail" placeholder="your.email@example.com" required>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Phone Number (Optional)</label>
                                <input type="tel" class="form-control" id="queryPhone" placeholder="+91 9876543210">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="submitCourseQuery()">
                            <i class="fas fa-paper-plane me-1"></i>Send Query
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('courseQueryModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('courseQueryModal'));
    modal.show();
    
    // Auto-fill user info if logged in (with delay to ensure modal is rendered)
    setTimeout(() => {
        const nameField = document.getElementById('queryName');
        const emailField = document.getElementById('queryEmail');
        const phoneField = document.getElementById('queryPhone');
        let filled = false;
        // Always try sessionStorage first
        const sName = sessionStorage.getItem('userName');
        const sEmail = sessionStorage.getItem('userEmail');
        const sPhone = sessionStorage.getItem('userPhone');
        if (sName || sEmail) {
            if (nameField) {
                nameField.value = sName || '';
                nameField.readOnly = true;
            }
            if (emailField) {
                emailField.value = sEmail || '';
                emailField.readOnly = true;
            }
            if (phoneField && sPhone) phoneField.value = sPhone;
            filled = true;
        } else if (currentUser) {
            if (nameField) {
                nameField.value = currentUser.name || '';
                nameField.readOnly = true;
            }
            if (emailField) {
                emailField.value = currentUser.email || '';
                emailField.readOnly = true;
            }
            if (phoneField) phoneField.value = currentUser.phone || '';
            filled = true;
        }
        if (!filled) {
            // Fallback: Try to get user data from auth check
            checkAuth().then(user => {
                if (user) {
                    if (nameField) {
                        nameField.value = user.name || '';
                        nameField.readOnly = true;
                    }
                    if (emailField) {
                        emailField.value = user.email || '';
                        emailField.readOnly = true;
                    }
                    if (phoneField) phoneField.value = user.phone || '';
                }
            });
        }
    }, 100);
}

// Submit course query
async function submitCourseQuery() {
    const form = document.getElementById('courseQueryForm');
    if (!currentUser) {
        showFormAlert('You must be logged in to submit a query.', 'danger', '#courseQueryForm');
        return;
    }
    const formData = {
        courseId: document.getElementById('queryCourseId').value,
        message: document.getElementById('queryMessage').value.trim(),
        name: document.getElementById('queryName').value.trim(),
        email: document.getElementById('queryEmail').value.trim(),
        phone: document.getElementById('queryPhone').value.trim()
    };
    
    if (!formData.message) {
        showFormAlert('Please enter your query message', 'warning', '#courseQueryForm');
        return;
    }
    
    if (!formData.name || !formData.email) {
        showFormAlert('Please fill in your name and email', 'warning', '#courseQueryForm');
        return;
    }
    
    try {
        const response = await fetch('/api/course-queries', {
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
                // Store query locally as backup
                storeQueryLocally(formData);
                
                // Hide the query modal and reset the form
                bootstrap.Modal.getInstance(document.getElementById('courseQueryModal')).hide();
                form.reset();
                
                // Show success modal
                const successModal = new bootstrap.Modal(document.getElementById('successModal'));
                successModal.show();
                
            } else {
                showAlert(data.message || 'Failed to submit query', 'danger');
            }
        } else {
            // Backend not available, store locally
            console.warn('Backend API not available, storing query locally');
            storeQueryLocally(formData);
            showAlert('Your query has been saved! We will contact you soon.', 'success-card');
            bootstrap.Modal.getInstance(document.getElementById('courseQueryModal')).hide();
            form.reset(); // Reset the form
        }
    } catch (error) {
        console.error('Error submitting query:', error);
        // Store locally as fallback
        storeQueryLocally(formData);
        showAlert('Your query has been saved locally! We will contact you soon.', 'success-card');
        bootstrap.Modal.getInstance(document.getElementById('courseQueryModal')).hide();
        form.reset(); // Reset the form
    }
}

// Store query locally when backend is not available
function storeQueryLocally(formData) {
    try {
        // Get existing queries from localStorage
        const existingQueries = JSON.parse(localStorage.getItem('courseQueries') || '[]');
        
        // Add new query with timestamp and ID
        const newQuery = {
            ...formData,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            status: 'pending',
            source: 'local'
        };
        
        existingQueries.push(newQuery);
        
        // Store back to localStorage
        localStorage.setItem('courseQueries', JSON.stringify(existingQueries));
        
        console.log('Query stored locally:', newQuery);
    } catch (error) {
        console.error('Error storing query locally:', error);
    }
}

// Open WhatsApp chat for course
function openWhatsAppChat(courseId) {
    const course = allCourses.find(c => c._id === courseId);
    if (!course) return;
    
    const message = `Hi! I'm interested in the course "${course.title}". Can you provide more information about:

• Course curriculum and duration
• Prerequisites and requirements
• Certification details
• Pricing and enrollment process
• Mentorship and support

Thank you!`;
    
    const whatsappNumber = '919535713363'; // Your WhatsApp number
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappURL, '_blank');
}

// Add to wishlist
async function addToWishlist(courseId) {
    if (!currentUser) {
        showAlert('Please login to add courses to wishlist', 'warning');
        return;
    }

    try {
        const response = await fetch(`/api/wishlist/${courseId}`, {
            method: 'POST'
        });

        const data = await response.json();
        
        if (response.ok) {
            showAlert('Course added to wishlist!', 'success');
        } else {
            showAlert(data.error || data.message || 'Failed to add to wishlist', 'danger');
        }
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        showAlert('Failed to add to wishlist', 'danger');
    }
}

// Enroll in free course
async function enrollFreeCourse(courseId) {
    if (!currentUser) {
        showAlert('Please login to enroll in courses', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return;
    }
    
    // Check if already enrolled
    const course = allCourses.find(c => c._id === courseId);
    if (course && course.isEnrolled) {
        showAlert('You are already enrolled in this course successfully!', 'info');
        return;
    }
    
    try {
        showLoading('Enrolling in course...');
        
        const response = await fetch('/api/enroll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ courseId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Successfully enrolled in the course!', 'success');
            // Reload courses to update UI
            await loadCourses();
        } else {
            if (data.message && data.message.includes('already enrolled')) {
                showAlert('You are already enrolled in this course successfully!', 'info');
            } else {
                showAlert(data.message || 'Failed to enroll in course', 'danger');
            }
        }
    } catch (error) {
        console.error('Error enrolling in course:', error);
        showAlert('Failed to enroll in course', 'danger');
    } finally {
        hideLoading();
    }
}

// Enroll in paid course (redirect to payment)
async function enrollPaidCourse(courseId) {
    if (!currentUser) {
        showAlert('Please login to enroll in courses', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return;
    }
    
    // Check if already enrolled
    const course = allCourses.find(c => c._id === courseId);
    if (course && course.isEnrolled) {
        showAlert('You are already enrolled in this course successfully!', 'info');
        return;
    }
    
    // Redirect to payment page
    window.location.href = `/payment.html?courseId=${courseId}`;
}

// Continue enrolled course
async function continueCourse(courseId) {
    if (!currentUser) {
        showAlert('Please login to continue the course', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return;
    }
    
    // For now, show a message. In a real implementation, this would open the course player
    showAlert('Course player will be implemented soon!', 'info');
    // TODO: Implement course player with video progress tracking
    // window.location.href = `/course-player.html?courseId=${courseId}`;
}

// Download certificate
async function downloadCertificate(courseId) {
    if (!currentUser) {
        showAlert('Please login to download certificate', 'warning');
        return;
    }
    
    try {
        showLoading('Generating certificate...');
        
        const response = await fetch(`/api/certificates?courseId=${courseId}`);
        const certificates = await response.json();
        
        if (certificates.length > 0) {
            const certificate = certificates[0];
            
            // Download certificate data
            const downloadResponse = await fetch(`/api/certificates/${certificate._id}/download`);
            const certData = await downloadResponse.json();
            
            if (certData.success) {
                // Create and download certificate (simple implementation)
                const certificateContent = `
CERTIFICATE OF COMPLETION

This is to certify that
${currentUser.name}

has successfully completed the course
"${certData.course.title}"

Certificate ID: ${certData.certificateId}
Date: ${new Date(certData.generatedAt).toLocaleDateString()}

Career Redefine Platform
                `;
                
                const blob = new Blob([certificateContent], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `certificate-${certData.course.title.replace(/\s+/g, '-')}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                showAlert('Certificate downloaded successfully!', 'success');
            } else {
                showAlert('Failed to generate certificate', 'danger');
            }
        } else {
            showAlert('No certificate found for this course', 'warning');
        }
    } catch (error) {
        console.error('Error downloading certificate:', error);
        showAlert('Failed to download certificate', 'danger');
    } finally {
        hideLoading();
    }
}

// Add course card hover effects and premium styling
const style = document.createElement('style');
style.textContent = `
    .course-card {
        transition: all 0.3s ease;
        border: none;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        overflow: hidden;
    }
    
    .course-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    .course-card .card-img-top {
        height: 200px;
        object-fit: cover;
        transition: transform 0.3s ease;
    }
    
    .course-card:hover .card-img-top {
        transform: scale(1.05);
    }
    
    .premium-course {
        border: 2px solid #ffc107;
        background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%);
    }
    
    .free-course {
        border: 2px solid #28a745;
        background: linear-gradient(135deg, #f0fff4 0%, #ffffff 100%);
    }
    
    .course-lock-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
        transition: opacity 0.3s ease;
    }
    
    .course-lock-overlay:hover {
        background: rgba(0, 0, 0, 0.8);
    }
    
    .lock-content {
        text-align: center;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    .course-filter-tabs {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    
    .course-filter-tabs .btn {
        border-radius: 25px;
        padding: 0.5rem 1.5rem;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    
    .course-filter-tabs .btn.active {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    
    .course-meta {
        border-top: 1px solid #eee;
        border-bottom: 1px solid #eee;
        padding: 0.75rem 0;
        margin: 0.75rem 0;
    }
    
    .price {
        font-weight: 600;
        font-size: 1.1rem;
    }
    
    .course-actions .btn {
        transition: all 0.3s ease;
        border-radius: 20px;
    }
    
    .course-actions .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    
    .progress {
        border-radius: 10px;
        overflow: hidden;
    }
    
    .progress-bar {
        transition: width 0.6s ease;
    }
    
    .badge {
        font-size: 0.75rem;
        padding: 0.5rem 0.75rem;
        border-radius: 15px;
    }
    
    @media (max-width: 768px) {
        .course-filter-tabs {
            margin-bottom: 1rem;
        }
        
        .course-filter-tabs .btn {
            padding: 0.4rem 1rem;
            font-size: 0.9rem;
        }
    }
`;
document.head.appendChild(style);
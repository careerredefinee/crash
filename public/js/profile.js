// Profile page JavaScript

let currentUser = null;

// Show premium tools in navbar if premium user
function showPremiumToolsNav() {
    checkAuth().then(user => {
        currentUser = user;
        const premiumDropdown = document.getElementById('premiumToolsDropdown');
        if (user && user.isPremium && premiumDropdown) {
            premiumDropdown.style.display = 'inline-block';
        } else if (premiumDropdown) {
            premiumDropdown.style.display = 'none';
        }
    });
}

// Run on DOMContentLoaded
if (document.readyState !== 'loading') {
    showPremiumToolsNav();
} else {
    document.addEventListener('DOMContentLoaded', showPremiumToolsNav);
}

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth().then(user => {
        if (!user) {
            window.location.href = '/login';
            return;
        }
        currentUser = user;
        loadProfile();
        loadWishlist();
        // loadEnrolledCourses(); // Removed My Courses tab
        loadCertificates();
        loadUserQueries();
        loadUserAppointments();
        checkPremiumAccess();
    });
    
    // Initialize forms
    document.getElementById('editProfileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('changePasswordForm').addEventListener('submit', handlePasswordChange);
});

// Load profile data
async function loadProfile() {
    try {
        const response = await fetch('/api/profile');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const profile = await response.json();
        
        // Check if profile data is valid
        if (!profile || typeof profile !== 'object') {
            throw new Error('Invalid profile data received');
        }
        
        // Update profile display with safe access
        const profileNameEl = document.getElementById('profileName');
        const profileEmailEl = document.getElementById('profileEmail');
        
        if (profileNameEl) {
            profileNameEl.textContent = profile.name || 'No Name';
        }
        if (profileEmailEl) {
            profileEmailEl.textContent = profile.email || 'No Email';
        }
        
        // Update profile picture
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar) {
            profileAvatar.src = profile.profilePic || '/images/default.png';
        }
        
        // Update stats
        document.getElementById('wishlistCount').textContent = profile.wishlist?.length || 0;
        document.getElementById('skillsCount').textContent = profile.skills?.length || 0;
        
        // Update profile details
        displayProfileDetails(profile);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Failed to load profile data', 'danger');
    }
}

// Display profile details
function displayProfileDetails(profile) {
    const detailsContainer = document.getElementById('profileDetails');
    
    detailsContainer.innerHTML = `
        <div class="col-md-6">
            <label class="form-label fw-bold">Full Name</label>
            <p class="form-control-plaintext">${profile.name || 'Not provided'}</p>
        </div>
        <div class="col-md-6">
            <label class="form-label fw-bold">Email</label>
            <p class="form-control-plaintext">${profile.email || 'Not provided'}</p>
        </div>
        <div class="col-md-6">
            <label class="form-label fw-bold">Phone</label>
            <p class="form-control-plaintext">${profile.phone || 'Not provided'}</p>
        </div>
        <div class="col-md-6">
            <label class="form-label fw-bold">Date of Birth</label>
            <p class="form-control-plaintext">${profile.dob ? formatDate(profile.dob) : 'Not provided'}</p>
        </div>
        <div class="col-12">
            <label class="form-label fw-bold">Skills</label>
            <div class="skills-display">
                ${profile.skills && profile.skills.length > 0 ? 
                    profile.skills.map(skill => `<span class="badge bg-primary me-2 mb-2">${skill}</span>`).join('') :
                    '<p class="form-control-plaintext">No skills added yet</p>'
                }
            </div>
        </div>
        <div class="col-md-6">
            <label class="form-label fw-bold">Member Since</label>
            <p class="form-control-plaintext">${formatDate(profile.createdAt)}</p>
        </div>
        <div class="col-md-6">
            <label class="form-label fw-bold">Account Type</label>
            <p class="form-control-plaintext">
                <span class="badge ${profile.isAdmin ? 'bg-danger' : (profile.isPremium ? 'bg-warning' : 'bg-success')}">
                    ${profile.isAdmin ? 'Administrator' : (profile.isPremium ? 'Premium User' : 'Regular User')}
                </span>
                ${profile.isPremium && profile.premiumPlan ? `<br><small class="text-muted">Plan: ${profile.premiumPlan.charAt(0).toUpperCase() + profile.premiumPlan.slice(1)}</small>` : ''}
            </p>
        </div>
    `;
}

// Load wishlist
async function loadWishlist() {
    try {
        const response = await fetch('/api/wishlist');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const wishlist = await response.json();
        
        const wishlistContainer = document.getElementById('wishlistContainer');
        if (!wishlistContainer) {
            console.error('Wishlist container not found');
            return;
        }
        
        wishlistContainer.innerHTML = '';
        
        // Check if wishlist is a valid array
        if (!Array.isArray(wishlist)) {
            console.warn('Wishlist is not an array:', wishlist);
            wishlistContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning">Unable to load wishlist data</div>
                </div>
            `;
            return;
        }
        
        if (wishlist.length === 0) {
            wishlistContainer.innerHTML = `
                <div class="col-12 text-center">
                    <div class="py-4">
                        <i class="fas fa-heart fs-1 text-muted mb-3"></i>
                        <h5 class="text-muted">Your wishlist is empty</h5>
                        <p class="text-muted">Add courses to your wishlist to see them here</p>
                        <a href="/courses" class="btn btn-primary">Browse Courses</a>
                    </div>
                </div>
            `;
            return;
        }
        
        wishlist.forEach(course => {
            const courseCard = createWishlistCard(course);
            wishlistContainer.appendChild(courseCard);
        });
        
    } catch (error) {
        console.error('Error loading wishlist:', error);
        document.getElementById('wishlistContainer').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">Failed to load wishlist</div>
            </div>
        `;
    }
}

// Create wishlist card
function createWishlistCard(course) {
    const col = document.createElement('div');
    col.className = 'col-md-6 mb-3';
    
    col.innerHTML = `
        <div class="card h-100">
            ${course.image ? `<img src="${course.image}" class="card-img-top" style="height: 150px; object-fit: cover;" alt="${course.title}">` : ''}
            <div class="card-body">
                <h6 class="card-title">${course.title}</h6>
                <p class="card-text text-muted small">${truncateText(course.description, 80)}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="text-success fw-bold">$${course.price}</span>
                    <div>
                        <button class="btn btn-sm btn-outline-danger" onclick="removeFromWishlist('${course._id}')" title="Remove from wishlist">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="enrollCourse('${course._id}')">
                            Enroll
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return col;
}
//remove wishlist
async function removeFromWishlist(courseId) {
    if (!confirm("Are you sure you want to remove this course from your wishlist?")) return;

    try {
        const response = await fetch(`/api/wishlist/${courseId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Course removed from wishlist', 'success');
            loadWishlist(); // refresh UI
            loadProfile();  // update wishlist count
        } else {
            showAlert('Failed to remove course', 'danger');
        }
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        showAlert('Failed to remove course', 'danger');
    }
}


async function loadUserAppointments() {
  try {
    const res = await fetch('/api/my-appointments');
    if (!res.ok) {
      throw new Error('Network response was not ok');
    }
    const myAppointments = await res.json();

    const tbody = document.getElementById('appointmentsTableBody');
    if (!tbody) {
      console.error("Element with id 'appointmentsTableBody' not found in the DOM.");
      showAlert('Appointments table not found on the page.', 'danger');
      return;
    }
    tbody.innerHTML = '';

    if (!Array.isArray(myAppointments) || myAppointments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">You have no appointments yet</td></tr>`;
      return;
    }

    myAppointments.forEach(app => {
      const tr = document.createElement('tr');
      let meetingLinkCell = '';
if (app.status === 'approved') {
  if (app.meetingLink && /^https?:\/\//.test(app.meetingLink)) {
    meetingLinkCell = `<a href="${app.meetingLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm rounded-pill px-3" style="text-decoration:none;color:#fff;">Join Meeting</a>`;
  } else {
    meetingLinkCell = '-';
  }
} else {
  meetingLinkCell = '';
}
tr.innerHTML = `
        <td>${formatDate(app.date)}</td>
        <td>${app.time}</td>
        <td>${truncateText(app.reason, 50)}</td>
        <td><span class="badge ${getStatusBadgeClass(app.status)}">${app.status}</span></td>
        <td>${meetingLinkCell}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Failed to load appointments:', error);
    const tbody = document.getElementById('appointmentsTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Failed to load appointments</td></tr>`;
    }
    showAlert('Failed to load appointments', 'danger');
  }
}

// Utility function to format date as YYYY-MM-DD or locale string
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  return date.toLocaleDateString();
}

// Utility function to truncate text to a certain length
function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

// Utility function to get badge class based on status
function getStatusBadgeClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'approved':
      return 'bg-success';
    case 'pending':
      return 'bg-warning text-dark';
    case 'rejected':
      return 'bg-danger';
    default:
      return 'bg-secondary';
  }
}


// Enroll in course
function enrollCourse(courseId) {
    showAlert('Enrollment request submitted! We will contact you soon.', 'success');
}

// Show edit profile modal
function showEditProfileModal() {
    // Populate form with current data
    document.getElementById('editName').value = currentUser.name || '';
    document.getElementById('editEmail').value = currentUser.email || '';
    document.getElementById('editPhone').value = currentUser.phone || '';
    document.getElementById('editDob').value = currentUser.dob ? currentUser.dob.split('T')[0] : '';
    document.getElementById('editSkills').value = currentUser.skills ? currentUser.skills.join(', ') : '';
    
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const name = document.getElementById('editName').value;
    const email = document.getElementById('editEmail').value;
    const phone = document.getElementById('editPhone').value;
    const dob = document.getElementById('editDob').value;
    const skillsText = document.getElementById('editSkills').value;
    const skills = skillsText ? skillsText.split(',').map(skill => skill.trim()).filter(skill => skill) : [];
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validation
    if (!name.trim() || !email.trim()) {
        showAlert('Name and email are required', 'warning');
        return;
    }
    
    if (!isValidEmail(email)) {
        showAlert('Please enter a valid email address', 'warning');
        return;
    }
    
    if (phone && !isValidPhone(phone)) {
        showAlert('Please enter a valid phone number', 'warning');
        return;
    }
    
    const originalContent = showLoading(submitBtn);
    
    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, phone, dob, skills })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Profile updated successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editProfileModal')).hide();
            currentUser = data.user;
            loadProfile();
        } else {
            showAlert(data.error || 'Failed to update profile', 'danger');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showAlert('Failed to update profile', 'danger');
    } finally {
        hideLoading(submitBtn, originalContent);
    }
}

// Upload profile picture
async function uploadProfilePicture(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showAlert('Please select a valid image file', 'warning');
        return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('Image size should be less than 5MB', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('profilePic', file);
    
    // Show loading state
    const overlay = document.querySelector('.profile-avatar-overlay');
    const originalOverlay = overlay.innerHTML;
    overlay.innerHTML = '<div class="loading"></div>';
    
    try {
        const response = await fetch('/api/profile/picture', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update profile picture immediately
            document.getElementById('profileAvatar').src = data.profilePic;
            
            // Update navbar profile picture
            if (typeof updateNavbarProfilePicture === 'function') {
                updateNavbarProfilePicture({ profilePic: data.profilePic });
            }
            
            showAlert('Profile picture updated successfully!', 'success');
        } else {
            showAlert(data.error || 'Failed to upload profile picture', 'danger');
        }
    } catch (error) {
        console.error('Profile picture upload error:', error);
        showAlert('Failed to upload profile picture', 'danger');
    } finally {
        // Restore overlay
        overlay.innerHTML = originalOverlay;
    }
}

// Handle password change
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert('All password fields are required', 'warning');
        return;
    }
    if (newPassword.length < 4) {
        showAlert('New password must be at least 4 characters long', 'warning');
        return;
    }
    if (newPassword !== confirmPassword) {
        showAlert('New passwords do not match', 'warning');
        return;
    }
    if (currentPassword === newPassword) {
        showAlert('New password must be different from current password', 'warning');
        return;
    }

    const originalContent = showLoading(submitBtn);

    try {
        const res = await fetch('/api/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();

        if (data.success) {
            showSuccessCard("Password successfully changed!");
            document.getElementById('changePasswordForm').reset();
        } else {
            showErrorCard(data.error || 'Invalid password');


            // Error dialog (same style as success but red with X)
function showErrorCard(message) {
    const overlay = document.createElement('div');
    overlay.innerHTML = `
        <div style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999;
        ">
            <div style="
                background: #fff5f5;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 6px 20px rgba(0,0,0,0.2);
                text-align: center;
                animation: scaleIn 0.4s ease forwards;
                min-width: 300px;
            ">
            
             <!-- Animated red error circle with drawing "X" (pure SVG, no images) -->
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 52 52" style="display:block;margin:20px auto;">
  <g>
    <!-- Circle outline -->
    <circle cx="26" cy="26" r="25" fill="none" stroke="#FF3B30" stroke-width="2"
            stroke-dasharray="157" stroke-dashoffset="157">
      <animate attributeName="stroke-dashoffset" from="157" to="0" dur="0.8s" fill="freeze"/>
    </circle>

    <!-- First stroke of the cross -->
    <path d="M16 16 L36 36" fill="none" stroke="#FF3B30" stroke-width="4" stroke-linecap="round"
          stroke-dasharray="28" stroke-dashoffset="28">
      <animate attributeName="stroke-dashoffset" from="28" to="0" begin="0.8s" dur="0.35s" fill="freeze"/>
    </path>

    <!-- Second stroke of the cross -->
    <path d="M36 16 L16 36" fill="none" stroke="#FF3B30" stroke-width="4" stroke-linecap="round"
          stroke-dasharray="28" stroke-dashoffset="28">
      <animate attributeName="stroke-dashoffset" from="28" to="0" begin="1.15s" dur="0.35s" fill="freeze"/>
    </path>
  </g>
</svg>

                <h2 style="color:#b71c1c;font-size:28px;font-weight:bold;">Invalid</h2>
                <p style="color:#555;font-size:18px;margin-bottom:25px;">${message}</p>
                <button id="errorOkBtn" style="
                    background: #F44336; color: white; border: none;
                    padding: 10px 25px; font-size: 16px;
                    border-radius: 8px; cursor: pointer;
                    transition: background 0.3s;
                " onmouseover="this.style.background='#d32f2f'" onmouseout="this.style.background='#F44336'">OK</button>
            </div>
        </div>
        <style>
            @keyframes circleDraw { to { stroke-dashoffset: 0; } }
            @keyframes xDraw { to { stroke-dashoffset: 0; } }
            @keyframes scaleIn { from { transform:scale(0.8);opacity:0; } to { transform:scale(1);opacity:1; } }
            @keyframes fadeOut { from { opacity:1; } to { opacity:0; } }
        </style>
    `;
    document.body.appendChild(overlay);

    // Close on OK button
    document.getElementById('errorOkBtn').addEventListener('click', () => {
        overlay.style.animation = "fadeOut 0.4s forwards";
        setTimeout(() => overlay.remove(), 400);
    });
}


        }
    } catch (error) {
        console.error('Password change error:', error);
        showAlert('Failed to change password', 'danger');

        
    } finally {
        hideLoading(submitBtn, originalContent);
    }
}

// Success dialog (no full background)
function showSuccessCard(message) {
    const overlay = document.createElement('div');
    overlay.innerHTML = `
        <div style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999;
        ">
            <div style="
                background: #fff8f0;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 6px 20px rgba(0,0,0,0.2);
                text-align: center;
                animation: scaleIn 0.4s ease forwards;
                min-width: 300px;
            ">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 52 52" style="margin-bottom:20px; display:block; margin-left:auto; margin-right:auto;">
                    <circle cx="26" cy="26" r="25" fill="none" stroke="#4CAF50" stroke-width="2"
                        style="stroke-dasharray:157;stroke-dashoffset:157;animation:circleDraw 1s ease forwards;"></circle>
                    <path fill="none" stroke="#4CAF50" stroke-width="4" d="M14 27l7 7 17-17"
                        style="stroke-dasharray:48;stroke-dashoffset:48;animation:tickDraw 0.8s ease forwards 1s;"></path>
                </svg>
                 <svg viewBox="0 0 52 52" style="width:80px;height:80px;margin-bottom:20px;">
      <circle cx="26" cy="26" r="25" fill="none" stroke="#4CAF50" stroke-width="2"/>
      <path fill="none" stroke="#4CAF50" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M14 27l7 7 17-17">
        <animate attributeName="stroke-dasharray" from="0,40" to="40,0" dur="0.5s" fill="freeze"/>
      </path>
    </svg>
                <h2 style="color:#333;font-size:28px;font-weight:bold;">Success!</h2>
                <p style="color:#555;font-size:18px;margin-bottom:25px;">${message}</p>
                <button id="successOkBtn" style="
                    background: #4CAF50; color: white; border: none;
                    padding: 10px 25px; font-size: 16px;
                    border-radius: 8px; cursor: pointer;
                    transition: background 0.3s;
                " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4CAF50'">OK</button>
            </div>
        </div>
        <style>
            @keyframes circleDraw { to { stroke-dashoffset: 0; } }
            @keyframes tickDraw { to { stroke-dashoffset: 0; } }
            @keyframes scaleIn { from { transform:scale(0.8);opacity:0; } to { transform:scale(1);opacity:1; } }
            @keyframes fadeOut { from { opacity:1; } to { opacity:0; } }
        </style>
    `;
    document.body.appendChild(overlay);

    // Close on OK button
    document.getElementById('successOkBtn').addEventListener('click', () => {
        overlay.style.animation = "fadeOut 0.4s forwards";
        setTimeout(() => overlay.remove(), 400);
    });
}
// Load enrolled courses
async function loadEnrolledCourses() {
    try {
        const response = await fetch('/api/enrollments');
        const enrollments = await response.json();
        
        const container = document.getElementById('enrolledCoursesContainer');
        const countBadge = document.getElementById('enrolledCount');
        
        countBadge.textContent = enrollments.length;
        container.innerHTML = '';
        
        if (enrollments.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-graduation-cap fs-1 text-muted mb-3"></i>
                    <h5 class="text-muted">No Enrolled Courses</h5>
                    <p class="text-muted">Start learning by enrolling in courses!</p>
                    <a href="/courses.html" class="btn btn-primary">
                        <i class="fas fa-search me-2"></i>Browse Courses
                    </a>
                </div>
            `;
            return;
        }
        
        enrollments.forEach(enrollment => {
            const courseCard = createEnrolledCourseCard(enrollment);
            container.appendChild(courseCard);
        });
        
    } catch (error) {
        console.error('Error loading enrolled courses:', error);
        document.getElementById('enrolledCoursesContainer').innerHTML = `
            <div class="col-12 text-center py-3">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Failed to load enrolled courses
                </div>
            </div>
        `;
    }
}

// Create enrolled course card
function createEnrolledCourseCard(enrollment) {
    const col = document.createElement('div');
    col.className = 'col-lg-6 col-md-12 mb-4';
    
    const course = enrollment.course;
    const progress = Math.round(enrollment.progress);
    const isCompleted = enrollment.completed;
    const canGetCertificate = enrollment.certificateGenerated;
    
    col.innerHTML = `
        <div class="card h-100 enrolled-course-card">
            <div class="row g-0 h-100">
                <div class="col-md-4">
                    ${
                        course.video 
                        ? `<div class="ratio ratio-16x9 h-100">
                               <iframe src="${course.video}" 
                                       class="rounded-start" 
                                       frameborder="0" 
                                       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                       allowfullscreen>
                               </iframe>
                           </div>`
                        : (course.image 
                            ? `<img src="${course.image}" class="img-fluid rounded-start h-100" alt="${course.title}" style="object-fit: cover;">`
                            : `<div class="bg-primary d-flex align-items-center justify-content-center h-100 rounded-start">
                                   <i class="fas fa-graduation-cap text-white fs-1"></i>
                               </div>`)
                    }
                </div>
                <div class="col-md-8">
                    <div class="card-body d-flex flex-column h-100">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title mb-0">${course.title}</h6>
                            ${course.isPaid ? '<span class="badge bg-warning text-dark"><i class="fas fa-crown me-1"></i>Premium</span>' : '<span class="badge bg-success"><i class="fas fa-gift me-1"></i>Free</span>'}
                        </div>
                        
                        <p class="card-text text-muted small mb-3">${course.description}</p>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-muted">Progress</small>
                                <small class="text-muted">${progress}%</small>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar ${isCompleted ? 'bg-success' : 'bg-primary'}" 
                                     role="progressbar" style="width: ${progress}%" 
                                     aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                                </div>
                            </div>
                        </div>
                        
                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <small class="text-muted">
                                    <i class="fas fa-clock me-1"></i>${course.duration}
                                </small>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">
                                    <i class="fas fa-user me-1"></i>${course.instructor}
                                </small>
                            </div>
                        </div>
                        
                        <div class="mt-auto">
                            <div class="d-flex gap-2">
                                <button class="btn btn-primary btn-sm flex-fill" onclick="continueCourse('${enrollment.course._id}', '${enrollment._id}')">
                                    <i class="fas fa-play me-1"></i>${enrollment.progress > 0 ? 'Continue' : 'Start'}
                                </button>
                                ${canGetCertificate ? `
                                    <button class="btn btn-success btn-sm" onclick="downloadCertificate('${course._id}')" title="Download Certificate">
                                        <i class="fas fa-certificate"></i>
                                    </button>
                                ` : ''}
                            </div>
                            
                            ${isCompleted ? `
                                <div class="mt-2 text-center">
                                    <small class="text-success">
                                        <i class="fas fa-check-circle me-1"></i>Course Completed!
                                    </small>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// Load certificates
async function loadCertificates() {
    try {
        const response = await fetch('/api/certificates');
        const certificates = await response.json();
        
        const container = document.getElementById('certificatesContainer');
        const countBadge = document.getElementById('certificatesCount');
        
        countBadge.textContent = certificates.length;
        container.innerHTML = '';
        
        if (certificates.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-certificate fs-1 text-muted mb-3"></i>
                    <h5 class="text-muted">No Certificates Yet</h5>
                    <p class="text-muted">Complete courses to earn certificates!</p>
                    <a href="/courses.html" class="btn btn-primary">
                        <i class="fas fa-graduation-cap me-2"></i>Start Learning
                    </a>
                </div>
            `;
            return;
        }
        
        certificates.forEach(certificate => {
            const certCard = createCertificateCard(certificate);
            container.appendChild(certCard);
        });
        
    } catch (error) {
        console.error('Error loading certificates:', error);
        document.getElementById('certificatesContainer').innerHTML = `
            <div class="col-12 text-center py-3">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Failed to load certificates
                </div>
            </div>
        `;
    }
}

// Create certificate card
function createCertificateCard(certificate) {
    const col = document.createElement('div');
    col.className = 'col-lg-6 col-md-12 mb-4';
    
    const course = certificate.course;
    const generatedDate = new Date(certificate.generatedAt).toLocaleDateString();
    
    col.innerHTML = `
        <div class="card h-100 certificate-card">
            <div class="card-body text-center">
                <div class="certificate-icon mb-3">
                    <i class="fas fa-certificate text-warning" style="font-size: 3rem;"></i>
                </div>
                
                <h6 class="card-title mb-2">${course.title}</h6>
                <p class="card-text text-muted small mb-3">Certificate of Completion</p>
                
                <div class="certificate-details mb-3">
                    <div class="row g-2 text-start">
                        <div class="col-12">
                            <small class="text-muted">
                                <i class="fas fa-id-card me-1"></i>
                                <strong>ID:</strong> ${certificate.certificateId}
                            </small>
                        </div>
                        <div class="col-12">
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i>
                                <strong>Issued:</strong> ${generatedDate}
                            </small>
                        </div>
                        <div class="col-12">
                            <small class="text-muted">
                                <i class="fas fa-download me-1"></i>
                                <strong>Downloads:</strong> ${certificate.downloadCount}
                            </small>
                        </div>
                    </div>
                </div>
                
                <button class="btn btn-success btn-sm w-100" onclick="downloadCertificate('${course._id}')">
                    <i class="fas fa-download me-2"></i>Download Certificate
                </button>
            </div>
        </div>
    `;
    
    return col;
}

// Continue course function
function continueCourse(courseId, enrollmentId) {
    // Redirect to course player with real progress tracking
    if (enrollmentId) {
        window.location.href = `/course-player.html?courseId=${courseId}&enrollmentId=${enrollmentId}`;
    } else {
        window.location.href = `/course-player.html?courseId=${courseId}`;
    }
}

// Refresh enrolled courses (can be called from other pages)
window.refreshEnrolledCourses = function() {
    if (typeof loadEnrolledCourses === 'function') {
        loadEnrolledCourses();
    }
};

// Refresh all profile data
window.refreshProfileData = function() {
    if (currentUser) {
        loadEnrolledCourses();
        loadCertificates();
    }
};

// Load user queries
async function loadUserQueries() {
    try {
        const response = await fetch('/api/course-queries/user');
        const queries = await response.json();
        
        const queriesContainer = document.getElementById('userQueriesContainer');
        const queriesCount = document.getElementById('queriesCount');
        
        queriesCount.textContent = queries.length;
        
        if (queries.length === 0) {
            queriesContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-question-circle fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No Queries Yet</h5>
                    <p class="text-muted">You haven't submitted any course queries yet.</p>
                    <a href="/courses" class="btn btn-primary">
                        <i class="fas fa-graduation-cap me-2"></i>Browse Courses
                    </a>
                </div>
            `;
            return;
        }
        
        queriesContainer.innerHTML = queries.map(query => createQueryCard(query)).join('');
        
    } catch (error) {
        console.error('Error loading user queries:', error);
        document.getElementById('userQueriesContainer').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Failed to load queries. Please try again later.
            </div>
        `;
    }
}

// Create query card
function createQueryCard(query) {
    const statusClass = query.status === 'replied' ? 'success' : query.status === 'pending' ? 'warning' : 'secondary';
    const statusIcon = query.status === 'replied' ? 'check-circle' : query.status === 'pending' ? 'clock' : 'question-circle';
    
    return `
        <div class="card mb-3 query-card">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h6 class="card-title">
                            <i class="fas fa-graduation-cap me-2 text-primary"></i>
                            ${query.courseTitle}
                        </h6>
                        <p class="card-text text-muted mb-2">
                            <strong>Your Query:</strong> ${query.message}
                        </p>
                        ${query.reply ? `
                            <div class="alert alert-success mt-2">
                                <strong><i class="fas fa-reply me-2"></i>Admin Reply:</strong>
                                <p class="mb-0 mt-2">${query.reply}</p>
                            </div>
                        ` : ''}
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>
                            Submitted: ${new Date(query.createdAt).toLocaleDateString()}
                            ${query.repliedAt ? ` | Replied: ${new Date(query.repliedAt).toLocaleDateString()}` : ''}
                        </small>
                    </div>
                    <div class="col-md-4 text-end">
                        <span class="badge bg-${statusClass} mb-2">
                            <i class="fas fa-${statusIcon} me-1"></i>
                            ${query.status.charAt(0).toUpperCase() + query.status.slice(1)}
                        </span>
                        <div>
                            <a href="/courses" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-eye me-1"></i>View Course
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Check premium access
async function checkPremiumAccess() {
    try {
        const response = await fetch('/api/check-premium-access');
        
        // Check if response is JSON or HTML
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            
            if (data.isPremium) {
                const premiumSection = document.getElementById('premiumSection');
                if (premiumSection) {
                    premiumSection.style.display = 'block';
                    loadPremiumFeatures();
                }
            } else {
                // Backend not available, check localStorage for premium status
                console.warn('Backend not available, checking localStorage for premium access');
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                const isPremium = currentUser.isPremium || false;
                
                const premiumSection = document.getElementById('premiumSection');
                if (premiumSection) {
                    premiumSection.style.display = isPremium ? 'block' : 'none';
                    if (isPremium) {
                        loadPremiumFeatures();
                    }
                }
            }
        } else {
            // Hide premium tab for non-premium users
            const premiumTab = document.getElementById('premiumTab');
            if (premiumTab) {
                premiumTab.style.display = 'none';
            }
            
            // Show premium signup option
            const premiumStatusContainer = document.getElementById('premiumStatusContainer');
            if (premiumStatusContainer) {
                premiumStatusContainer.innerHTML = `
                    <div class="text-center">
                        <div class="premium-status-inactive mb-4">
                            <i class="fas fa-lock fa-3x text-muted mb-3"></i>
                            <h4 class="text-muted mb-2">Premium Access Required</h4>
                            <p class="text-muted mb-3">Unlock exclusive premium features</p>
                        </div>
                        
                        <div class="d-grid gap-2">
                            <a href="/premium-login" class="btn btn-warning btn-lg">
                                <i class="fas fa-crown me-2"></i>Premium Login
                            </a>
                            <a href="/support" class="btn btn-outline-primary">
                                <i class="fas fa-info-circle me-2"></i>Learn More
                            </a>
                        </div>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('Error checking premium access:', error);
        // Fallback: hide premium section
        const premiumSection = document.getElementById('premiumSection');
        if (premiumSection) {
            premiumSection.style.display = 'none';
        }
    }
}

// Load premium features
function loadPremiumFeatures() {
    console.log('Loading premium features...');
    // Implementation for loading premium features
}

// Premium logout function
function premiumLogout() {
    if (confirm('Are you sure you want to logout from premium access?')) {
        fetch('/api/premium/logout', { method: 'POST' })
            .then(() => {
                showAlert('Premium logout successful', 'success');
                checkPremiumAccess(); // Refresh premium status
            })
            .catch(error => {
                console.error('Premium logout error:', error);
                showAlert('Failed to logout from premium', 'danger');
            });
    }
}

// Download certificate function
async function downloadCertificate(courseId) {
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
                
                // Reload certificates to update download count
                loadCertificates();
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


// Add custom styles
const style = document.createElement('style');
style.textContent = `
    .profile-avatar {
        font-size: 4rem;
    }
    
    .skills-display .badge {
        font-size: 0.9rem;
    }
    
    .nav-tabs .nav-link {
        color: #666;
        border: none;
        border-bottom: 2px solid transparent;
    }
    
    .nav-tabs .nav-link.active {
        color: var(--primary-color);
        background: none;
        border-bottom-color: var(--primary-color);
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
    
    .form-control-plaintext {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 0.375rem;
        padding: 0.375rem 0.75rem;
        margin-bottom: 0;
    }
    
    .enrolled-course-card {
        transition: all 0.3s ease;
        border: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .enrolled-course-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
    }
    
    .certificate-card {
        transition: all 0.3s ease;
        border: 2px solid #ffc107;
        background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%);
        box-shadow: 0 4px 15px rgba(255, 193, 7, 0.2);
    }
    
    .certificate-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(255, 193, 7, 0.3);
    }
    
    .certificate-icon {
        animation: certificatePulse 3s ease-in-out infinite;
    }
    
    @keyframes certificatePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    .certificate-details {
        background: rgba(255, 255, 255, 0.7);
        border-radius: 8px;
        padding: 1rem;
        border: 1px solid rgba(255, 193, 7, 0.3);
    }
    
    .progress {
        border-radius: 10px;
        overflow: hidden;
        background-color: rgba(0,0,0,0.1);
    }
    
    .progress-bar {
        transition: width 0.8s ease;
        border-radius: 10px;
    }
    
    .query-card {
        transition: all 0.3s ease;
        border-left: 4px solid #007bff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .query-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    }
    
    .premium-feature-card {
        background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%);
        border: 2px solid #ffc107 !important;
        transition: all 0.3s ease;
    }
    
    .premium-feature-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(255, 193, 7, 0.2);
    }
    
    .premium-access-card {
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        border: 2px solid #dee2e6 !important;
    }
    
    .premium-status-active .fa-crown {
        animation: crownGlow 2s ease-in-out infinite;
    }
    
    @keyframes crownGlow {
        0%, 100% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.1); filter: brightness(1.2); }
    }
    
    .premium-details {
        background: rgba(255, 193, 7, 0.1);
        border: 1px solid rgba(255, 193, 7, 0.3) !important;
    }
    
    @media (max-width: 768px) {
        .profile-avatar {
            font-size: 3rem;
        }
        
        .enrolled-course-card .row {
            flex-direction: column;
        }
        
        .enrolled-course-card .col-md-4,
        .enrolled-course-card .col-md-8 {
            max-width: 100%;
            flex: 0 0 auto;
        }
        
        .certificate-card {
            margin-bottom: 1rem;
        }
        
        .query-card .col-md-8,
        .query-card .col-md-4 {
            max-width: 100%;
            flex: 0 0 auto;
        }
        
        .query-card .col-md-4 {
            text-align: left !important;
            margin-top: 1rem;
        }
    }
`;
document.head.appendChild(style);

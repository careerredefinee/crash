// Course Player JavaScript
let currentUser = null;
let currentCourse = null;
let currentEnrollment = null;
let videoElement = null;
let progressUpdateInterval = null;
let lastSavedProgress = 0;

// Initialize course player
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuth();
    await loadCoursePlayer();
});

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch('/api/user');
        if (response.ok) {
            currentUser = await response.json();
            updateNavbar();
        } else {
            // Redirect to login if not authenticated
            window.location.href = '/login';
            return;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
    }
}

// Update navbar with user info
function updateNavbar() {
    if (currentUser) {
        document.getElementById('authButtons').style.display = 'none';
        document.getElementById('userDropdown').style.display = 'block';
        document.getElementById('navUserName').textContent = currentUser.name;
        
        // Update profile picture
        const profilePic = document.getElementById('navProfilePic');
        if (currentUser.profilePicture) {
            profilePic.src = currentUser.profilePicture;
        } else {
            profilePic.src = '/images/default-avatar.svg';
        }
    }
}

// Load course player
async function loadCoursePlayer() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('courseId');
        const enrollmentId = urlParams.get('enrollmentId');
        
        if (!courseId) {
            showAlert('Course ID not provided', 'danger');
            setTimeout(() => window.location.href = '/courses.html', 2000);
            return;
        }

        // Load course details
        const courseResponse = await fetch(`/api/courses/${courseId}`);
        if (!courseResponse.ok) {
            throw new Error('Failed to load course');
        }
        currentCourse = await courseResponse.json();

        // Load enrollment details
        let enrollmentResponse;
        if (enrollmentId) {
            enrollmentResponse = await fetch(`/api/enrollments/${enrollmentId}`);
        } else {
            // Find enrollment by course ID
            const enrollmentsResponse = await fetch('/api/enrollments');
            const enrollments = await enrollmentsResponse.json();
            currentEnrollment = enrollments.find(e => e.course._id === courseId);
        }
        
        if (enrollmentResponse && enrollmentResponse.ok) {
            currentEnrollment = await enrollmentResponse.json();
        }

        if (!currentEnrollment) {
            showAlert('You are not enrolled in this course', 'warning');
            setTimeout(() => window.location.href = '/courses.html', 2000);
            return;
        }

        // Display course information
        displayCourseInfo();
        
        // Load video player
        loadVideoPlayer();
        
        // Update progress display
        updateProgressDisplay();

    } catch (error) {
        console.error('Error loading course player:', error);
        showAlert('Failed to load course player', 'danger');
    }
}

// Display course information
function displayCourseInfo() {
    document.getElementById('courseTitle').textContent = currentCourse.title;
    document.getElementById('courseDescription').textContent = currentCourse.description;
    document.getElementById('courseInstructor').textContent = currentCourse.instructor || 'Career Redefine';
    
    // Format duration
    const duration = currentCourse.videoDurationMinutes || currentCourse.duration || 0;
    document.getElementById('courseDuration').textContent = formatTime(duration * 60);
    document.getElementById('totalTime').textContent = formatTime(duration * 60);
}

// Load video player
function loadVideoPlayer() {
    const videoContainer = document.getElementById('videoContainer');
    
    if (currentCourse.video) {
        // Create video element
        videoElement = document.createElement('video');
        videoElement.src = currentCourse.video;
        videoElement.controls = true;
        videoElement.className = 'w-100 h-100';
        videoElement.style.objectFit = 'cover';
        
        // Set initial time from saved progress
        const savedSeconds = (currentEnrollment.watchedMinutes || 0) * 60;
        videoElement.currentTime = savedSeconds;
        
        // Add event listeners for progress tracking
        videoElement.addEventListener('loadedmetadata', onVideoLoaded);
        videoElement.addEventListener('timeupdate', onTimeUpdate);
        videoElement.addEventListener('play', onVideoPlay);
        videoElement.addEventListener('pause', onVideoPause);
        videoElement.addEventListener('ended', onVideoEnded);
        
        videoContainer.appendChild(videoElement);
    } else if (currentCourse.image) {
        // Fallback to image if no video
        const imageElement = document.createElement('img');
        imageElement.src = currentCourse.image;
        imageElement.className = 'w-100 h-100';
        imageElement.style.objectFit = 'cover';
        videoContainer.appendChild(imageElement);
        
        showAlert('This course contains image content only', 'info');
    } else {
        videoContainer.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100 bg-light"><p class="text-muted">No video content available</p></div>';
    }
}

// Video event handlers
function onVideoLoaded() {
    console.log('Video loaded, duration:', videoElement.duration);
    updateProgressDisplay();
}

function onTimeUpdate() {
    if (videoElement && !videoElement.paused) {
        const currentSeconds = Math.floor(videoElement.currentTime);
        const currentMinutes = currentSeconds / 60;
        
        // Update watched time display
        document.getElementById('watchedTime').textContent = formatTime(currentSeconds);
        
        // Update progress if we've watched more than before
        if (currentMinutes > (currentEnrollment.watchedMinutes || 0)) {
            currentEnrollment.watchedMinutes = currentMinutes;
            updateProgressDisplay();
            
            // Save progress every 10 seconds to avoid too many API calls
            if (currentSeconds % 10 === 0 && currentSeconds !== lastSavedProgress) {
                saveProgress();
                lastSavedProgress = currentSeconds;
            }
        }
    }
}

function onVideoPlay() {
    console.log('Video started playing');
    // Start periodic progress saving
    if (progressUpdateInterval) {
        clearInterval(progressUpdateInterval);
    }
    progressUpdateInterval = setInterval(saveProgress, 30000); // Save every 30 seconds
}

function onVideoPause() {
    console.log('Video paused');
    saveProgress(); // Save immediately when paused
}

function onVideoEnded() {
    console.log('Video ended');
    saveProgress();
    showAlert('Congratulations! You completed this video!', 'success');
}

// Update progress display
function updateProgressDisplay() {
    if (!currentCourse || !currentEnrollment) return;
    
    const totalMinutes = currentCourse.videoDurationMinutes || currentCourse.duration || 1;
    const watchedMinutes = currentEnrollment.watchedMinutes || 0;
    const progressPercentage = Math.min(100, Math.round((watchedMinutes / totalMinutes) * 100));
    
    // Update progress bar
    const progressBar = document.getElementById('progressBar');
    const progressPercentageElement = document.getElementById('progressPercentage');
    
    progressBar.style.width = progressPercentage + '%';
    progressBar.setAttribute('aria-valuenow', progressPercentage);
    progressPercentageElement.textContent = progressPercentage + '%';
    
    // Update progress bar color based on percentage
    progressBar.className = 'progress-bar';
    if (progressPercentage >= 80) {
        progressBar.classList.add('bg-success');
        showCertificateOption();
    } else if (progressPercentage >= 50) {
        progressBar.classList.add('bg-info');
    } else if (progressPercentage >= 25) {
        progressBar.classList.add('bg-warning');
    } else {
        progressBar.classList.add('bg-danger');
    }
    
    // Update watched time
    const watchedSeconds = Math.floor(watchedMinutes * 60);
    document.getElementById('watchedTime').textContent = formatTime(watchedSeconds);
    
    // Show progress messages
    updateProgressMessages(progressPercentage);
}

// Update progress messages
function updateProgressMessages(percentage) {
    const progressAlert = document.getElementById('progressAlert');
    const progressMessage = document.getElementById('progressMessage');
    
    let message = '';
    let alertClass = 'alert-info';
    
    if (percentage >= 80) {
        message = 'Excellent! You\'ve completed 80% and earned your certificate!';
        alertClass = 'alert-success';
    } else if (percentage >= 60) {
        message = 'Great progress! You\'re almost there - keep watching!';
        alertClass = 'alert-info';
    } else if (percentage >= 40) {
        message = 'Good job! You\'re halfway through the course!';
        alertClass = 'alert-info';
    } else if (percentage >= 20) {
        message = 'Nice start! Continue watching to unlock your certificate!';
        alertClass = 'alert-warning';
    } else {
        message = 'Welcome! Start watching to track your progress!';
        alertClass = 'alert-info';
    }
    
    progressMessage.textContent = message;
    progressAlert.className = `alert ${alertClass}`;
    progressAlert.style.display = 'block';
}

// Show certificate option
function showCertificateOption() {
    const certificateStatus = document.getElementById('certificateStatus');
    if (currentEnrollment.certificateGenerated) {
        certificateStatus.style.display = 'block';
    }
}

// Save progress to server
async function saveProgress() {
    if (!currentEnrollment || !currentEnrollment._id) return;
    
    try {
        const watchedMinutes = currentEnrollment.watchedMinutes || 0;
        
        const response = await fetch(`/api/progress/${currentEnrollment._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                watchedMinutes: watchedMinutes
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentEnrollment = data.enrollment;
            console.log('Progress saved:', watchedMinutes, 'minutes');
            
            // Check if certificate was generated
            if (data.enrollment.certificateGenerated && !document.getElementById('certificateStatus').style.display) {
                showAlert('🎉 Congratulations! You\'ve earned your certificate!', 'success');
                showCertificateOption();
            }
        }
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

// Download certificate
async function downloadCertificate() {
    try {
        showLoading('Generating certificate...');
        
        const response = await fetch(`/api/certificate/${currentCourse._id}`, {
            method: 'GET'
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `certificate-${currentCourse.title.replace(/\s+/g, '-')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showAlert('Certificate downloaded successfully!', 'success');
        } else {
            throw new Error('Failed to generate certificate');
        }
    } catch (error) {
        console.error('Error downloading certificate:', error);
        showAlert('Failed to download certificate', 'danger');
    } finally {
        hideLoading();
    }
}

// Navigation functions
function goBackToCourses() {
    window.location.href = '/courses.html';
}

function goToProfile() {
    window.location.href = '/profile.html';
}

// Utility function to format time
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (progressUpdateInterval) {
        clearInterval(progressUpdateInterval);
    }
    saveProgress(); // Save final progress
});

// Logout function
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/';
    }
}

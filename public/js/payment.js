// Payment page JavaScript

let currentCourse = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth().then(user => {
        if (!user) {
            window.location.href = '/login';
            return;
        }
        
        // Get course ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('courseId');
        
        if (!courseId) {
            showAlert('Invalid course ID', 'danger');
            setTimeout(() => window.location.href = '/courses', 2000);
            return;
        }
        
        loadCourseDetails(courseId);
    });
    
    // Initialize payment form
    document.getElementById('paymentForm').addEventListener('submit', handlePaymentSubmission);
});

// Load course details
async function loadCourseDetails(courseId) {
    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();
        
        currentCourse = courses.find(course => course._id === courseId);
        
        if (!currentCourse) {
            showAlert('Course not found', 'danger');
            setTimeout(() => window.location.href = '/courses', 2000);
            return;
        }
        
        if (!currentCourse.isPaid) {
            showAlert('This is a free course', 'info');
            setTimeout(() => window.location.href = '/courses', 2000);
            return;
        }
        
        // Display course details
        displayCourseDetails(currentCourse);
        
        // Check if payment already exists
        checkExistingPayment(courseId);
        
    } catch (error) {
        console.error('Error loading course details:', error);
        showAlert('Failed to load course details', 'danger');
    }
}

// Display course details
function displayCourseDetails(course) {
    document.getElementById('courseImage').src = course.image || '/images/default-course.jpg';
    document.getElementById('courseTitle').textContent = course.title;
    document.getElementById('courseInstructor').innerHTML = `<i class="fas fa-user me-1"></i>Instructor: ${course.instructor}`;
    document.getElementById('courseDuration').innerHTML = `<i class="fas fa-clock me-1"></i>Duration: ${course.duration}`;
    document.getElementById('coursePrice').textContent = course.price;
}

// Check if payment already exists
async function checkExistingPayment(courseId) {
    try {
        const response = await fetch('/api/admin/payments');
        if (response.ok) {
            const payments = await response.json();
            const authData = await checkAuth();
            const existingPayment = payments.find(p => 
                p.course._id === courseId && 
                p.user._id === authData.user._id
            );
            
            if (existingPayment) {
                showPaymentStatus(existingPayment.status);
            }
        }
    } catch (error) {
        // User might not have admin access, ignore error
        console.log('Could not check existing payments');
    }
}

// Show payment status
function showPaymentStatus(status) {
    const statusDiv = document.getElementById('paymentStatus');
    const alertDiv = statusDiv.querySelector('.alert');
    
    statusDiv.style.display = 'block';
    
    switch (status) {
        case 'pending':
            alertDiv.className = 'alert alert-warning';
            alertDiv.innerHTML = `
                <i class="fas fa-clock me-2"></i>
                <strong>Payment Under Review!</strong> Your payment is being reviewed by our admin team.
            `;
            break;
        case 'approved':
            alertDiv.className = 'alert alert-success';
            alertDiv.innerHTML = `
                <i class="fas fa-check-circle me-2"></i>
                <strong>Payment Approved!</strong> You can now access this course.
            `;
            setTimeout(() => window.location.href = '/courses', 3000);
            break;
        case 'rejected':
            alertDiv.className = 'alert alert-danger';
            alertDiv.innerHTML = `
                <i class="fas fa-times-circle me-2"></i>
                <strong>Payment Rejected!</strong> Please contact support or submit a new payment proof.
            `;
            break;
    }
}

// Preview payment screenshot
function previewPaymentScreenshot(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showAlert('Please select a valid image file', 'warning');
        input.value = '';
        return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('Image size should be less than 5MB', 'warning');
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('uploadPreview').style.display = 'block';
        document.querySelector('.upload-content').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// Handle payment submission
async function handlePaymentSubmission(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('paymentScreenshot');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!fileInput.files[0]) {
        showAlert('Please upload payment screenshot', 'warning');
        return;
    }
    
    if (!currentCourse) {
        showAlert('Course information not loaded', 'danger');
        return;
    }
    
    const formData = new FormData();
    formData.append('courseId', currentCourse._id);
    formData.append('paymentScreenshot', fileInput.files[0]);
    
    const originalContent = showLoading(submitBtn);
    
    try {
        const response = await fetch('/api/payment', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Payment proof submitted successfully! You will receive access once approved.', 'success');
            showPaymentStatus('pending');
            
            // Hide the form
            document.getElementById('paymentForm').style.display = 'none';
        } else {
            showAlert(data.error || 'Failed to submit payment proof', 'danger');
        }
    } catch (error) {
        console.error('Payment submission error:', error);
        showAlert('Failed to submit payment proof', 'danger');
    } finally {
        hideLoading(submitBtn, originalContent);
    }
}

// Add custom styles for payment page
const style = document.createElement('style');
style.textContent = `
    .payment-card {
        background: linear-gradient(145deg, #ffffff, #f8f9fa);
        border: none;
        border-radius: 20px;
        box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
        overflow: hidden;
    }
    
    .course-payment-img {
        max-height: 150px;
        object-fit: cover;
        border-radius: 10px;
    }
    
    .price-display {
        background: linear-gradient(135deg, #e8f5e8, #d4edda);
        padding: 10px 15px;
        border-radius: 10px;
        display: inline-block;
        margin-top: 10px;
    }
    
    .qr-code-container {
        background: white;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        display: inline-block;
    }
    
    .qr-code-img {
        width: 200px;
        height: 200px;
        border: 2px solid #e9ecef;
        border-radius: 10px;
    }
    
    .upload-area {
        border: 2px dashed #3498db;
        border-radius: 15px;
        padding: 40px 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        background: linear-gradient(145deg, #f8f9fa, #ffffff);
    }
    
    .upload-area:hover {
        border-color: #2980b9;
        background: linear-gradient(145deg, #e3f2fd, #f8f9fa);
        transform: translateY(-2px);
    }
    
    .upload-content {
        color: #666;
    }
    
    .upload-preview {
        text-align: center;
    }
    
    .preview-img {
        max-width: 200px;
        max-height: 200px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    
    .payment-instructions {
        background: linear-gradient(145deg, #f8f9fa, #ffffff);
        padding: 20px;
        border-radius: 15px;
        border-left: 4px solid #3498db;
    }
    
    @media (max-width: 768px) {
        .qr-code-img {
            width: 150px;
            height: 150px;
        }
        
        .upload-area {
            padding: 30px 15px;
        }
    }
`;
document.head.appendChild(style);

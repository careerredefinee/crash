// Login page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    checkAuth().then(user => {
        if (user) {
            if (user.isAdmin) {
                window.location.href = '/admin';
            } else {
                window.location.href = '/';
            }
        }
    });

    // Handle login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Handle register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Handle OTP form
    document.getElementById('otpForm').addEventListener('submit', handleOTPVerification);
});

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!isValidEmail(email)) {
        showAlert('Please enter a valid email address', 'danger');
        return;
    }
    
    const originalContent = showLoading(submitBtn);
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showFormAlert('Login successful!', 'success', '#loginForm');
            // Store complete user data in sessionStorage
            if (data.user) {
                // Store individual fields
                sessionStorage.setItem('userName', data.user.name || '');
                sessionStorage.setItem('userEmail', data.user.email || '');
                sessionStorage.setItem('userPhone', data.user.phone || '');
                sessionStorage.setItem('userId', data.user._id || '');
                
                // Store the complete user object as JSON
                sessionStorage.setItem('user', JSON.stringify(data.user));
                
                // Also set a flag to indicate user is logged in
                sessionStorage.setItem('isLoggedIn', 'true');
            }
            
            // Redirect based on user type
            setTimeout(() => {
                // Check if there's a redirect URL in session storage
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
                if (redirectUrl) {
                    sessionStorage.removeItem('redirectAfterLogin');
                    window.location.href = redirectUrl;
                } else if (data.isAdmin) {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/profile.html';
                }
            }, 1000);
        } else {
            showFormAlert(data.message || 'Login failed', 'danger', '#loginForm');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Login failed. Please try again.', 'danger');
    } finally {
        hideLoading(submitBtn, originalContent);
    }
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validation
    if (!name.trim()) {
        showAlert('Please enter your full name', 'danger');
        return;
    }
    
    if (!isValidEmail(email)) {
        showAlert('Please enter a valid email address', 'danger');
        return;
    }
    
    if (!isValidPhone(phone)) {
        showAlert('Please enter a valid phone number', 'danger');
        return;
    }
    
    if (password.length < 4) {
        showAlert('Password must be at least 4 characters long', 'danger');
        return;
    }
    
    const originalContent = showLoading(submitBtn);
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, phone, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('OTP sent to your email. Please check and verify.', 'success');
            showOTPForm();
        } else {
            showAlert(data.message || 'Registration failed', 'danger');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Registration failed. Please try again.', 'danger');
    } finally {
        hideLoading(submitBtn, originalContent);
    }
}

// Handle OTP verification
async function handleOTPVerification(e) {
    e.preventDefault();
    
    const otp = document.getElementById('otpInput').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!otp || otp.length !== 6) {
        showAlert('Please enter a valid 6-digit OTP', 'danger');
        return;
    }
    
    const originalContent = showLoading(submitBtn);
    
    try {
        const response = await fetch('/api/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ otp })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Registration successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            showAlert(data.message || 'Invalid OTP', 'danger');
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        showAlert('Verification failed. Please try again.', 'danger');
    } finally {
        hideLoading(submitBtn, originalContent);
    }
}

// Show register form
function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('otpForm').style.display = 'none';
    
    // Update header
    document.querySelector('.card-body h2').textContent = 'Create Account';
    document.querySelector('.card-body p').textContent = 'Join Career Redefine today';
}

// Show login form
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('otpForm').style.display = 'none';
    
    // Update header
    document.querySelector('.card-body h2').textContent = 'Welcome Back';
    document.querySelector('.card-body p').textContent = 'Sign in to your account';
}

// Show OTP form
function showOTPForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('otpForm').style.display = 'block';
}

// Auto-focus OTP input when shown
const otpInput = document.getElementById('otpInput');
otpInput.addEventListener('input', function() {
    // Remove non-numeric characters
    this.value = this.value.replace(/\D/g, '');
    
    // Auto-submit when 6 digits are entered
    if (this.value.length === 6) {
        setTimeout(() => {
            document.getElementById('otpForm').dispatchEvent(new Event('submit'));
        }, 500);
    }
});

// Add form animation
const style = document.createElement('style');
style.textContent = `
    .card {
        animation: slideInUp 0.6s ease-out;
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .form-control:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25);
    }
    
    .input-group-text {
        background-color: #f8f9fa;
        border-color: #ddd;
    }
    
    #otpInput {
        letter-spacing: 0.5rem;
        font-weight: bold;
    }
`;
document.head.appendChild(style);
// Services page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Navbar blur effect on scroll
    const navbar = document.querySelector('.navbar');
    const scrollThreshold = 10; // Pixels to scroll before applying blur
    
    // Initialize navbar with no blur
    navbar.classList.remove('scrolled');
    
    function updateNavbarBlur() {
        const scrollPosition = window.scrollY;
        
        // Toggle 'scrolled' class based on scroll position
        if (scrollPosition > scrollThreshold) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
    
    // Throttle the scroll event for better performance
    let isScrolling;
    window.addEventListener('scroll', function() {
        window.cancelAnimationFrame(isScrolling);
        isScrolling = window.requestAnimationFrame(updateNavbarBlur);
    });
    
    // Initialize navbar state on page load
    updateNavbarBlur();
    // Services page initialization can be added here if needed

    // Request Call Modal Logic
    const requestCallBtn = document.getElementById('requestCallBtn');
    const requestCallModal = new bootstrap.Modal(document.getElementById('requestCallModal'));
    const requestCallForm = document.getElementById('requestCallForm');
    const callFormError = document.getElementById('callFormError');
    const callFormSuccess = document.getElementById('callFormSuccess');
    const callFormSpinner = document.getElementById('callFormSpinner');

    // Only show modal if user is logged in (verified)
    requestCallBtn.addEventListener('click', async function() {
        const authData = await checkAuth();
        if (!authData || !authData.authenticated) {
            window.location.href = '/login';
            return;
        }
        // Pre-fill user info if available
        document.getElementById('callName').value = sessionStorage.getItem('userName') || '';
        document.getElementById('callEmail').value = sessionStorage.getItem('userEmail') || '';
        document.getElementById('callPhone').value = sessionStorage.getItem('userPhone') || '';
        callFormError.classList.add('d-none');
        callFormSuccess.classList.add('d-none');
        requestCallForm.reset();
        requestCallModal.show();
    });

    requestCallForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        callFormError.classList.add('d-none');
        callFormSuccess.classList.add('d-none');
        callFormSpinner.classList.remove('d-none');

        const name = document.getElementById('callName').value.trim();
        const email = document.getElementById('callEmail').value.trim();
        const phone = document.getElementById('callPhone').value.trim();
        const message = document.getElementById('callMessage').value.trim();

        if (!name || !email || !phone || !message) {
            callFormError.textContent = 'All fields are required.';
            callFormError.classList.remove('d-none');
            callFormSpinner.classList.add('d-none');
            return;
        }
        if (!isValidEmail(email)) {
            callFormError.textContent = 'Please enter a valid email address.';
            callFormError.classList.remove('d-none');
            callFormSpinner.classList.add('d-none');
            return;
        }
        if (!isValidPhone(phone)) {
            callFormError.textContent = 'Please enter a valid phone number.';
            callFormError.classList.remove('d-none');
            callFormSpinner.classList.add('d-none');
            return;
        }
        // Get JWT from localStorage or cookies (assuming JWT is stored after login)
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        try {
            const res = await fetch('/api/request-call', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ name, email, phone, message })
            });
            const data = await res.json();
            callFormSpinner.classList.add('d-none');
            if (res.ok) {
                showATMSuccess("Request Submitted", data.message || "We will call you back shortly.");
                callFormSuccess.classList.add('d-none');
                requestCallForm.reset();
                
            } else {
                callFormError.textContent = data.error || 'Failed to submit request.';
                callFormError.classList.remove('d-none');
            }
        } catch (err) {
            callFormSpinner.classList.add('d-none');
            callFormError.textContent = 'Network error. Please try again.';
            callFormError.classList.remove('d-none');
        }
    });
});
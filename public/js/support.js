// Support page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointmentDate').min = today;
    
    // Handle appointment form submission
    document.getElementById('appointmentForm').addEventListener('submit', handleAppointmentSubmission);
});

// Show appointment form
function showAppointmentForm() {
    checkAuth().then(user => {
        if (!user) {
            showAlert('Please login to book an appointment', 'warning');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return;
        }
        
        document.getElementById('appointmentSection').style.display = 'block';
        document.getElementById('appointmentSection').scrollIntoView({ behavior: 'smooth' });
    });
}

// Hide appointment form
function hideAppointmentForm() {
    document.getElementById('appointmentSection').style.display = 'none';
    // Reset form
    document.getElementById('appointmentForm').reset();
}

// Handle appointment submission
async function handleAppointmentSubmission(e) {
    e.preventDefault();
    
    const user = await checkAuth();
    if (!user) {
        showAlert('Please login to book an appointment', 'warning');
        return;
    }
    
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const reason = document.getElementById('appointmentReason').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validation
    if (!date || !time || !reason.trim()) {
        showAlert('Please fill in all fields', 'warning');
        return;
    }
    
    // Check if date is not in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showAlert('Please select a future date', 'warning');
        return;
    }
    
    const originalContent = showLoading(submitBtn);
    
    try {
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date, time, reason })
        });
        
        const data = await response.json();
        
        if (data.success) {
            hideAppointmentForm();

            // Show ATM-size success modal
            const successModal = new bootstrap.Modal(document.getElementById('successModal'));
            successModal.show();
            
        } else {
            showAlert(data.error || 'Failed to book appointment', 'danger');
        }
    } catch (error) {
        console.error('Appointment booking error:', error);
        showAlert('Failed to book appointment. Please try again.', 'danger');
    } finally {
        hideLoading(submitBtn, originalContent);
    }
}

// Format time for display
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Add smooth animations
const style = document.createElement('style');
style.textContent = `
    #appointmentSection {
        animation: slideInUp 0.5s ease-out;
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
    
    .card {
        transition: all 0.3s ease;
    }
    
    .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    .accordion-button:not(.collapsed) {
        background-color: var(--primary-color);
        color: white;
    }
    
    .accordion-button:focus {
        box-shadow: 0 0 0 0.25rem rgba(52, 152, 219, 0.25);
    }
`;
document.head.appendChild(style);
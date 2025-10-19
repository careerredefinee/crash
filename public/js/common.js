// Common JavaScript functions and utilities

// Check authentication status
async function checkAuth() {
    try {
        const authSection = document.getElementById('authSection');
        const userSection = document.getElementById('userSection');
        if (authSection) authSection.style.display = 'none';
        if (userSection) userSection.style.display = 'none';

        const response = await fetch('/api/check-auth', { credentials: 'include' });
        const data = await response.json();

        if (data.authenticated) {
            if (authSection) authSection.style.display = 'none';
            if (userSection) userSection.style.display = 'block';
            
            // Store user info in sessionStorage
            if (data.user) {
                sessionStorage.setItem('userName', data.user.name || '');
                sessionStorage.setItem('userEmail', data.user.email || '');
                sessionStorage.setItem('userPhone', data.user.phone || '');
                
                // Update navbar profile picture if user data is available
                updateNavbarProfilePicture(data.user);
            }
            return data;
        } else {
            if (authSection) authSection.style.display = 'block';
            if (userSection) userSection.style.display = 'none';
            return null;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        return null;
    }
}

// Logout function
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        // Clear user info from sessionStorage
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('userEmail');
        sessionStorage.removeItem('userPhone');
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Show loading state
function showLoading(element) {
    const originalContent = element.innerHTML;
    element.innerHTML = '<span class="loading"></span>';
    element.disabled = true;
    return originalContent;
}

// Hide loading state
function hideLoading(element, originalContent) {
    element.innerHTML = originalContent;
    element.disabled = false;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format time ago
function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDate(dateString);
}

// Show alert message - inline and compact version
function showAlert(message, type = 'info', targetElement = null) {
    // Special case for success card
    if (type === 'success-card') {
        // Remove any existing success cards first
        const existingCards = document.querySelectorAll('.success-card');
        existingCards.forEach(card => card.remove());
        
        // Create the success card
        const successCard = document.createElement('div');
        successCard.className = 'success-card';
        successCard.innerHTML = `
            <div class="success-card__icon">
                <i class="fas fa-check"></i>
            </div>
            <div class="success-card__content">
                <h4 class="success-card__title">Success!</h4>
                <p class="success-card__message">${message}</p>
            </div>
            <button class="success-card__close" aria-label="Close">&times;</button>
            <div class="success-card__progress"></div>
        `;
        
        // Add to body
        document.body.appendChild(successCard);
        
        // Auto-dismiss after 5 seconds
        const dismiss = () => {
            successCard.style.animation = 'none';
            successCard.style.transform = 'translateX(120%)';
            setTimeout(() => successCard.remove(), 300);
        };
        
        // Close button
        const closeBtn = successCard.querySelector('.success-card__close');
        closeBtn.addEventListener('click', dismiss);
        
        // Auto-dismiss after 5 seconds
        const dismissTimeout = setTimeout(dismiss, 5000);
        
        // Pause auto-dismiss on hover
        successCard.addEventListener('mouseenter', () => {
            clearTimeout(dismissTimeout);
            const progress = successCard.querySelector('.success-card__progress');
            if (progress) progress.style.animationPlayState = 'paused';
        });
        
        // Resume auto-dismiss when mouse leaves
        successCard.addEventListener('mouseleave', () => {
            const progress = successCard.querySelector('.success-card__progress');
            if (progress) progress.style.animationPlayState = 'running';
            const newTimeout = setTimeout(dismiss, 2000);
            
            // Store the new timeout ID so we can clear it if needed
            successCard._dismissTimeout = newTimeout;
        });
        
        return;
    }
    
    // Default alert behavior for other types
    // Remove any existing alerts first
    const existingAlerts = document.querySelectorAll('.inline-alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show inline-alert`;
    alertDiv.style.cssText = `
        margin: 10px 0;
        padding: 8px 12px;
        font-size: 14px;
        border-radius: 6px;
        max-width: 400px;
        position: relative;
    `;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close btn-close-sm" data-bs-dismiss="alert" style="font-size: 12px; padding: 4px;"></button>
    `;
    
    // Find the best place to insert the alert
    let insertTarget = targetElement;
    
    if (!insertTarget) {
        // Try to find the active form or submit button
        const activeElement = document.activeElement;
        if (activeElement && activeElement.type === 'submit') {
            insertTarget = activeElement.closest('form') || activeElement.parentElement;
        } else {
            // Look for forms with submit buttons
            const forms = document.querySelectorAll('form');
            if (forms.length > 0) {
                insertTarget = forms[forms.length - 1]; // Use the last form on the page
            } else {
                // Look for submit buttons
                const submitBtns = document.querySelectorAll('button[type="submit"], .btn-primary, .btn-success');
                if (submitBtns.length > 0) {
                    insertTarget = submitBtns[submitBtns.length - 1].parentElement;
                }
            }
        }
    }
    
    // Insert the alert
    if (insertTarget) {
        // Insert after the target element
        insertTarget.insertAdjacentElement('afterend', alertDiv);
    } else {
        // Fallback: insert at the top of main content area
        const mainContent = document.querySelector('main, .container, .content') || document.body;
        mainContent.insertBefore(alertDiv, mainContent.firstChild);
    }
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 4000);
    
    // Scroll to alert if it's not visible
    setTimeout(() => {
        alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Helper function to show alert near a specific form or button
function showFormAlert(message, type = 'info', formSelector = null) {
    let targetForm = null;
    
    if (formSelector) {
        targetForm = document.querySelector(formSelector);
    }
    
    showAlert(message, type, targetForm);
}

// Update navbar profile picture
function updateNavbarProfilePicture(user) {
    try {
        // Default avatar path - ensure this path exists in your project
        const defaultAvatar = '/images/default-avatar.png';
        
        // Safely get profile picture or use default
        const profilePic = (user && user.profilePic) ? user.profilePic : defaultAvatar;
        
        // Update all elements with class 'profile-avatar' (more reliable than ID for multiple instances)
        const profileAvatars = document.querySelectorAll('.profile-avatar, #navProfileAvatar');
        
        if (profileAvatars && profileAvatars.length > 0) {
            profileAvatars.forEach(img => {
                try {
                    if (img && img.tagName === 'IMG') {
                        img.src = profilePic;
                        // Add error handling in case the image fails to load
                        img.onerror = function() {
                            console.warn('Failed to load profile image, using default');
                            this.src = defaultAvatar;
                        };
                    }
                } catch (e) {
                    console.error('Error updating profile image:', e);
                }
            });
        }
        
        // Also update legacy nav profile picture if it exists
        const navProfilePic = document.getElementById('navProfilePic');
        if (navProfilePic) {
            navProfilePic.src = profilePic;
        }
    } catch (error) {
        console.error('Error in updateNavbarProfilePicture:', error);
    }
}


// Check if user needs to login
function requireAuth() {
    checkAuth().then(user => {
        if (!user) {
            showAlert('Please login to access this feature', 'warning');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return false;
        }
        return true;
    });
}

// Chat Assistant Functions
let isChatOpen = false;

function toggleChat() {
    const chatBox = document.getElementById('chatBox');
    isChatOpen = !isChatOpen;
    
    if (isChatOpen) {
        chatBox.classList.add('show');
    } else {
        chatBox.classList.remove('show');
    }
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Send suggestion message
function sendSuggestion(message) {
    const input = document.getElementById('chatInput');
    input.value = message;
    sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const messagesContainer = document.getElementById('chatMessages');
    
    // Add user message
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'message user-message';
    userMessageDiv.textContent = message;
    messagesContainer.appendChild(userMessageDiv);
    
    // Clear input
    input.value = '';
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add loading message
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant-message';
    loadingDiv.innerHTML = '<span class="loading"></span> Thinking...';
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Get Career Redefine specific response
    const response = getCareerRedefineResponse(message);
    
    setTimeout(() => {
        // Remove loading message
        loadingDiv.remove();
        
        // Add AI response
        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.className = 'message assistant-message';
        aiMessageDiv.innerHTML = `<div class="message-content">${response}</div>`;
        messagesContainer.appendChild(aiMessageDiv);
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 1000);
}

// Career Redefine specific response function
function getCareerRedefineResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Course-related queries
    if (lowerMessage.includes('course') || lowerMessage.includes('what do you provide') || lowerMessage.includes('what courses')) {
        return `
            <strong>🎓 Our Course Offerings</strong><br><br>
            We provide comprehensive career transformation courses in:
            <ul class="mt-2 mb-2">
                <li><strong>📊 Data Science & Analytics</strong> - Python, R, Machine Learning, Statistics</li>
                <li><strong>🤖 Artificial Intelligence</strong> - Deep Learning, NLP, Computer Vision</li>
                <li><strong>💻 Web Development</strong> - Full-stack development, React, Node.js</li>
                <li><strong>🎨 UI/UX Design</strong> - Design thinking, Figma, User research</li>
                <li><strong>☁️ Cloud Computing</strong> - AWS, Azure, DevOps</li>
                <li><strong>📱 Mobile Development</strong> - React Native, Flutter</li>
            </ul>
            All courses include real-time projects, industry mentorship, and job placement support!
        `;
    }
    
    // Mentorship queries
    if (lowerMessage.includes('mentor') || lowerMessage.includes('guidance')) {
        return `
            <strong>👨‍🏫 Our Mentorship Program</strong><br><br>
            We provide personalized mentorship from industry experts:
            <ul class="mt-2 mb-2">
                <li>🎯 1-on-1 career guidance sessions</li>
                <li>📋 Personalized learning roadmaps</li>
                <li>💼 Industry insights and best practices</li>
                <li>🔄 Regular progress reviews and feedback</li>
                <li>🤝 Networking opportunities with professionals</li>
            </ul>
            Our mentors are working professionals from top companies with 5+ years of experience.
        `;
    }
    
    // Job placement queries
    if (lowerMessage.includes('job') || lowerMessage.includes('placement') || lowerMessage.includes('career')) {
        return `
            <strong>💼 Job Placement & Career Support</strong><br><br>
            We provide comprehensive job assistance:
            <ul class="mt-2 mb-2">
                <li>📝 Resume building and optimization</li>
                <li>🎤 Interview preparation and mock sessions</li>
                <li>🔍 Job search strategy and guidance</li>
                <li>🤝 Direct placement support with partner companies</li>
                <li>💼 Portfolio development for showcasing skills</li>
                <li>📈 Salary negotiation guidance</li>
            </ul>
            We have a high success rate with 85%+ job placement within 6 months!
        `;
    }
    
    // AI tools queries
    if (lowerMessage.includes('ai tool') || lowerMessage.includes('tools')) {
        return `
            <strong>🤖 Our AI-Powered Career Tools</strong><br><br>
            We offer cutting-edge AI tools to accelerate your career:
            <ul class="mt-2 mb-2">
                <li>📄 AI Resume Analyzer - Get instant feedback on your resume</li>
                <li>🎭 AI Mock Interview - Practice with AI-powered interview simulations</li>
                <li>🎯 Career Path Predictor - AI recommendations for your career journey</li>
                <li>📊 Skill Gap Analysis - Identify areas for improvement</li>
                <li>💡 Personalized Learning Recommendations</li>
            </ul>
            These tools are included free with all our courses!
        `;
    }
    
    // Pricing queries
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('fee')) {
        return `
            <strong>💰 Our Affordable Pricing</strong><br><br>
            We believe in making quality education accessible:
            <ul class="mt-2 mb-2">
                <li>🎓 Individual Courses: Starting from ₹15,000</li>
                <li>📦 Complete Programs: ₹25,000 - ₹45,000</li>
                <li>💎 Premium Mentorship: Additional ₹10,000</li>
                <li>🔄 Flexible EMI options available</li>
                <li>💸 100% money-back guarantee if not satisfied</li>
            </ul>
            High ROI with average salary increase of 150%+ after course completion!
        `;
    }
    
    // Default response
    return `
        <strong>🤔 I'd be happy to help!</strong><br><br>
        I can provide information about:
        <ul class="mt-2 mb-2">
            <li>🎓 Our course offerings and curriculum</li>
            <li>👨‍🏫 Mentorship and guidance programs</li>
            <li>💼 Job placement and career support</li>
            <li>🤖 AI-powered career tools</li>
            <li>💰 Pricing and enrollment options</li>
            <li>📞 How to get started with Career Redefine</li>
        </ul>
        What specific aspect would you like to know more about?
    `;
}

// Mobile navigation active state
function setMobileNavActive() {
    const currentPath = window.location.pathname;
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    
    mobileNavItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === currentPath) {
            item.classList.add('active');
        }
    });
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setMobileNavActive();
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            // Only scroll if href is a valid selector (not just '#' or empty)
            if (href && href !== '#') {
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
});

// Handle page navigation for protected routes
function navigateWithAuth(url) {
    checkAuth().then(user => {
        if (user) {
            window.location.href = url;
        } else {
            showAlert('Please login to access this page', 'warning');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        }
    });
}

// Utility function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Utility function to validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Utility function to validate phone
function isValidPhone(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

// File upload preview
function previewFile(input, previewId) {
    const file = input.files[0];
    const preview = document.getElementById(previewId);
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (file.type.startsWith('image/')) {
                preview.innerHTML = `<img src="${e.target.result}" class="img-fluid rounded" style="max-height: 200px;">`;
            } else {
                preview.innerHTML = `<p class="text-muted">File selected: ${file.name}</p>`;
            }
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}
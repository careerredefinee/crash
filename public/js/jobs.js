// Jobs page JavaScript

let allJobs = [];

document.addEventListener('DOMContentLoaded', function() {
    loadJobs();
    
    // Add search and filter functionality
    const jobSearch = document.getElementById('jobSearch');
    const locationFilter = document.getElementById('locationFilter');
    const salaryFilter = document.getElementById('salaryFilter');
    
    if (jobSearch) {
        jobSearch.addEventListener('input', filterJobs);
    }
    
    if (locationFilter) {
        locationFilter.addEventListener('change', filterJobs);
    }
    
    if (salaryFilter) {
        salaryFilter.addEventListener('change', filterJobs);
    }
});

// Load jobs
async function loadJobs() {
    try {
        const response = await fetch('/api/jobs');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.jobs)) {
            allJobs = data.jobs;
            displayJobs(allJobs);
        } else {
            throw new Error(data.error || 'Invalid data format received from server');
        }
        
    } catch (error) {
        console.error('Error loading jobs:', error);
        const jobsContainer = document.getElementById('jobsContainer');
        if (jobsContainer) {
            jobsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Failed to load jobs. Please try again later.
                    </div>
                </div>
            `;
        }
    }
}

// Display jobs
function displayJobs(jobs) {
    const jobsContainer = document.getElementById('jobsContainer');
    jobsContainer.innerHTML = '';
    
    if (jobs.length === 0) {
        jobsContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="py-5">
                    <i class="fas fa-briefcase fs-1 text-muted mb-3"></i>
                    <h4 class="text-muted">No jobs available</h4>
                    <p class="text-muted">Check back soon for new opportunities!</p>
                </div>
            </div>
        `;
        return;
    }
    
    jobs.forEach(job => {
        const jobCard = createJobCard(job);
        jobsContainer.appendChild(jobCard);
    });
}

// Create job card
function createJobCard(job) {
    const col = document.createElement('div');
    col.className = 'col-12 mb-4';
    
    col.innerHTML = `
        <div class="job-card">
            <div class="row align-items-center">
                <div class="col-lg-8">
                    <div class="d-flex align-items-start">
                        <div class="job-icon me-3">
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h5 class="mb-1">${job.title}</h5>
                            <h6 class="text-primary mb-2">${job.company}</h6>
                            <div class="job-meta mb-2">
                                <span class="me-3">
                                    <i class="fas fa-map-marker-alt me-1"></i>${job.location}
                                </span>
                                <span class="job-salary">
                                    <i class="fas fa-dollar-sign me-1"></i>${job.salary}
                                </span>
                            </div>
                            <p class="text-muted mb-2">${truncateText(job.description, 150)}</p>
                            <div class="job-requirements">
                                <small class="text-muted">
                                    <strong>Requirements:</strong> ${truncateText(job.requirements, 100)}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 text-lg-end">
                    <div class="job-actions">
                        <small class="text-muted d-block mb-2">
                            <i class="fas fa-clock me-1"></i>Posted ${timeAgo(job.createdAt)}
                        </small>
                        <button class="btn btn-outline-primary btn-sm me-2" onclick="viewJobDetails('${job._id}')">
                            <i class="fas fa-eye me-1"></i>View Details
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="applyJob('${job._id}')">
                            <i class="fas fa-paper-plane me-1"></i>Apply Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// Filter jobs
function filterJobs() {
    try {
        const searchElement = document.getElementById('jobSearch');
        const salaryElement = document.getElementById('salaryFilter');
        
        const searchTerm = searchElement ? searchElement.value.toLowerCase().trim() : '';
        const salaryFilter = salaryElement ? salaryElement.value : '';
        
        let filteredJobs = allJobs.filter(job => {
            // Search filter - check title, company, description, and requirements
            const matchesSearch = !searchTerm || 
                job.title.toLowerCase().includes(searchTerm) ||
                job.company.toLowerCase().includes(searchTerm) ||
                job.description.toLowerCase().includes(searchTerm) ||
                (job.requirements && job.requirements.toLowerCase().includes(searchTerm));
            
            // Salary filter
            let matchesSalary = true;
            if (salaryFilter && job.salary) {
                const salary = extractSalaryNumber(job.salary);
                if (salary > 0) {
                    if (salaryFilter === '0-50000') {
                        matchesSalary = salary <= 50000;
                    } else if (salaryFilter === '50000-100000') {
                        matchesSalary = salary > 50000 && salary <= 100000;
                    } else if (salaryFilter === '100000-150000') {
                        matchesSalary = salary > 100000 && salary <= 150000;
                    } else if (salaryFilter === '150000+') {
                        matchesSalary = salary > 150000;
                    }
                }
            }
            
            return matchesSearch && matchesSalary;
        });
        
        displayJobs(filteredJobs);
        
        // Update results count
        updateResultsCount(filteredJobs.length, allJobs.length);
        
    } catch (error) {
        console.error('Error filtering jobs:', error);
        displayJobs(allJobs); // Fallback to show all jobs
    }
}

// Update results count
function updateResultsCount(filtered, total) {
    const resultsText = filtered === total ? 
        `Showing all ${total} jobs` : 
        `Showing ${filtered} of ${total} jobs`;
    
    let resultsElement = document.getElementById('resultsCount');
    if (!resultsElement) {
        // Create results count element if it doesn't exist
        resultsElement = document.createElement('div');
        resultsElement.id = 'resultsCount';
        resultsElement.className = 'text-muted mb-3';
        
        const container = document.getElementById('jobsContainer');
        if (container && container.parentNode) {
            container.parentNode.insertBefore(resultsElement, container);
        }
    }
    
    resultsElement.innerHTML = `<small><i class="fas fa-info-circle me-1"></i>${resultsText}</small>`;
}

// Extract salary number from string
function extractSalaryNumber(salaryString) {
    const numbers = salaryString.match(/\d+/g);
    if (numbers && numbers.length > 0) {
        return parseInt(numbers[0]);
    }
    return 0;
}

// View job details
function viewJobDetails(jobId) {
    const job = allJobs.find(j => j._id === jobId);
    if (!job) return;
    
    // Create modal for job details
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${job.title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <h6 class="text-primary">${job.company}</h6>
                        <div class="job-meta mb-3">
                            <span class="me-3">
                                <i class="fas fa-map-marker-alt me-1"></i>${job.location}
                            </span>
                            <span class="job-salary">
                                <i class="fas fa-dollar-sign me-1"></i>${job.salary}
                            </span>
                        </div>
                    </div>
                    
                    <h6>Job Description</h6>
                    <p class="mb-4">${job.description}</p>
                    
                    <h6>Requirements</h6>
                    <p class="mb-4">${job.requirements}</p>
                    
                    <div class="text-muted">
                        <small>Posted on ${formatDate(job.createdAt)}</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="applyJob('${job._id}')">
                        <i class="fas fa-paper-plane me-1"></i>Apply Now
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Remove modal from DOM when hidden
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}

// Apply for job
function applyJob(jobId) {
    const job = allJobs.find(j => j._id === jobId);
    if (!job) {
        showAlert('Job not found', 'danger');
        return;
    }
    
    // First check if user is logged in
    checkAuth().then(user => {
        if (!user) {
            // Store the job ID in session storage to redirect back after login
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            
            // Show login prompt
            showAlert('Please login to apply for this job', 'warning');
            
            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
            return;
        }
        
        // Show loading state on the apply button
        const applyBtn = document.querySelector(`button[onclick*="${jobId}"]`);
        const originalText = applyBtn ? applyBtn.innerHTML : '';
        if (applyBtn) {
            applyBtn.disabled = true;
            applyBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Applying...';
        }
        
        // Submit the application
        fetch('/api/job-applications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ jobId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // If there's an external link, open it in a new tab
                if (data.externalLink) {
                    window.open(data.externalLink, '_blank');
                }
                
                // Show success message
                showAlert('Application submitted successfully!', 'success');
                
                // Update the UI to show applied status
                if (applyBtn) {
                    applyBtn.innerHTML = '<i class="fas fa-check-circle me-1"></i>Applied';
                    applyBtn.classList.remove('btn-primary');
                    applyBtn.classList.add('btn-success');
                    applyBtn.onclick = null; // Remove the click handler
                }
            } else {
                // Show error message
                showAlert(data.message || 'Failed to submit application', 'danger');
                
                // Reset the button
                if (applyBtn) {
                    applyBtn.disabled = false;
                    applyBtn.innerHTML = originalText;
                }
            }
        })
        .catch(error => {
            console.error('Error applying for job:', error);
            showAlert('Failed to submit application. Please try again.', 'danger');
            
            // Reset the button
            if (applyBtn) {
                applyBtn.disabled = false;
                applyBtn.innerHTML = originalText;
            }
        });
    });
}

// Add job card styles
const style = document.createElement('style');
style.textContent = `
    .job-card {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        border-left: 4px solid var(--primary-color);
    }
    
    .job-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 15px 35px rgba(0,0,0,0.15);
    }
    
    .job-icon {
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, var(--primary-color), var(--success-color));
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.2rem;
    }
    
    .job-meta {
        color: #666;
        font-size: 0.9rem;
    }
    
    .job-salary {
        color: var(--success-color);
        font-weight: 600;
    }
    
    .job-actions .btn {
        transition: all 0.3s ease;
    }
    
    .job-actions .btn:hover {
        transform: translateY(-2px);
    }
    
    .job-requirements {
        background: #f8f9fa;
        padding: 0.5rem;
        border-radius: 5px;
        border-left: 3px solid var(--primary-color);
    }
    
    @media (max-width: 768px) {
        .job-card {
            padding: 1rem;
        }
        
        .job-actions {
            margin-top: 1rem;
        }
        
        .job-actions .btn {
            width: 100%;
            margin-bottom: 0.5rem;
        }
    }
`;
document.head.appendChild(style);
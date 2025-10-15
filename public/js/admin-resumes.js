// Admin Resumes Management
let currentResumePage = 1;
const resumesPerPage = 10;
let totalResumes = 0;
let currentSearchQuery = '';

// Initialize the resumes tab when it's shown
document.addEventListener('DOMContentLoaded', function() {
    const resumesTab = document.querySelector('a[href="#resumes"]');
    if (resumesTab) {
        resumesTab.addEventListener('shown.bs.tab', function() {
            loadResumes();
        });
    }
});

// Load resumes with pagination and search
async function loadResumes(page = 1, searchQuery = '') {
    try {
        currentResumePage = page;
        currentSearchQuery = searchQuery;
        
        // Show loading state
        const tbody = document.getElementById('resumesTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 mb-0">Loading resumes...</p>
                </td>
            </tr>
        `;

        // Build the API URL with query parameters
        let url = `/api/resumes/admin/resumes?page=${page}&limit=${resumesPerPage}`;
        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch resumes');
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to load resumes');
        }

        // Update pagination info
        totalResumes = data.pagination?.total || 0;
        
        // Render the resumes and pagination
        renderResumes(data.data || []);
        
        // Only render pagination if we have pagination data
        if (data.pagination) {
            renderResumesPagination(data.pagination);
        }
    } catch (error) {
        console.error('Error loading resumes:', error);
        const tbody = document.getElementById('resumesTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-circle fa-2x mb-2"></i>
                    <p class="mb-0">Failed to load resumes. Please try again later.</p>
                    <small class="text-muted">${error.message}</small>
                </td>
            </tr>
        `;
    }
}

// Show analysis details in a modal
function showAnalysisDetails(resume) {
    const analysis = resume.analysis || {};
    const suggestions = analysis.suggestions || [];
    const keywords = analysis.keywords || [];
    const score = analysis.score || 0;
    const scorePercentage = Math.round(score * 10);

    // Create modal HTML
    const modalHTML = `
    <div class="modal fade" id="analysisModal" tabindex="-1" aria-labelledby="analysisModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title" id="analysisModalLabel">Resume Analysis - ${resume.originalName || 'Untitled'}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h5>ATS Score</h5>
                            <div class="progress" style="height: 30px;">
                                <div class="progress-bar ${getScoreColorClass(scorePercentage)}" role="progressbar" 
                                     style="width: ${scorePercentage}%" aria-valuenow="${scorePercentage}" 
                                     aria-valuemin="0" aria-valuemax="100">
                                    ${scorePercentage}%
                                </div>
                            </div>
                            <small class="text-muted">This resume has an ATS score of ${scorePercentage} out of 100</small>
                        </div>
                        <div class="col-md-6">
                            <h5>File Information</h5>
                            <p class="mb-1"><strong>File Name:</strong> ${resume.originalName || 'N/A'}</p>
                            <p class="mb-1"><strong>File Type:</strong> ${resume.fileType || 'N/A'}</p>
                            <p class="mb-1"><strong>File Size:</strong> ${formatFileSize(resume.fileSize)}</p>
                            <p class="mb-0"><strong>Uploaded:</strong> ${formatDate(resume.uploadedAt || resume.createdAt)}</p>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <h5>Top Keywords</h5>
                            ${keywords.length > 0 
                                ? `<div class="d-flex flex-wrap gap-2">
                                    ${keywords.slice(0, 10).map(keyword => 
                                        `<span class="badge bg-primary">${keyword}</span>`).join('')}
                                   </div>`
                                : '<p class="text-muted">No keywords found</p>'
                            }
                        </div>
                        <div class="col-md-6">
                            <h5>Status</h5>
                            <span class="badge bg-${getStatusBadgeClass(resume.status)}">
                                ${resume.status || 'pending'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <h5>Suggestions for Improvement</h5>
                        ${suggestions.length > 0 
                            ? `<ul class="list-group">
                                ${suggestions.map(suggestion => 
                                    `<li class="list-group-item">${suggestion}</li>`).join('')}
                               </ul>`
                            : '<p class="text-muted">No specific suggestions available</p>'
                        }
                    </div>
                </div>
                <div class="modal-footer">
                    <a href="${resume.url || '#'}" class="btn btn-primary" target="_blank" ${!resume.url ? 'disabled' : ''}>
                        <i class="fas fa-download me-1"></i> Download Resume
                    </a>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>`;

    // Add modal to DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    // Initialize and show modal
    const modal = new bootstrap.Modal(document.getElementById('analysisModal'));
    modal.show();

    // Clean up modal after it's closed
    document.getElementById('analysisModal').addEventListener('hidden.bs.modal', function () {
        document.body.removeChild(modalContainer);
    });
}

// Helper function to get color class based on score
function getScoreColorClass(score) {
    if (score >= 70) return 'bg-success';
    if (score >= 40) return 'bg-warning';
    return 'bg-danger';
}

// Render resumes in the table
function renderResumes(resumes) {
    const tbody = document.getElementById('resumesTableBody');
    
    if (!resumes || resumes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <i class="fas fa-folder-open fa-2x text-muted mb-2"></i>
                    <p class="mb-0">No resumes found</p>
                    <small class="text-muted">Uploaded resumes will appear here</small>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = resumes.map(resume => {
        // Get ATS score or default to 0
        const atsScore = resume.analysis?.score || 0;
        const atsPercentage = Math.round(atsScore * 10);
        
        // Determine progress bar color based on score
        let progressClass = 'bg-success';
        if (atsPercentage < 40) {
            progressClass = 'bg-danger';
        } else if (atsPercentage < 70) {
            progressClass = 'bg-warning';
        }

        // Get file icon based on file type
        const isPDF = (resume.fileType || '').toLowerCase().includes('pdf');
        const fileIcon = isPDF ? 'fa-file-pdf text-danger' : 'fa-file-word text-primary';
        
        // Format the upload date
        const uploadDate = formatDate(resume.uploadedAt || resume.createdAt);
        
        // Get status badge class
        const statusClass = getStatusBadgeClass(resume.status || 'pending');
        const statusText = resume.status || 'pending';
        
        // Escape HTML in file name to prevent XSS
        const safeFileName = (resume.originalName || 'Untitled')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        return `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="flex-shrink-0 me-2">
                        <i class="fas ${fileIcon} fa-2x"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="fw-bold text-truncate" style="max-width: 200px;" title="${safeFileName}">
                            ${safeFileName}
                        </div>
                        <small class="text-muted">${formatFileSize(resume.fileSize)} • ${resume.fileType || 'Unknown Type'}</small>
                    </div>
                </div>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="me-2">
                        <div class="progress" style="width: 100px; height: 20px;">
                            <div class="progress-bar ${progressClass} progress-bar-striped progress-bar-animated" 
                                role="progressbar" 
                                style="width: ${atsPercentage}%" 
                                aria-valuenow="${atsPercentage}" 
                                aria-valuemin="0" 
                                aria-valuemax="100">
                            </div>
                        </div>
                    </div>
                    <div>
                        <span class="fw-bold">${atsPercentage}%</span>
                        <small class="text-muted d-block">ATS Score</small>
                    </div>
                </div>
            </td>
            <td>
                <div class="d-flex flex-column">
                    <span class="fw-bold">${resume.user?.name || 'Unknown User'}</span>
                    <small class="text-muted">${resume.userEmail || 'No email'}</small>
                </div>
            </td>
            <td>${uploadDate}</td>
            <td>
                <span class="badge bg-${statusClass}">
                    ${statusText}
                </span>
            </td>
            <td class="text-end">
                <div class="btn-group btn-group-sm">
                    <button onclick="showAnalysisDetails(${JSON.stringify(resume).replace(/"/g, '&quot;').replace(/'/g, '&#39;')})" 
                            class="btn btn-sm btn-outline-info" 
                            title="View Analysis">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                    <a href="${resume.url || '#'}" target="_blank" class="btn btn-sm btn-outline-primary" title="View Resume">
                        <i class="fas fa-eye"></i>
                    </a>
                    <button onclick="downloadResume('${resume._id || ''}', '${safeFileName}')" 
                            class="btn btn-sm btn-outline-secondary" 
                            title="Download" ${!resume.url ? 'disabled' : ''}>
                        <i class="fas fa-download"></i>
                    </button>
                    <button onclick="confirmDeleteResume('${resume._id || ''}')" 
                            class="btn btn-sm btn-outline-danger" 
                            title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// Render pagination for resumes
function renderResumesPagination(pagination) {
    const paginationEl = document.getElementById('resumesPagination');
    if (!pagination || pagination.totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    const { page, totalPages } = pagination;
    let html = '';

    // Previous button
    html += `
        <li class="page-item ${page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadResumes(${page - 1}, '${currentSearchQuery}')" ${page === 1 ? 'tabindex="-1" aria-disabled="true"' : ''}>
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        html += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="loadResumes(1, '${currentSearchQuery}')">1</a>
            </li>
        `;
        if (startPage > 2) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === page ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadResumes(${i}, '${currentSearchQuery}')">${i}</a>
            </li>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
        html += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="loadResumes(${totalPages}, '${currentSearchQuery}')">${totalPages}</a>
            </li>
        `;
    }

    // Next button
    html += `
        <li class="page-item ${page === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadResumes(${page + 1}, '${currentSearchQuery}')" ${page === totalPages ? 'tabindex="-1" aria-disabled="true"' : ''}>
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;

    paginationEl.innerHTML = html;
}

// Search resumes
function searchResumes() {
    const searchInput = document.getElementById('resumeSearchInput');
    const query = searchInput.value.trim();
    loadResumes(1, query);
}

// Download resume
async function downloadResume(resumeId, fileName) {
    try {
        const response = await fetch(`/api/admin/resumes/${resumeId}/download`, {
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Failed to download resume');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'resume.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading resume:', error);
        showAlert('error', 'Download Failed', 'Failed to download resume. Please try again.');
    }
}

// Confirm before deleting a resume
function confirmDeleteResume(resumeId) {
    Swal.fire({
        title: 'Delete Resume',
        text: 'Are you sure you want to delete this resume? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            deleteResume(resumeId);
        }
    });
}

// Delete a resume
async function deleteResume(resumeId) {
    try {
        const response = await fetch(`/api/admin/resumes/${resumeId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete resume');
        }

        showAlert('success', 'Success', 'Resume deleted successfully');
        loadResumes(currentResumePage, currentSearchQuery);
    } catch (error) {
        console.error('Error deleting resume:', error);
        showAlert('error', 'Delete Failed', error.message || 'Failed to delete resume. Please try again.');
    }
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Helper function to get badge class based on status
function getStatusBadgeClass(status) {
    const statusMap = {
        'pending': 'warning',
        'reviewed': 'info',
        'approved': 'success',
        'rejected': 'danger'
    };
    return statusMap[status?.toLowerCase()] || 'secondary';
}

// Show alert using SweetAlert2
function showAlert(icon, title, text) {
    Swal.fire({
        icon: icon,
        title: title,
        text: text,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}

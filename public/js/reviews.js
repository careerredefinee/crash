// Reviews page JavaScript

let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    loadBlogs();
    loadReviews();
    initializeModals();
    
    // Check authentication
    checkAuth().then(user => {
        currentUser = user;
    });
});

// Initialize modals and forms
function initializeModals() {
    // Blog form
    document.getElementById('createBlogForm').addEventListener('submit', handleBlogSubmission);
    document.getElementById('blogImage').addEventListener('change', function() {
        previewFile(this, 'blogImagePreview');
    });
    
    // Review form
    document.getElementById('createReviewForm').addEventListener('submit', handleReviewSubmission);
    
    // Rating stars
    const stars = document.querySelectorAll('.rating-input .fas');
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            document.getElementById('reviewRating').value = rating;
            updateStarRating(rating);
        });
        
        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.dataset.rating);
            highlightStars(rating);
        });
    });
    
    document.querySelector('.rating-input').addEventListener('mouseleave', function() {
        const currentRating = parseInt(document.getElementById('reviewRating').value);
        updateStarRating(currentRating);
    });
}

let selectedRating = 0; // Keep track of clicked rating

// Add emoji reaction element dynamically if not exists
function ensureReactionElement() {
    if (!document.getElementById('rating-reaction')) {
        const reactionEl = document.createElement('div');
        reactionEl.id = 'rating-reaction';
        reactionEl.style.fontSize = '2rem';
        reactionEl.style.marginTop = '5px';
        reactionEl.style.transition = 'transform 0.3s ease';
        document.querySelector('.rating-input').after(reactionEl);
        reactionEl.textContent = "🙂"; // default face
    }
}

// Update star rating display (on click)
function updateStarRating(rating) {
    ensureReactionElement();
    const stars = document.querySelectorAll('.rating-input .fas');
    stars.forEach((star, index) => {
        star.style.transition = "transform 0.2s ease, color 0.2s ease";
        if (index < rating) {
            star.classList.add('text-warning');
            star.classList.remove('text-muted');
        } else {
            star.classList.add('text-muted');
            star.classList.remove('text-warning');
        }
    });

    // Save rating
    selectedRating = rating;

    // Update reaction
    updateReactionFace(rating);
}

// Highlight stars on hover
function highlightStars(rating) {
    ensureReactionElement();
    const stars = document.querySelectorAll('.rating-input .fas');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('text-warning');
            star.classList.remove('text-muted');
            star.style.transform = "scale(1.2) rotate(-5deg)";
        } else {
            star.classList.add('text-muted');
            star.classList.remove('text-warning');
            star.style.transform = "scale(1)";
        }
    });

    updateReactionFace(rating, true);
}

// Update emoji face + animation
function updateReactionFace(rating, animate = false) {
    const reaction = document.getElementById('rating-reaction');
    const reactions = {
        1: "😭",
        2: "☹️",
        3: "😐",
        4: "😊",
        5: "🤩"
    };
    reaction.textContent = reactions[rating] || "🙂";

    if (animate) {
        reaction.style.transform = "scale(1.3)";
        setTimeout(() => {
            reaction.style.transform = "scale(1)";
        }, 200);
    }
}

// Attach hover & click events dynamically
function initStarRating() {
    ensureReactionElement();
    document.querySelectorAll('.rating-input .fas').forEach((star, index) => {
        star.addEventListener('mouseover', () => highlightStars(index + 1));
        star.addEventListener('mouseout', () => updateStarRating(selectedRating || 0));
        star.addEventListener('click', () => updateStarRating(index + 1));
    });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", initStarRating);

// Show create blog modal
function showCreateBlogModal() {
    if (!currentUser) {
        showAlert('Please login to create blog posts', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('createBlogModal'));
    modal.show();
}

// Show create review modal
function showCreateReviewModal() {
    if (!currentUser) {
        showAlert('Please login to write reviews', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('createReviewModal'));
    modal.show();
}

// Handle blog submission
async function handleBlogSubmission(e) {
    e.preventDefault();
    
    const title = document.getElementById('blogTitle').value;
    const content = document.getElementById('blogContent').value;
    const imageFile = document.getElementById('blogImage').files[0];
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!title.trim() || !content.trim()) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }
    
    const originalContent = showLoading(submitBtn);
    
    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        const response = await fetch('/api/blogs', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Blog post created successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('createBlogModal')).hide();
            document.getElementById('createBlogForm').reset();
            document.getElementById('blogImagePreview').innerHTML = '';
            loadBlogs();
        } else {
            showAlert(data.error || 'Failed to create blog post', 'danger');
        }
    } catch (error) {
        console.error('Blog creation error:', error);
        showAlert('Failed to create blog post', 'danger');
    } finally {
        hideLoading(submitBtn, originalContent);
    }
}

// Handle review submission
async function handleReviewSubmission(e) {
    e.preventDefault();
    
    const rating = parseInt(document.getElementById('reviewRating').value);
    const comment = document.getElementById('reviewComment').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!comment.trim()) {
        showAlert('Please write a review comment', 'warning');
        return;
    }
    
    const originalContent = showLoading(submitBtn);
    
    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rating, comment })
        });
        
        const data = await response.json();
        
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('createReviewModal')).hide();
            document.getElementById('createReviewForm').reset();
            updateStarRating(5);
            loadReviews();
            
            // Show ATM-size tick modal
            const reviewSuccessModal = new bootstrap.Modal(document.getElementById('reviewSuccessModal'));
            reviewSuccessModal.show();
            
        } else {
            showAlert(data.error || 'Failed to submit review', 'danger');
        }
    } catch (error) {
        console.error('Review submission error:', error);
        showAlert('Failed to submit review', 'danger');
    } finally {
        hideLoading(submitBtn, originalContent);
    }
}

// Load blogs
async function loadBlogs() {
    try {
        const response = await fetch('/api/blogs');
        let blogs = await response.json();

        // 🔹 Filter out admin blogs
        blogs = blogs.filter(blog => !blog.isAdmin);

        const blogsContainer = document.getElementById('blogsContainer');
        blogsContainer.innerHTML = '';

        if (blogs.length === 0) {
            blogsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <div class="py-5">
                        <i class="fas fa-blog fs-1 text-muted mb-3"></i>
                        <h4 class="text-muted">No blog posts yet</h4>
                        <p class="text-muted">Be the first to share your thoughts!</p>
                    </div>
                </div>
            `;
            return;
        }

        blogs.forEach(blog => {
            const blogCard = createBlogCard(blog);
            blogsContainer.appendChild(blogCard);
        });

    } catch (error) {
        console.error('Error loading blogs:', error);
        document.getElementById('blogsContainer').innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger">Failed to load blog posts</div>
            </div>
        `;
    }
}


// Load reviews
async function loadReviews() {
    try {
        const response = await fetch('/api/reviews');
        const reviews = await response.json();
        
        const reviewsContainer = document.getElementById('reviewsContainer');
        reviewsContainer.innerHTML = '';
        
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <div class="py-5">
                        <i class="fas fa-star fs-1 text-muted mb-3"></i>
                        <h4 class="text-muted">No reviews yet</h4>
                        <p class="text-muted">Share your experience with us!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        reviews.forEach(review => {
            const reviewCard = createReviewCard(review);
            reviewsContainer.appendChild(reviewCard);
        });
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('reviewsContainer').innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger">Failed to load reviews</div>
            </div>
        `;
    }
}

// Create blog card
function createBlogCard(blog) {
    const col = document.createElement('div');
    col.className = 'col-lg-6 col-md-6 mb-4';
    
    const isAdmin = blog.isAdmin || (blog.author && blog.author.isAdmin);
    
    col.innerHTML = `
        <div class="blog-card h-100">
           ${blog.image ? `
  <div class="blog-image-wrapper">
    <img src="${blog.image}" class="blog-image" alt="${blog.title}">
  </div>` : ''}

<div class="card-body d-flex flex-column">
    <div class="d-flex justify-content-between align-items-start mb-2">
        <h5 class="card-title mb-0">${blog.title}</h5>
        ${isAdmin ? '<span class="badge bg-primary">Admin</span>' : ''}
    </div>


                <p class="card-text text-muted flex-grow-1">${truncateText(blog.content, 120)}</p>
                <div class="blog-meta mb-3">
                    <small class="text-muted">
                        <i class="fas fa-user me-1"></i>${blog.author?.name || 'Anonymous'}
                        <i class="fas fa-calendar ms-3 me-1"></i>${formatDate(blog.createdAt)}
                    </small>
                </div>
                <div class="blog-actions">
                    <button class="blog-action ${blog.likes?.includes(currentUser?._id) ? 'liked' : ''}" onclick="likeBlog('${blog._id}')">
                        <i class="fas fa-heart"></i>
                        <span>${blog.likes?.length || 0}</span>
                    </button>
                    <button class="blog-action" onclick="viewBlogDetail('${blog._id}')">
                        <i class="fas fa-comment"></i>
                        <span>${blog.comments?.length || 0}</span>
                    </button>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewBlogDetail('${blog._id}')">
                        Read More
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// Create review card
function createReviewCard(review) {
    const col = document.createElement('div');
    col.className = 'col-lg-6 col-md-6 mb-4';
    
    col.innerHTML = `
        <div class="card h-100">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h6 class="mb-1">${review.user?.name || 'Anonymous'}</h6>
                        <div class="rating">
                            ${generateStarRating(review.rating)}
                        </div>
                    </div>
                    <small class="text-muted">${timeAgo(review.createdAt)}</small>
                </div>
                <p class="card-text">${review.comment}</p>
            </div>
        </div>
    `;
    
    return col;
}

// Generate star rating HTML
function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star text-warning"></i>';
        } else {
            stars += '<i class="fas fa-star text-muted"></i>';
        }
    }
    return stars;
}

// Like blog
async function likeBlog(blogId) {
    if (!currentUser) {
        showAlert('Please login to like posts', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`/api/blogs/${blogId}/like`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            loadBlogs(); // Reload blogs to update like count
        }
    } catch (error) {
        console.error('Error liking blog:', error);
        showAlert('Failed to like post', 'danger');
    }
}

// View blog detail
async function viewBlogDetail(blogId) {
    try {
        const response = await fetch('/api/blogs');
        const blogs = await response.json();
        const blog = blogs.find(b => b._id === blogId);
        
        if (!blog) return;
        
        const modal = document.getElementById('blogDetailModal');
        const title = document.getElementById('blogDetailTitle');
        const content = document.getElementById('blogDetailContent');
        
        title.textContent = blog.title;
        
        content.innerHTML = `
            <div class="blog-detail">
                ${blog.image ? `<img src="${blog.image}" class="img-fluid rounded mb-4" alt="${blog.title}">` : ''}
                
                <div class="blog-meta mb-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge ${blog.isAdmin ? 'bg-primary' : 'bg-secondary'} me-2">
                                ${blog.isAdmin ? 'Admin' : 'User'}
                            </span>
                            <span class="text-muted">
                                <i class="fas fa-user me-1"></i>${blog.author?.name || 'Anonymous'}
                            </span>
                        </div>
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>${formatDate(blog.createdAt)}
                        </small>
                    </div>
                </div>
                
                <div class="blog-content mb-4">
                    <p>${blog.content.replace(/\n/g, '</p><p>')}</p>
                </div>
                
                <div class="blog-actions mb-4">
                    <button class="btn btn-outline-primary me-2 ${blog.likes?.includes(currentUser?._id) ? 'active' : ''}" onclick="likeBlog('${blog._id}')">
                        <i class="fas fa-heart me-1"></i>Like (${blog.likes?.length || 0})
                    </button>
                </div>
                
                <div class="comments-section">
                    <h6 class="mb-3">Comments (${blog.comments?.length || 0})</h6>
                    
                    ${currentUser ? `
                        <div class="comment-form mb-4">
                            <div class="input-group">
                                <input type="text" class="form-control" id="commentInput-${blog._id}" placeholder="Write a comment...">
                                <button class="btn btn-primary" onclick="addComment('${blog._id}')">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="comments-list">
                        ${blog.comments?.map(comment => `
                            <div class="comment mb-3 p-3 bg-light rounded">
                                <div class="d-flex justify-content-between align-items-start">
                                    <strong>${comment.user?.name || 'Anonymous'}</strong>
                                    <small class="text-muted">${timeAgo(comment.createdAt)}</small>
                                </div>
                                <p class="mb-0 mt-1">${comment.comment}</p>
                            </div>
                        `).join('') || '<p class="text-muted">No comments yet.</p>'}
                    </div>
                </div>
            </div>
        `;
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
    } catch (error) {
        console.error('Error loading blog detail:', error);
        showAlert('Failed to load blog details', 'danger');
    }
}

// Add comment
async function addComment(blogId) {
    if (!currentUser) {
        showAlert('Please login to comment', 'warning');
        return;
    }
    
    const commentInput = document.getElementById(`commentInput-${blogId}`);
    const comment = commentInput.value.trim();
    
    if (!comment) {
        showAlert('Please enter a comment', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`/api/blogs/${blogId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ comment })
        });
        
        const data = await response.json();
        
        if (data.success) {
            commentInput.value = '';
            viewBlogDetail(blogId); // Reload blog detail to show new comment
            loadBlogs(); // Reload blogs to update comment count
        } else {
            showAlert('Failed to add comment', 'danger');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        showAlert('Failed to add comment', 'danger');
    }
}

// Initialize rating display
updateStarRating(5);

// Add custom styles
const style = document.createElement('style');
style.textContent = `
    .blog-card {
        transition: all 0.3s ease;
        border: none;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .blog-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    .blog-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
        padding-top: 1rem;
        border-top: 1px solid #eee;
    }
    
    .blog-action {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        transition: color 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .blog-action:hover {
        color: var(--primary-color);
    }
    
    .blog-action.liked {
        color: var(--danger-color);
    }
    
    .rating-input {
        display: flex;
        gap: 0.25rem;
        margin-bottom: 1rem;
    }
    
    .rating-input .fas {
        cursor: pointer;
        font-size: 1.5rem;
        transition: color 0.3s ease;
    }
    
    .rating {
        display: flex;
        gap: 0.25rem;
    }
    
    .comment {
        border-left: 3px solid var(--primary-color);
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
`;
document.head.appendChild(style);
document.addEventListener('DOMContentLoaded', async () => {
    const blogId = window.location.pathname.split('/').pop();

    const res = await fetch(`/api/blogs/${blogId}`);
    const blog = await res.json();
    if (!blog || blog.error) {
        document.getElementById('blogDetails').innerHTML = '<p>Blog not found.</p>';
        return;
    }

    // Render blog content
    document.getElementById('blogDetails').innerHTML = `
        <h1>${blog.title}</h1>
        ${blog.image ? `<img src="${blog.image}" class="img-fluid mb-4">` : ''}
        <p>${blog.content}</p>
    `;
    document.getElementById('likeCount').textContent = blog.likes?.length || 0;

    renderComments(blog.comments || []);

    // Like button event
    document.getElementById('likeBtn').onclick = async () => {
        const likeRes = await fetch(`/api/blogs/${blog._id}/like`, { method: 'POST' });
        const data = await likeRes.json();
        if (data.success) {
            document.getElementById('likeCount').textContent = data.likesCount;
        }
    };

    // Comment button event
    document.getElementById('commentBtn').onclick = async () => {
        const comment = document.getElementById('commentText').value.trim();
        if (!comment) return alert('Enter a comment');
        await fetch(`/api/blogs/${blog._id}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment })
        });
        document.getElementById('commentText').value = '';
        location.reload(); // reload page to update comments
    };
});

function renderComments(comments) {
    const container = document.getElementById('commentsSection');
    container.innerHTML = '';
    if (!comments.length) {
        container.innerHTML = '<p class="text-muted">No comments yet.</p>';
        return;
    }
    comments.forEach(c => {
        const div = document.createElement('div');
        div.className = 'border p-2 mb-2';
        div.innerHTML = `<strong>${c.user?.name || 'Anonymous'}:</strong> ${c.comment}`;
        container.appendChild(div);
    });
}

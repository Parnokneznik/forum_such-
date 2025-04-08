document.addEventListener('DOMContentLoaded', function() {
    let posts = JSON.parse(localStorage.getItem('forumPosts')) || [];
    let sortMethod = 'time';
    
    document.getElementById('post-creation-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('post-title').value.trim();
        const content = document.getElementById('post-content').value.trim();
        
        if (title && content) {
            const newPost = {
                id: Date.now(),
                title,
                content,
                timestamp: new Date(),
                comments: []
            };
            
            posts.unshift(newPost); 
            savePosts();
            renderPosts();
            
            this.reset();
        }
    });
    
    document.getElementById('sort-newest').addEventListener('click', function() {
        sortMethod = 'time';
        renderPosts();
    });
    
    document.getElementById('sort-popular').addEventListener('click', function() {
        sortMethod = 'comments';
        renderPosts();
    });
    
    function savePosts() {
        localStorage.setItem('forumPosts', JSON.stringify(posts));
    }
    
    function renderPosts() {
        const postsList = document.getElementById('posts-list');
        postsList.innerHTML = '';
        
        const sortedPosts = [...posts].sort((a, b) => {
            if (sortMethod === 'time') {
                return b.timestamp - a.timestamp;
            } else {
                return b.comments.length - a.comments.length;
            }
        });
        
        sortedPosts.forEach(post => {
            const postElement = document.createElement('li');
            postElement.className = 'post';
            postElement.dataset.postId = post.id;
            
            postElement.innerHTML = `
                <div class="post-title">${post.title}</div>
                <div class="post-content">${post.content}</div>
                <div class="post-meta">
                    <span>Posted: ${formatDate(post.timestamp)}</span>
                    <span>Comments: ${post.comments.length}</span>
                </div>
                <div class="comment-section">
                    <button class="add-comment-btn">Add Comment</button>
                    <button class="toggle-comments">Show Comments (${post.comments.length})</button>
                    <form class="comment-form">
                        <textarea placeholder="Write your comment..." required></textarea>
                        <button type="submit" class="btn-success">Post Comment</button>
                    </form>
                    <div class="comments-list" style="display:none"></div>
                </div>
            `;
            
            postsList.appendChild(postElement);
            
            setupCommentToggle(postElement, post);
            
            setupAddCommentButton(postElement);
            
            setupCommentForm(postElement, post);
            
            renderComments(post.id, post.comments);
        });
    }
    
    function formatDate(date) {
        return new Date(date).toLocaleString();
    }
    
    function setupCommentToggle(postElement, post) {
        const toggleBtn = postElement.querySelector('.toggle-comments');
        const commentsList = postElement.querySelector('.comments-list');
        
        toggleBtn.addEventListener('click', function() {
            if (commentsList.style.display === 'none') {
                commentsList.style.display = 'block';
                this.textContent = `Hide Comments (${post.comments.length})`;
            } else {
                commentsList.style.display = 'none';
                this.textContent = `Show Comments (${post.comments.length})`;
            }
        });
    }
    
    function setupAddCommentButton(postElement) {
        const addCommentBtn = postElement.querySelector('.add-comment-btn');
        const commentForm = postElement.querySelector('.comment-form');
        
        addCommentBtn.addEventListener('click', function() {
            commentForm.style.display = commentForm.style.display === 'block' ? 'none' : 'block';
        });
    }
    
    function setupCommentForm(postElement, post) {
        const commentForm = postElement.querySelector('.comment-form');
        const toggleBtn = postElement.querySelector('.toggle-comments');
        const commentsList = postElement.querySelector('.comments-list');
        
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const commentText = this.querySelector('textarea').value.trim();
            
            if (commentText) {
                const newComment = {
                    id: Date.now(),
                    content: commentText,
                    timestamp: new Date()
                };
                
                post.comments.unshift(newComment);
                savePosts();
                renderComments(post.id, post.comments);
                
                this.reset();
                this.style.display = 'none';
                toggleBtn.textContent = `Hide Comments (${post.comments.length})`;
                commentsList.style.display = 'block';
            }
        });
    }
    
    function renderComments(postId, comments) {
        const postElement = document.querySelector(`.post[data-post-id="${postId}"]`);
        if (!postElement) return;
        
        const commentsList = postElement.querySelector('.comments-list');
        commentsList.innerHTML = '';
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
            return;
        }
        
        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <div class="comment-meta">Posted: ${formatDate(comment.timestamp)}</div>
                <div class="comment-content">${comment.content}</div>
            `;
            commentsList.appendChild(commentElement);
        });
    }
    
    renderPosts();
});
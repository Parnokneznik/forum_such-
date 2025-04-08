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
    
    function formatDate(date) {
        return new Date(date).toLocaleString();
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
                    <span>Comments: ${countAllComments(post)}</span>
                </div>
                <div class="comment-section">
                    <button class="add-comment-btn">Add Comment</button>
                    <button class="toggle-comments">Show Comments (${countAllComments(post)})</button>
                    <form class="comment-form">
                        <textarea placeholder="Write your comment..." required></textarea>
                        <button type="submit" class="btn-success">Post Comment</button>
                    </form>
                    <div class="comments-list" style="display:none"></div>
                </div>
            `;
            
            postsList.appendChild(postElement);
            
            const toggleBtn = postElement.querySelector('.toggle-comments');
            const commentsList = postElement.querySelector('.comments-list');
            
            toggleBtn.addEventListener('click', function() {
                if (commentsList.style.display === 'none') {
                    commentsList.style.display = 'block';
                    this.textContent = `Hide Comments (${countAllComments(post)})`;
                } else {
                    commentsList.style.display = 'none';
                    this.textContent = `Show Comments (${countAllComments(post)})`;
                }
            });
            
            const addCommentBtn = postElement.querySelector('.add-comment-btn');
            const commentForm = postElement.querySelector('.comment-form');
            
            addCommentBtn.addEventListener('click', function() {
                commentForm.style.display = commentForm.style.display === 'block' ? 'none' : 'block';
            });
            
            commentForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const commentText = this.querySelector('textarea').value.trim();
                
                if (commentText) {
                    const newComment = {
                        id: Date.now(),
                        content: commentText,
                        timestamp: new Date(),
                        replies: []
                    };
                    
                    post.comments.unshift(newComment);
                    savePosts();
                    renderComments(post);
                    
                    this.reset();
                    this.style.display = 'none';
                    toggleBtn.textContent = `Hide Comments (${countAllComments(post)})`;
                    commentsList.style.display = 'block';
                }
            });
            
            renderComments(post);
        });
    }
    
    function countAllComments(post) {
        let count = post.comments.length;
        post.comments.forEach(comment => {
            if (comment.replies) {
                count += comment.replies.length;
            }
        });
        return count;
    }
    
    function renderComments(post) {
        const postElement = document.querySelector(`.post[data-post-id="${post.id}"]`);
        if (!postElement) return;
        
        const commentsList = postElement.querySelector('.comments-list');
        commentsList.innerHTML = '';
        
        if (post.comments.length === 0) {
            commentsList.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
            return;
        }
        
        post.comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.dataset.commentId = comment.id;
            
            commentElement.innerHTML = `
                <div class="comment-meta">Posted: ${formatDate(comment.timestamp)}</div>
                <div class="comment-content">${comment.content}</div>
                <button class="reply-btn">Reply</button>
                <form class="reply-form">
                    <textarea placeholder="Write your reply..." required></textarea>
                    <button type="submit" class="btn-success">Post Reply</button>
                </form>
                <div class="reply-section"></div>
            `;
            
            commentsList.appendChild(commentElement);
            
            const replyBtn = commentElement.querySelector('.reply-btn');
            const replyForm = commentElement.querySelector('.reply-form');
            
            replyBtn.addEventListener('click', function() {
                replyForm.style.display = replyForm.style.display === 'block' ? 'none' : 'block';
            });
            
            replyForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const replyText = this.querySelector('textarea').value.trim();
                
                if (replyText) {
                    if (!comment.replies) comment.replies = [];
                    
                    const newReply = {
                        id: Date.now(),
                        content: replyText,
                        timestamp: new Date()
                    };
                    
                    comment.replies.unshift(newReply);
                    savePosts();
                    renderReplies(post, comment);
                    
                    this.reset();
                    this.style.display = 'none';
                    
                    const toggleBtn = postElement.querySelector('.toggle-comments');
                    toggleBtn.textContent = `Hide Comments (${countAllComments(post)})`;
                }
            });
            
            if (comment.replies && comment.replies.length > 0) {
                renderReplies(post, comment);
            }
        });
    }
    
    function renderReplies(post, comment) {
        const commentElement = document.querySelector(`.post[data-post-id="${post.id}"] .comment[data-comment-id="${comment.id}"]`);
        if (!commentElement) return;
        
        const replySection = commentElement.querySelector('.reply-section');
        replySection.innerHTML = '';
        
        comment.replies.forEach(reply => {
            const replyElement = document.createElement('div');
            replyElement.className = 'reply';
            replyElement.innerHTML = `
                <div class="reply-meta">Posted: ${formatDate(reply.timestamp)}</div>
                <div class="reply-content">${reply.content}</div>
            `;
            replySection.appendChild(replyElement);
        });
    }
    
    renderPosts();
});
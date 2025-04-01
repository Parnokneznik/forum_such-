document.addEventListener('DOMContentLoaded', () => {
    const postsList = document.getElementById('posts');
    const newPostForm = document.getElementById('new-post-form');
    const sortByTimeButton = document.getElementById('sort-by-time');
    const sortByCommentsButton = document.getElementById('sort-by-comments');

    let currentSort = 'time';

    function loadPosts(sortBy = 'time') {
        fetch(`/api/posts?sortBy=${sortBy}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(posts => {
                postsList.innerHTML = '';
                posts.forEach(post => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<a href="/post.html?id=${post.post_id}">${post.title}</a> <span class="comment-count">(${post.comment_count} comments)</span> - <span class="created-at">${new Date(post.created_at).toLocaleString()}</span>`;
                    postsList.appendChild(listItem);
                });
            })
            .catch(error => {
                console.error('Could not load posts:', error);
                postsList.innerHTML = '<li>Error loading posts.</li>';
            });
    }

    newPostForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const titleInput = document.getElementById('title');
        const contentInput = document.getElementById('content');
        const title = titleInput.value;
        const content = contentInput.value;

        fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, content }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            titleInput.value = '';
            contentInput.value = '';
            loadPosts(currentSort); 
        })
        .catch(error => {
            console.error('Could not create post:', error);
        });
    });

    sortByTimeButton.addEventListener('click', () => {
        currentSort = 'time';
        loadPosts(currentSort);
    });

    sortByCommentsButton.addEventListener('click', () => {
        currentSort = 'comments';
        loadPosts(currentSort);
    });

    loadPosts(currentSort); 
});
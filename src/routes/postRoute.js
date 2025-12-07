import postController from "../controllers/postController.js";

export default (app) => {
    app.post('/posts', postController.createPost);
    app.get('/posts', postController.getAll);
    app.get('/posts/:id', postController.getPost);
    app.post('/posts/:id/like', postController.likePost);
    app.get('/feed', postController.getFeed);
    app.post('/posts/:id/comments', postController.createComment);
    app.get('/posts/:id/comments', postController.getComments);
}

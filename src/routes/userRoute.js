import userController from "../controllers/userController.js";

export default (app) => {
    app.post('/users', userController.create);
    app.get('/users', userController.getAll);
    app.get('/users/search', userController.searchUsers);
    app.get('/users/:id', userController.getProfile);
    app.get('/users/:id/posts', userController.getUserPosts);
    app.get('/users/:id/followers', userController.getFollowers);
    app.get('/users/:id/following', userController.getFollowing);
    app.post('/users/:id/follow', userController.followUser);
    app.delete('/users/:id/follow', userController.unfollowUser);
    app.get('/recommendations/friends/:id', userController.getRecommendations);
}

import emprestimoController from "../controllers/emprestimoController.js";

export default (app) => {
    app.get('/emprestimo', emprestimoController.get);
    app.get('/emprestimo/:id', emprestimoController.get);
    app.post('/emprestimo', emprestimoController.persist);
    app.patch('/emprestimo/:id', emprestimoController.persist);
    app.delete('/emprestimo/:id', emprestimoController.destroy);
}
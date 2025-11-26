import pessoaController from "../controllers/pessoaController.js";

export default (app) => {
    app.get('/pessoa', pessoaController.getAll);
    app.get('/pessoa/:id', pessoaController.getId);
    app.post('/idade', pessoaController.create)
}
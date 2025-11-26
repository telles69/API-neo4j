import ClienteRoute from "./ClienteRoute.js";
import EmprestimoRoute from "./EmprestimoRoute.js";
import pessoaRoute from "./pessoaRoute.js";

function Routes(app){
    pessoaRoute(app)
    ClienteRoute(app)
    EmprestimoRoute(app)
}

export default Routes;
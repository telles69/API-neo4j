import UserRoute from "./userRoute.js";
import PostRoute from "./postRoute.js";

function Routes(app){
    UserRoute(app);
    PostRoute(app);
}

export default Routes;

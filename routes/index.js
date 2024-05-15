import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';

const mapRoutes = (app) => {
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);
  app.post('/users', UsersController.postNew);
  app.get('/users/me', UsersController.getMe);
  app.get('/connect', AuthController.connect);
  app.get('/disconnect', AuthController.disconnect);
};

export default mapRoutes;
module.exports = mapRoutes;

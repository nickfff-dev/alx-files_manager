import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    if (!req.body.email) {
      return res.status(400).send({ error: 'Missing email' });
    }
    if (!req.body.password) {
      return res.status(400).send({ error: 'Missing password' });
    }
    const { email, password } = req.body;
    const existingUser = await dbClient.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).send({ error: 'Already exist' });
    }

    const newUser = await dbClient.createUser({ email, password: sha1(password) });
    return res.status(201).send({ id: newUser.id, email: newUser.email });
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const user = await dbClient.getUserById(userId);
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    return res.status(200).json({ id: user._id.toString(), email: user.email });
  }
}
module.exports = UsersController;
export default UsersController;

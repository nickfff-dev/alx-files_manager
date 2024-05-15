import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import hashPassword from '../utils/hshpw';

class AuthController {
  static async connect(req, res) {
    try {
      const authHeader = req.headers.authorization.split(' ')[1];
      const [email, password] = Buffer.from(authHeader, 'base64').toString().split(':');
      const hashedPassword = hashPassword(password);
      const user = await dbClient.getUserByEmail(email);

      if (!user) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
      if (user.password !== hashedPassword) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
      const token = uuidv4();
      await redisClient.set(`auth_${token}`, user._id.toString(), 86400);
      return res.status(200).json({ token });
    } catch (err) {
      return res.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async disconnect(req, res) {
    try {
      const token = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
      await redisClient.del(`auth_${token}`);
      return res.status(204).end();
    } catch (err) {
      return res.status(500).send({ error: 'Internal Server Error' });
    }
  }
}

module.exports = AuthController;
export default AuthController;

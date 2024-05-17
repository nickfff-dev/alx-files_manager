import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async connect(req, res) {
    const authHeader = req.headers.authorization.split(' ')[1];
    const [email, password] = Buffer.from(authHeader, 'base64').toString().split(':');

    const user = await dbClient.getUserByEmail(email);

    if (!user || (sha1(password) !== user.password)) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 86400);
    return res.status(200).json({ token });
  }

  static async disconnect(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    await redisClient.del(`auth_${token}`);
    return res.status(204).end();
  }
}

module.exports = AuthController;
export default AuthController;

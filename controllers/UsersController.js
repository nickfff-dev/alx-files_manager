import crypto from 'crypto';
import dbClient from '../utils/db';

function hashPassword(password) {
  return crypto.createHash('sha1')
    .update(password, 'utf-8')
    .digest('hex');
};

class UsersController {
  static async postNew(req, res) {
    if (!req.body.email) {
      return res.status(400).send({ error: 'Missing email' });
    }
    if (!req.body.password) {
      return res.status(400).send({ error: 'Missing password' });
    }
    const { email, password } = req.body;
    const existingUser = await dbClient.getUser(email);
    if (existingUser) {
      return res.status(400).send({ error: 'Already exist' });
    }
    const hash = hashPassword(password);
    const newUser = await dbClient.createUser({ email, password: hash });
    return res.status(201).send({ id: newUser.id, email: newUser.email });
  }
}

module.exports = UsersController;
export default UsersController;

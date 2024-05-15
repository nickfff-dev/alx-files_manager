import crypto from 'crypto';

function hashPassword(password) {
  return crypto.createHash('sha1')
    .update(password, 'utf-8')
    .digest('hex');
}

export default hashPassword;

// controllers/FilesController.js
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    try {
      const token = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const {
        name, type, parentId, isPublic, data,
      } = req.body;

      if (!name) {
        return res.status(400).send({ error: 'Missing name' });
      }

      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).send({ error: 'Missing type' });
      }

      let localPath;
      if (type === 'file' || type === 'image') {
        if (!data) {
          return res.status(400).send({ error: 'Missing data' });
        }
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        localPath = path.join(folderPath, `${uuidv4()}`);
        await new Promise((resolve, reject) => {
          fs.writeFile(localPath, data, 'base64', (err) => {
            if (err) {
              reject(err);
            }
            resolve();
          });
        });
      }

      const fileData = {
        userId,
        name,
        type,
        isPublic: !!isPublic,
        parentId: parentId || 0,
        ...((type === 'file' || type === 'image') && { localPath }),
      };

      const result = await dbClient.createFile(fileData);

      if (!result) {
        return res.status(400).send({ error: 'Parent not found' });
      }

      return res.status(201).json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).send({ error: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
export default FilesController;

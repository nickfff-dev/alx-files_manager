/* eslint-disable prefer-destructuring */
import { v4 as uuidv4 } from 'uuid';
import { writeFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'path';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath);
    }
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    if (!req.body.name) {
      return res.status(400).send({ error: 'Missing name' });
    }

    if (!req.body.type || !['folder', 'file', 'image'].includes(req.body.type)) {
      return res.status(400).send({ error: 'Missing type' });
    }

    const name = req.body.name;
    const type = req.body.type;
    const data = req.body.data;

    let parentId = 0;
    let isPublic = false;
    let parentName = '';
    if (Object.keys(req.body).includes('parentId')) {
      parentId = req.body.parentId;
      if (parentId !== 0) {
        const parentFile = await dbClient.getFileById(parentId.toString());
        if (!parentFile) {
          return res.status(400).send({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).send({ error: 'Parent is not a folder' });
        }
        parentName = parentFile.name;
      }
    }

    if (Object.keys(req.body).includes('isPublic')) {
      isPublic = req.body.isPublic;
    }

    let localPath;
    if (type === 'file' || type === 'image') {
      if (!data) {
        return res.status(400).send({ error: 'Missing data' });
      }
      if (parentName !== '') {
        localPath = path.join(folderPath, parentName, `${uuidv4()}`);
      } else {
        localPath = path.join(folderPath, `${uuidv4()}`);
      }

      try {
        await writeFile(localPath, data, { encoding: 'base64' });
      } catch (err) {
        console.log(err);
      }
    }
    if (type === 'folder') {
      if (parentName !== '') {
        localPath = path.join(folderPath, parentName, `${name}`);
      } else {
        localPath = path.join(folderPath, `${name}`);
      }
      if (!existsSync(localPath)) {
        mkdirSync(localPath, {r});
      }
    }
    const fileData = {
      userId,
      name,
      type,
      isPublic,
      parentId,
      ...((type === 'file' || type === 'image') && { localPath }),
    };

    const result = await dbClient.createFile(fileData);

    if (!result) {
      return res.status(400).send({ error: 'Error creating file' });
    }
    const paylod = {
      userId: result.userId,
      name: result.name,
      type: result.type,
      isPublic: result.isPublic,
      parentId: result.parentId,
      id: result._id.toString(),
    };
    return res.status(201).json(paylod);
  }

  static async getShow(req, res) {
    try {
      const token = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const fileId = req.params.id;
      const file = await dbClient.getFileById(fileId);

      if (!file) {
        return res.status(404).send({ error: 'Not found' });
      }

      return res.status(200).json(file);
    } catch (err) {
      console.error(err);
      return res.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async getIndex(req, res) {
    try {
      const token = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const { parentId = 0, page = 0 } = req.query;
      const pageSize = 20;
      const skip = page * pageSize;

      const files = await dbClient.getFilesByParentIdAndPage(parentId, skip, pageSize);

      return res.status(200).json(files);
    } catch (err) {
      console.error(err);
      return res.status(500).send({ error: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
export default FilesController;

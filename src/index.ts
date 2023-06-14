import express, { NextFunction, Request, Response } from 'express';
import { logger } from './utils/logger';
import { Message } from './utils/types';
import { db } from './db';
import { MessageService } from './service/message.service';
import { CONFIG } from './config';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post('/notify', async (req, res) => {
  const message = req.body as Message;
  if (message.post_type !== 'message') {
    res.send(null);
    return;
  }
  try {
    res.json(await MessageService.handle(message));
  } catch (e) {
    res.status(500).send(`Something broke! ${(e as Error).message}`);
  }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.message || JSON.stringify(err));
  res.status(500).send(`Something broke! ${err.message}`);
});

app.listen(CONFIG.port, async () => {
  await db.authenticate();
  logger.info(`Server is running on port ${CONFIG.port}`);
});

import express, { NextFunction, Request, Response } from 'express';

import { CONFIG } from './config';
import { db } from './db';
import { messageService } from './service/message.service';
import { logger } from './utils/logger';
import { Message } from './utils/types';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post('/notify', async (req, res) => {
  try {
    const message = req.body as Message;
    const text = await messageService.handle(message);
    if (text) {
      console.log(text);
      // await axios.post(`http://localhost:5700/send_group_msg`, msg);
    }
    res.json({ message: text });
  } catch (e) {
    res.status(500).send(`Something broke! ${(e as Error).message}`);
  }
});

//eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.message || JSON.stringify(err));
  res.status(500).send(`Something broke! ${err.message}`);
});

app.listen(CONFIG.port, async () => {
  await db.authenticate();
  logger.info(`Server is running on port ${CONFIG.port}`);
});

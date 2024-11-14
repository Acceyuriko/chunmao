import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import express, { NextFunction, Request, Response } from 'express';

import { CONFIG } from './config';
import { db } from './db';
import { cqService } from './service/cq.service';
import { messageService } from './service/message.service';
import { taskService } from './service/task.service';
import { logger } from './utils/logger';
import { Message } from './utils/types';

dayjs.extend(isoWeek);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post('/notify', async (req, res) => {
  try {
    const message = req.body as Message;
    const text = await messageService.handle(message);
    if (text) {
      await cqService.sendGroupMessage(
        message.group_id,
        text.replaceAll(/CQ:image,file=/gi, `CQ:image,file=${CONFIG.imageUrl}`),
      );
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
  taskService.run();
  logger.info(`Server is running on port ${CONFIG.port}`);
});

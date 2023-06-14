import express from 'express';
import { logger } from './utils/logger';

const app = express();

app.use(express.json());

app.listen(6624, () => {
  logger.info('Server is running on port 6624');
});

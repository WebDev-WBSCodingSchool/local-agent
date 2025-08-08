import express from 'express';
import { errorHandler, notFoundHandler } from '#middlewares';
import { agentsRouter } from '#routes';

const app = express();
const port = process.env.PORT || '3000';

app.use(express.json());
app.use('/agents', agentsRouter);
app.use('*splat', notFoundHandler);
app.use(errorHandler);

const server = app.listen(port, () =>
  console.log(`\x1b[35mExample app listening at http://localhost:${port}\x1b[0m`)
);

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));

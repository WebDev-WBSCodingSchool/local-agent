import { Router } from 'express';
import { validateBodyZod } from '#middlewares';
import { weatherPromptSchema } from '#schemas';
import { getCurrentWeather } from '#controllers';

const agentsRouter = Router();

agentsRouter.post('/weather', validateBodyZod(weatherPromptSchema), getCurrentWeather);

export default agentsRouter;

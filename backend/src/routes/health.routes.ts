import { Router } from 'express';
import { getHealth, getDatabaseHealth } from '../controllers/health.controller';

const router = Router();

router.get('/', getHealth);
router.get('/db', getDatabaseHealth);

export const healthRoutes = router;

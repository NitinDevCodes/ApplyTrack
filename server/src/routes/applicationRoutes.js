import { Router } from 'express';
import * as controller from '../controllers/applicationController.js';
import { validate, createApplicationSchema, updateApplicationSchema, querySchema } from '../utils/validation.js';
import HttpError from '../utils/HttpError.js';

const router = Router();
router.param('id', (req, res, next, id) => next(/^[a-f\d]{24}$/i.test(id) ? undefined : new HttpError(400, 'Invalid record ID.')));
router.route('/').get(validate(querySchema, 'query'), controller.listApplications).post(validate(createApplicationSchema), controller.createApplication);
router.route('/:id').get(controller.getApplication).patch(validate(updateApplicationSchema), controller.updateApplication).delete(controller.deleteApplication);
export default router;

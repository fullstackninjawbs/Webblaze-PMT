import { Router } from 'express';
import {
  createTodo,
  getTodos,
  updateTodo,
  deleteTodo,
} from './todo.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createTodoSchema, updateTodoSchema } from './todo.validation';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createTodoSchema), createTodo);
router.get('/', getTodos);
router.put('/:id', validate(updateTodoSchema), updateTodo);
router.delete('/:id', deleteTodo);

export default router;

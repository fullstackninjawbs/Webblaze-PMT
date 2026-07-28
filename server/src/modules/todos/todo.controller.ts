import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as todoService from './todo.service';

export const createTodo = asyncHandler(async (req: Request, res: Response) => {
  // If user not specified in body, assign it to the requester
  const userId = req.body.user || (req as any).user._id || (req as any).user.id;
  const todoData = { ...req.body, user: userId };
  
  const todo = await todoService.createTodo(todoData);
  
  res.status(201).json({
    success: true,
    data: todo,
    message: 'Todo created successfully',
  });
});

export const getTodos = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const todos = await todoService.getTodos(user.role, user._id || user.id);
  
  res.status(200).json({
    success: true,
    data: todos,
  });
});

export const updateTodo = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const todo = await todoService.updateTodo(req.params.id, req.body, user.role, user._id || user.id);
  
  res.status(200).json({
    success: true,
    data: todo,
    message: 'Todo updated successfully',
  });
});

export const deleteTodo = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  await todoService.deleteTodo(req.params.id, user.role, user._id || user.id);
  
  res.status(200).json({
    success: true,
    data: null,
    message: 'Todo deleted successfully',
  });
});

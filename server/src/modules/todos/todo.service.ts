import { TeamTodo, ITeamTodo } from './todo.model';
import { ApiError } from '../../utils/ApiError';
import { Role } from '../../types';

export const createTodo = async (data: Partial<ITeamTodo>): Promise<ITeamTodo> => {
  const todo = await TeamTodo.create(data);
  return todo.populate('relatedProject', 'name');
};

export const getTodos = async (userRole: Role, userId: string): Promise<ITeamTodo[]> => {
  let query = {};
  
  // If not Admin/PM, only show their own to-dos
  if (userRole !== Role.ADMIN && userRole !== Role.PM) {
    query = { user: userId };
  }

  return TeamTodo.find(query)
    .populate('relatedProject', 'name client')
    .populate('user', 'name email avatarUrl role')
    .sort({ dueDate: 1, createdAt: -1 });
};

export const updateTodo = async (id: string, updateData: Partial<ITeamTodo>, userRole: Role, userId: string): Promise<ITeamTodo> => {
  const todo = await TeamTodo.findById(id);
  if (!todo) {
    throw new ApiError(404, 'Todo not found');
  }

  // Only the assigned user or an Admin/PM can update a todo
  if (userRole !== Role.ADMIN && userRole !== Role.PM && todo.user.toString() !== String(userId)) {
    throw new ApiError(403, 'You do not have permission to update this todo');
  }

  const updatedTodo = await TeamTodo.findByIdAndUpdate(id, updateData, { new: true })
    .populate('relatedProject', 'name')
    .populate('user', 'name email avatarUrl');

  return updatedTodo!;
};

export const deleteTodo = async (id: string, userRole: Role, userId: string): Promise<void> => {
  const todo = await TeamTodo.findById(id);
  if (!todo) {
    throw new ApiError(404, 'Todo not found');
  }

  if (userRole !== Role.ADMIN && userRole !== Role.PM && todo.user.toString() !== String(userId)) {
    throw new ApiError(403, 'You do not have permission to delete this todo');
  }

  await TeamTodo.findByIdAndDelete(id);
};

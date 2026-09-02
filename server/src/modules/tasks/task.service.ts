import { Task, ITask } from './task.model';
import { Milestone } from '../milestones/milestone.model';
import { User } from '../users/user.model';
import { evaluateAndUpdateMilestoneStatus } from '../milestones/milestone.service';
import { Project } from '../projects/project.model';
import { sendTaskAssignmentEmail, sendTaskStatusChangeEmail } from '../../utils/emailService';
import { ApiError } from '../../utils/ApiError';
import { paginate, PaginationParams, PaginatedResult } from '../../utils/paginate';
import { Role } from '../../types';
import { normalizeDept } from '../../utils/department';

const enforceHourCap = async (milestoneId: string, estimatedHours: number, currentTaskId?: string) => {
  const milestone = await Milestone.findById(milestoneId);
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }

  const query: any = { milestone: milestoneId };
  if (currentTaskId) {
    query._id = { $ne: currentTaskId };
  }

  const siblingTasks = await Task.find(query);
  const sumOfSiblingHours = siblingTasks.reduce((sum, task) => sum + task.estimatedHours, 0);

  if (sumOfSiblingHours + estimatedHours > milestone.estimatedHours) {
    throw new ApiError(
      400,
      `Task exceeds milestone estimated hours. Milestone budget: ${milestone.estimatedHours}, Used: ${sumOfSiblingHours}, Task: ${estimatedHours}`
    );
  }
};

export const createTask = async (data: Partial<ITask>): Promise<ITask> => {
  if (data.milestone) {
    const milestone = await Milestone.findById(data.milestone).populate('project');
    if (milestone) {
      const project = milestone.project as any;
      if (project && project.status === 'completed') {
        throw new ApiError(400, 'Cannot add tasks to a completed project');
      }
    }
  }

  await enforceHourCap(data.milestone as unknown as string, data.estimatedHours!);
  
  const task = await Task.create(data);
  if (data.milestone) {
    await evaluateAndUpdateMilestoneStatus(data.milestone as unknown as string);
  }

  // Send assignment email notification if assignedTo is provided
  if (task.assignedTo) {
    const assignedUser = await User.findById(task.assignedTo);
    if (assignedUser && assignedUser.email) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      sendTaskAssignmentEmail({
        to: assignedUser.email,
        assigneeName: assignedUser.name,
        taskTitle: task.title,
        taskDescription: task.description,
        estimatedHours: task.estimatedHours,
        department: task.department,
        taskUrl: `${clientUrl}/tasks/${task._id}`,
      }).catch((err) => console.error('Task assignment email error:', err));
    }
  }

  return task;
};


export const getTasksByMilestone = async (milestoneId: string, user?: any, params: PaginationParams = {}): Promise<PaginatedResult<ITask>> => {
  let query: any = { milestone: milestoneId };

  if (user && (user.role === Role.TEAM_LEAD || user.role === Role.TEAM_MEMBER)) {
    if (user.department) {
      const deptVariants = normalizeDept(user.department);
      const regexes = deptVariants.map((d) => new RegExp(d, 'i'));
      query.$or = [
        { department: { $in: regexes } },
        { department: user.department }
      ];
    } else {
      query.assignedTo = user.id || user._id;
    }
  }

  if (params.status && params.status !== 'all') {
    query.status = params.status;
  }
  if (params.search) {
    query.title = { $regex: new RegExp(params.search, 'i') };
  }

  const populateOptions = [
    { path: 'assignedTo', select: 'name email avatarUrl role department' }
  ];

  return paginate(Task, query, params, populateOptions);
};

export const getTasksByUser = async (userId: string, params: PaginationParams = {}): Promise<PaginatedResult<ITask>> => {
  const query: any = { assignedTo: userId };
  if (params.status && params.status !== 'all') {
    query.status = params.status;
  }
  if (params.search) {
    query.title = { $regex: new RegExp(params.search, 'i') };
  }

  const populateOptions = [
    {
      path: 'milestone',
      populate: {
        path: 'project',
        select: 'name client type',
      },
    }
  ];
  return paginate(Task, query, params, populateOptions);
};

export const getAllTasks = async (user?: any, params: PaginationParams = {}): Promise<PaginatedResult<ITask>> => {
  let query: any = {};

  if (user && user.role === Role.TEAM_LEAD && user.department) {
    const deptVariants = normalizeDept(user.department);
    const regexes = deptVariants.map((d) => new RegExp(d, 'i'));
    
    const projects = await Project.find({ type: { $in: regexes } });
    const projectIds = projects.map(p => p._id);
    const milestones = await Milestone.find({ project: { $in: projectIds } });
    const milestoneIds = milestones.map(m => m._id);
    
    const users = await User.find({ department: { $in: regexes } });
    const userIds = users.map(u => u._id);
    
    query.$or = [
      { department: { $in: regexes } },
      { department: user.department },
      { assignedTo: { $in: userIds } },
      { milestone: { $in: milestoneIds } },
      { assignedTo: user.id || user._id }
    ];
  } else if (user && user.role === Role.TEAM_MEMBER) {
    if (user.department) {
      const deptVariants = normalizeDept(user.department);
      const regexes = deptVariants.map((d) => new RegExp(d, 'i'));
      query.$or = [
        { department: { $in: regexes } },
        { department: user.department }
      ];
    } else {
      query.assignedTo = user.id || user._id;
    }
  }

  if (params.status && params.status !== 'all') {
    query.status = params.status;
  }
  if (params.search) {
    query.title = { $regex: new RegExp(params.search, 'i') };
  }
  if (params.department && params.department !== 'all') {
    query.department = { $regex: new RegExp(params.department, 'i') };
  }
  if (params.userId && params.userId !== 'all') {
    query.assignedTo = params.userId;
  }

  const populateOptions = [
    { path: 'assignedTo', select: 'name email avatarUrl role department' },
    {
      path: 'milestone',
      populate: { path: 'project', select: 'name client type' }
    }
  ];

  return paginate(Task, query, params, populateOptions);
};

export const getTaskById = async (id: string, user?: any): Promise<ITask> => {
  const task = await Task.findById(id)
    .populate('assignedTo', 'name email avatarUrl role')
    .populate({
      path: 'attachments',
      populate: { path: 'uploadedBy', select: 'name' }
    });
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (user && (user.role === Role.TEAM_LEAD || user.role === Role.TEAM_MEMBER)) {
    if (user.department) {
      const deptVariants = normalizeDept(user.department);
      const regexes = deptVariants.map((d) => new RegExp(d, 'i'));
      
      const isDeptMatch = regexes.some(r => r.test(task.department || '')) || task.department === user.department;
      
      if (!isDeptMatch) {
        throw new ApiError(403, 'Forbidden: Task does not belong to your department');
      }
    } else {
      // User with no department can only access their own tasks
      const assignedId = task.assignedTo ? (typeof task.assignedTo === 'object' ? (task.assignedTo as any)._id?.toString() : String(task.assignedTo)) : null;
      const currentUserId = (user.id || user._id)?.toString();
      if (assignedId !== currentUserId) {
        throw new ApiError(403, 'Forbidden: You can only access your assigned tasks');
      }
    }
  }

  return task;
};

export const updateTask = async (
  id: string,
  updateData: Partial<ITask>,
  user?: { id?: string; _id?: string; role?: Role, department?: string }
): Promise<ITask> => {
  const task = await getTaskById(id, user);

  if (user && user.role === Role.TEAM_MEMBER) {
    const currentUserId = (user.id || user._id)?.toString();
    const assignedId = task.assignedTo ? (typeof task.assignedTo === 'object' ? (task.assignedTo as any)._id?.toString() : String(task.assignedTo)) : null;
    if (!assignedId || assignedId !== currentUserId) {
      throw new ApiError(403, 'Forbidden: You can only update tasks assigned to you');
    }
  }

  if (updateData.estimatedHours !== undefined && updateData.estimatedHours !== task.estimatedHours) {
    await enforceHourCap(task.milestone as unknown as string, updateData.estimatedHours, id);
  }

  const updatedTask = await Task.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('assignedTo', 'name email avatarUrl role')
    .populate({
      path: 'attachments',
      populate: { path: 'uploadedBy', select: 'name' }
    });

  if (!updatedTask) {
    throw new ApiError(404, 'Task not found after update');
  }

  // Auto-recalculate status based on spentHours vs estimatedHours
  // If estimatedHours was changed, we may need to update status
  if (updateData.estimatedHours !== undefined && updateData.status === undefined) {
    const spentHours = updatedTask.spentHours || 0;
    const newEstimated = updatedTask.estimatedHours;

    if (spentHours >= newEstimated && updatedTask.status !== 'completed') {
      // Hours used up — auto-complete
      await Task.findByIdAndUpdate(id, { status: 'completed' });
      updatedTask.status = 'completed';
    } else if (spentHours < newEstimated && updatedTask.status === 'completed') {
      // Estimated hours increased above spent — reopen to in_progress
      const newStatus = spentHours > 0 ? 'in_progress' : 'assigned';
      await Task.findByIdAndUpdate(id, { status: newStatus });
      updatedTask.status = newStatus as ITask['status'];
    }
  }

  const milestoneId = typeof updatedTask.milestone === 'object' ? (updatedTask.milestone as any)?._id : updatedTask.milestone;
  if (milestoneId) {
    await evaluateAndUpdateMilestoneStatus(milestoneId.toString());
  }

  // Email Notifications
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  // 1. Assignment change email
  if (updateData.assignedTo && updateData.assignedTo.toString() !== (task.assignedTo ? task.assignedTo.toString() : '')) {
    const assignedUser = await User.findById(updateData.assignedTo);
    if (assignedUser && assignedUser.email) {
      sendTaskAssignmentEmail({
        to: assignedUser.email,
        assigneeName: assignedUser.name,
        taskTitle: updatedTask.title,
        taskDescription: updatedTask.description,
        estimatedHours: updatedTask.estimatedHours,
        department: updatedTask.department,
        taskUrl: `${clientUrl}/tasks/${updatedTask._id}`,
      }).catch((err) => console.error('Task assignment email error:', err));
    }
  }

  // 2. Status change email
  if (updateData.status && updateData.status !== task.status) {
    const assigneeObj = updatedTask.assignedTo as any;
    if (assigneeObj && assigneeObj.email) {
      sendTaskStatusChangeEmail({
        to: assigneeObj.email,
        recipientName: assigneeObj.name,
        taskTitle: updatedTask.title,
        oldStatus: task.status,
        newStatus: updateData.status,
        taskUrl: `${clientUrl}/tasks/${updatedTask._id}`,
      }).catch((err) => console.error('Task status change email error:', err));
    }
  }

  return updatedTask;
};


export const deleteTask = async (id: string): Promise<void> => {
  const task = await Task.findByIdAndDelete(id);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  const milestoneId = typeof task.milestone === 'object' ? (task.milestone as any)?._id : task.milestone;
  if (milestoneId) {
    await evaluateAndUpdateMilestoneStatus(milestoneId.toString());
  }
};

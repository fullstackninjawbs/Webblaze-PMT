import { Task, ITask } from './task.model';
import { Milestone } from '../milestones/milestone.model';
import { User } from '../users/user.model';
import { evaluateAndUpdateMilestoneStatus } from '../milestones/milestone.service';
import { sendTaskAssignmentEmail, sendTaskStatusChangeEmail } from '../../utils/emailService';
import { ApiError } from '../../utils/ApiError';
import { Role } from '../../types';

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

const normalizeDept = (dept?: string): string[] => {
  if (!dept) return [];
  const lower = dept.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (lower.includes('full')) return ['fullstack', 'full_stack', 'full stack'];
  if (lower.includes('shop')) return ['shopify'];
  if (lower.includes('word')) return ['wordpress'];
  if (lower.includes('seo')) return ['seo'];
  if (lower.includes('design') || lower.includes('ui') || lower.includes('ux')) return ['design', 'ui_ux', 'ui/ux'];
  return [dept.toLowerCase()];
};

export const getTasksByMilestone = async (milestoneId: string, user?: any): Promise<ITask[]> => {
  let query: any = { milestone: milestoneId };

  if (user && user.role !== Role.ADMIN && user.role !== Role.PM) {
    if (user.role === Role.TEAM_MEMBER) {
      query.assignedTo = user.id || user._id;
    }
  }

  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email avatarUrl role department')
    .sort({ createdAt: -1 });

  if (user && user.role === Role.TEAM_LEAD && user.department) {
    const deptVariants = normalizeDept(user.department);
    return tasks.filter((t: any) => {
      if (t.department && deptVariants.some(v => t.department.toLowerCase().includes(v.replace('_', '')))) return true;
      if (t.assignedTo && typeof t.assignedTo === 'object' && t.assignedTo.department) {
        if (deptVariants.some(v => t.assignedTo.department.toLowerCase().includes(v.replace('_', '')))) return true;
      }
      const assignedId = t.assignedTo?._id?.toString() || t.assignedTo?.toString();
      if (assignedId === (user.id || user._id)?.toString()) return true;
      return false;
    });
  }

  return tasks;
};

export const getTasksByUser = async (userId: string): Promise<ITask[]> => {
  return Task.find({ assignedTo: userId })
    .populate({
      path: 'milestone',
      populate: {
        path: 'project',
        select: 'name client type',
      },
    })
    .sort({ createdAt: -1 });
};

export const getAllTasks = async (user?: any): Promise<ITask[]> => {
  let query: any = {};

  if (user && user.role !== Role.ADMIN && user.role !== Role.PM) {
    if (user.role === Role.TEAM_MEMBER) {
      // TEAM_MEMBER only sees tasks assigned to them
      query.assignedTo = user.id || user._id;
    } else if (user.role === Role.TEAM_LEAD) {
      // TEAM_LEAD only sees tasks matching their department or assigned to them
      const userDept = user.department;
      if (userDept) {
        const deptVariants = normalizeDept(userDept);
        const regexes = deptVariants.map((d) => new RegExp(d, 'i'));

        const deptUsers = await User.find({
          $or: [
            { department: { $in: regexes } },
            { department: userDept }
          ]
        }).select('_id');
        const deptUserIds = deptUsers.map((u) => u._id);

        query.$or = [
          { department: { $in: regexes } },
          { assignedTo: { $in: deptUserIds } },
          { assignedTo: user.id || user._id },
        ];
      } else {
        query.assignedTo = user.id || user._id;
      }
    }
  }

  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email avatarUrl role department')
    .populate({
      path: 'milestone',
      populate: {
        path: 'project',
        select: 'name client type',
      },
    })
    .sort({ createdAt: -1 });

  // Additional check for TEAM_LEAD to match project type as well
  if (user && user.role === Role.TEAM_LEAD && user.department) {
    const deptVariants = normalizeDept(user.department);
    return tasks.filter((t: any) => {
      // 1. Direct task department match
      if (t.department && deptVariants.some(v => t.department.toLowerCase().includes(v.replace('_', '')))) return true;
      // 2. Assigned user department match
      if (t.assignedTo && typeof t.assignedTo === 'object' && t.assignedTo.department) {
        if (deptVariants.some(v => t.assignedTo.department.toLowerCase().includes(v.replace('_', '')))) return true;
      }
      // 3. Project type match
      const projectType = t.milestone?.project?.type;
      if (projectType && deptVariants.some(v => projectType.toLowerCase().includes(v.replace('_', '')))) return true;
      // 4. Assigned directly to lead
      const assignedId = t.assignedTo?._id?.toString() || t.assignedTo?.toString();
      if (assignedId === (user.id || user._id)?.toString()) return true;

      return false;
    });
  }

  return tasks;
};

export const getTaskById = async (id: string): Promise<ITask> => {
  const task = await Task.findById(id)
    .populate('assignedTo', 'name email avatarUrl role')
    .populate({
      path: 'attachments',
      populate: { path: 'uploadedBy', select: 'name' }
    });
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  return task;
};

export const updateTask = async (
  id: string,
  updateData: Partial<ITask>,
  user?: { id?: string; _id?: string; role?: Role }
): Promise<ITask> => {
  const task = await getTaskById(id);

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

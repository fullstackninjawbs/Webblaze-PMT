import { Milestone, IMilestone } from './milestone.model';
import { Project } from '../projects/project.model';
import { Task } from '../tasks/task.model';
import { ApiError } from '../../utils/ApiError';

export const evaluateAndUpdateMilestoneStatus = async (milestoneId: string): Promise<IMilestone | null> => {
  const milestone = await Milestone.findById(milestoneId);
  if (!milestone) return null;

  const tasks = await Task.find({ milestone: milestoneId });
  const calculatedSpentHours = tasks.reduce((sum, t) => sum + (t.spentHours || 0), 0);

  let newStatus: IMilestone['status'] = milestone.status;

  const isHoursReached = calculatedSpentHours >= milestone.estimatedHours && milestone.estimatedHours > 0;
  const areAllTasksCompleted = tasks.length > 0 && tasks.every(t => t.status === 'completed');

  if (isHoursReached || areAllTasksCompleted) {
    newStatus = 'completed';
  } else if (calculatedSpentHours > 0 || tasks.some(t => t.status === 'in_progress' || t.status === 'in_review')) {
    if (milestone.status !== 'on_hold' && milestone.status !== 'cancelled') {
      newStatus = 'in_progress';
    }
  } else if (calculatedSpentHours === 0 && tasks.every(t => t.status === 'assigned')) {
    if (milestone.status !== 'on_hold' && milestone.status !== 'cancelled') {
      newStatus = 'not_started';
    }
  }

  if (milestone.spentHours !== calculatedSpentHours || milestone.status !== newStatus) {
    milestone.spentHours = calculatedSpentHours;
    milestone.status = newStatus;
    await milestone.save();
  }

  return milestone;
};

export const createMilestone = async (data: Partial<IMilestone>): Promise<IMilestone> => {
  const project = await Project.findById(data.project);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const milestone = await Milestone.create(data);
  return milestone;
};

export const getMilestonesByProject = async (projectId: string): Promise<IMilestone[]> => {
  const milestones = await Milestone.find({ project: projectId }).sort({ createdAt: -1 });

  // Evaluate & sync status for all milestones
  const updatedMilestones = await Promise.all(
    milestones.map(async (m) => {
      const updated = await evaluateAndUpdateMilestoneStatus(m._id as unknown as string);
      return updated || m;
    })
  );

  return updatedMilestones;
};

export const getMilestoneById = async (id: string): Promise<IMilestone> => {
  await evaluateAndUpdateMilestoneStatus(id);
  const milestone = await Milestone.findById(id).populate('project');
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }
  return milestone;
};

export const updateMilestone = async (id: string, updateData: Partial<IMilestone>): Promise<IMilestone> => {
  const milestone = await Milestone.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }
  await evaluateAndUpdateMilestoneStatus(id);
  const updated = await Milestone.findById(id);
  return updated || milestone;
};

export const deleteMilestone = async (id: string): Promise<void> => {
  const milestone = await Milestone.findByIdAndDelete(id);
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }
};

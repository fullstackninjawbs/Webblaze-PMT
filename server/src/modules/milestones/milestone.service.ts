import { Milestone, IMilestone } from './milestone.model';
import { Project } from '../projects/project.model';
import { ApiError } from '../../utils/ApiError';

export const createMilestone = async (data: Partial<IMilestone>): Promise<IMilestone> => {
  const project = await Project.findById(data.project);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const milestone = await Milestone.create(data);
  return milestone;
};

export const getMilestonesByProject = async (projectId: string): Promise<IMilestone[]> => {
  return Milestone.find({ project: projectId }).sort({ createdAt: -1 });
};

export const getMilestoneById = async (id: string): Promise<IMilestone> => {
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
  return milestone;
};

export const deleteMilestone = async (id: string): Promise<void> => {
  const milestone = await Milestone.findByIdAndDelete(id);
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }
};

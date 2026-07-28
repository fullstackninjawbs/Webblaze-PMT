import { Release, IRelease } from './release.model';
import { ApiError } from '../../utils/ApiError';
import { Role } from '../../types';

export const createRelease = async (data: Partial<IRelease>): Promise<IRelease> => {
  const release = await Release.create(data);
  return release.populate(['project', 'teamMember']);
};

export const getAllReleases = async (userRole: Role, userId: string, filters: any = {}): Promise<IRelease[]> => {
  let query = { ...filters };
  
  if (userRole === Role.TEAM_LEAD || userRole === Role.TEAM_MEMBER) {
    const mongoose = require('mongoose');
    const Project = mongoose.model('Project');
    const assignedProjects = await Project.find({ team: userId }).select('_id');
    const projectIds = assignedProjects.map((p: any) => p._id);
    query = { ...query, project: { $in: projectIds } };
  }

  return Release.find(query)
    .populate('project', 'name status')
    .populate('teamMember', 'name avatarUrl role department')
    .sort({ releaseDate: 1 }); // Sort upcoming first
};

export const getReleaseById = async (id: string): Promise<IRelease> => {
  const release = await Release.findById(id).populate(['project', 'teamMember']);
  if (!release) throw new ApiError(404, 'Release not found');
  return release;
};

export const updateRelease = async (id: string, updateData: Partial<IRelease>, userRole: Role, userId: string): Promise<IRelease> => {
  const release = await Release.findById(id);
  if (!release) throw new ApiError(404, 'Release not found');

  if (userRole !== Role.ADMIN && userRole !== Role.PM && release.createdBy.toString() !== userId && release.teamMember?.toString() !== userId) {
    throw new ApiError(403, 'Permission denied to update this release');
  }

  const updated = await Release.findByIdAndUpdate(id, updateData, { new: true })
    .populate(['project', 'teamMember']);
  
  return updated!;
};

export const deleteRelease = async (id: string, userRole: Role, userId: string): Promise<void> => {
  const release = await Release.findById(id);
  if (!release) throw new ApiError(404, 'Release not found');

  if (userRole !== Role.ADMIN && userRole !== Role.PM && release.createdBy.toString() !== userId) {
    throw new ApiError(403, 'Permission denied to delete this release');
  }

  await Release.findByIdAndDelete(id);
};

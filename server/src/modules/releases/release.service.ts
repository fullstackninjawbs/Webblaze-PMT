import { Release, IRelease } from './release.model';
import { ApiError } from '../../utils/ApiError';
import { Role } from '../../types';
import { getAccessibleProjectIds, isProjectScopedRole, canAccessProject, RequestUser } from '../../utils/access';

// Never populate the whole project: it carries budget and payment fields
const releasePopulate = [
  { path: 'project', select: 'name status' },
  { path: 'teamMember', select: 'name avatarUrl role department' },
];

export const createRelease = async (data: Partial<IRelease>): Promise<IRelease> => {
  const release = await Release.create(data);
  return release.populate(releasePopulate);
};

export const getAllReleases = async (userRole: Role, userId: string, filters: any = {}): Promise<IRelease[]> => {
  let query = { ...filters };
  
  if (isProjectScopedRole(userRole)) {
    const projectIds = await getAccessibleProjectIds({ _id: userId, role: userRole });
    query = { ...query, project: { $in: projectIds } };
  }

  return Release.find(query)
    .populate('project', 'name status')
    .populate('teamMember', 'name avatarUrl role department')
    .sort({ releaseDate: 1 }); // Sort upcoming first
};

export const getReleaseById = async (id: string, user?: RequestUser): Promise<IRelease> => {
  const release = await Release.findById(id).populate(releasePopulate);
  if (!release) throw new ApiError(404, 'Release not found');
  const projectId = (release.project as any)?._id || release.project;
  if (user && !(await canAccessProject(user, projectId))) {
    throw new ApiError(403, 'You do not have access to this release');
  }
  return release;
};

export const updateRelease = async (id: string, updateData: Partial<IRelease>, userRole: Role, userId: string): Promise<IRelease> => {
  const release = await Release.findById(id);
  if (!release) throw new ApiError(404, 'Release not found');

  if (userRole !== Role.ADMIN && userRole !== Role.PM && release.createdBy.toString() !== userId && release.teamMember?.toString() !== userId) {
    throw new ApiError(403, 'Permission denied to update this release');
  }

  const updated = await Release.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
    .populate(releasePopulate);
  
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

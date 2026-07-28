import { baseApi } from '../../app/api';
import { ProjectStatus } from '../../types';
import { Client } from '../clients/client.slice';
import { User } from '../auth/auth.slice';

export interface Project {
  _id: string;
  name: string;
  client: Client;
  totalBudget?: number;
  receivedAmount?: number;
  pendingAmount?: number;
  description?: string;
  type?: string;
  status: ProjectStatus;
  team: User[];
  createdAt: string;
  updatedAt: string;
}

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<{ success: boolean; data: Project[] }, void>({
      query: () => '/projects',
      providesTags: ['Project'],
    }),
    getProjectById: builder.query<{ success: boolean; data: Project }, string>({
      query: (id) => `/projects/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Project', id }],
    }),
    createProject: builder.mutation<{ success: boolean; data: Project }, Partial<Project> & { client: string; team?: string[] }>({
      query: (body) => ({
        url: '/projects',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Project'],
    }),
    updateProject: builder.mutation<{ success: boolean; data: Project }, { id: string; data: Partial<Project> }>({
      query: ({ id, data }) => ({
        url: `/projects/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Project', id }, 'Project'],
    }),
    deleteProject: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Project'],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectApi;

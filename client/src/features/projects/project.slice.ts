import { baseApi } from '../../app/api';
import { ProjectStatus, PaginatedResponse } from '../../types';
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
  progress?: number;
  estHours?: number;
  spentHours?: number;
}

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<PaginatedResponse<Project[]>, { page?: number; limit?: number; sort?: string; [key: string]: any } | void>({
      query: (params) => {
        let url = '/projects';
        if (params) {
          const queryParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, value.toString());
            }
          });
          const qs = queryParams.toString();
          if (qs) url += `?${qs}`;
        }
        return url;
      },
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
    updateProject: builder.mutation<{ success: boolean; data: Project }, { id: string; data: Partial<Omit<Project, 'team' | 'client'> & { team?: string[]; client?: string }> }>({
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

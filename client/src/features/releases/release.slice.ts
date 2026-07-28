import { baseApi } from '../../app/api';
import { Project } from '../projects/project.slice';
import { User } from '../auth/auth.slice';

export interface Release {
  _id: string;
  project: string | Project;
  department: 'design' | 'development' | 'seo';
  teamMember?: string | User;
  details: string;
  releaseDate: string;
  status: 'draft' | 'scheduled' | 'in_review' | 'released';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const releaseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReleases: builder.query<{ success: boolean; data: Release[] }, { projectId?: string } | void>({
      query: (params) => {
        let url = '/releases';
        if (params && params.projectId) {
          url += `?project=${params.projectId}`;
        }
        return url;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Release' as const, id: _id })),
              { type: 'Release', id: 'LIST' },
            ]
          : [{ type: 'Release', id: 'LIST' }],
    }),
    createRelease: builder.mutation<{ success: boolean; data: Release; message: string }, Partial<Release>>({
      query: (body) => ({
        url: '/releases',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Release', id: 'LIST' }],
    }),
    updateRelease: builder.mutation<{ success: boolean; data: Release; message: string }, Partial<Release> & { _id: string }>({
      query: (body) => ({
        url: `/releases/${body._id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result) => result ? [{ type: 'Release', id: result.data._id }] : [],
    }),
    deleteRelease: builder.mutation<{ success: boolean; data: null; message: string }, string>({
      query: (id) => ({
        url: `/releases/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Release'],
    }),
  }),
});

export const {
  useGetReleasesQuery,
  useCreateReleaseMutation,
  useUpdateReleaseMutation,
  useDeleteReleaseMutation,
} = releaseApi;

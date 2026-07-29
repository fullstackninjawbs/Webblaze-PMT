import { baseApi } from '../../app/api';

export interface Attachment {
  _id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string | { _id: string; name: string };
  createdAt: string;
}

export const uploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadFile: builder.mutation<{ success: boolean; data: Attachment; message: string }, FormData>({
      query: (formData) => ({
        url: '/uploads',
        method: 'POST',
        body: formData,
      }),
    }),
  }),
});

export const {
  useUploadFileMutation,
} = uploadApi;

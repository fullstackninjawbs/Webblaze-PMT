import { Model, FilterQuery, PopulateOptions } from 'mongoose';

export interface PaginationParams {
  page?: number | string;
  limit?: number | string;
  sort?: string;
  [key: string]: any;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function paginate<T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  params: PaginationParams,
  populateOptions?: PopulateOptions | (PopulateOptions | string)[]
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(1000, Math.max(1, Number(params.limit) || 20)); // Hard cap at 1000
  const skip = (page - 1) * limit;
  const sort = params.sort || '-createdAt';

  let query = model.find(filter).sort(sort).skip(skip).limit(limit);

  if (populateOptions) {
    if (Array.isArray(populateOptions)) {
      for (const pop of populateOptions) {
        query = query.populate(pop as any);
      }
    } else {
      query = query.populate(populateOptions as any);
    }
  }

  const [data, total] = await Promise.all([
    query.exec(),
    model.countDocuments(filter).exec()
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

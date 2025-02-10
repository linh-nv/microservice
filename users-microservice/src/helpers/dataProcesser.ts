import {
  PaginatedResult,
  PaginationOptions,
  SearchOptions,
  SortOptions,
} from 'src/Shared/interface';

export class DataProcessingHelper<T extends Record<string, any>> {
  private data: T[];

  constructor(data: T[]) {
    this.data = data;
  }

  // Xử lý tìm kiếm
  search(options: SearchOptions): this {
    const { search, searchFields } = options;

    if (search && searchFields?.length) {
      const searchTerms = search.toLowerCase().trim().split(/\s+/);

      this.data = this.data.filter((item) => {
        // Tạo chuỗi tìm kiếm từ các trường được chỉ định
        const searchString = searchFields
          .map((field) => {
            // Hỗ trợ nested fields (vd: profile.location)
            return field.split('.').reduce((obj, key) => obj?.[key], item);
          })
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        // Kiểm tra tất cả từ khóa tìm kiếm
        return searchTerms.every((term) => searchString.includes(term));
      });
    }

    return this;
  }

  // Xử lý sắp xếp
  sort(options: SortOptions): this {
    const { sortBy, orderBy = 'ASC' } = options;

    if (sortBy) {
      this.data.sort((a, b) => {
        let valueA = this.getNestedValue(a, sortBy);
        let valueB = this.getNestedValue(b, sortBy);

        // Xử lý các trường hợp đặc biệt
        if (valueA instanceof Date) valueA = valueA.getTime();
        if (valueB instanceof Date) valueB = valueB.getTime();

        // Chuyển đổi sang lowercase nếu là string
        if (typeof valueA === 'string') valueA = valueA.toLowerCase();
        if (typeof valueB === 'string') valueB = valueB.toLowerCase();

        const compareResult = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        return orderBy === 'DESC' ? -compareResult : compareResult;
      });
    }

    return this;
  }

  // Xử lý phân trang
  paginate(options: PaginationOptions): PaginatedResult<T> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const total = this.data.length;
    const paginatedData = this.data.slice(skip, skip + limit);

    return {
      data: paginatedData,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Hàm helper để lấy giá trị từ nested object
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

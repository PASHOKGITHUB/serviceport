// src/utils/apiFeatures.ts - Update to handle better filtering

export class APIFeatures {
  public query: any;
  public queryString: any;

  constructor(query: any, queryString: any) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Handle search
    if (queryObj.search && queryObj.search.trim()) {
      const searchRegex = new RegExp(queryObj.search.trim(), 'i');
      this.query = this.query.find({
        $or: [
          { serviceId: searchRegex },
          { customerName: searchRegex },
          { customerContactNumber: searchRegex },
          { location: searchRegex },
          { 'productDetails.productName': searchRegex },
          { 'productDetails.brand': searchRegex },
          { 'productDetails.serialNumber': searchRegex }
        ]
      });
      delete queryObj.search;
    }

    // Handle status filter
    if (queryObj.status && queryObj.status.trim()) {
      this.query = this.query.find({ action: queryObj.status });
      delete queryObj.status;
    }

    // Handle branch filter
    if (queryObj.branch && queryObj.branch.trim()) {
      // You'll need to add branchId field to your Service model
      // For now, we'll skip this filter
      delete queryObj.branch;
    }

    // Advanced filtering for other fields
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Default sort by creation date (newest first)
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100; // Default limit
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
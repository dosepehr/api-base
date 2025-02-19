class APIFeatures {
    constructor(query, reqQuery) {
        this.query = query;
        this.reqQuery = reqQuery;
    }

    // For Mongoose Queries
    filter() {
        const queryObj = { ...this.reqQuery };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach((el) => delete queryObj[el]);
        this.query = this.query.find(queryObj);
        return this;
    }

    sort() {
        if (this.reqQuery.sort) {
            const sortBy = this.reqQuery.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }

    limit() {
        if (this.reqQuery.fields) {
            const fields = this.reqQuery.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }
        return this;
    }

    paginate() {
        const page = +this.reqQuery.page || 1;
        const limit = +this.reqQuery.limit || 100;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }

    // For Cached Data (Array Manipulation)
    filterArray() {
        const queryObj = { ...this.reqQuery };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach((el) => delete queryObj[el]);

        this.query = this.query.filter((item) =>
            Object.entries(queryObj).every(([key, value]) =>
                String(item[key]).includes(value)
            )
        );
        return this;
    }

    sortArray() {
        if (this.reqQuery.sort) {
            const sortBy = this.reqQuery.sort.split(',');
            this.query.sort((a, b) => {
                for (let field of sortBy) {
                    const direction = field.startsWith('-') ? -1 : 1;
                    field = field.replace('-', '');
                    if (a[field] > b[field]) return direction;
                    if (a[field] < b[field]) return -direction;
                }
                return 0;
            });
        }
        return this;
    }

    limitArray() {
        if (this.reqQuery.fields) {
            const fields = this.reqQuery.fields.split(',');
            this.query = this.query.map((item) =>
                fields.reduce((obj, field) => {
                    obj[field] = item[field];
                    return obj;
                }, {})
            );
        }
        return this;
    }

    paginateArray() {
        const page = +this.reqQuery.page || 1;
        const limit = +this.reqQuery.limit || 100;
        const start = (page - 1) * limit;
        this.query = this.query.slice(start, start + limit);
        return this;
    }
}

module.exports = APIFeatures;

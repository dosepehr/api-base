class APIFeatures {
    constructor(query, reqQuery) {
        this.query = query;
        this.reqQuery = reqQuery;
    }

    filter() {
        const queryObj = { ...this.reqQuery };

        // filtering
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.map((el) => delete queryObj[el]);

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
}

module.exports = APIFeatures;
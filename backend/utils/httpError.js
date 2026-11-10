// Throw these from controllers/services; middleware/errorHandler.js turns them into JSON.
class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

const badRequest = (message, errors) => new HttpError(400, message, errors);
const unauthorized = (message = "Unauthorized") => new HttpError(401, message);
const forbidden = (message = "You do not have permission to do this") => new HttpError(403, message);
const notFound = (what = "Resource") => new HttpError(404, `${what} not found`);
const conflict = (message) => new HttpError(409, message);

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict };

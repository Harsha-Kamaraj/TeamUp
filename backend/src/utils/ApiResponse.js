/**
 * ApiResponse — a single, consistent success envelope.
 *
 * Every successful endpoint replies with the same shape:
 *   { success: true, message: string, data: any }
 * A predictable contract makes the frontend's job much simpler.
 *
 * Usage:
 *   return res.status(200).json(new ApiResponse(200, user, 'Profile loaded'));
 */
export default class ApiResponse {
  constructor(statusCode = 200, data = null, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

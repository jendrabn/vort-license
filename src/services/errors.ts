export class ServiceError extends Error {
  formData?: Record<string, unknown>;

  constructor(message: string, formData?: Record<string, unknown>) {
    super(message);
    this.name = 'ServiceError';
    this.formData = formData;
  }
}

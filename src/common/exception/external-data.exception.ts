export class ExternalDataException extends Error {
  constructor(message: string) {
    super(message);
    this.name = ExternalDataException.name;
  }
}

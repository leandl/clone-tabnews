type InternalServerErrorOptions = {
  cause: unknown;
};

export class InternalServerError extends Error {
  public readonly action = "Entre em contato com o suporte.";
  public readonly status_code = 500;

  constructor({ cause }: InternalServerErrorOptions) {
    super("Um erro interno não esperado aconteceu.", {
      cause,
    });

    this.name = "InternalServerError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.status_code,
    };
  }
}

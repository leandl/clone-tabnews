type InternalServerErrorOptions = {
  statusCode?: number;
  cause?: unknown;
};

export class InternalServerError extends Error {
  public readonly action = "Entre em contato com o suporte.";
  public statusCode: number;

  constructor({ cause, statusCode }: InternalServerErrorOptions) {
    super("Um erro interno não esperado aconteceu.", {
      cause,
    });

    this.statusCode = statusCode ?? 500;
    this.name = "InternalServerError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

type ServiceErrorOptions = {
  message?: string;
  cause?: unknown;
  action?: string;
  context?: unknown;
};

export class ServiceError extends Error {
  public readonly statusCode = 503;
  public action: string;
  public context?: unknown;

  constructor({ cause, message, action, context }: ServiceErrorOptions) {
    super(message ?? "Serviço indisponível no momento.", {
      cause,
    });

    this.name = "ServiceError";
    this.action = action ?? "Verifique se o serviço está disponível.";
    this.context = context;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
      context: this.context,
    };
  }
}

type ValidationErrorOptions = {
  message?: string;
  action?: string;
  cause?: unknown;
};

export class ValidationError extends Error {
  public readonly statusCode = 400;
  public action: string;

  constructor({ cause, message, action }: ValidationErrorOptions) {
    super(message ?? "Um erro de validação ocorreu.", {
      cause,
    });

    this.action = action ?? "Ajuste os dados enviados e tente novamente.";
    this.name = "ValidationError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

type UnauthorizedErrorOptions = {
  message?: string;
  action?: string;
  cause?: unknown;
};

export class UnauthorizedError extends Error {
  public readonly statusCode = 401;
  public action: string;

  constructor({ cause, message, action }: UnauthorizedErrorOptions) {
    super(message ?? "Usuário não autenticado.", {
      cause,
    });

    this.action = action ?? "Faça novamente o login para continuar.";
    this.name = "UnauthorizedError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

type ForbiddenErrorOptions = {
  message?: string;
  action?: string;
  cause?: unknown;
};

export class ForbiddenError extends Error {
  public readonly statusCode = 403;
  public action: string;

  constructor({ cause, message, action }: ForbiddenErrorOptions) {
    super(message ?? "Acesso negado..", {
      cause,
    });

    this.action =
      action ?? "Verifique as features necessárias antes de continuar.";
    this.name = "ForbiddenError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

type NotFoundErrorOptions = {
  message?: string;
  action?: string;
  cause?: unknown;
};

export class NotFoundError extends Error {
  public readonly statusCode = 404;
  public action: string;

  constructor({ cause, message, action }: NotFoundErrorOptions) {
    super(message ?? "Não foi possível encontrar este recurso no sistema.", {
      cause,
    });

    this.action =
      action ?? "Verifique se os parâmetros enviado na consulta estão certos.";
    this.name = "NotFoundError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class MethodNotAllowedError extends Error {
  public readonly action =
    "Verifique se o método HTTP enviado é válido para este endpoint.";
  public readonly statusCode = 405;

  constructor() {
    super("Método não permitido para este endpoint.");
    this.name = "MethodNotAllowedError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

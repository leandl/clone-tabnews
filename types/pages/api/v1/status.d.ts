class DatetimeUTCString extends String {}

export type APIStatusResponse = {
  updated_at: DatetimeUTCString;
  dependencies: {
    database: {
      version: string;
      max_connections: number;
      opened_connections: number;
    };
  };
};

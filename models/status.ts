class DatetimeUTCString extends String {}

export type APIStatus = {
  updated_at: DatetimeUTCString;
  dependencies: {
    database: {
      version: string;
      max_connections: number;
      opened_connections: number;
    };
  };
};

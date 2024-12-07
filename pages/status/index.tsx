import { APIStatusResponse } from "@/types/pages/api/v1/status";
import { ReactNode } from "react";
import useSWR from "swr";

async function fetchAPI(key: string) {
  const response = await fetch(key);
  const responseBody = await response.json();

  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <DatabaseStatus />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR<APIStatusResponse>(
    "/api/v1/status",
    fetchAPI,
    {
      refreshInterval: 2000,
    },
  );

  let updatedAtText: string = "Carregando...";
  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at.toString()).toLocaleString(
      "pt-Br",
    );
  }

  return (
    <div>
      Última atualização: <b>{updatedAtText}</b>
    </div>
  );
}

function DatabaseStatus() {
  const { isLoading, data } = useSWR<APIStatusResponse>(
    "/api/v1/status",
    fetchAPI,
    {
      refreshInterval: 2000,
    },
  );

  let databaseStatusInformation: ReactNode = "Carregando...";
  if (!isLoading && data) {
    databaseStatusInformation = (
      <ul>
        <li>
          Versão: <b>{data.dependencies.database.version}</b>
        </li>
        <li>
          Máximo de conexões:{" "}
          <b>{data.dependencies.database.max_connections}</b>
        </li>
        <li>
          Conexções abertas:{" "}
          <b>{data.dependencies.database.opened_connections}</b>
        </li>
      </ul>
    );
  }

  return (
    <div>
      <h2>Database</h2>
      <div>{databaseStatusInformation}</div>
    </div>
  );
}

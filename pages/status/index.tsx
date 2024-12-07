import { APIStatusResponse } from "@/types/pages/api/v1/status";
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
      {data?.dependencies.database && (
        <div>
          <h2>Database</h2>
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
        </div>
      )}
    </div>
  );
}

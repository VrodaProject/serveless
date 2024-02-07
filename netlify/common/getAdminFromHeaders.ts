import { config } from "../core/config";
import { api } from "./api";
import { getTokeData, HASURA_CLAIMS, HASURA_USER_ID } from "./jwt";
import { GetAdminByIdQuery } from "./sdk";

export const getAdminFromHeaders = async (
  headers
): Promise<GetAdminByIdQuery> => {
  const authHeader = headers["authorization"];

  if (!authHeader) {
    throw new Error(
      JSON.stringify({
        statusCode: 403,
        body: JSON.stringify({ massage: "Forbidden" }),
      })
    );
  }

  const [_, authToken] = authHeader.split(" ");

  const adminObj = getTokeData(authToken);
  const adminId = adminObj[HASURA_CLAIMS][HASURA_USER_ID];

  const data = await api.GetAdminById(
    { id: adminId },
    {
      "x-vroda-secret-key": config.hasuraAdminSecre,
    }
  );
  return data;
};

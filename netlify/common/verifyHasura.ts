import { config } from "../core/config";

export const verifyHasura = (headers) => {
  if (
    !headers["x-vroda-secret-key"] ||
    headers["x-vroda-secret-key"] !== config.hasuraVrodaSecret //Якщо що я змінив myvrodasicretkey на myvrodasicretkeys мб це буде якось заважати потім
  ) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        massage: "'x-vroda-secret-key' is missing or value is invalid",
      }),
    };
  }
};

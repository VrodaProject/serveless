import type { Handler } from "@netlify/functions";
import jwt from "jsonwebtoken";
import { AdminRegisterInput, getSdk } from "../common/sdk";
import { GraphQLClient } from "graphql-request";
import crypto from "crypto";
import { hashPassword } from "../common/password";
import { signToken } from "../common/jwt";
import { config } from "../core/config";
import { api } from "../common/api";

export const handler: Handler = async (event, context) => {
  const { body, headers } = event;

  if (
    !headers["x-vroda-secret-key"] ||
    headers["x-vroda-secret-key"] !== "myvrodasicretkey" //Якщо що я змінив myvrodasicretkey на myvrodasicretkeys мб це буде якось заважати потім
  ) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        massage: "'x-vroda-secret-key' is missing or value is invalid",
      }),
    };
  }

  const input: AdminRegisterInput = JSON.parse(body!).input.admin;

  const password = hashPassword(input.password);

  const data = await api.InsertAdmin(
    {
      username: input.username,
      password,
    },
    {
      "x-vroda-secret-key": config.hasuraAdminSecre,
    }
  );

  const accessToken = signToken(data.insert_admin_one?.id);

  return {
    statusCode: 200,
    body: JSON.stringify({ accessToken: accessToken }),
  };
};

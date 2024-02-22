import type { Handler } from "@netlify/functions";
import jwt from "jsonwebtoken";
import { AdminLoginInput, getSdk } from "../common/sdk";
import { signToken } from "../common/jwt";
import { api } from "../common/api";
import { config } from "../core/config";
import { hashPassword } from "../common/password";

const invalidUserOrPassword = {
  statusCode: 404,
  body: JSON.stringify({ massage: "User not found or password invalid" }),
};

export const handler: Handler = async (event, context) => {
  const { body } = event;

  const input: AdminLoginInput = JSON.parse(body!).input.admin;

  const data = await api.GetAdminByUsername(
    { username: input.username },
    {
      "x-vroda-secret-key": config.hasuraAdminSecre,
    }
  );

  if (data.admin.length === 0) {
    return invalidUserOrPassword;
  }

  const hashedPassword = hashPassword(input.password);

  if (hashedPassword !== data.admin[0].password) {
    return invalidUserOrPassword;
  }

  const accessToken = signToken(data.admin[0].id);

  return {
    body: JSON.stringify({ accessToken: accessToken }),
    statusCode: 200,
  };
};

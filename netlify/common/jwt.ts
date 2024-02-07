import jwt from "jsonwebtoken";
import { config } from "../core/config";

export const HASURA_CLAIMS = "https://hasura.io/jwt/claims";
export const HASURA_USER_ID = "x-hasura-user-id";

enum HasuraRoles {
  admin = "admin",
  user = "user",
}

type HasuraRolesType = keyof typeof HasuraRoles;

export const signToken = (id: string, role: HasuraRolesType = "admin") => {
  const allowedRoles = ["user"];

  if (role === "admin") {
    allowedRoles.push("admin");
  }

  return jwt.sign(
    {
      [HASURA_CLAIMS]: {
        "x-hasura-allowed-roles": allowedRoles,
        "x-hasura-default-role": role,
        "x-hasura-user-id": id,
      },
    },
    config.jwtSecret
  );
};

export const getTokeData = (token: string) => {
  return jwt.verify(token, config.jwtSecret);
};

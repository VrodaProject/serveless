import type { Handler } from "@netlify/functions";
import jwt from "jsonwebtoken";
import { AdminLoginInput, CustomerRegisterInput, getSdk } from "../common/sdk";
import { signToken } from "../common/jwt";
import { api } from "../common/api";
import { config } from "../core/config";
import { hashPassword } from "../common/password";
import { validatePhoneNumber } from "../common/phoneNumber";

const invalidUserOrPassword = {
  statusCode: 404,
  body: JSON.stringify({ massage: "User not found or password invalid" }),
};

export const handler: Handler = async (event, context) => {
  const { body } = event;

  const input: CustomerRegisterInput = JSON.parse(body!).input.customer;
  let phoneNumber;

  try {
    phoneNumber = validatePhoneNumber(input.phone);
  } catch (error) {
    return JSON.parse(error.massage);
  }

  const data = await api.GetCustomerByPhoneNumber(
    { phone: phoneNumber },
    {
      "x-vroda-secret-key": config.hasuraAdminSecre,
    }
  );

  if (data.customers.length === 0) {
    return invalidUserOrPassword;
  }

  const hashedPassword = hashPassword(input.password);

  if (hashedPassword !== data.customers[0].password) {
    return invalidUserOrPassword;
  }

  const accessToken = signToken(data.customers[0].id, "user");

  return {
    body: JSON.stringify({ accessToken: accessToken }),
    statusCode: 200,
  };
};

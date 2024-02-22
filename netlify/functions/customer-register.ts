import type { Handler } from "@netlify/functions";
import { CustomerRegisterInput, getSdk } from "../common/sdk";

import { hashPassword } from "../common/password";
import { signToken } from "../common/jwt";
import { config } from "../core/config";
import { api } from "../common/api";
import { validatePhoneNumber } from "../common/phoneNumber";

export const handler: Handler = async (event, context) => {
  const { body, headers } = event;

  const input: CustomerRegisterInput = JSON.parse(body!).input.customer;

  const password = hashPassword(input.password);

  let phoneNumber;

  try {
    phoneNumber = validatePhoneNumber(input.phone);
  } catch (error) {
    return JSON.parse(error.massage);
  }
  const data = await api.InsertCustomer(
    {
      name: input.name,
      address: input.address,
      phone: phoneNumber,
      password,
    },
    {
      "x-vroda-secret-key": config.hasuraAdminSecre,
    }
  );

  const customer = await api.GetCustomerByPhone(
    { phoneNumber },
    {
      "x-hasura-admin-secret": config.hasuraAdminSecre,
    }
  );

  const accessToken = signToken(customer.customers[0].id, "user");

  return {
    statusCode: 200,
    body: JSON.stringify({ accessToken: accessToken }),
  };
};

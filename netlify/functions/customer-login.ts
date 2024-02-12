import type { Handler } from "@netlify/functions";
import { validatePhoneNumber } from "../common/phoneNumber";
import { phoneRegexp } from "../common/regex";
import { verifyHasura } from "../common/verifyHasura";
import { CustomerLoginInput } from "../common/sdk";
import { config } from "../core/config";
import twilio from "twilio";
import { api } from "../common/api";

const twilioClient = twilio(config.twilioAccountSid, config.twilioAuthToken);

const handler: Handler = async (event, context) => {
  const { body, headers } = event;

  try {
    verifyHasura(headers);
  } catch (error) {
    return JSON.parse(error.massage);
  }

  const input: CustomerLoginInput = JSON.parse(body).input.input;
  let phoneNumber;

  try {
    phoneNumber = validatePhoneNumber(input.phoneNumber);
  } catch (error) {
    return JSON.parse(error.massage);
  }

  const verification = await twilioClient.verify.v2
    .services(config.twilioServiceSid)
    .verifications.create({ to: phoneNumber, channel: "sms" });

  await api.RegisterNewCustomer(
    {
      phone: phoneNumber,
      twilioVerificationSid: verification.sid,
    },
    {
      "x-hasura-admin-secret": config.hasuraAdminSecre,
    }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      ...input,
      isValid: phoneRegexp.test(input.phoneNumber),
      status: verification.status,
    }),
  };
};

export { handler };

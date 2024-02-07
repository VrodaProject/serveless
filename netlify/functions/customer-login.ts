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

  console.log(phoneNumber);

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

// Download the helper library from https://www.twilio.com/docs/node/install
// Set environment variables for your credentials
// Read more at http://twil.io/secure
// const accountSid = "AC0442b593ede736bc4f4e0cbb4bc23467";
// const authToken = "2f37cdd325fa6c8a04d3aafbce1dfdfa";
// const verifySid = process.env.YOUR_VERIFY_SID;
// const client = require("twilio")(accountSid, authToken);

// client.verify.v2
//   .services(verifySid)
//   .verifications.create({ to: "+380976597611", channel: "sms" })
//   .then((verification) => console.log(verification.status))
//   .then(() => {
//     const readline = require("readline").createInterface({
//       input: process.stdin,
//       output: process.stdout,
//     });
//     readline.question("Please enter the OTP:", (otpCode) => {
//       client.verify.v2
//         .services(verifySid)
//         .verificationChecks.create({ to: "+380976597611", code: otpCode })
//         .then((verification_check) => console.log(verification_check.status))
//         .then(() => readline.close());
//     });
//   });

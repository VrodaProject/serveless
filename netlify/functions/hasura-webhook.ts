import type { Handler } from "@netlify/functions";
import { verifyHasura } from "../common/verifyHasura";
import { HasuraEventBody, HasuraEvents } from "../dto/hasura-event-body.dto";
import { api } from "../common/api";
import { config } from "../core/config";
import { createNewCustomer } from "../hasura/create-new-customer";
import { sendNotificationToAdmin } from "../hasura/send-notification-to-admin";
import { setPaymentStatus } from "../hasura/set-payment-status";

const handler: Handler = async (event, context) => {
  const { headers, body: bodyRow } = event;

  try {
    verifyHasura(headers);
  } catch (error) {
    return JSON.parse(error.massage);
  }
  const body = JSON.parse(bodyRow) as HasuraEventBody;

  const {
    trigger: { name: triggerName },
  } = body;

  if (triggerName === HasuraEvents.ORDER_CREATED) {
    await Promise.all([createNewCustomer(body), sendNotificationToAdmin(body)]);
  } else if (triggerName === HasuraEvents.ORDER_UPDATED) {
    await setPaymentStatus(body);
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      status: "ok",
    }),
  };
};

export { handler };

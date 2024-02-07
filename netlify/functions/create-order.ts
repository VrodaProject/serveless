import type { Handler } from "@netlify/functions";
import { verifyHasura } from "../common/verifyHasura";
import { api } from "../common/api";
import {
  CreateOrderInput,
  Payment_Status_Enum,
  Payment_Types_Enum,
} from "../common/sdk";
import { config } from "../core/config";
import axios from "axios";
import { FondyCheckoutUrlResponse } from "../dto/fondy-checkout-url-response.dto";
import crypto from "crypto";

const handler: Handler = async (event, context) => {
  const { headers, body } = event;

  try {
    verifyHasura(headers);
  } catch (error) {
    return JSON.parse(error.massage);
  }

  const input: CreateOrderInput = JSON.parse(body!).input.order;

  let checkoutUrl = null;
  const paymentType = input.payment_type as Payment_Types_Enum;

  const order = await api.CreateOrder({
    client_address: input.client_address,
    client_name: input.client_name,
    client_phone: input.client_phone,
    comment: input.comment,
    payment_type: paymentType,
    payment_status: Payment_Status_Enum.Processing,
  });

  if (input.payment_type === Payment_Types_Enum.Online) {
    const items = input.items.split(",").reduce((acc, item) => {
      const [products_id, amount] = item.split("_");

      return {
        ...acc,
        [products_id]: amount,
      };
    }, {});
    const productsItemsDecriptions = await api.GetProductsItemsById({
      ids: Object.keys(items),
    });

    const orederDescription = productsItemsDecriptions.products
      .map((item) => `${item.title} x${items[item.id]}`)
      .join(",");

    const orderPrice = productsItemsDecriptions.products.reduce(
      (acc, item) => acc + item.price * items[item.id],
      0
    );

    const orderBody = {
      order_id: order.insert_orders_one.id,
      merchant_id: config.fondyMerchantId,
      order_desc: orederDescription,
      amount: orderPrice * 100,
      currency: "UAH",
      response_url: `${config.serverlessUrl}/redirect?url=${config.clientFrontendUrl}/checkout/thank-you`,
      server_callback_url: `${config.serverlessUrl}/fondy`,
    };

    const orderedKeys = Object.keys(orderBody).sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });

    const signatureRaw = orderedKeys.map((v) => orderBody[v]).join("|");
    const signature = crypto.createHash("sha1");
    signature.update(`${config.fondyMerchantPassword}|${signatureRaw}`);
    const signHex = signature.digest("hex");

    let data;
    try {
      const fondyResponse = await axios.post<FondyCheckoutUrlResponse>(
        "https://pay.fondy.eu/api/checkout/url/",
        {
          request: { ...orderBody, signature: signHex },
        }
      );
      if (fondyResponse.data.response.error_massage) {
        throw new Error(fondyResponse.data.response.error_massage);
      }

      data = fondyResponse.data;
    } catch (error) {
      console.log(error);

      await api.DeleteOrderById({ id: order.insert_orders_one.id });
      return {
        statusCode: 418,
        body: JSON.stringify({
          message:
            "Упс, щось трапилось з платіжним сервісом. Спробуйте будь-ласка пізніше або оберіть інший вид оплати",
        }),
      };
    }

    await api.UpdatePaymentId({
      id: order.insert_orders_one.id,
      payment_id: Number(data.response.payment_id),
    });

    checkoutUrl = data.response.checkout_url;
  }

  const productsItems = input.items.split(",").map((orderItem) => {
    const [products_id, amount] = orderItem.split("_");

    return {
      order_id: order.insert_orders_one.id,
      products_id,
      amount,
    };
  });

  await api.AddItemsToOrder({
    objects: productsItems,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      id: order.insert_orders_one.id,
      checkout_url: checkoutUrl,
    }),
  };
};

export { handler };

import type { Handler } from "@netlify/functions";
import { faker } from "@faker-js/faker";
import { api } from "../common/api";
import { config } from "../core/config";
import { verifyHasura } from "../common/verifyHasura";
import {
  CreateFakeOrderMutationVariables,
  Payment_Types_Enum,
} from "../common/sdk";

const handler: Handler = async (event, context) => {
  const { headers, queryStringParameters } = event;

  const {
    amount: amountRaw = 1,
    recent: recentRow = 0,
    phone: phoneRow = null,
  } = queryStringParameters;
  const amount = Number(amountRaw);
  const recent = Number(recentRow);
  const phone = phoneRow ? decodeURIComponent(phoneRow) : null;

  try {
    verifyHasura(headers);
  } catch (error) {
    return JSON.parse(error.massage);
  }

  const categories = await api.GetCategories();

  const menuItems = await api.GetProductsItemsGroupedByCategoryId({
    firstCategory: categories.products_categories[0].id,

    secondCategory: categories.products_categories[1].id,
  });

  const firstGroupLength = menuItems.firstGroup.length;
  const secondGroupLength = menuItems.secondGroup.length;

  for (let i = 0; i < amount; i++) {
    const fakeData: CreateFakeOrderMutationVariables = {
      client_phone: phone ?? faker.phone.number("+380#########"),
      client_name: faker.person.fullName(),
      client_address: faker.location.streetAddress(true),
      created_at: new Date(),
      comment: faker.datatype.boolean() ? faker.lorem.lines() : null,
      payment_type: faker.datatype.boolean()
        ? Payment_Types_Enum.Card
        : Payment_Types_Enum.Cash,
    };
    if (recent != 0) {
      fakeData.created_at = faker.date.recent(recent);
    }

    const newOrder = await api.CreateFakeOrder(fakeData);

    const firstGroupItem =
      menuItems.firstGroup[faker.datatype.number({ max: firstGroupLength - 1 })]
        .id;
    const secondGroupItem =
      menuItems.secondGroup[
        faker.datatype.number({ max: secondGroupLength - 1 })
      ].id;

    await api.AddItemsToOrder({
      objects: [
        {
          order_id: newOrder.insert_orders_one.id,
          products_id: firstGroupItem,
        },
        {
          order_id: newOrder.insert_orders_one.id,
          products_id: secondGroupItem,
        },
      ],
    });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ status: "OK" }),
  };
};

export { handler };

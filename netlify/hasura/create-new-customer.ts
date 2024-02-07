import { api } from "../common/api";
import { config } from "../core/config";
import { HasuraEventBody } from "../dto/hasura-event-body.dto";

export const createNewCustomer = async (body: HasuraEventBody) => {
  const {
    event: {
      data: { new: order },
    },
  } = body;

  try {
    await api.CreateNewCustomer(
      {
        phone: order.client_phone,
        name: order.client_name,
        address: order.client_address,
      },
      {
        "x-hasura-admin-secret": config.hasuraAdminSecre,
      }
    );
  } catch (error) {
    console.log("error on creating new customer", {
      phone: order.client_phone,
      name: order.client_name,
      address: order.client_address,
    });
  }
};

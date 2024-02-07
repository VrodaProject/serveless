import { v2 as cloudinary } from "cloudinary";
import { config } from "../core/config";
import { getAdminFromHeaders } from "../common/getAdminFromHeaders";
import { GetAdminByIdQuery } from "../common/sdk";
import { Handler } from "@netlify/functions";

cloudinary.config({
  cloud_name: config.cloudCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.apiApiSecret,
  secure: true,
});

const handler: Handler = async (event, context) => {
  const { headers } = event;
  let admin: GetAdminByIdQuery;
  try {
    admin = await getAdminFromHeaders(headers);
  } catch (e) {
    return JSON.parse(e.message);
  }

  if (!admin.admin_by_pk?.id) {
    return {
      statusCode: 403,
      body: JSON.stringify({ massge: "Forbidden" }),
    };
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const publicId = `products-${timestamp}`;

  const signature = cloudinary.utils.api_sign_request(
    {
      folder: "products",
      public_id: publicId,
      timestamp: timestamp,
      upload_preset: "lj6r0i31",
    },
    process.env.API_SECRET!
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      apiKey: process.env.API_KEY,
      cloudName: process.env.CLOUD_NAME,
      signature,
      timestamp,
      publicId,
    }),
  };
};

export { handler };

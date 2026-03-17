import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate, prisma } from "../shopify.server";

interface LineItemProperty {
  name: string;
  value: string;
}

interface LineItem {
  id: number;
  title: string;
  price: string;
  quantity: number;
  properties?: LineItemProperty[];
}

interface CartAttribute {
  name: string;
  value: string;
}

interface OrderWebhookPayload {
  id: number;
  name: string;
  currency: string;
  line_items: LineItem[];
  note_attributes: CartAttribute[];
}

interface ConversionPayload {
  reference: string;
  name: string;
  operation: "sale";
  value: string;
  currency: string;
  ffmHash: string;
}

// Set to true to actually send to FFM API, false to just log
const SEND_TO_API = true;

async function sendConversion(payload: ConversionPayload): Promise<{ success: boolean; response?: string; error?: string }> {
  console.log("========================================");
  console.log("[FFM] CONVERSION PAYLOAD:");
  console.log(JSON.stringify(payload, null, 2));
  console.log("========================================");

  if (!SEND_TO_API) {
    console.log("[FFM] API call skipped (SEND_TO_API = false)");
    return { success: true, response: "Logged only - API call skipped" };
  }

  try {
    const response = await fetch("https://api.ffm.to/conversion/sale", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (response.ok) {
      return { success: true, response: responseText };
    } else {
      return { success: false, error: `HTTP ${response.status}: ${responseText}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("========================================");
  console.log("[FFM] WEBHOOK RECEIVED!");
  console.log("========================================");
  
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log(`[FFM] Topic: ${topic}`);
  console.log(`[FFM] Shop: ${shop}`);
  console.log(`[FFM] Payload:`, JSON.stringify(payload, null, 2));

  const topicString = String(topic);

  if (topicString === "ORDERS_PAID" || topicString === "ORDERS_CREATE") {
    await handleOrderPaid(shop, payload as unknown as OrderWebhookPayload);
  } else if (topicString === "APP_UNINSTALLED") {
    console.log(`App uninstalled from ${shop}`);
  } else if (topicString === "CUSTOMERS_DATA_REQUEST") {
    console.log(`Customer data request for ${shop}`);
    // This app only stores conversion logs with order/line item IDs and FFM hashes.
    // No personal customer data is stored.
  } else if (topicString === "CUSTOMERS_REDACT") {
    console.log(`Customer redact request for ${shop}`);
    // No personal customer data stored — nothing to redact.
  } else if (topicString === "SHOP_REDACT") {
    console.log(`Shop redact request for ${shop}`);
    // Clean up all data for this shop
    await prisma.conversionLog.deleteMany({ where: { shop } });
    console.log(`Deleted all conversion logs for ${shop}`);
  } else {
    console.log(`Unhandled webhook topic: ${topicString}`);
  }

  return new Response(null, { status: 200 });
};

async function handleOrderPaid(shop: string, order: OrderWebhookPayload): Promise<void> {
  console.log(`Processing order ${order.id} for ${shop}`);
  console.log(`[FFM] Order note_attributes:`, JSON.stringify(order.note_attributes, null, 2));
  
  // Also check if there's a cart_attributes or attributes field
  const orderAny = order as unknown as Record<string, unknown>;
  if (orderAny.cart_attributes) {
    console.log(`[FFM] Order cart_attributes:`, JSON.stringify(orderAny.cart_attributes, null, 2));
  }
  if (orderAny.attributes) {
    console.log(`[FFM] Order attributes:`, JSON.stringify(orderAny.attributes, null, 2));
  }

  // Try to find FFM hash from multiple sources
  let ffmHash: string | null = null;
  
  // 1. Check note_attributes (cart attributes become note_attributes)
  const ffmAttribute = order.note_attributes?.find(
    (attr) => attr.name === "ffm" || attr.name === "ffm_hash" || attr.name === "_ffm"
  );
  if (ffmAttribute?.value) {
    ffmHash = ffmAttribute.value;
    console.log(`[FFM] Found hash in note_attributes: ${ffmHash}`);
  }
  
  // 2. Check order note (format: "ffm:HASH")
  if (!ffmHash && typeof orderAny.note === 'string' && orderAny.note) {
    const noteMatch = orderAny.note.match(/ffm:([^\s]+)/);
    if (noteMatch) {
      ffmHash = noteMatch[1];
      console.log(`[FFM] Found hash in order note: ${ffmHash}`);
    }
  }
  
  // 3. Check line item properties (Buy Now injects here)
  console.log(`[FFM] Checking line item properties...`);
  if (order.line_items?.length > 0) {
    for (const item of order.line_items) {
      console.log(`[FFM] Line item ${item.id} properties:`, JSON.stringify(item.properties, null, 2));
      if (item.properties && item.properties.length > 0) {
        const ffmProp = item.properties.find(
          (prop) => prop.name === "_ffm" || prop.name === "ffm"
        );
        if (ffmProp?.value) {
          ffmHash = ffmProp.value;
          console.log(`[FFM] Found hash in line item properties: ${ffmHash}`);
          break;
        }
      }
    }
  }

  if (!ffmHash) {
    console.log(`No FFM hash found for order ${order.id}, skipping conversion tracking`);
    console.log(`[FFM] note_attributes:`, order.note_attributes);
    console.log(`[FFM] note:`, orderAny.note);
    return;
  }
  console.log(`Found FFM hash: ${ffmHash} for order ${order.id}`);

  // Process each line item
  for (const lineItem of order.line_items) {
    const conversionPayload: ConversionPayload = {
      reference: String(lineItem.id),
      name: lineItem.title,
      operation: "sale",
      value: lineItem.price,
      currency: order.currency,
      ffmHash: ffmHash,
    };

    console.log(`Sending conversion for line item ${lineItem.id}:`, conversionPayload);

    const result = await sendConversion(conversionPayload);

    // Log the conversion attempt
    await prisma.conversionLog.create({
      data: {
        shop,
        orderId: String(order.id),
        lineItemId: String(lineItem.id),
        productName: lineItem.title,
        amount: lineItem.price,
        currency: order.currency,
        ffmHash: ffmHash,
        status: result.success ? "success" : "failed",
        response: result.success ? result.response : result.error,
      },
    });

    if (result.success) {
      console.log(`Successfully sent conversion for line item ${lineItem.id}`);
    } else {
      console.error(`Failed to send conversion for line item ${lineItem.id}:`, result.error);
    }
  }
}


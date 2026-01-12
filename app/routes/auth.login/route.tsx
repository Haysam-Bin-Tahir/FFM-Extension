import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  AppProvider,
  BlockStack,
  Button,
  Card,
  FormLayout,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { useState } from "react";

import { login } from "../../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const errors = {
    shop: url.searchParams.get("error"),
  };

  return json({ errors, polarisTranslations: {} });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const shop = formData.get("shop") as string;
  const errors = { shop: "" };

  if (!shop) {
    errors.shop = "Shop domain is required";
    return json({ errors });
  }

  try {
    return await login(request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    errors.shop = errorMessage;
    return json({ errors });
  }
};

export default function Auth() {
  const { errors } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");

  const shopError = actionData?.errors?.shop || errors?.shop;

  return (
    <AppProvider i18n={{}}>
      <Page>
        <Card>
          <Form method="post">
            <FormLayout>
              <BlockStack gap="500">
                <Text variant="headingMd" as="h2">
                  Log in to FFM Tracker
                </Text>
                <TextField
                  type="text"
                  name="shop"
                  label="Shop domain"
                  helpText="e.g. my-shop.myshopify.com"
                  value={shop}
                  onChange={setShop}
                  autoComplete="on"
                  error={shopError || undefined}
                />
                <Button submit variant="primary">
                  Log in
                </Button>
              </BlockStack>
            </FormLayout>
          </Form>
        </Card>
      </Page>
    </AppProvider>
  );
}


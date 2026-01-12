import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Page,
  Card,
  BlockStack,
  Text,
  Box,
  Divider,
  List,
} from "@shopify/polaris";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json({});
};

export default function Privacy() {
  const lastUpdated = "December 29, 2024";

  return (
    <Page
      title="Privacy Policy"
      backAction={{ content: "Dashboard", url: "/app" }}
    >
      <BlockStack gap="500">
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="p" variant="bodySm" tone="subdued">
                Last updated: {lastUpdated}
              </Text>
              
              <Text as="p" variant="bodyMd">
                This Privacy Policy describes how FFM Tracker ("we", "us", or "our") collects, 
                uses, and handles data when you use our Shopify application.
              </Text>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                1. Data We Collect
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                FFM Tracker collects minimal data necessary to provide affiliate tracking services:
              </Text>
              
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  From Store Visitors:
                </Text>
                <List type="bullet">
                  <List.Item>
                    <strong>FFM Hash</strong> - A tracking identifier from the URL parameter (?ffm=xxx). 
                    This is not personal data and cannot identify individuals.
                  </List.Item>
                </List>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  From Orders (via Shopify Webhooks):
                </Text>
                <List type="bullet">
                  <List.Item><strong>Order ID</strong> - Shopify's order reference number</List.Item>
                  <List.Item><strong>Line Item ID</strong> - Identifier for purchased items</List.Item>
                  <List.Item><strong>Product Name</strong> - Name of the purchased product</List.Item>
                  <List.Item><strong>Order Amount</strong> - Purchase value</List.Item>
                  <List.Item><strong>Currency</strong> - Transaction currency code</List.Item>
                </List>
              </BlockStack>

              <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                <Text as="p" variant="bodySm">
                  <strong>Important:</strong> We do NOT collect personal customer information such as 
                  names, email addresses, phone numbers, or shipping addresses.
                </Text>
              </Box>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                2. How We Use Data
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                We use the collected data solely for:
              </Text>
              
              <List type="bullet">
                <List.Item>
                  <strong>Affiliate Attribution</strong> - Linking purchases to affiliate partners 
                  who referred the customer
                </List.Item>
                <List.Item>
                  <strong>Conversion Tracking</strong> - Recording successful conversions for 
                  affiliate commission purposes
                </List.Item>
                <List.Item>
                  <strong>Analytics</strong> - Providing merchants with conversion statistics 
                  in the app dashboard
                </List.Item>
              </List>
              
              <Text as="p" variant="bodyMd">
                We do not use data for profiling, advertising, or any purpose other than 
                affiliate tracking.
              </Text>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                3. Data Sharing
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                Conversion data (FFM hash, order ID, product name, amount) is sent to the 
                FFM API (api.ffm.to) for affiliate attribution purposes. This is the core 
                functionality of the app.
              </Text>
              
              <Text as="p" variant="bodyMd">
                We do not sell, rent, or share data with any other third parties.
              </Text>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                4. Data Storage & Security
              </Text>
              <Divider />
              
              <List type="bullet">
                <List.Item>
                  <strong>Encryption in Transit</strong> - All data is transmitted via HTTPS
                </List.Item>
                <List.Item>
                  <strong>Secure Storage</strong> - Conversion logs are stored securely using 
                  industry-standard practices
                </List.Item>
                <List.Item>
                  <strong>Browser Storage</strong> - FFM hash is stored in the visitor's browser 
                  localStorage and is cleared after checkout
                </List.Item>
              </List>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                5. Data Retention
              </Text>
              <Divider />
              
              <List type="bullet">
                <List.Item>
                  <strong>Conversion Logs</strong> - Automatically deleted after 90 days
                </List.Item>
                <List.Item>
                  <strong>Browser Data</strong> - FFM hash is cleared immediately after checkout completion
                </List.Item>
              </List>
              
              <Text as="p" variant="bodyMd">
                We do not retain data longer than necessary to fulfill our service obligations.
              </Text>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                6. Customer Privacy Rights
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                We respect customer privacy choices:
              </Text>
              
              <List type="bullet">
                <List.Item>
                  <strong>Consent</strong> - We check Shopify's Customer Privacy API and only 
                  track visitors who have consented to analytics and marketing
                </List.Item>
                <List.Item>
                  <strong>Opt-Out</strong> - Customers can opt-out via the store's privacy 
                  consent banner
                </List.Item>
                <List.Item>
                  <strong>Do Not Sell</strong> - We honor "Do Not Sell My Personal Information" 
                  requests automatically
                </List.Item>
              </List>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                7. GDPR & CCPA Compliance
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                FFM Tracker is designed to comply with:
              </Text>
              
              <List type="bullet">
                <List.Item>
                  <strong>GDPR</strong> (General Data Protection Regulation) - We process minimal 
                  data, respect consent, and provide data retention controls
                </List.Item>
                <List.Item>
                  <strong>CCPA</strong> (California Consumer Privacy Act) - We honor opt-out 
                  requests and do not sell personal information
                </List.Item>
              </List>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                8. Changes to This Policy
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                We may update this Privacy Policy from time to time. We will notify merchants 
                of any material changes by updating the "Last updated" date at the top of this policy.
              </Text>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                9. Contact Us
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                If you have any questions about this Privacy Policy or our data practices, 
                please contact us through the Shopify App Store or at the support channels 
                provided in your app dashboard.
              </Text>
            </BlockStack>
          </Box>
        </Card>
      </BlockStack>
    </Page>
  );
}


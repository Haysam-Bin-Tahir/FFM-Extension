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

export default function Terms() {
  const lastUpdated = "December 29, 2024";

  return (
    <Page
      title="Terms of Service"
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
                These Terms of Service ("Terms") govern your use of the FFM Tracker application 
                ("App", "Service") provided through the Shopify App Store. By installing or using 
                the App, you agree to these Terms.
              </Text>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                1. Service Description
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                FFM Tracker is an affiliate conversion tracking application that:
              </Text>
              
              <List type="bullet">
                <List.Item>Captures affiliate tracking parameters from visitor URLs</List.Item>
                <List.Item>Associates purchases with affiliate partners</List.Item>
                <List.Item>Sends conversion data to the FFM API for attribution</List.Item>
                <List.Item>Provides conversion analytics in your Shopify admin</List.Item>
              </List>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                2. Account & Access
              </Text>
              <Divider />
              
              <List type="bullet">
                <List.Item>
                  You must have a valid Shopify store to use this App
                </List.Item>
                <List.Item>
                  You are responsible for maintaining the security of your Shopify account
                </List.Item>
                <List.Item>
                  You must have authority to bind your business to these Terms
                </List.Item>
              </List>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                3. Acceptable Use
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                You agree to use the App only for lawful purposes and in accordance with 
                these Terms. You agree NOT to:
              </Text>
              
              <List type="bullet">
                <List.Item>Use the App for any illegal or unauthorized purpose</List.Item>
                <List.Item>Attempt to reverse engineer, decompile, or hack the App</List.Item>
                <List.Item>Interfere with or disrupt the App's functionality</List.Item>
                <List.Item>Use the App in violation of Shopify's Terms of Service</List.Item>
                <List.Item>Transmit malicious code or content through the App</List.Item>
              </List>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                4. Data & Privacy
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                Your use of the App is also governed by our Privacy Policy. By using the App, 
                you acknowledge that:
              </Text>
              
              <List type="bullet">
                <List.Item>
                  You have read and understood our Privacy Policy
                </List.Item>
                <List.Item>
                  You consent to the collection and processing of data as described
                </List.Item>
                <List.Item>
                  You are responsible for complying with applicable privacy laws in your jurisdiction
                </List.Item>
                <List.Item>
                  You will inform your customers about affiliate tracking as required by law
                </List.Item>
              </List>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                5. Merchant Responsibilities
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                As a merchant using FFM Tracker, you are responsible for:
              </Text>
              
              <List type="bullet">
                <List.Item>
                  Enabling appropriate customer privacy consent mechanisms on your store
                </List.Item>
                <List.Item>
                  Ensuring your privacy policy discloses the use of affiliate tracking
                </List.Item>
                <List.Item>
                  Complying with GDPR, CCPA, and other applicable privacy regulations
                </List.Item>
                <List.Item>
                  Responding to customer data requests related to your store
                </List.Item>
              </List>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                6. Service Availability
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                We strive to provide reliable service, but:
              </Text>
              
              <List type="bullet">
                <List.Item>
                  The App is provided "as is" without warranty of uninterrupted availability
                </List.Item>
                <List.Item>
                  We may perform maintenance that temporarily affects service
                </List.Item>
                <List.Item>
                  We reserve the right to modify or discontinue features with notice
                </List.Item>
              </List>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                7. Limitation of Liability
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                To the maximum extent permitted by law:
              </Text>
              
              <List type="bullet">
                <List.Item>
                  We are not liable for any indirect, incidental, special, or consequential damages
                </List.Item>
                <List.Item>
                  Our total liability shall not exceed the amount you paid for the App 
                  in the 12 months preceding the claim
                </List.Item>
                <List.Item>
                  We are not responsible for lost revenue, missed conversions, or 
                  affiliate commission discrepancies
                </List.Item>
              </List>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                8. Indemnification
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                You agree to indemnify and hold harmless FFM Tracker, its affiliates, and 
                their respective officers, directors, employees, and agents from any claims, 
                damages, losses, or expenses arising from:
              </Text>
              
              <List type="bullet">
                <List.Item>Your use of the App</List.Item>
                <List.Item>Your violation of these Terms</List.Item>
                <List.Item>Your violation of any applicable laws or regulations</List.Item>
              </List>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                9. Termination
              </Text>
              <Divider />
              
              <List type="bullet">
                <List.Item>
                  You may uninstall the App at any time through your Shopify admin
                </List.Item>
                <List.Item>
                  We may suspend or terminate your access for violation of these Terms
                </List.Item>
                <List.Item>
                  Upon termination, your conversion logs will be deleted according to 
                  our data retention policy
                </List.Item>
              </List>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                10. Changes to Terms
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                We reserve the right to modify these Terms at any time. We will provide 
                notice of material changes by updating the "Last updated" date. Continued 
                use of the App after changes constitutes acceptance of the modified Terms.
              </Text>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                11. Governing Law
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                These Terms shall be governed by and construed in accordance with applicable 
                laws, without regard to conflict of law principles. Any disputes shall be 
                resolved through binding arbitration or in the courts of competent jurisdiction.
              </Text>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                12. Contact
              </Text>
              <Divider />
              
              <Text as="p" variant="bodyMd">
                For questions about these Terms, please contact us through the Shopify 
                App Store or the support channels provided in your app dashboard.
              </Text>
            </BlockStack>
          </Box>
        </Card>
      </BlockStack>
    </Page>
  );
}


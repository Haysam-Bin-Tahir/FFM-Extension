import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Box,
  InlineStack,
  Badge,
  Divider,
  Link,
  Icon,
  Collapsible,
  Button,
  Banner,
} from "@shopify/polaris";
import { InfoIcon } from "@shopify/polaris-icons";
import { useState, useEffect } from "react";

import { authenticate, prisma } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  
  const url = new URL(request.url);
  const appUrl = `https://${url.host}`;
  
  // Auto-register webhook using GraphQL
  let webhookStatus = "unknown";
  try {
    const existingWebhooks = await admin.graphql(`
      query {
        webhookSubscriptions(first: 10) {
          edges {
            node {
              id
              topic
              endpoint {
                ... on WebhookHttpEndpoint {
                  callbackUrl
                }
              }
            }
          }
        }
      }
    `);
    
    // Check if we got a redirect (auth not ready) instead of actual data
    if (existingWebhooks.status === 302 || existingWebhooks.status === 301) {
      console.log("[FFM] Auth redirect detected, webhook registration will retry on next load");
      webhookStatus = "initializing";
    } else {
      const webhooksData = await existingWebhooks.json();
      const webhooks = webhooksData.data?.webhookSubscriptions?.edges || [];
      const hasOrdersCreate = webhooks.some((w: { node: { topic: string } }) => 
        w.node.topic === "ORDERS_CREATE" || w.node.topic === "ORDERS_PAID"
      );
      
      if (!hasOrdersCreate) {
        const result = await admin.graphql(`
          mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
            webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
              webhookSubscription {
                id
              }
              userErrors {
                field
                message
              }
            }
          }
        `, {
          variables: {
            topic: "ORDERS_CREATE",
            webhookSubscription: {
              callbackUrl: `${appUrl}/webhooks`,
              format: "JSON"
            }
          }
        });
        
        // Check for redirect on mutation too
        if (result.status === 302 || result.status === 301) {
          console.log("[FFM] Auth redirect on webhook creation, will retry on next load");
          webhookStatus = "initializing";
        } else {
          const resultData = await result.json();
          console.log("[FFM] Webhook registration result:", JSON.stringify(resultData, null, 2));
          
          if (resultData.data?.webhookSubscriptionCreate?.webhookSubscription?.id) {
            webhookStatus = "registered";
          } else {
            webhookStatus = `error: ${JSON.stringify(resultData.data?.webhookSubscriptionCreate?.userErrors)}`;
          }
        }
      } else {
        webhookStatus = "already_registered";
      }
    }
  } catch (error) {
    // Check if it's a Response object (redirect)
    const errorObj = error as { status?: number };
    if (errorObj && typeof errorObj.status === 'number' && (errorObj.status === 302 || errorObj.status === 301)) {
      console.log("[FFM] Auth redirect caught, webhook registration will retry on next load");
      webhookStatus = "initializing";
    } else {
      console.error("[FFM] Webhook auto-registration error:", error);
      webhookStatus = `error: ${error instanceof Error ? error.message : "unknown"}`;
    }
  }
  
  // Data Retention: Auto-delete conversion logs older than 90 days
  const retentionDays = 90;
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - retentionDays);
  
  await prisma.conversionLog.deleteMany({
    where: {
      shop: session.shop,
      createdAt: { lt: retentionDate },
    },
  });

  const recentConversions = await prisma.conversionLog.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const totalConversions = await prisma.conversionLog.count({
    where: { shop: session.shop },
  });

  const successfulConversions = await prisma.conversionLog.count({
    where: { shop: session.shop, status: "success" },
  });

  return json({
    shop: session.shop,
    recentConversions,
    totalConversions,
    successfulConversions,
    webhookStatus,
    appUrl,
  });
};

interface ConversionLog {
  id: string;
  productName: string;
  orderId: string;
  lineItemId: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
}

function StatCard({ 
  label, 
  value, 
  tone 
}: { 
  label: string; 
  value: number; 
  tone?: "success" | "critical" | "default";
}) {
  const toneColors = {
    success: { bg: "rgba(0, 128, 96, 0.08)", text: "#008060" },
    critical: { bg: "rgba(215, 44, 13, 0.08)", text: "#D72C0D" },
    default: { bg: "rgba(32, 34, 35, 0.05)", text: "#202223" },
  };
  
  const colors = toneColors[tone || "default"];

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="300">
          <Text as="span" variant="bodySm" tone="subdued">
            {label}
          </Text>
          <Box
            background="bg-surface"
            borderRadius="200"
            paddingBlock="200"
            paddingInline="300"
          >
            <Text 
              as="p" 
              variant="heading2xl"
              fontWeight="bold"
            >
              <span style={{ color: colors.text }}>{value.toLocaleString()}</span>
            </Text>
          </Box>
        </BlockStack>
      </Box>
    </Card>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ConversionRow({ conversion }: { conversion: ConversionLog }) {
  const isSuccess = conversion.status === "success";
  
  return (
    <Box paddingBlock="300">
      <InlineStack align="space-between" blockAlign="center" wrap={false}>
        <Box minWidth="0">
          <BlockStack gap="100">
            <Text as="p" variant="bodyMd" fontWeight="semibold" truncate>
              {conversion.productName}
            </Text>
            <InlineStack gap="200" align="start">
              <Text as="span" variant="bodySm" tone="subdued">
                #{conversion.orderId}
              </Text>
              <Text as="span" variant="bodySm" tone="subdued">
                •
              </Text>
              <Text as="span" variant="bodySm" tone="subdued">
                {formatDate(conversion.createdAt)}
              </Text>
            </InlineStack>
          </BlockStack>
        </Box>
        
        <Box>
          <InlineStack gap="300" blockAlign="center" wrap={false}>
            <Text as="p" variant="bodyMd" fontWeight="semibold">
              {parseFloat(conversion.amount).toLocaleString("en-US", {
                style: "currency",
                currency: conversion.currency,
              })}
            </Text>
            <Badge tone={isSuccess ? "success" : "critical"}>
              {isSuccess ? "Sent" : "Failed"}
            </Badge>
          </InlineStack>
        </Box>
      </InlineStack>
    </Box>
  );
}

function SetupStatusBanner({ webhookStatus }: { webhookStatus: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Show success message briefly when webhook was just registered
    if (webhookStatus === "registered") {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [webhookStatus]);

  // Auto-refresh when initializing
  useEffect(() => {
    if (webhookStatus === "initializing") {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [webhookStatus]);

  if (dismissed) return null;

  // Initializing - auth session establishing
  if (webhookStatus === "initializing") {
    return (
      <Banner title="Initializing FFM Tracker" tone="info">
        <BlockStack gap="200">
          <Text as="p" variant="bodySm">
            Setting up your conversion tracking... This page will refresh automatically.
          </Text>
        </BlockStack>
      </Banner>
    );
  }

  // Webhook was just registered - show success
  if (webhookStatus === "registered" && showSuccess) {
    return (
      <Banner
        title="Setup Complete"
        tone="success"
        onDismiss={() => setDismissed(true)}
      >
        <BlockStack gap="200">
          <Text as="p" variant="bodySm">
            FFM Tracker is now configured and ready to track conversions. 
            The webhook has been registered successfully.
          </Text>
        </BlockStack>
      </Banner>
    );
  }

  // Error registering webhook
  if (webhookStatus.startsWith("error:")) {
    return (
      <Banner
        title="Setup Issue"
        tone="warning"
        onDismiss={() => setDismissed(true)}
      >
        <BlockStack gap="200">
          <Text as="p" variant="bodySm">
            There was an issue setting up the webhook: {webhookStatus.replace("error: ", "")}
          </Text>
          <Text as="p" variant="bodySm">
            Conversion tracking may not work until this is resolved. Try refreshing the page.
          </Text>
        </BlockStack>
      </Banner>
    );
  }

  // Already registered - everything is good, no banner needed
  return null;
}

export default function Index() {
  const { recentConversions, totalConversions, successfulConversions, webhookStatus } = useLoaderData<typeof loader>();
  const failedConversions = totalConversions - successfulConversions;
  const successRate = totalConversions > 0 
    ? Math.round((successfulConversions / totalConversions) * 100) 
    : 0;

  return (
    <Page title="FFM Tracker Dashboard">
      <BlockStack gap="600">
        {/* Setup Status Banner */}
        <SetupStatusBanner webhookStatus={webhookStatus} />

        {/* Stats Grid */}
        <Layout>
          <Layout.Section variant="oneThird">
            <StatCard label="Total Conversions" value={totalConversions} />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard label="Successful" value={successfulConversions} tone="success" />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard label="Failed" value={failedConversions} tone="critical" />
          </Layout.Section>
        </Layout>

        {/* Success Rate Banner */}
        {totalConversions > 0 && (
          <Card>
            <Box padding="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Delivery Success Rate
                  </Text>
                  <Text as="p" variant="bodyLg" fontWeight="semibold">
                    {successRate}% of conversions delivered successfully
                  </Text>
                </BlockStack>
                <Box 
                  background={successRate >= 90 ? "bg-fill-success-secondary" : successRate >= 70 ? "bg-fill-warning" : "bg-fill-critical-secondary"}
                  borderRadius="full"
                  padding="200"
                  minWidth="64px"
                >
                  <Text as="p" variant="headingMd" alignment="center">
                    {successRate}%
                  </Text>
                </Box>
              </InlineStack>
            </Box>
          </Card>
        )}

        {/* Recent Conversions */}
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Recent Conversions
                </Text>
                {recentConversions.length > 0 && (
                  <Badge tone="info">{`${recentConversions.length} latest`}</Badge>
                )}
              </InlineStack>
              
              <Divider />
              
              {recentConversions.length === 0 ? (
                <Box paddingBlock="800">
                  <BlockStack gap="200" inlineAlign="center">
                    <Box
                      background="bg-fill-secondary"
                      borderRadius="full"
                      padding="400"
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8C9196" strokeWidth="1.5">
                        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                        <rect x="9" y="3" width="6" height="4" rx="1" />
                        <path d="M9 12h6" />
                        <path d="M9 16h6" />
                      </svg>
                    </Box>
                    <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                      No conversions recorded yet
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                      Conversions will appear here when orders with FFM tracking are completed
                    </Text>
                  </BlockStack>
                </Box>
              ) : (
                <BlockStack gap="0">
                  {recentConversions.map((conversion: ConversionLog, index: number) => (
                    <Box key={conversion.id}>
                      <ConversionRow conversion={conversion} />
                      {index < recentConversions.length - 1 && <Divider />}
                    </Box>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Box>
        </Card>

        {/* Data & Privacy Disclosure */}
        <DataPrivacySection />
      </BlockStack>
    </Page>
  );
}

function DataPrivacySection() {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="300">
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="200" blockAlign="center">
              <Icon source={InfoIcon} tone="subdued" />
              <Text as="h2" variant="headingMd">
                Data & Privacy
              </Text>
            </InlineStack>
            <Button
              variant="plain"
              onClick={() => setOpen(!open)}
              ariaExpanded={open}
              ariaControls="data-privacy-collapsible"
            >
              {open ? "Hide details" : "View details"}
            </Button>
          </InlineStack>
          
          <Collapsible
            open={open}
            id="data-privacy-collapsible"
            transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
          >
            <BlockStack gap="400">
              <Divider />
              
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Data We Process
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  FFM Tracker processes the following data for affiliate attribution:
                </Text>
                <Box paddingInlineStart="400">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm">• <strong>FFM Hash</strong> - Affiliate tracking identifier from URL parameter</Text>
                    <Text as="p" variant="bodySm">• <strong>Order ID</strong> - Shopify order reference number</Text>
                    <Text as="p" variant="bodySm">• <strong>Product Name</strong> - Name of purchased products</Text>
                    <Text as="p" variant="bodySm">• <strong>Order Amount</strong> - Purchase value and currency</Text>
                  </BlockStack>
                </Box>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Purpose
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  This data is used solely for affiliate conversion tracking and attribution. 
                  When a customer arrives via an affiliate link (with ?ffm= parameter), we track 
                  their purchase to attribute the sale to the correct affiliate partner.
                </Text>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Data Handling & Security
                </Text>
                <Box paddingInlineStart="400">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm">• Data is sent securely via HTTPS (encrypted in transit)</Text>
                    <Text as="p" variant="bodySm">• FFM hash is cleared from customer browser after checkout</Text>
                    <Text as="p" variant="bodySm">• We respect customer privacy consent preferences</Text>
                    <Text as="p" variant="bodySm">• No personal customer data (email, name, address) is collected</Text>
                  </BlockStack>
                </Box>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Data Retention
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Conversion logs are automatically deleted after 90 days to ensure data isn't 
                  kept longer than necessary. FFM tracking data in the customer's browser is 
                  cleared immediately after checkout completion.
                </Text>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Customer Rights
                </Text>
                <Box paddingInlineStart="400">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm">• Customers can opt-out via your store's privacy consent banner</Text>
                    <Text as="p" variant="bodySm">• We honor "Do Not Sell My Data" requests automatically</Text>
                    <Text as="p" variant="bodySm">• No automated decision-making with legal effects is performed</Text>
                  </BlockStack>
                </Box>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Legal
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  By using this app, you agree to our{" "}
                  <Link url="/app/privacy" removeUnderline>
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link url="/app/terms" removeUnderline>
                    Terms of Service
                  </Link>.
                </Text>
              </BlockStack>
            </BlockStack>
          </Collapsible>
        </BlockStack>
      </Box>
    </Card>
  );
}

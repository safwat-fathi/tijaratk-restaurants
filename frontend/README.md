# Tijaratk Restaurant Frontend

This is the customer-facing and merchant dashboard frontend for the Tijaratk Restaurant platform, built with **Next.js**.

## Product Goal

The platform delivers a fast, "order-now" restaurant experience. It prioritizes speed, clarity, and trust in pricing and availability, focused on active order fulfillment rather than long-term customer history.

## Architecture & Integration

-   **POS-Driven Menu:** The menu is always read from our local PostgreSQL mirror of POS data, ensuring high performance even during high traffic.
-   **Pricing Integrity:** All totals and availability are validated server-side at checkout against mirrored POS data.
-   **Branch-Centric UX:** The experience is strictly scoped to the selected branch, including operating hours and delivery service fees.
-   **Real-time Tracking:** Order status updates are synced from the POS `change_log` to provide live tracking for active orders.

## Customer Experience Flow

1.  **Storefront Entry:** Restaurant identity and "Start Order" CTA.
2.  **Branch Selection:** Choose the fulfilling location.
3.  **Menu Browsing:** Browse categories and items (synced from POS view `PS_ApplicationOrders_V`).
4.  **Cart & Customization:** Configure item quantities and review order breakdown.
5.  **Checkout:** Choose fulfillment (Delivery/Pickup) and provide contact details. Delivery fees are derived from POS view `PS_ApplicationDeliveryServices_V`.
6.  **Tracking:** Monitor the live order status as it moves through the POS lifecycle.

## Tech Stack

-   **Framework:** Next.js (App Router)
-   **Styling:** Tailwind CSS
-   **Icons:** Lucide React
-   **Validation:** Zod / React Hook Form

## Getting Started

First, install dependencies:

```bash
$ pnpm install
```

Then, run the development server:

```bash
$ pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuration

Ensure the `NEXT_PUBLIC_API_BASE_URL` in your `.env` points to the running backend instance.

## Deployment

The application is optimized for deployment on the **Vercel Platform**.

import CheckoutClient from "./checkout-client";

export function generateStaticParams() {
  return [
    { bookingId: "demo-booking-1" },
    { bookingId: "demo-booking-2" },
    { bookingId: "demo" },
  ];
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return <CheckoutClient bookingId={bookingId} />;
}

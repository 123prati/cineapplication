import ShowtimeClient from "./showtime-client";

export function generateStaticParams() {
  return [
    { id: "demo-cinema-1-1" },
    { id: "demo-cinema-1-2" },
    { id: "demo-cinema-2-1" },
    { id: "demo-cinema-2-2" },
    { id: "demo-showtime-1" },
  ];
}

export default async function ShowtimeBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ShowtimeClient showtimeId={id} />;
}

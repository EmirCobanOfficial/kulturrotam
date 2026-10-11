import CheckInClient from "@/components/CheckInClient";

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <CheckInClient token={token} />;
}

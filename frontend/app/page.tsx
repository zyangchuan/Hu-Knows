import { redirect } from "next/navigation";

// The poster's root link lands here → send everyone to the demo flow.
// The full-featured (login + VIA) flow lives at /app.
export default function Home() {
  redirect("/demo");
}

// app/(root)/page.tsx - FIXED VERSION
import { redirect } from "next/navigation";

// Root page should just redirect to dashboard
// This prevents the redirect loop
const RootPage = () => {
  redirect("/dashboard");
};

export default RootPage;
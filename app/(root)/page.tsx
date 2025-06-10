import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";

const RootPage = async () => {
  console.log('🏠 RootPage: Checking authentication...');
  
  const user = await getCurrentUser();
  
  if (user) {
    console.log('🏠 RootPage: User authenticated, redirecting to dashboard');
    redirect("/dashboard");
  } else {
    console.log('🏠 RootPage: User not authenticated, redirecting to sign-in');
    redirect("/sign-in");
  }
};

export default RootPage;
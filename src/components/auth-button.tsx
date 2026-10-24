"use client";

import { useAuthUser } from "@/lib/use-auth-user";
import { UserMenu } from "./user-menu";

export function AuthButton() {
  const { user, ready } = useAuthUser();

  // Always render the sign-in link as default — both server and client start with this
  // Once auth check completes, swap to UserMenu if logged in
  if (ready && user) {
    return <UserMenu email={user.email} avatarUrl={user.avatarUrl} />;
  }

  return (
    <a
      href="/auth/login"
      className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2 rounded-lg whitespace-nowrap font-headline text-sm font-bold tracking-tight"
    >
      Sign in
    </a>
  );
}

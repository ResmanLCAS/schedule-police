"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import Loading from "@/components/loading";
import { BinusLogoWithRibbon, Chikawa } from "@/components/binus-logo";
import { Particles } from "@/components/ui/particles";


export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loggingIn, setLoggingIn] = useState(false);

    const { user, loading } = useAuthGuard({ requireAuth: false });

    const handleLogin = async (e: React.FormEvent) => {
        if (loggingIn) return;
        setLoggingIn(true);
        e.preventDefault();

        const loginResponse = await login(username, password);
        if (loginResponse.success) router.push("/home");
        else toast.error(loginResponse.message);
        setLoggingIn(false);
    };

    if (loading) return <Loading />;
    else if (user) return null;

    return (
      <div className="relative flex min-h-screen w-full items-center justify-center">

        <div className="absolute inset-0 -z-10">
          <Particles />
        </div>

        <Card className="w-full max-w-sm shadow-lg pt-0 z-10">
          <CardHeader className="text-center">
            <div className="pl-5">
              <BinusLogoWithRibbon />
            </div>
            <CardTitle className="mt-2 text-lg font-semibold text-card-foreground">
              LCAS - SChedule Police
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-3">
              <Input
                placeholder="Initial"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                className="w-full bg-[#0090d1] hover:bg-[#0070a3] hover:cursor-pointer"
                disabled={loggingIn}
                type="submit"
              >
                {loggingIn ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Chikawa/>

        <div className="absolute bottom-4 right-4 z-20">
          <ModeToggle />
        </div>
      </div>
    );
}

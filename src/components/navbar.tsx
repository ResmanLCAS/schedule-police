"use client";

import { BinusLogoWithRibbon } from "@/components/binus-logo";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { LogoutButton } from "@/components/logout-button";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ModeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import LinkAccountDialog from "@/components/link-account-dialog";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { TypingAnimation } from "@/components/ui/typing-animation";

export default function Navbar() {
    const { user, loading } = useAuthGuard({ requireAuth: true });

    const words = [
        "Hello!",
        "Halo!",
        "Hi!",
        "Hola!",
        "Bonjour!",
        "Ciao!",
        "こんにちは！",
        "안녕하세요!",
        "你好！",
        "Guten Tag!",
        "Olá!",
        "Здравствуйте!",
        "Merhaba!",
        "Sawubona!",
        "नमस्ते!",
        "Salam!",
        "Hej!",
        "Selamat!",
        "Shalom!",
    ];

    if (loading || !user) return null;

    return (
        <>
            <div className="hidden md:flex flex-col">
                <div className="flex justify-between border-b-2 pb-2">
                    <div className="mx-24 w-full flex justify-between">
                        <BinusLogoWithRibbon />
                        <div className="flex items-center gap-4 text-xl font-medium text-foreground">
                            <p>
                                <TypingAnimation words={words} loop />{" "}
                                {user.username}
                            </p>
                            <LogoutButton />
                            <ModeToggle />
                        </div>
                    </div>
                </div>

                <div className="px-30 py-2">
                    <NavigationMenu>
                        <NavigationMenuList>
                            {user.role === "ADMIN" && (
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger>
                                        Admin
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent className="px-4 py-3 w-[220px] space-y-2">
                                        <NavigationMenuLink asChild>
                                            <Link
                                                href="/admin/assistants"
                                                className="block rounded-md px-2 py-2 hover:bg-muted transition-colors">
                                                Manage Assistants
                                            </Link>
                                        </NavigationMenuLink>
                                        {/* <NavigationMenuLink asChild>
                                            <Link
                                                href="/admin/region"
                                                className="block rounded-md px-2 py-2 hover:bg-muted transition-colors">
                                                Manage Regions
                                            </Link>
                                        </NavigationMenuLink> */}
                                        <Button
                                            variant="ghost"
                                            className="text-left"
                                            onClick={() =>
                                                fetch("/api/admin/shift", {
                                                    method: "PUT",
                                                })
                                            }>
                                            Refresh Shift Data
                                        </Button>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>
                            )}
                            <NavigationMenuItem>
                                <Button variant="ghost">
                                    <Link
                                        href="/home"
                                        className="block rounded-md px-2 py-2 transition-colors">
                                        Home
                                    </Link>
                                </Button>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <LinkAccountDialog />
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
            </div>

            <div className="flex md:hidden flex-col border-b-2">
                <div className="flex justify-between items-center p-4">
                    <BinusLogoWithRibbon />
                    <div className="flex items-center gap-2">
                        <ModeToggle />
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>

                            <SheetContent
                                side="right"
                                className="w-[280px] flex flex-col">
                                <SheetHeader>
                                    <SheetTitle className="text-left">
                                        Hello, {user.username}
                                    </SheetTitle>
                                </SheetHeader>

                                <div className="flex flex-col gap-2 mt-6 flex-1">
                                    <LinkAccountDialog />

                                    {user.role === "ADMIN" && (
                                        <>
                                            <p className="text-sm font-semibold text-muted-foreground px-2 mt-2">
                                                Admin
                                            </p>

                                            <Button
                                                variant="ghost"
                                                className="justify-start pl-6"
                                                asChild>
                                                <Link href="/home">Home</Link>
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                className="justify-start pl-6"
                                                asChild>
                                                <Link href="/admin/mypermission">
                                                    My Permission
                                                </Link>
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                className="justify-start pl-6"
                                                asChild>
                                                <Link href="/admin/assistants">
                                                    Manage Assistants List
                                                </Link>
                                            </Button>
                                        </>
                                    )}
                                </div>

                                <div className="mt-auto pb-4">
                                    <LogoutButton />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </>
    );
}

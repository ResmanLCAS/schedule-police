import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState, ReactNode } from "react";
import { GetConnectionString } from "@/frontend-controller/assistant-controller";
import { ScriptCopyBtn } from "@/components/ui/script-copy-button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";

export default function LinkAccountDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="hover:cursor-pointer">
                    Connect Line Account
                </Button>
            </DialogTrigger>

            <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md p-4 max-h-[90vh] overflow-y-auto rounded-lg">
                <LinkAccountInstructions />
            </DialogContent>
        </Dialog>
    );
}

export function LinkAccountInstructions() {
    const instructions: { title: string; desc: ReactNode }[] = [
        {
            title: "Add the Line Bot",
            desc: (
                <>
                    Click{" "}
                    <Link
                        href="https://lin.ee/ogjG6al"
                        target="_blank"
                        className="text-blue-600 underline">
                        here
                    </Link>{" "}
                    to add the Line Bot.
                </>
            ),
        },
        {
            title: "Get Your Connection String",
            desc: (
                <>
                    Go to the connections tab and obtain your Connection String
                    with the copy button.
                </>
            ),
        },
        {
            title: "Send the Connection String",
            desc: (
                <>
                    Paste the previously acquired Connection String and send it
                    to the LCAS - SchedulePolice Line Bot. The code is valid for
                    15 minutes.
                </>
            ),
        },
        {
            title: "Finished",
            desc: (
                <>
                    If you receive a success message, then your account has been
                    connected. Note that once a connection has been made, it
                    cannot be overridden. Contact ResMan for manual override.
                </>
            ),
        },
    ];

    return (
        <>
            <DialogHeader className="max-w-[80vw]">
                <DialogTitle>How to Link Your Line Account</DialogTitle>
                <DialogDescription>
                    A brief step-by-step tutorial to connect your Line Account
                    with SchedulePolice.
                </DialogDescription>
            </DialogHeader>

            <div className="mt-4 px-2 sm:px-0 max-w-[92vw]">
                <div className="p-4 flex flex-col gap-4 max-w-[80vw]">
                    <h2 className="text-lg font-medium leading-none">
                        Instructions
                    </h2>

                    {instructions.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                            <p className="text-sm font-semibold wrap-break-word">
                                {idx + 1}. {item.title}
                            </p>
                            <p className="text-sm text-muted-foreground wrap-break-word">
                                {item.desc}
                            </p>
                        </div>
                    ))}

                    <Separator />

                    <LinkAccount />
                </div>
            </div>

            <DialogFooter>
                Consult with ResMan (JB/NB) if you have any questions.
            </DialogFooter>
        </>
    );
}

export function LinkAccount() {
    const [connectionString, setConnectionString] = useState<string | null>(
        null
    );
    const [isFetched, setIsFetched] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        async function fetchConnectionString() {
            try {
                setIsFetched(true);

                if (user?.line_id)
                    toast.info(
                        "You have already linked your Line account. Contact ResMan if you want to re-link."
                    );

                const response = await GetConnectionString();

                if (response.success && response.data) {
                    setConnectionString(response.data);
                } else {
                    throw new Error(response.message);
                }
            } catch (error) {
                toast.error("Failed to get Connection String!", {
                    description: "Error: " + error,
                });
            }
        }

        if (!isFetched) fetchConnectionString();
    }, [isFetched, user?.line_id]);

    return (
        <>
            <DialogHeader className="max-w-[90vw]">
                <DialogTitle>Get Connection String</DialogTitle>
                <DialogDescription>
                    Press the copy icon to get your connection string.
                </DialogDescription>
            </DialogHeader>

            <div className="px-2 sm:px-0 max-w-[80vw]">
                <div className="text-sm text-muted-foreground mb-4">
                    {connectionString
                        ? "Connection String:"
                        : "Press the button below to fetch your UID."}
                </div>

                <div className="w-full flex justify-center">
                    <ScriptCopyBtn
                        codeLanguage="yaml"
                        lightTheme="laserwave"
                        darkTheme="laserwave"
                        commandMap={{
                            "": connectionString ?? "Loading...",
                        }}
                        disabled={
                                !connectionString ||
                                connectionString === "ALREADY_CONNECTED"
                            }
                    />
                </div>
            </div>
        </>
    );
}

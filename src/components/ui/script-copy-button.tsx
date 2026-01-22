"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useTheme } from "next-themes";
import { HTMLAttributes, useEffect, useState } from "react";

interface ScriptCopyBtnProps extends HTMLAttributes<HTMLDivElement> {
    showMultiplePackageOptions?: boolean;
    codeLanguage: string;
    lightTheme: string;
    darkTheme: string;
    commandMap: Record<string, string>;
    className?: string;
    disabled: boolean;
}

export function ScriptCopyBtn({
    codeLanguage,
    lightTheme,
    darkTheme,
    commandMap,
    className,
    disabled,
}: ScriptCopyBtnProps) {
    const packageManagers = Object.keys(commandMap);
    const [packageManager] = useState(packageManagers[0]);
    const [copied, setCopied] = useState(false);
    const [highlightedCode, setHighlightedCode] = useState("");
    const { theme } = useTheme();
    const command = commandMap[packageManager];

    useEffect(() => {
        async function loadHighlightedCode() {
            try {
                const { codeToHtml } = await import("shiki");
                const highlighted = await codeToHtml(command, {
                    lang: codeLanguage,
                    themes: {
                        light: lightTheme,
                        dark: darkTheme,
                    },
                    defaultColor: theme === "dark" ? "dark" : "light",
                });
                setHighlightedCode(highlighted);
            } catch (error) {
                console.error("Error highlighting code:", error);
                setHighlightedCode(`<pre>${command}</pre>`);
            }
        }

        loadHighlightedCode();
    }, [command, theme, codeLanguage, lightTheme, darkTheme]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn("w-full flex justify-center", className)}>
            <div className="w-full flex justify-between">
                <div className="w-full flex justify-between">
                    <div className="min-w-[200px] grow font-mono">
                        {highlightedCode ? (
                            <div
                                className={`[&>pre]:overflow-x-auto [&>pre]:rounded-md [&>pre]:p-2 [&>pre]:px-4 [&>pre]:font-mono ${
                                    theme === "dark" ? "dark" : "light"
                                }`}
                                dangerouslySetInnerHTML={{
                                    __html: highlightedCode,
                                }}
                            />
                        ) : (
                            <pre className="rounded-md border border-border bg-white p-2 px-4 font-mono dark:bg-black">
                                {command}
                            </pre>
                        )}
                    </div>
                    <Button
                        variant="default"
                        size="icon"
                        className="relative ml-2 rounded-md bg-[#27212e] w-10 h-10"
                        onClick={copyToClipboard}
                        aria-label={copied ? "Copied" : "Copy to clipboard"}
                        disabled={disabled}>
                        <span className="sr-only">
                            {copied ? "Copied" : "Copy"}
                        </span>
                        <Copy
                            className={`h-4 w-4 transition-all duration-300 ${
                                copied ? "scale-0" : "scale-100"
                            }`}
                            color="white"
                        />
                        <Check
                            className={`absolute inset-0 m-auto h-4 w-4 transition-all duration-300 ${
                                copied ? "scale-100" : "scale-0"
                            }`}
                            color="white"
                        />
                    </Button>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html>
            <body className="h-screen w-screen flex items-center justify-center bg-gray-50 text-gray-800">
                <div className="text-center px-6 py-10 rounded-2xl shadow-md bg-white max-w-sm mx-auto">
                    <h1 className="text-3xl font-semibold mb-3">
                        Something went wrong
                    </h1>

                    <p className="text-sm text-gray-600 mb-6">
                        An unexpected error occurred. Please try again or return
                        later.
                    </p>

                    <button
                        onClick={reset}
                        className="mt-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition">
                        Try Again
                    </button>

                    {error?.digest && (
                        <p className="mt-4 text-xs text-gray-400">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>
            </body>
        </html>
    );
}

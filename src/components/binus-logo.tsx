"use client";

import Image from "next/image";

export default function BinusLogo() {
    return (
        <>
            <Image
                src="/logo-lcas.png"
                alt="Logo"
                loading="eager"
                width={210}
                height={100}
                className="pt-2 dark:hidden"
            />
            <Image
                src="/logo-lcas-dark.png"
                alt="Logo"
                loading="eager"
                width={210}
                height={100}
                className="pt-2 hidden dark:block"
            />
        </>
    );
}

export function BinusLogoWithRibbon() {
    return (
        <div className="flex">
            <Image
                src="/strip.png"
                alt="ribbon"
                loading="lazy"
                width={35}
                height={30}
            />
            <BinusLogo />
        </div>
    );
}

export function Chikawa() {
    return (
        <div className="absolute top-0 left-0">
            <div className=" relative group w-[200px] h-[150px]">
                <Image
                    src="/chiikawa.png"
                    alt="chikawa"
                    loading="lazy"
                    width={150}
                    height={150}
                    unoptimized
                />

                <div className="absolute inset-0 flex flex-col justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="text-white text-xs font-bold bg-black/50 p-1 rounded mt-2">
                        SC24-2
                    </div>

                    <div className="grow"></div>
                    <div className="text-white text-xs font-bold bg-black/50 p-1 rounded mb-2">
                        NB24-2
                    </div>
                </div>
            </div>
        </div>
    );
}

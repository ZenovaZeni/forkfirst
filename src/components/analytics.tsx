"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import Script from "next/script";

const isProduction = process.env.NODE_ENV === "production";
const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim();
const safeClarityProjectId = clarityProjectId && /^[a-zA-Z0-9]+$/.test(clarityProjectId)
  ? clarityProjectId
  : undefined;

export function Analytics({ enableVercel }: { enableVercel: boolean }) {
  return (
    <>
      {enableVercel ? <VercelAnalytics /> : null}
      {isProduction && safeClarityProjectId ? (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${safeClarityProjectId}");
          `}
        </Script>
      ) : null}
    </>
  );
}

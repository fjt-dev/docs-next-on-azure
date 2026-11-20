---
title: "Comparison"
source: "docs/comparison.md"
---

Ways to run a Next.js app on Azure, side by side. next-on-azure packages the app and deploys it to one Azure Function; the other options are what Azure and Next.js document. Check the sources before you decide: services change.

| | next-on-azure | Azure Static Web Apps (hybrid) | Node.js server or Docker container | Static export |
| --- | --- | --- | --- | --- |
| What you get | The app is packaged and deployed to one Azure Function (Flex Consumption) | A static host with a managed backend for Next.js ¹ | You run `next start` or the standalone image on a service you choose (App Service, Container Apps, AKS) | HTML, CSS and JavaScript files on any static host |
| Next.js features | App Router and Pages Router, SSR, streaming, ISR, `revalidateTag` and `revalidatePath`, `'use cache'`, middleware, Server Actions, `after()`, `next/image`. Not the Edge runtime. Details: [Compatibility](./compatibility.md) | App Router, Pages Router, React Server Components, route handlers, image optimization, i18n, middleware ¹ | All ² | Limited ² |
| Status | Experimental (`0.1.0`) | Preview ¹ | Supported by Next.js ² | Supported by Next.js ² |
| Scales to zero | Yes | Not stated in the documentation ¹ | Depends on the service: Container Apps can ³ | A static host has no server |
| Cache shared by all instances | Yes, in Blob and Table Storage | Not stated in the documentation ¹ | Each instance has its own cache unless you add a cache handler ⁴ | Not needed |
| Infrastructure | `deploy` creates it with Bicep, or use your own ([Your own infrastructure](./infrastructure.md)) | Created by Static Web Apps, deployed from GitHub Actions or Azure DevOps | You create it | You create it |
| Known limits | No Edge runtime. Static files are served by the function, so a busy site needs a CDN in front. Front Door is not tested | 250 MB maximum app size. Image caching is not supported with ISR. Linked APIs and the SWA CLI are not supported ¹ | You build and run the image, the scaling and the shared cache | Anything that needs a server does not work |

## Other platforms

- **OpenNext** turns the Next.js build output into packages for AWS Lambda, Cloudflare and a Node.js server. It does not deploy the app by itself ([OpenNext documentation](https://opennext.js.org/aws)). It has no Azure target.
- **Vercel** has a verified adapter: it runs the Next.js test suite, and the Next.js team coordinates with it before major releases ². Other platforms, such as AWS Amplify, Cloudflare and Netlify, have their own integrations that Next.js does not verify ².

## Sources

1. Microsoft Learn: [Deploy Next.js websites on Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/nextjs) and [hybrid Next.js (preview)](https://learn.microsoft.com/azure/static-web-apps/deploy-nextjs-hybrid), read 2026-11-20.
2. Next.js documentation: [Deploying](https://nextjs.org/docs/app/getting-started/deploying), read 2026-11-20.
3. Microsoft Learn: [Set scaling rules in Azure Container Apps](https://learn.microsoft.com/azure/container-apps/scale-app): the minimum number of replicas is 0 by default.
4. Next.js documentation: [Self-hosting, caching and ISR](https://nextjs.org/docs/app/guides/self-hosting).

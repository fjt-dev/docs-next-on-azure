import { withAzure } from "next-on-azure/config";

// The site is a static documentation site; it is built and deployed with next-on-azure itself.
export default withAzure({
  reactStrictMode: true,
  poweredByHeader: false,
});

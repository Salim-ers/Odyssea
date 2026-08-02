/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          /* La géolocalisation était refusée à la page elle-même, ce qui
             rendait « Ma position » inopérant sans le moindre message : le
             navigateur bloque avant même de demander l'autorisation. On
             l'autorise pour notre seule origine — le consentement reste
             celui du navigateur, demandé au clic et jamais avant. Caméra et
             micro restent fermés : rien ici n'en a l'usage. */
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};
export default nextConfig;

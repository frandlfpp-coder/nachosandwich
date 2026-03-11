/** @type {import('next').NextConfig} */
const nextConfig = {
  // Asegúrate de que esto NO esté en 'export' si quieres usar App Hosting
  // output: 'standalone', // Opcional: ayuda a Firebase a empaquetar mejor
  reactStrictMode: true,
};

module.exports = nextConfig;

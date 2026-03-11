/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilitar la salida 'standalone' optimiza la compilación para despliegues.
  // Es la configuración recomendada para Firebase App Hosting.
  output: 'standalone',
  reactStrictMode: true,
};

module.exports = nextConfig;

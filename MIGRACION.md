# Migración de Clube de Lazer Shangrilá

La web se compila con Vite y se publica como archivos estáticos en Cloudflare Workers. Las rutas de React, incluidas `/mesa/:tableId` y `/reset-password`, usan la configuración SPA de `wrangler.jsonc`. Cloudflare no necesita acceso administrativo a Supabase.

## Verificar el backend

La aplicación y el servidor local de impresión apuntan al proyecto Supabase `gehmvvvlinstfprgtkeg`. Confirma en el panel de Supabase que ese proyecto está bajo control de la cuenta del club. En ese caso, conserva la URL, la clave pública, las tablas y políticas, los usuarios de Auth, los buckets, Realtime y las funciones que ya están desplegadas.

Si el proyecto pertenece a Lovable Cloud, mantén el backend actual operativo. Antes de retirar Lovable, prepara un proyecto Supabase bajo tu control y verifica el traslado de registros, usuarios, archivos y funciones. La carpeta `supabase/migrations` contiene el esquema versionado. El repositorio por sí solo no contiene los datos ni los secretos del proyecto.

## Publicar primero en una URL de pruebas

1. En Cloudflare Workers, selecciona el repositorio `automatikblog/shangrila-escape-reserve` y la rama `migracion/cloudflare`. Si la pantalla inicial usa `main`, selecciona `migracion/cloudflare` en **Settings → Build → Branch control** antes de compilar. Usa la raíz del repositorio, Node.js 22, comando de compilación `npm run build` y comando de despliegue `npx --yes wrangler@4 deploy`. El proyecto se llama `clubedelazershangrila`. La primera publicación usa la URL que Cloudflare asigne bajo `workers.dev`.
2. En **Build Variables**, proporciona `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` del proyecto confirmado. Vite incorpora ambas al JavaScript del navegador. Usa la clave publicable o `anon`.
3. Para un despliegue manual desde la rama, ejecuta `npm ci`, `npm run build` y `npx --yes wrangler@4 deploy` desde la raíz con una sesión autorizada en Cloudflare.
4. En Supabase Auth, añade a Redirect URLs la URL de pruebas con `/` y `/reset-password` para probar la recuperación de contraseña. Conserva la Site URL y los destinos actuales durante las pruebas. Si la plantilla de recuperación está personalizada, comprueba que respeta el destino permitido.
5. Abre la página principal, `/cardapio`, una URL directa de mesa conocida, `/admin` y `/reset-password`. Comprueba el acceso con un usuario autorizado, las reservas y el correo de confirmación con una reserva de prueba acordada, los pedidos y su actualización en cocina, y una impresión de prueba en la Elgin. `print-server` se ejecuta en la red local de la impresora y usa el mismo proyecto Supabase. Evita arrancar una segunda instancia contra la misma cola.

## Sustituir el servicio de lectura de facturas

La versión anterior de `parse-invoice` enviaba las imágenes a la pasarela de IA de Lovable. Esta rama mantiene el formato de respuesta y la lógica de extracción y prepara la llamada directa a Gemini. La versión nueva comprueba la sesión y el rol de personal antes de procesar una imagen.

1. Acuerda con el responsable del club el tratamiento de imágenes de facturas y el plan de Gemini. Consulta sus condiciones antes de enviar documentos reales.
2. En el proyecto Supabase, carga `GEMINI_API_KEY` y `GEMINI_MODEL` como secretos de Edge Functions. Usa un modelo disponible en tu cuenta con soporte para imágenes y salida JSON, como `gemini-3.5-flash-lite`, y valida la calidad con una factura ficticia. Guarda una referencia a la versión desplegada de `parse-invoice` y conserva su configuración para poder restaurarla.
3. Despliega únicamente `parse-invoice` con `npx supabase functions deploy parse-invoice --project-ref gehmvvvlinstfprgtkeg` cuando el cambio esté autorizado. El comando presupone que se conserva el proyecto actual. Comprueba la importación con una factura ficticia, tanto con rol autorizado como sin sesión. El cambio afecta a todas las webs que usan esta función en ese proyecto.
4. La función de correo `send-reservation-email` sigue usando Resend en Supabase. Si se conserva el proyecto, comprueba su funcionamiento y conserva su secreto en Supabase.

## Conservar el dominio y los QR

Los QR impresos y los correos de reservas hacen referencia a `https://clubedelazershangrila.com.br`. Conserva ese nombre y las rutas existentes. Antes del cambio, guarda los registros DNS vigentes y verifica el acceso al registrador. Workers requiere una zona activa en Cloudflare. Si necesitas mover la gestión DNS, copia primero los registros de la zona, incluidos los de correo. Un CNAME existente para el nombre del sitio debe resolverse al conectar el dominio. Con la vista de Cloudflare validada, conecta el dominio al Worker y comprueba HTTPS, los QR físicos y la recuperación de contraseña desde el dominio definitivo. Mantén disponible el alojamiento de Lovable hasta confirmar la operación. La reversión del frontend consiste en restaurar el destino DNS previo del sitio.

## Referencias

- [Cloudflare Workers para una SPA](https://developers.cloudflare.com/workers/static-assets/migration-guides/vercel-to-workers/static-site/)
- [Despliegue desde GitHub](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/)
- [Dominios personalizados en Workers](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Identificar el backend de Lovable](https://supabase.com/kb/troubleshooting/identify-lovable-cloud-or-supabase-backend)
- [URLs de redirección de Supabase Auth](https://supabase.com/docs/guides/auth/redirect-urls)
- [Secretos de Edge Functions](https://supabase.com/docs/guides/functions/secrets)
- [Compatibilidad de Gemini con la API OpenAI](https://ai.google.dev/gemini-api/docs/openai)
- [Condiciones de la API de Gemini](https://ai.google.dev/gemini-api/terms)

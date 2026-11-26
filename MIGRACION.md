# Migración de Clube de Lazer Shangrilá

La web se compila con Vite y se publica como archivos estáticos en Cloudflare Workers. Las rutas de React, incluidas `/mesa/:tableId` y `/reset-password`, usan la configuración SPA de `wrangler.jsonc`. Cloudflare no necesita acceso administrativo a Supabase.

## Copiar el backend administrado por Lovable

El sitio de producción y el servidor de impresión usan el proyecto `gehmvvvlinstfprgtkeg` de Lovable Cloud. La primera publicación en Cloudflare puede usar ese mismo proyecto. El cambio a un Supabase propio se hace después de verificar la copia.

1. En Lovable, ve a **More → Database → Manage → Settings → Export project data → Database → Start export**. Descarga el archivo `.backup` y guárdalo fuera del repositorio. Contiene estructura, datos y cuentas de usuarios con los hashes de sus contraseñas. Descarga aparte los archivos de **More → Storage**, conservando sus rutas.
2. Inspecciona el archivo con `pg_restore --list`, usando herramientas de PostgreSQL 16 o posterior con soporte zstd. Prepara una restauración selectiva en el proyecto Supabase nuevo. Conserva los objetos administrados que ya existen en el destino. Revisa los datos iniciales de las migraciones antes de combinarlos con el contenido del archivo.
3. Conserva los UUID de mesas, usuarios y pedidos. Antes de conectar el notebook al nuevo backend, verifica que importar pedidos históricos no cree comandas nuevas. Comprueba las tablas, los usuarios, los buckets, las funciones y la publicación Realtime de `public.print_jobs`.
4. Restaura la primera copia y valida con el sitio de prueba. Repite la exportación y la sincronización final durante una ventana acordada para incluir las ventas y comandas posteriores a la primera copia. Lovable permite una exportación cada 24 horas.
5. Tras validar la copia final, actualiza las variables de compilación de Cloudflare y `SUPABASE_URL` y `SUPABASE_ANON_KEY` en el `.env` del servidor de impresión, usando los valores del proyecto nuevo. Guarda una copia de la configuración anterior para volver a ella. Las sesiones existentes deben volver a iniciar sesión.

## Publicar primero en una URL de pruebas

1. En Cloudflare Workers, selecciona el repositorio `automatikblog/shangrila-escape-reserve` y la rama `migracion/cloudflare`. Si la pantalla inicial usa `main`, selecciona `migracion/cloudflare` en **Settings → Build → Branch control** antes de compilar. Usa la raíz del repositorio, Node.js 22, comando de compilación `npm run build` y comando de despliegue `npx --yes wrangler@4 deploy`. El proyecto se llama `clubedelazershangrila`. La primera publicación usa la URL que Cloudflare asigne bajo `workers.dev`.
2. En **Build Variables**, proporciona `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` del proyecto confirmado. Vite incorpora ambas al JavaScript del navegador. Usa la clave publicable o `anon`.
3. Para un despliegue manual desde la rama, ejecuta `npm ci`, `npm run build` y `npx --yes wrangler@4 deploy` desde la raíz con una sesión autorizada en Cloudflare.
4. Para probar la recuperación, comprueba que el backend acepta las rutas `/` y `/reset-password` de la URL de pruebas. La configuración depende de si se usa Lovable Cloud o Supabase propio. Conserva la URL de producción durante las pruebas.
5. Abre la página principal, `/cardapio`, una URL directa de mesa conocida, `/admin` y `/reset-password`. Comprueba el acceso con un usuario autorizado, las reservas y el correo de confirmación con una reserva de prueba acordada, los pedidos y su actualización en cocina, y una impresión de prueba en la Elgin. `print-server` se ejecuta en la red local de la impresora y usa el mismo proyecto Supabase. Evita arrancar una segunda instancia contra la misma cola.

## Sustituir el servicio de lectura de facturas

La versión anterior de `parse-invoice` enviaba las imágenes a la pasarela de IA de Lovable. Esta rama mantiene el formato de respuesta y la lógica de extracción y prepara la llamada directa a Gemini. La versión nueva comprueba la sesión y el rol de personal antes de procesar una imagen.

1. Acuerda con el responsable del club el tratamiento de imágenes de facturas y el plan de Gemini. Consulta sus condiciones antes de enviar documentos reales.
2. En el proyecto Supabase, carga `GEMINI_API_KEY` y `GEMINI_MODEL` como secretos de Edge Functions. Usa un modelo disponible en tu cuenta con soporte para imágenes y salida JSON, como `gemini-3.5-flash-lite`, y valida la calidad con una factura ficticia. Guarda una referencia a la versión desplegada de `parse-invoice` y conserva su configuración para poder restaurarla.
3. Despliega únicamente `parse-invoice` con `npx supabase functions deploy parse-invoice --project-ref <proyecto-nuevo>` después de restaurar la copia y configurar los secretos. Comprueba la importación con una factura ficticia, tanto con rol autorizado como sin sesión. El cambio afecta a todas las webs que usan esta función en ese proyecto.
4. La función de correo `send-reservation-email` sigue usando Resend en Supabase. Si se conserva el proyecto, comprueba su funcionamiento. Si pasas al proyecto nuevo, vuelve a configurar el secreto de Resend y despliega la función allí.

## Conservar el dominio y los QR

Los QR impresos y los correos de reservas hacen referencia a `https://clubedelazershangrila.com.br`. Conserva ese nombre y las rutas existentes. Antes del cambio, guarda los registros DNS vigentes y verifica el acceso al registrador. Workers requiere una zona activa en Cloudflare. Si necesitas mover la gestión DNS, copia primero los registros de la zona, incluidos los de correo. Un CNAME existente para el nombre del sitio debe resolverse al conectar el dominio. Con la vista de Cloudflare validada, conecta el dominio al Worker y comprueba HTTPS, los QR físicos y la recuperación de contraseña desde el dominio definitivo. Mantén disponible el alojamiento de Lovable hasta confirmar la operación. La reversión del frontend consiste en restaurar el destino DNS previo del sitio. El código actualizado del notebook busca comandas pendientes al reconectar y cada 30 segundos. Antes de cambiar el backend, prueba un pedido con varios ítems y una caída de Internet, con el notebook y la Elgin en la red del restaurante.

## Referencias

- [Cloudflare Workers para una SPA](https://developers.cloudflare.com/workers/static-assets/migration-guides/vercel-to-workers/static-site/)
- [Despliegue desde GitHub](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/)
- [Dominios personalizados en Workers](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Exportación del banco en Lovable](https://docs.lovable.dev/features/database-backups#export-your-database)
- [Restauración en un Supabase propio](https://docs.lovable.dev/tips-tricks/external-deployment-hosting#host-backend-and-data-on-a-managed-provider-supabase-example)
- [URLs de redirección de Supabase Auth](https://supabase.com/docs/guides/auth/redirect-urls)
- [Secretos de Edge Functions](https://supabase.com/docs/guides/functions/secrets)
- [Compatibilidad de Gemini con la API OpenAI](https://ai.google.dev/gemini-api/docs/openai)
- [Condiciones de la API de Gemini](https://ai.google.dev/gemini-api/terms)

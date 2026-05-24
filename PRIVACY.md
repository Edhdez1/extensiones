# Política de Privacidad — Promptisma

**Última actualización:** 24 de mayo de 2026

Promptisma es una extensión de navegador que transforma el texto que
seleccionas en un prompt optimizado, usando el proveedor de IA que tú elijas.
Esta política explica qué datos se manejan y cómo.

## Resumen

- **No tenemos servidores propios.** No recopilamos, almacenamos ni vendemos tus
  datos personales.
- **No usamos analítica ni rastreadores** de ningún tipo.
- Tus **claves de API** y tus **ajustes** se guardan **solo en tu navegador**
  (`storage.local`) y nunca se envían a nadie salvo, en el caso de la clave, al
  proveedor de IA correspondiente para autenticar tu propia petición.

## Qué datos se procesan

| Dato | Dónde se guarda | A quién se envía |
|---|---|---|
| Texto que seleccionas y optimizas | No se almacena | Únicamente al proveedor de IA que tengas activo, para generar el prompt |
| API keys de los proveedores | Solo en tu navegador (`storage.local`) | Solo al proveedor correspondiente, como cabecera de autenticación |
| Ajustes (proveedor, modelo, estilo, idioma) | Solo en tu navegador (`storage.local`) | A nadie |

## Envío de texto a proveedores de IA

Cuando optimizas un texto, ese texto se envía **directamente desde tu navegador**
al proveedor de IA que hayas seleccionado en los ajustes. La extensión no
intermedia ese tráfico a través de ningún servidor propio.

El proveedor por defecto es **Pollinations** (servicio gratuito que no requiere
clave). Si configuras otro proveedor (OpenAI, Google Gemini, Groq u OpenRouter),
el texto se enviará a ese proveedor. El tratamiento que cada proveedor haga de
los datos se rige por **su propia política de privacidad**:

- Pollinations — https://pollinations.ai
- OpenAI — https://openai.com/policies/privacy-policy
- Google Gemini — https://policies.google.com/privacy
- Groq — https://groq.com/privacy-policy
- OpenRouter — https://openrouter.ai/privacy

Recomendamos no seleccionar ni enviar información sensible o confidencial.

## Permisos de la extensión

- `contextMenus`: añade la opción "Optimizar como prompt" al menú del clic derecho.
- `storage`: guarda tus ajustes y claves localmente en el navegador.
- `notifications`: muestra avisos breves (p. ej. si hay que recargar la página).
- Acceso a las páginas: necesario para leer el texto que seleccionas y mostrar
  el panel de resultados. El texto solo se procesa cuando tú activas la opción.

## Control del usuario

Puedes borrar tus claves y ajustes en cualquier momento desde la página de
ajustes de la extensión, o desinstalándola (lo que elimina todo lo guardado en
`storage.local`).

## Cambios en esta política

Si esta política cambia, se actualizará la fecha del encabezado y, si el cambio
es relevante, se reflejará en las notas de la versión de la extensión.

## Contacto

Para dudas sobre privacidad: **edwarmejia23@gmail.com**

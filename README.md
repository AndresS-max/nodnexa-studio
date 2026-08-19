# NodNexa Studio

MVP público de validación para convertir una referencia de contenido en un primer guion adaptado a una marca.

## Alcance actual

- Contexto mínimo: marca, audiencia, tono y objetivo.
- Entrada manual de transcripción, caption o idea.
- Gancho, ángulo, estructura y guion editable generados en el navegador.
- Eventos de inicio y finalización sin almacenar el texto fuente.
- Comentarios y correo opcional persistidos en D1.

Este repositorio corresponde a la Fase 0. No incluye aún cuentas, organizaciones, extracción de URLs, IA generativa, aprobaciones ni pagos.

## Desarrollo

```bash
npm install
npm run dev
```

## Verificación

```bash
npm run lint
npm test
```

## Seguridad

- Las referencias se procesan únicamente en el navegador.
- Los endpoints públicos aplican límites de tamaño, origen y frecuencia.
- Los correos son opcionales y se validan en el servidor.
- Los archivos de investigación y respuestas comerciales se mantienen fuera de este repositorio.

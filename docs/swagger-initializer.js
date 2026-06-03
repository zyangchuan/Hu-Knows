// Central OpenAPI docs for all hu-knows services.
//
// The spec is the static openapi.yaml in this directory — edit it to document
// new services or endpoints. (Resolved relative to the <base href="/docs/">.)
window.onload = function () {
  window.ui = SwaggerUIBundle({
    url: 'openapi.yaml',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: 'StandaloneLayout',
  });
};

exports.csp_links = [
  "'self'",
  "*.sdg-innovation-commons.org",
  "sdg-innovation-commons.org",
  "https://apis.sdg-innovation-commons.org",
  "https://unpkg.com",
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
  "https://www.google.com",
  "https://maxcdn.bootstrapcdn.com",
  "https://acclabplatforms.blob.core.windows.net",
  "https://cdn.jsdelivr.net",
  "https://code.jquery.com",
  "https://cdnjs.cloudflare.com",
  "https://design.undp.org",
  "https://undp-accelerator-labs.github.io",
];

exports.csp_config = {
  contentSecurityPolicy: {
    directives: {
      "img-src": this.csp_links,
      "script-src": this.csp_links.concat([
        (req, res) => `'nonce-${res.locals.nonce}'`,
        "sha256-NNiElek2Ktxo4OLn2zGTHHeUR6b91/P618EXWJXzl3s=",
        "strict-dynamic",
      ]),
      "script-src-attr": [
        "'self'",
        "*.sdg-innovation-commons.org",
        "sdg-innovation-commons.org",
      ],
      "style-src": this.csp_links,
      "connect-src": this.csp_links,
      "frame-src": [
        "'self'",
        "*.sdg-innovation-commons.org",
        "sdg-innovation-commons.org",
        "https://www.youtube.com/",
        "https://youtube.com/",
        "https://web.microsoftstream.com",
      ],
      "form-action": [
        "'self'",
        "*.sdg-innovation-commons.org",
        "sdg-innovation-commons.org",
      ],
    },
  },
  referrerPolicy: {
    policy: ["strict-origin-when-cross-origin", "same-origin"],
  },
  xPoweredBy: false,
  strictTransportSecurity: {
    maxAge: 123456,
  },
};

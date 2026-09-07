// Maps extensionless URIs onto the prerendered objects that vite writes:
//   /blog/foo   -> /blog/foo/index.html
//   /blog/foo/  -> /blog/foo/index.html
//   /assets/x.js, /sitemap.xml, /og-image.jpg -> untouched (they have extensions)
//
// A slug with no prerendered object still 403s from S3, which the distribution's
// custom_error_response turns back into /index.html so React Router renders 404.
// ES5 only: the CloudFront Functions runtime is not a full browser JS engine.
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    if (uri.charAt(uri.length - 1) === '/') {
        request.uri = uri + 'index.html';
        return request;
    }

    var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
    if (lastSegment.indexOf('.') === -1) {
        request.uri = uri + '/index.html';
    }

    return request;
}

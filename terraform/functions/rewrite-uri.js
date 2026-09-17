// Normalizes the request onto one canonical URL per page, then maps that URL
// onto the prerendered objects that vite writes:
//   https://www.zagran.dev/blog/foo -> 301 https://zagran.dev/blog/foo
//   /blog/foo/  -> 301 /blog/foo
//   /blog/foo   -> /blog/foo/index.html
//   /           -> /index.html
//   /assets/x.js, /sitemap.xml, /og-image.jpg -> untouched (they have extensions)
//
// The redirects exist because both hostnames are aliases on this distribution
// and the trailing-slash form resolves to the same object: without them every
// page is reachable, 200, at four URLs, which is what Search Console reports as
// duplicate content. A function that returns a response short-circuits before
// the cache lookup, so these never enter the cache key.
//
// A slug with no prerendered object still 403s from S3, which the
// distribution's custom_error_response turns into a real 404 on /404.html.
// ES5 only: the CloudFront Functions runtime is not a full browser JS engine.

function queryString(request) {
    var qs = request.querystring;
    var parts = [];
    for (var key in qs) {
        var param = qs[key];
        if (param.multiValue) {
            for (var i = 0; i < param.multiValue.length; i++) {
                parts.push(key + '=' + param.multiValue[i].value);
            }
        } else if (param.value === '') {
            parts.push(key);
        } else {
            parts.push(key + '=' + param.value);
        }
    }
    return parts.length ? '?' + parts.join('&') : '';
}

function permanentRedirect(location) {
    return {
        statusCode: 301,
        statusDescription: 'Moved Permanently',
        headers: { location: { value: location } }
    };
}

function handler(event) {
    var request = event.request;
    var uri = request.uri;
    var host = request.headers.host ? request.headers.host.value : '';

    if (host.indexOf('www.') === 0) {
        return permanentRedirect('https://' + host.substring(4) + uri + queryString(request));
    }

    if (uri === '/') {
        request.uri = '/index.html';
        return request;
    }

    if (uri.charAt(uri.length - 1) === '/') {
        return permanentRedirect(
            'https://' + host + uri.substring(0, uri.length - 1) + queryString(request)
        );
    }

    var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
    if (lastSegment.indexOf('.') === -1) {
        request.uri = uri + '/index.html';
    }

    return request;
}

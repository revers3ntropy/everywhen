const authRoutes = ['login', 'signup'];
const defaultPath = 'home';

export function redirectPath(url: URL): string {
    let redirect = url.searchParams.get('redirect');
    if (!redirect) return defaultPath;

    redirect = redirect
        .trim()
        // remove leading slashes, which might redirect to another site
        .replace(/^\/+/g, '');

    const [path, ...queryParts] = redirect.split('?');
    let query = queryParts.join('?');
    let normalisedPath = path.split('/').filter(Boolean).join('/');

    // deal with the case where the redirect gets layered,
    // e.g. /login?redirect=/login?redirect=a
    while (authRoutes.includes(normalisedPath)) {
        if (!query) return defaultPath;
        if (!query.startsWith('redirect=')) return defaultPath;
        const [newPath, newQuery] = query.substring('redirect='.length).split('?', 2);
        normalisedPath = newPath.split('/').filter(Boolean).join('/');
        query = newQuery;
    }

    if (!normalisedPath) return defaultPath;

    redirect = normalisedPath + (query ? '?' + query : '');

    return redirect;
}

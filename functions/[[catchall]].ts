// This function handles SPA routing for Cloudflare Pages

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url)
  const path = url.pathname

  // List of extensions that should be served as static files
  const staticExtensions = ['.xml', '.json', '.txt', '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.webp', '.html']

  // Check if the request is for a static file
  const hasExtension = staticExtensions.some(ext => path.endsWith(ext))

  // Check if path is in the content directory
  const isContentPath = path.startsWith('/content/')

  // For static files and content, fetch directly from assets
  if (hasExtension || isContentPath) {
    try {
      const response = await context.env.ASSETS.fetch(context.request)
      if (response.status !== 404) {
        return response
      }
    } catch {
      // Fall through to SPA
    }
  }

  // For SPA routes, serve index.html
  try {
    const response = await context.env.ASSETS.fetch(new URL('/index.html', url.origin))
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      }
    })
  } catch {
    return new Response('Not Found', { status: 404 })
  }
}

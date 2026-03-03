import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

/**
 * 🔐 MIDDLEWARE — Se ejecuta ANTES de que Next.js sirva cualquier página.
 *
 * ¿Por qué existe esto?
 * Sin middleware, cualquier usuario puede escribir "/" en la URL y ver el menú
 * aunque no esté logueado. El middleware actúa como un "guardia" que intercepta
 * cada request y decide si dejarlo pasar o redirigirlo.
 *
 * Flujo:
 *  - Usuario accede a "/"        → ¿tiene sesión? → sí: pasa | no: va a /auth/login
 *  - Usuario accede a "/auth/*"  → ¿tiene sesión? → sí: va a "/" | no: pasa (no tiene sentido loguearse si ya lo estás)
 */
export async function middleware(req) {
  // NextResponse.next() significa "deja pasar el request normalmente"
  const res = NextResponse.next();

  // Creamos un cliente de Supabase especial para el middleware.
  // Este cliente puede leer y REFRESCAR la sesión desde las cookies del request.
  // Es diferente al cliente normal (createClient) porque el middleware no tiene
  // acceso al navegador, solo a las cookies HTTP.
  const supabase = createMiddlewareClient({ req, res });

  // getSession() lee la cookie de sesión y, si el token está caducado,
  // lo refresca automáticamente. Por eso necesitamos el cliente de middleware.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // 🚫 Rutas protegidas: el usuario DEBE estar logueado
  // Añadimos /admin además de /
  // La verificación de si es ADMIN la hace el propio page.js de /admin
  // (aquí solo verificamos que haya sesión)
  const protectedRoutes = ["/", "/admin"];
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // 🔄 Rutas de auth: si YA está logueado, no tiene sentido que vaya al login
  if (pathname.startsWith("/auth") && session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ✅ En cualquier otro caso, dejamos pasar el request
  return res;
}

/**
 * config.matcher define EN QUÉ RUTAS se ejecuta el middleware.
 *
 * El patrón "/((?!_next/static|_next/image|favicon.ico).*)" significa:
 * "Todas las rutas EXCEPTO los archivos estáticos de Next.js y el favicon"
 *
 * Si no excluimos esos paths, el middleware se ejecutaría en cada imagen/CSS
 * y haría la app muy lenta.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
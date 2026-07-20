import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
  return to;
}

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  supabaseResponse: NextResponse,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirectResponse = NextResponse.redirect(url);
  return copyCookies(supabaseResponse, redirectResponse);
}

/**
 * Refresh auth cookies + guard protected routes.
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[proxy] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
    global: {
      headers: {
        apikey: supabaseAnonKey,
      },
    },
  });

  // Revalidate JWT with Auth server (do not use getSession() here)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isRoot = path === "/";
  const isLogin = path === "/login" || path.startsWith("/login/");
  const isProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/teacher") ||
    path.startsWith("/courses");

  if (!user && (isProtected || isRoot)) {
    return redirectWithCookies(request, "/login", supabaseResponse);
  }

  // Logged-in users: / and /login → home by role
  if (user && (isLogin || isRoot)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role;
    if (role === "teacher" || role === "admin") {
      return redirectWithCookies(request, "/teacher", supabaseResponse);
    }
    return redirectWithCookies(request, "/dashboard", supabaseResponse);
  }

  if (user && path.startsWith("/teacher")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "student") {
      return redirectWithCookies(request, "/dashboard", supabaseResponse);
    }
  }

  if (user && path.startsWith("/dashboard")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "teacher" || profile?.role === "admin") {
      return redirectWithCookies(request, "/teacher", supabaseResponse);
    }
  }

  return supabaseResponse;
}

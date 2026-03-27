
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
    // This `try/catch` block is only here for the interactive tutorial.
    // Feel free to remove once you have Supabase connected.
    try {
        // Create an unmodified response
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-pathname', request.nextUrl.pathname);

        let response = NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            request.cookies.set(name, value);
                        });
                        response = NextResponse.next({
                            request,
                        });
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set(name, value, options);
                        });
                    },
                },
            },
        );

        // This will refresh session if needed - custom protected routes logic
        const {
            data: { user },
        } = await supabase.auth.getUser();

        // protected routes
        const isApiRoute = request.nextUrl.pathname.startsWith("/api");
        const isSharePage = request.nextUrl.pathname.startsWith("/projects/share/");

        const isAuthPage = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/forgot-password" || request.nextUrl.pathname === "/reset-password";

        if (request.nextUrl.pathname.startsWith("/") && !isApiRoute && !isSharePage && !isAuthPage && !user) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        if (request.nextUrl.pathname === "/login" && user) {
            return NextResponse.redirect(new URL("/", request.url));
        }

        return response;
    } catch (e) {
        // If you are here, a Supabase client could not be created!
        // This is likely because you have not set up environment variables.
        // Check out http://localhost:3000 for Next Steps.
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        });
    }
};

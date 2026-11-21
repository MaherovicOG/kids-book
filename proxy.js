import { NextResponse } from 'next/server';
export function proxy(request) {
  const first=request.nextUrl.pathname.split('/')[1];
  const headers=new Headers(request.headers);
  headers.set('x-site-locale',['en','fr','ar'].includes(first)?first:'en');
  return NextResponse.next({request:{headers}});
}
export const config={matcher:['/((?!api|_next|favicon.ico|images|heroes).*)']};

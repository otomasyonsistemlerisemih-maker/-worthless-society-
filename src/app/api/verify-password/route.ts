import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { password } = await request.json();

  // Şifre kontrolü: Ortam değişkeni (SECRET_PASSWORD) kullanılır, 
  // yoksa varsayılan olarak 'worthless' kabul edilir.
  const correctPassword = process.env.SECRET_PASSWORD || 'worthless';

  if (password === correctPassword) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false }, { status: 401 });
}

// app/api/healthcheck/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const GET = (req: NextRequest) => {
  return NextResponse.json({ status: 'ok' });
};
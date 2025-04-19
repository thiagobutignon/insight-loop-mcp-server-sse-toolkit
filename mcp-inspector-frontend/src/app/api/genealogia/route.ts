import { NextResponse } from 'next/server';
import data from '../../logs/genealogia.json';

export async function GET() {
  return NextResponse.json(data);
}
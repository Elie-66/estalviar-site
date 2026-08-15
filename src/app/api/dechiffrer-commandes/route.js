import { NextResponse } from 'next/server';
import { dechiffrerCode } from '../../../lib/chiffrement';

export async function POST(req) {
  try {
    const { items } = await req.json();

    const resultats = items.map((item) => {
      let code = null;
      if (item.code) {
        try {
          code = dechiffrerCode(item.code);
        } catch (e) {
          code = item.code; // ancien code non chiffré, on l'affiche tel quel
        }
      }
      return { id: item.id, code };
    });

    return NextResponse.json({ resultats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
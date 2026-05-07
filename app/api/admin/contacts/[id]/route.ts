import { NextResponse } from 'next/server';
import supabase from '../../../../../lib/supabase';

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id }    = await ctx.params;
  const { active } = await request.json();

  const { data, error } = await supabase
    .from('routing_contacts')
    .update({ active })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const { error } = await supabase
    .from('routing_contacts')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

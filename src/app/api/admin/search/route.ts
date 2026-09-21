import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") || "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const search = { contains: q, mode: "insensitive" as const };

  const [research, publications, events, programs, blogPosts, mediaItems, resources, careers, teamMembers] = await Promise.all([
    db.researchArticle.findMany({ where: { OR: [{ title: search }, { description: search }] }, take: 5, select: { id: true, slug: true, title: true } }),
    db.publication.findMany({ where: { OR: [{ title: search }, { description: search }] }, take: 5, select: { id: true, slug: true, title: true } }),
    db.event.findMany({ where: { OR: [{ name: search }, { description: search }] }, take: 5, select: { id: true, slug: true, name: true } }),
    db.program.findMany({ where: { OR: [{ title: search }, { description: search }] }, take: 5, select: { id: true, slug: true, title: true } }),
    db.blogPost.findMany({ where: { OR: [{ title: search }, { description: search }] }, take: 5, select: { id: true, slug: true, title: true } }),
    db.mediaItem.findMany({ where: { OR: [{ title: search }, { description: search }] }, take: 5, select: { id: true, slug: true, title: true } }),
    db.resource.findMany({ where: { OR: [{ title: search }, { description: search }] }, take: 5, select: { id: true, slug: true, title: true } }),
    db.career.findMany({ where: { OR: [{ title: search }, { description: search }] }, take: 5, select: { id: true, slug: true, title: true } }),
    db.teamMember.findMany({ where: { OR: [{ name: search }, { bio: search }] }, take: 5, select: { id: true, slug: true, name: true } }),
  ]);

  const results = [
    ...research.map(r => ({ type: "Research", title: r.title, url: `/admin/research/${r.id}` })),
    ...publications.map(p => ({ type: "Publication", title: p.title, url: `/admin/publications/${p.id}` })),
    ...events.map(e => ({ type: "Event", title: e.name, url: `/admin/events/${e.id}` })),
    ...programs.map(p => ({ type: "Program", title: p.title, url: `/admin/programs/${p.id}` })),
    ...blogPosts.map(b => ({ type: "Blog", title: b.title, url: `/admin/blog/${b.id}` })),
    ...mediaItems.map(m => ({ type: "Media", title: m.title, url: `/admin/media-items/${m.id}` })),
    ...resources.map(r => ({ type: "Resource", title: r.title, url: `/admin/resources/${r.id}` })),
    ...careers.map(c => ({ type: "Career", title: c.title, url: `/admin/careers/${c.id}` })),
    ...teamMembers.map(t => ({ type: "Team", title: t.name, url: `/admin/team/${t.id}` })),
  ].slice(0, 15);

  return NextResponse.json({ results });
}

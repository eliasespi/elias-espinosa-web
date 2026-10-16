create table if not exists public.site_content (
  site_key text primary key,
  data jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
alter table public.site_admins enable row level security;

drop policy if exists "public can read published site content" on public.site_content;
create policy "public can read published site content"
on public.site_content
for select
to anon, authenticated
using (published = true);

drop policy if exists "users can read own admin membership" on public.site_admins;
create policy "users can read own admin membership"
on public.site_admins
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "site admins can manage content" on public.site_content;
create policy "site admins can manage content"
on public.site_content
for all
to authenticated
using (
  exists (
    select 1 from public.site_admins
    where site_admins.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.site_admins
    where site_admins.user_id = auth.uid()
  )
);

-- Bootstrap: after the owner signs in once, insert that auth user UUID into
-- public.site_admins using a privileged SQL session or the Supabase dashboard.

insert into public.site_content (site_key, data, published)
values (
  'main',
  '{
    "home": {
      "primary": "Solutions architecture and systems design.",
      "secondary": "Design, travel, photography, and independent work.",
      "areas": "Systems, design, travel, and photography.",
      "workSummary": "Architecture, automation, and platforms.",
      "designSummary": "Interiors, clothing, and objects.",
      "travelSummary": "Places, hotels, and photographs."
    },
    "about": {
      "deck": "Systems, design, travel, and photography.",
      "work": "Architecture, automation, platforms, and data.",
      "design": "Traditional interiors, classic clothing, and well-made objects.",
      "travel": "Architecture, hotels, landscapes, and photographs."
    },
    "contact": {
      "deck": "Consulting and independent systems work.",
      "prompt": "Send me the context and what you’re trying to solve.",
      "focus": "Systems architecture, automation, platforms, and selected digital projects."
    },
    "projects": [
      {
        "slug": "personal-site",
        "title": "Personal site.",
        "category": "Design & development",
        "year": "2026",
        "status": "Ongoing",
        "summary": "Designed and built by me.",
        "focus": "Design / Front-end",
        "stack": "HTML / CSS / JavaScript",
        "url": "https://github.com/eliasespi/elias-espinosa-web",
        "coverUrl": "",
        "order": 1,
        "published": true
      }
    ]
  }'::jsonb,
  true
)
on conflict (site_key) do nothing;

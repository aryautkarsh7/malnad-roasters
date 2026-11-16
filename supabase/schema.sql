-- Run this whole file in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text not null default '',
  price integer not null check (price > 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  status text not null default 'new'
    check (status in ('new', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status text not null default 'paid',
  total integer not null default 0,
  shipping jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  unit_price integer not null,
  quantity integer not null check (quantity > 0)
);

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- Create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users that signed up before this script ran.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- Order placement runs in one transaction: lock the product rows, check
-- stock, decrement it and write the order. Only the service role can call it.
create or replace function public.place_order(p_user uuid, p_items jsonb, p_shipping jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_total integer := 0;
  v_order uuid;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  insert into public.orders (user_id, shipping, total)
  values (p_user, p_shipping, 0)
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;

    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid
    for update;

    if not found then
      raise exception 'PRODUCT_MISSING';
    end if;

    if v_product.stock < v_qty then
      raise exception 'OUT_OF_STOCK:%', v_product.name;
    end if;

    update public.products set stock = stock - v_qty, updated_at = now()
    where id = v_product.id;

    insert into public.order_items (order_id, product_id, name, unit_price, quantity)
    values (v_order, v_product.id, v_product.name, v_product.price, v_qty);

    v_total := v_total + v_product.price * v_qty;
  end loop;

  update public.orders set total = v_total where id = v_order;
  return v_order;
end;
$$;

revoke all on function public.place_order(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.place_order(uuid, jsonb, jsonb) to service_role;

-- Row level security. There are no insert, update or delete policies, so the
-- browser (anon and authenticated roles) can only read. All writes go through
-- the API, which uses the service role key.
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "products: public read" on public.products;
create policy "products: public read" on public.products
  for select using (true);

drop policy if exists "orders: read own" on public.orders;
create policy "orders: read own" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "order items: read own" on public.order_items;
create policy "order items: read own" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

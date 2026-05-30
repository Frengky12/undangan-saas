-- Allow public to read guest messages for active invitations
-- Needed for "Ucapan & Doa" section on public invitation page
create policy "Public can view guest messages"
  on public.guests for select
  using (
    invitation_id in (
      select id from public.invitations where is_active = true
    )
  );

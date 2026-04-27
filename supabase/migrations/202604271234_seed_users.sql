-- Update member count to 6 (the actual flat size)
insert into public.settings (key, value)
values ('member_count', '6')
on conflict (key) do update set value = '6';

-- Rename rooms to match actual roommate pairs
-- Room 1: Yasir Momand & Haris Khan
-- Room 2: Sajid Ali & Ahmad Raza
-- Room 3: Jamil Ur Rahman & Ateeb Raza
update public.rooms set name = 'Yasir & Haris Room'        where name = 'Room 1';
update public.rooms set name = 'Sajid & Raza Room'         where name = 'Room 2';
update public.rooms set name = 'Jamil & Ateeb Room'        where name = 'Room 3';
update public.rooms set name = 'Yasir & Haris Washroom'    where name = 'Room 1 Washroom';
update public.rooms set name = 'Sajid & Raza Washroom'     where name = 'Room 2 Washroom';
update public.rooms set name = 'Jamil & Ateeb Washroom'    where name = 'Room 3 Washroom';

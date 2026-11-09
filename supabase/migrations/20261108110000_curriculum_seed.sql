-- Lentera · Curriculum seed (generated)
-- Jangan mengedit file ini secara manual. Sumber: scripts/content/**/*.ts
-- Jalankan ulang: npm run seed:build
-- Ringkasan: 10 mata pelajaran, 22 level, 22 unit, 57 lesson, 231 soal.

begin;

-- subjects: pemrograman-web
insert into public.subjects (id, slug, name, short_name, description, category, icon_key, accent_color, status, is_primary, sort_order)
values ('b29f7255-7011-4f2c-83e7-23283923651d', 'pemrograman-web', 'Pemrograman Web', 'Web', 'Membangun halaman web dengan HTML, CSS, dan JavaScript, mulai dari struktur hingga interaksi.', 'teknologi', 'code', '#4CA8E8', 'active'::public.subject_status, true, 1)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  accent_color = excluded.accent_color,
  status = excluded.status,
  is_primary = excluded.is_primary,
  sort_order = excluded.sort_order;

-- courses: pemrograman-web
insert into public.courses (id, subject_id, slug, title, description, category, icon_key, sort_order, is_published)
values ('645be3ea-a148-4a2b-824c-1cdfaad0443d', 'b29f7255-7011-4f2c-83e7-23283923651d', 'pemrograman-web', 'Pemrograman Web', 'Membangun halaman web dengan HTML, CSS, dan JavaScript, mulai dari struktur hingga interaksi.', 'teknologi', 'code', 1, true)
on conflict (id) do update set
  subject_id = excluded.subject_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- course_levels: pemrograman-web/beginner
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('9a42e0ef-fc19-4d2e-8e8c-de61a78d3714', '645be3ea-a148-4a2b-824c-1cdfaad0443d', 'beginner', 'Level 1 · Dasar HTML', 'Mengenal struktur dokumen HTML dan tag penting untuk membangun halaman.', 'beginner'::public.difficulty_band, 0, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: pemrograman-web/struktur-halaman-web
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('c07e7327-37b0-4461-8f35-04327dbacc08', '9a42e0ef-fc19-4d2e-8e8c-de61a78d3714', 'struktur-halaman-web', 'Struktur Halaman Web', 'Setiap halaman web dimulai dari struktur HTML yang rapi dan mudah dipahami.', array['Mengenali struktur dasar dokumen HTML', 'Menggunakan tag teks, gambar, dan tautan', 'Memilih tag semantik yang sesuai']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: pemrograman-web/html-dasar
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('c5703dd2-91c7-4432-88ff-7c5573989dce', 'c07e7327-37b0-4461-8f35-04327dbacc08', 'html-dasar', 'HTML Dasar', 'Mengenal tag pembentuk halaman web dan perannya.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: pemrograman-web/html-dasar
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('ca1eb39e-8a2b-4217-8c2b-dbc43c44657e', 'c07e7327-37b0-4461-8f35-04327dbacc08', 'lesson-html-dasar', 'HTML Dasar', 'Mengenal tag pembentuk halaman web dan perannya.', 'lesson'::public.node_kind, 'c5703dd2-91c7-4432-88ff-7c5573989dce', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: pemrograman-web/html-dasar/html-heading
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('e1cd5413-b7bc-4540-8d42-f69a7b48b402', 'c5703dd2-91c7-4432-88ff-7c5573989dce', 'html-heading', 'multiple_choice'::public.question_type, 'HTML', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Tag HTML mana yang digunakan untuk judul utama halaman?', '<h1> adalah heading tingkat pertama yang menandai judul utama. <title> dipakai untuk judul tab browser, bukan isi halaman.', 'Heading memiliki tingkat h1 sampai h6.', 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/html-dasar/html-heading/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('bd97d3e5-dc68-4f10-8620-fe32d23a9c97', 'e1cd5413-b7bc-4540-8d42-f69a7b48b402', '<h1>', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-dasar/html-heading/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6fc8c6f9-7874-4b15-859a-7e2fc328b37e', 'e1cd5413-b7bc-4540-8d42-f69a7b48b402', '<p>', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-dasar/html-heading/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('913a3b52-4d3c-425f-89f9-16ed7fcd816c', 'e1cd5413-b7bc-4540-8d42-f69a7b48b402', '<title>', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-dasar/html-heading/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('35999a8a-3a8d-4edd-8a1d-7694d02851d0', 'e1cd5413-b7bc-4540-8d42-f69a7b48b402', '<header>', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/html-dasar/html-paragraph
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('cf927459-bee2-4aac-895b-b84948236f74', 'c5703dd2-91c7-4432-88ff-7c5573989dce', 'html-paragraph', 'multiple_choice'::public.question_type, 'HTML', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Apa fungsi tag <p>?', '<p> membungkus satu paragraf teks. Tautan memakai <a>, gambar memakai <img>, dan tabel memakai <table>.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/html-dasar/html-paragraph/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('49e491a4-346b-4317-831b-d48eca20ba05', 'cf927459-bee2-4aac-895b-b84948236f74', 'Membuat paragraf teks', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-dasar/html-paragraph/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('fda89e83-8857-4661-8bb6-bdc1e9dffd83', 'cf927459-bee2-4aac-895b-b84948236f74', 'Membuat tautan', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-dasar/html-paragraph/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2459f5a7-8d47-496c-845d-7b6aa4713ba3', 'cf927459-bee2-4aac-895b-b84948236f74', 'Menyisipkan gambar', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-dasar/html-paragraph/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1adbe08e-91a4-4d9e-8882-37d383fc7750', 'cf927459-bee2-4aac-895b-b84948236f74', 'Membuat tabel', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/html-dasar/html-link
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('314ef259-bfd8-464f-88cc-73b11cb2c679', 'c5703dd2-91c7-4432-88ff-7c5573989dce', 'html-link', 'multiple_choice'::public.question_type, 'HTML', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Atribut apa yang menentukan tujuan sebuah tautan pada tag <a>?', 'Atribut href berisi alamat tujuan tautan. Atribut src dipakai gambar, sedangkan alt menyediakan teks alternatif.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/html-dasar/html-link/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5580b0fd-97a6-4a98-8765-4c849d33e269', '314ef259-bfd8-464f-88cc-73b11cb2c679', 'href', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-dasar/html-link/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('50a68e9a-6f71-40e6-87af-eb501a30610c', '314ef259-bfd8-464f-88cc-73b11cb2c679', 'src', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-dasar/html-link/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('bb68c7b9-1dea-4aa5-8080-a215f5167799', '314ef259-bfd8-464f-88cc-73b11cb2c679', 'alt', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-dasar/html-link/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('04a48c50-3afd-45f2-8d14-58315f784ec1', '314ef259-bfd8-464f-88cc-73b11cb2c679', 'class', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/html-dasar/html-image-tag
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('71bc6bbe-7662-474f-8494-07179e8b6c5c', 'c5703dd2-91c7-4432-88ff-7c5573989dce', 'html-image-tag', 'fill_blank'::public.question_type, 'HTML', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Lengkapi tag berikut agar menampilkan gambar: <__ src="logo.png" alt="Logo">', 'Tag <img> menampilkan gambar melalui atribut src. Alt wajib diisi agar gambar tetap bermakna bagi pembaca layar.', 'Namanya singkatan dari image.', 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: pemrograman-web/html-dasar/html-image-tag/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('7d0c6072-121b-4343-81b8-77bb89e13c22', '71bc6bbe-7662-474f-8494-07179e8b6c5c', 'img', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: pemrograman-web/html-dasar/html-nav
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('e561754e-0c3f-45ec-82cc-5d2fbf1cccc0', 'c5703dd2-91c7-4432-88ff-7c5573989dce', 'html-nav', 'multiple_choice'::public.question_type, 'HTML Semantik', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Tag semantik yang paling tepat untuk membungkus menu navigasi adalah…', '<nav> menandai area navigasi utama. <main> adalah konten utama halaman, bukan daftar menu.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/html-dasar/html-nav/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('44befe3e-1ab5-4e8d-86ff-bb5b8ae7ab33', 'e561754e-0c3f-45ec-82cc-5d2fbf1cccc0', '<nav>', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-dasar/html-nav/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9e28e90a-dfa0-4c70-88b2-ffc17f528313', 'e561754e-0c3f-45ec-82cc-5d2fbf1cccc0', '<div>', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-dasar/html-nav/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('13dac45c-a435-4d3d-8474-b84a824529d7', 'e561754e-0c3f-45ec-82cc-5d2fbf1cccc0', '<span>', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-dasar/html-nav/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1302c310-6ca8-48b2-8952-6cbb426a7bf4', 'e561754e-0c3f-45ec-82cc-5d2fbf1cccc0', '<main>', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: pemrograman-web/html-review
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('64982b19-8f37-440b-89bf-fd5be9912e29', 'c07e7327-37b0-4461-8f35-04327dbacc08', 'html-review', 'Review HTML', 'Periksa kembali pemahaman struktur dan tag semantik HTML.', 'review'::public.lesson_kind, 5, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: pemrograman-web/html-review
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('fa98913e-aca7-4230-8de7-6825fbb99483', 'c07e7327-37b0-4461-8f35-04327dbacc08', 'lesson-html-review', 'Review HTML', 'Periksa kembali pemahaman struktur dan tag semantik HTML.', 'review'::public.node_kind, '64982b19-8f37-440b-89bf-fd5be9912e29', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: pemrograman-web/html-review/review-html-main
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('a5a5dc49-ddb8-4de5-89f0-8637128ce1c5', '64982b19-8f37-440b-89bf-fd5be9912e29', 'review-html-main', 'multiple_choice'::public.question_type, 'HTML Semantik', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Tag yang menandai konten utama halaman adalah…', '<main> membungkus konten utama yang unik untuk halaman tersebut. <nav> khusus navigasi.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/html-review/review-html-main/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0e88b6a8-8fac-4835-894f-a9f58e6744b2', 'a5a5dc49-ddb8-4de5-89f0-8637128ce1c5', '<main>', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-review/review-html-main/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ab79a0af-c241-4e61-8e93-5d429f3ac0c7', 'a5a5dc49-ddb8-4de5-89f0-8637128ce1c5', '<section>', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-review/review-html-main/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6f07c773-f577-4ba4-834e-b7266f75028c', 'a5a5dc49-ddb8-4de5-89f0-8637128ce1c5', '<footer>', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-review/review-html-main/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d6ea99af-2c24-48ca-8b6c-07bf4dc74776', 'a5a5dc49-ddb8-4de5-89f0-8637128ce1c5', '<nav>', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/html-review/review-html-alt
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('3bc5c6e2-b5dc-4083-8399-847c9db9e69b', '64982b19-8f37-440b-89bf-fd5be9912e29', 'review-html-alt', 'multiple_choice'::public.question_type, 'Aksesibilitas', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Apa fungsi atribut alt pada elemen gambar?', 'Alt adalah teks alternatif yang menjelaskan gambar ketika gambar tidak tampil atau dibaca oleh pembaca layar.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/html-review/review-html-alt/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('882c542b-7237-4b14-89b6-49deea3bb346', '3bc5c6e2-b5dc-4083-8399-847c9db9e69b', 'Memberi deskripsi gambar untuk pembaca layar', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-review/review-html-alt/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a95421ab-f6a4-454c-8f49-77e938ac1f1d', '3bc5c6e2-b5dc-4083-8399-847c9db9e69b', 'Mengatur ukuran gambar', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-review/review-html-alt/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('54efa8b6-70e4-4a25-881d-7ffc4b904172', '3bc5c6e2-b5dc-4083-8399-847c9db9e69b', 'Menentukan alamat gambar', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-review/review-html-alt/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('81bc7554-6674-4d80-8061-281bdfcb808d', '3bc5c6e2-b5dc-4083-8399-847c9db9e69b', 'Membuat gambar dapat diklik', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/html-review/review-html-ol
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('d409e921-26cf-4a99-80ab-b477dafd96df', '64982b19-8f37-440b-89bf-fd5be9912e29', 'review-html-ol', 'typing'::public.question_type, 'HTML', 'beginner'::public.difficulty_band, 'Tulis jawaban pada kolom yang tersedia.', 'Tulis tag pembuka HTML untuk membuat daftar berurutan.', '<ol> membuat ordered list atau daftar bernomor. <ul> dipakai untuk daftar tanpa urutan.', null, 15, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: pemrograman-web/html-review/review-html-ol/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('50e4d39f-f759-4b6f-89f9-28eebbb46e0d', 'd409e921-26cf-4a99-80ab-b477dafd96df', '<ol>', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- question_answers: pemrograman-web/html-review/review-html-ol/1
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('f52393a3-53c2-40c7-8f94-c1241f67896b', 'd409e921-26cf-4a99-80ab-b477dafd96df', 'ol', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- lessons: pemrograman-web/html-challenge
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('a8a99079-b024-482b-848c-6ea63d3d18f1', 'c07e7327-37b0-4461-8f35-04327dbacc08', 'html-challenge', 'Tantangan HTML', 'Latihan lebih menantang tentang pemilihan elemen dan atribut.', 'challenge'::public.lesson_kind, 6, 10, 2, 2, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: pemrograman-web/html-challenge
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('6719cb9d-20ad-4e34-88eb-7983e5285321', 'c07e7327-37b0-4461-8f35-04327dbacc08', 'lesson-html-challenge', 'Tantangan HTML', 'Latihan lebih menantang tentang pemilihan elemen dan atribut.', 'challenge'::public.node_kind, 'a8a99079-b024-482b-848c-6ea63d3d18f1', 20, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: pemrograman-web/html-challenge/challenge-html-article
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('1166f759-f0c0-41f3-8128-b408968c6aeb', 'a8a99079-b024-482b-848c-6ea63d3d18f1', 'challenge-html-article', 'multiple_choice'::public.question_type, 'HTML Semantik', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Elemen paling tepat untuk membungkus tulisan mandiri seperti artikel blog adalah…', '<article> menandai konten mandiri yang masih bermakna jika dipisahkan dari halaman.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/html-challenge/challenge-html-article/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('348e9dd9-387c-4619-8a40-c48282192b03', '1166f759-f0c0-41f3-8128-b408968c6aeb', '<article>', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-challenge/challenge-html-article/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('639d7c7b-d715-43ff-8e4c-470e2aaf9e88', '1166f759-f0c0-41f3-8128-b408968c6aeb', '<div>', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-challenge/challenge-html-article/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9f94fb80-20dc-4844-8dd9-08a646ef8e8b', '1166f759-f0c0-41f3-8128-b408968c6aeb', '<span>', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-challenge/challenge-html-article/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f254a41d-5e36-4026-832d-bd645d1f353c', '1166f759-f0c0-41f3-8128-b408968c6aeb', '<thead>', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/html-challenge/challenge-html-target
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('37a574c9-5a2a-4a94-8dcc-f49d5d02b970', 'a8a99079-b024-482b-848c-6ea63d3d18f1', 'challenge-html-target', 'fill_blank'::public.question_type, 'HTML', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Agar tautan terbuka di tab baru, isi atribut target dengan "___".', 'target="_blank" membuka tautan di tab atau jendela baru. Sertakan rel="noopener" untuk keamanan.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: pemrograman-web/html-challenge/challenge-html-target/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('267bc60d-84b5-4997-8f03-724aaf2e1b68', '37a574c9-5a2a-4a94-8dcc-f49d5d02b970', '_blank', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: pemrograman-web/html-challenge/challenge-html-aside
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('5e3ad3a7-4d2b-4406-8c44-a58e41163ebe', 'a8a99079-b024-482b-848c-6ea63d3d18f1', 'challenge-html-aside', 'multiple_choice'::public.question_type, 'HTML Semantik', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Konten pelengkap di samping artikel utama paling tepat dibungkus dengan…', '<aside> dipakai untuk konten yang berkaitan tetapi bukan bagian utama, misalnya catatan atau tautan terkait.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/html-challenge/challenge-html-aside/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('eb49453a-5e5f-4ae7-8fd4-22221804139c', '5e3ad3a7-4d2b-4406-8c44-a58e41163ebe', '<aside>', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-challenge/challenge-html-aside/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('bd4f24b5-2028-41b9-8605-1a21778b9a69', '5e3ad3a7-4d2b-4406-8c44-a58e41163ebe', '<header>', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-challenge/challenge-html-aside/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('71caf10e-66e5-4ed1-8436-5192884fe70e', '5e3ad3a7-4d2b-4406-8c44-a58e41163ebe', '<footer>', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/html-challenge/challenge-html-aside/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1d0a9d2a-96ee-4706-8f62-b1bf3a6eb30a', '5e3ad3a7-4d2b-4406-8c44-a58e41163ebe', '<main>', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- course_levels: pemrograman-web/elementary
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('3b38c4c9-bb14-4238-8ee1-84f2cee25fd1', '645be3ea-a148-4a2b-824c-1cdfaad0443d', 'elementary', 'Level 2 · CSS dan Layout', 'Menata warna, jarak, dan susunan elemen dengan CSS modern.', 'elementary'::public.difficulty_band, 1, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: pemrograman-web/menata-tampilan
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('070e86a2-1e02-4efb-83b5-f0637e8df13f', '3b38c4c9-bb14-4238-8ee1-84f2cee25fd1', 'menata-tampilan', 'Menata Tampilan Halaman', 'CSS mengubah struktur HTML menjadi tampilan yang nyaman dibaca.', array['Menulis selector class dan properti dasar', 'Mengatur jarak dengan padding dan margin', 'Menyusun elemen dengan Flexbox', 'Menerapkan media query sederhana']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: pemrograman-web/css-dasar
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('facf6810-52c3-493f-85c3-fbe64ac2d10a', '070e86a2-1e02-4efb-83b5-f0637e8df13f', 'css-dasar', 'CSS Dasar', 'Selector, properti, dan layout responsif untuk halaman web.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: pemrograman-web/css-dasar
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('3de992b0-3fd6-4354-8f33-58b44be6e347', '070e86a2-1e02-4efb-83b5-f0637e8df13f', 'lesson-css-dasar', 'CSS Dasar', 'Selector, properti, dan layout responsif untuk halaman web.', 'lesson'::public.node_kind, 'facf6810-52c3-493f-85c3-fbe64ac2d10a', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: pemrograman-web/css-dasar/css-class-selector
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('b14bebb4-206b-49fc-8f3c-ea96c43e3d7e', 'facf6810-52c3-493f-85c3-fbe64ac2d10a', 'css-class-selector', 'multiple_choice'::public.question_type, 'CSS', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Selector CSS untuk semua elemen dengan class card adalah…', 'Titik (.) menandai class, sedangkan tanda pagar (#) menandai id. Tanpa simbol berarti selector tag.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/css-dasar/css-class-selector/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('68b00c02-e22c-4423-8fc3-7db4e1036671', 'b14bebb4-206b-49fc-8f3c-ea96c43e3d7e', '.card', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/css-dasar/css-class-selector/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1eaf630d-1c8c-41da-8b25-b4c6213a1e58', 'b14bebb4-206b-49fc-8f3c-ea96c43e3d7e', '#card', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/css-dasar/css-class-selector/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('81c655f6-e721-45e0-84f1-078514814a1f', 'b14bebb4-206b-49fc-8f3c-ea96c43e3d7e', 'card', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/css-dasar/css-class-selector/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b85a6260-0013-48ca-8cd1-d2b02e26f7fd', 'b14bebb4-206b-49fc-8f3c-ea96c43e3d7e', '*card', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/css-dasar/css-text-color
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('51398e79-401a-4d97-897c-d23a35310c7e', 'facf6810-52c3-493f-85c3-fbe64ac2d10a', 'css-text-color', 'multiple_choice'::public.question_type, 'CSS', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Properti apa yang mengubah warna teks?', 'color mengatur warna teks. background-color mengatur warna latar, bukan warna huruf.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/css-dasar/css-text-color/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1caf3e93-9b34-43e7-8737-a6c8dff19d09', '51398e79-401a-4d97-897c-d23a35310c7e', 'color', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/css-dasar/css-text-color/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a626f658-982a-402d-8418-687038811e7a', '51398e79-401a-4d97-897c-d23a35310c7e', 'background-color', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/css-dasar/css-text-color/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('abce0068-b277-4094-8a44-d18a9845e3c2', '51398e79-401a-4d97-897c-d23a35310c7e', 'font-size', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/css-dasar/css-text-color/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d8f5af70-17d1-4147-80e0-cf77bd8b4bc0', '51398e79-401a-4d97-897c-d23a35310c7e', 'border', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/css-dasar/css-flex-row
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('a1e975d1-4f19-4c0a-8a94-0b7918dc7bb6', 'facf6810-52c3-493f-85c3-fbe64ac2d10a', 'css-flex-row', 'multiple_choice'::public.question_type, 'Layout', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Agar anak elemen tersusun horizontal dengan Flexbox, properti pada container adalah…', 'display: flex mengaktifkan Flexbox dan secara default menata anak elemen dalam satu baris horizontal.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/css-dasar/css-flex-row/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e5074eef-3a00-4758-8138-8939201195a2', 'a1e975d1-4f19-4c0a-8a94-0b7918dc7bb6', 'display: flex', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/css-dasar/css-flex-row/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b460813e-b906-4bea-8300-e49924ec879b', 'a1e975d1-4f19-4c0a-8a94-0b7918dc7bb6', 'position: absolute', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/css-dasar/css-flex-row/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('120054e2-a3a8-48bb-8600-db80fa15c7f7', 'a1e975d1-4f19-4c0a-8a94-0b7918dc7bb6', 'text-align: center', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/css-dasar/css-flex-row/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('77cbcea2-2aea-4294-8406-bf9d7157db5e', 'a1e975d1-4f19-4c0a-8a94-0b7918dc7bb6', 'overflow: hidden', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/css-dasar/css-padding
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('8b9e1051-0200-4b7f-8def-6a768add3e6f', 'facf6810-52c3-493f-85c3-fbe64ac2d10a', 'css-padding', 'fill_blank'::public.question_type, 'Box Model', 'elementary'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Properti CSS untuk jarak antara konten dan border di dalam elemen adalah ___', 'Padding adalah ruang di dalam elemen. Margin adalah ruang di luar elemen.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: pemrograman-web/css-dasar/css-padding/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('f2a671c8-f9cb-42b3-8d93-65da0e048b3c', '8b9e1051-0200-4b7f-8def-6a768add3e6f', 'padding', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: pemrograman-web/css-dasar/css-media-query
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('ce22deec-c730-44b2-8ab0-9c108055ccb3', 'facf6810-52c3-493f-85c3-fbe64ac2d10a', 'css-media-query', 'multiple_choice'::public.question_type, 'Responsive Design', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Media query untuk layar dengan lebar maksimal 768px adalah…', 'max-width berarti aturan berlaku pada layar yang lebarnya tidak lebih dari 768px.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/css-dasar/css-media-query/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b74e5cb8-1f82-4080-8a6a-c903c910bb11', 'ce22deec-c730-44b2-8ab0-9c108055ccb3', '@media (max-width: 768px)', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/css-dasar/css-media-query/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ad399a2a-cd04-4a27-888f-a651b4a561b3', 'ce22deec-c730-44b2-8ab0-9c108055ccb3', '@media (min-width: 768px)', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/css-dasar/css-media-query/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b1c753c2-7a12-4db4-88dd-5ead892311ec', 'ce22deec-c730-44b2-8ab0-9c108055ccb3', 'media(max-width)', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/css-dasar/css-media-query/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('23395c76-cde9-4011-8117-d796ddbf6d18', 'ce22deec-c730-44b2-8ab0-9c108055ccb3', '@query max-width 768px', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: pemrograman-web/latihan-css-layout
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('e4997619-632e-4e9b-84c5-4cabab6c455c', '070e86a2-1e02-4efb-83b5-f0637e8df13f', 'latihan-css-layout', 'Latihan CSS & Layout', 'Latihan terarah untuk properti CSS yang paling sering dipakai.', 'practice'::public.lesson_kind, 6, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: pemrograman-web/latihan-css-layout
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('bfc30231-386b-43fd-885f-c4d8f32f2f6a', '070e86a2-1e02-4efb-83b5-f0637e8df13f', 'lesson-latihan-css-layout', 'Latihan CSS & Layout', 'Latihan terarah untuk properti CSS yang paling sering dipakai.', 'practice'::public.node_kind, 'e4997619-632e-4e9b-84c5-4cabab6c455c', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: pemrograman-web/latihan-css-layout/practice-web-padding
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('7b2185f7-30de-47aa-8873-30a268df67e8', 'e4997619-632e-4e9b-84c5-4cabab6c455c', 'practice-web-padding', 'multiple_choice'::public.question_type, 'CSS Box Model', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Properti CSS yang mengatur jarak di dalam batas elemen adalah…', 'Padding memberi ruang antara konten dan border. Margin memberi jarak di luar border.', 'Bayangkan bantalan di dalam kotak.', 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/latihan-css-layout/practice-web-padding/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a13b3d97-ac8f-4893-842b-3bdd98712812', '7b2185f7-30de-47aa-8873-30a268df67e8', 'padding', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/latihan-css-layout/practice-web-padding/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e1b62dc7-9fbc-4266-8669-cad5f4550aeb', '7b2185f7-30de-47aa-8873-30a268df67e8', 'margin', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/latihan-css-layout/practice-web-padding/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2fa5d654-d2f8-4433-8042-126e1459af20', '7b2185f7-30de-47aa-8873-30a268df67e8', 'border', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/latihan-css-layout/practice-web-padding/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3de1a211-345a-47c3-8ac9-d39379971844', '7b2185f7-30de-47aa-8873-30a268df67e8', 'outline', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/latihan-css-layout/practice-web-flex-row
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('fb5cd592-42e8-4d8f-8330-9c8882708c82', 'e4997619-632e-4e9b-84c5-4cabab6c455c', 'practice-web-flex-row', 'multiple_choice'::public.question_type, 'Flexbox', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Pada container dengan display: flex, arah susunan default anak-anaknya adalah…', 'Flexbox memakai flex-direction: row secara default, sehingga anak tersusun horizontal.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/latihan-css-layout/practice-web-flex-row/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5f24f2ae-1128-4895-8e2c-599f2b012018', 'fb5cd592-42e8-4d8f-8330-9c8882708c82', 'horizontal (row)', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/latihan-css-layout/practice-web-flex-row/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1d93164e-fa23-4df3-8076-da085eda67a9', 'fb5cd592-42e8-4d8f-8330-9c8882708c82', 'vertikal (column)', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/latihan-css-layout/practice-web-flex-row/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c95f6e8a-abc9-4c0a-8793-5b29a3ba655b', 'fb5cd592-42e8-4d8f-8330-9c8882708c82', 'grid dua dimensi', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/latihan-css-layout/practice-web-flex-row/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d66e0872-1db6-4cb9-8103-9ea17abb2aed', 'fb5cd592-42e8-4d8f-8330-9c8882708c82', 'posisi absolute', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/latihan-css-layout/practice-web-selector-p
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('fe00a96f-18ec-44a8-8b53-cfd0a83c5483', 'e4997619-632e-4e9b-84c5-4cabab6c455c', 'practice-web-selector-p', 'typing'::public.question_type, 'Selector CSS', 'elementary'::public.difficulty_band, 'Tulis jawaban pada kolom yang tersedia.', 'Tulis selector CSS untuk memilih semua elemen <p>.', 'Selector p memilih seluruh elemen paragraf tanpa tanda titik atau pagar.', null, 15, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: pemrograman-web/latihan-css-layout/practice-web-selector-p/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('61bf6608-5772-4d0b-81eb-8eba9a2168be', 'fe00a96f-18ec-44a8-8b53-cfd0a83c5483', 'p', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- lessons: pemrograman-web/checkpoint-html-css
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('7e09aa11-0971-4c47-81b1-9eab0b9621b8', '070e86a2-1e02-4efb-83b5-f0637e8df13f', 'checkpoint-html-css', 'Checkpoint HTML & CSS', 'Periksa pemahaman struktur dan penataan sebelum masuk JavaScript.', 'review'::public.lesson_kind, 8, 10, 2, 2, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: pemrograman-web/checkpoint-html-css
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('7f29db96-130a-4075-815e-4a32a21e96d3', '070e86a2-1e02-4efb-83b5-f0637e8df13f', 'lesson-checkpoint-html-css', 'Checkpoint HTML & CSS', 'Periksa pemahaman struktur dan penataan sebelum masuk JavaScript.', 'checkpoint'::public.node_kind, '7e09aa11-0971-4c47-81b1-9eab0b9621b8', 20, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: pemrograman-web/checkpoint-html-css/checkpoint-web-main
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('00246c34-fcdc-48b1-8bca-644d4fc5c2db', '7e09aa11-0971-4c47-81b1-9eab0b9621b8', 'checkpoint-web-main', 'multiple_choice'::public.question_type, 'HTML Semantik', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Tag yang menandai konten utama halaman adalah…', '<main> membungkus konten utama yang unik. <nav> untuk navigasi, <aside> untuk konten samping, <footer> untuk penutup.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/checkpoint-html-css/checkpoint-web-main/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5c95b118-5f33-4f10-864c-5049e6eefebb', '00246c34-fcdc-48b1-8bca-644d4fc5c2db', '<main>', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/checkpoint-html-css/checkpoint-web-main/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1cbb5e4d-89b1-479b-82ba-605533d0250b', '00246c34-fcdc-48b1-8bca-644d4fc5c2db', '<nav>', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/checkpoint-html-css/checkpoint-web-main/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f981a162-df48-4667-8fe1-6bd1972786a4', '00246c34-fcdc-48b1-8bca-644d4fc5c2db', '<aside>', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/checkpoint-html-css/checkpoint-web-main/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('06d640f1-3e6b-4bcf-80cc-bb8d7b40627a', '00246c34-fcdc-48b1-8bca-644d4fc5c2db', '<footer>', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/checkpoint-html-css/checkpoint-web-em
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('fedee882-d95a-42aa-82bf-3816c8113b6c', '7e09aa11-0971-4c47-81b1-9eab0b9621b8', 'checkpoint-web-em', 'multiple_choice'::public.question_type, 'Satuan CSS', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Satuan CSS yang relatif terhadap ukuran font elemen induk adalah…', 'em dihitung dari font-size induk. rem dihitung dari font-size root, px bersifat tetap, dan vh relatif terhadap tinggi viewport.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/checkpoint-html-css/checkpoint-web-em/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f612579b-46fb-4f5d-8105-28ee221c201d', 'fedee882-d95a-42aa-82bf-3816c8113b6c', 'em', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/checkpoint-html-css/checkpoint-web-em/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0e71c0c8-68ff-4d5e-85aa-72bb08d75143', 'fedee882-d95a-42aa-82bf-3816c8113b6c', 'px', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/checkpoint-html-css/checkpoint-web-em/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('47a4fe4a-f1b2-409a-87ce-e08777b445c9', 'fedee882-d95a-42aa-82bf-3816c8113b6c', 'vh', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/checkpoint-html-css/checkpoint-web-em/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('73978d44-b99a-4b49-8524-299287123e1d', 'fedee882-d95a-42aa-82bf-3816c8113b6c', 'pt', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/checkpoint-html-css/checkpoint-web-grid
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('63835c7a-2c18-4bf8-8380-4a46c397ed6e', '7e09aa11-0971-4c47-81b1-9eab0b9621b8', 'checkpoint-web-grid', 'fill_blank'::public.question_type, 'CSS Grid', 'elementary'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Lengkapi: .galeri { display: __; grid-template-columns: repeat(3, 1fr); }', 'display: grid mengaktifkan tata letak dua dimensi; grid-template-columns menentukan jumlah kolom.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: pemrograman-web/checkpoint-html-css/checkpoint-web-grid/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('306c04df-3c8c-47ff-899b-540953a4179b', '63835c7a-2c18-4bf8-8380-4a46c397ed6e', 'grid', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- course_levels: pemrograman-web/intermediate
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('b9840911-3f31-4653-8408-f9a045faa514', '645be3ea-a148-4a2b-824c-1cdfaad0443d', 'intermediate', 'Level 3 · JavaScript dan DOM', 'Membuat halaman merespons aksi pengguna melalui JavaScript dan DOM.', 'intermediate'::public.difficulty_band, 2, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: pemrograman-web/halaman-interaktif
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('c98e76ce-490d-4743-8b3d-7cd9c5330f3b', 'b9840911-3f31-4653-8408-f9a045faa514', 'halaman-interaktif', 'Membuat Halaman Interaktif', 'JavaScript menghubungkan tampilan dengan data dan aksi pengguna secara langsung.', array['Mendeklarasikan variabel dengan tepat', 'Memilih elemen DOM', 'Menangani event klik dan submit']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: pemrograman-web/javascript-dom
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('70e47e94-b396-4455-83f5-8092ad3f8a4a', 'c98e76ce-490d-4743-8b3d-7cd9c5330f3b', 'javascript-dom', 'JavaScript dan DOM', 'Mengubah halaman berdasarkan interaksi pengguna.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: pemrograman-web/javascript-dom
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('4d7cefe9-d519-468d-804e-cb00836b51b6', 'c98e76ce-490d-4743-8b3d-7cd9c5330f3b', 'lesson-javascript-dom', 'JavaScript dan DOM', 'Mengubah halaman berdasarkan interaksi pengguna.', 'lesson'::public.node_kind, '70e47e94-b396-4455-83f5-8092ad3f8a4a', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: pemrograman-web/javascript-dom/js-const
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('31e6d89e-c4ca-4313-8bb4-074a9ebd921e', '70e47e94-b396-4455-83f5-8092ad3f8a4a', 'js-const', 'multiple_choice'::public.question_type, 'JavaScript', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Kata kunci untuk mendeklarasikan nilai yang tidak akan diganti adalah…', 'const dipakai untuk konstanta. let dipakai bila nilainya perlu berubah, sedangkan var memiliki aturan scope lama.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/javascript-dom/js-const/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('68607156-4e9f-4f8d-81fe-457eeb4fc9e4', '31e6d89e-c4ca-4313-8bb4-074a9ebd921e', 'const', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/javascript-dom/js-const/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3ac20e09-48e2-4f7d-8afb-78619b090d8d', '31e6d89e-c4ca-4313-8bb4-074a9ebd921e', 'let', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/javascript-dom/js-const/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('05abc81f-dc71-40e5-8744-8be2e404fe18', '31e6d89e-c4ca-4313-8bb4-074a9ebd921e', 'var', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/javascript-dom/js-const/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0ca6e39b-d3e8-4859-81cc-2b4513cdb2fd', '31e6d89e-c4ca-4313-8bb4-074a9ebd921e', 'static', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/javascript-dom/js-get-element-by-id
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('9dc95223-1838-46ee-8bf6-a6706849bf76', '70e47e94-b396-4455-83f5-8092ad3f8a4a', 'js-get-element-by-id', 'multiple_choice'::public.question_type, 'DOM', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Cara memilih elemen dengan id judul adalah…', 'getElementById menerima nama id tanpa tanda pagar. querySelector(''.judul'') memilih class.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/javascript-dom/js-get-element-by-id/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c19f1f08-6f09-4c0d-8a74-c962843c3f12', '9dc95223-1838-46ee-8bf6-a6706849bf76', 'document.getElementById(''judul'')', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/javascript-dom/js-get-element-by-id/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6d38d79b-c1f9-4348-81fa-9720272ba07e', '9dc95223-1838-46ee-8bf6-a6706849bf76', 'document.querySelector(''.judul'')', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/javascript-dom/js-get-element-by-id/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7d5fde26-0b1f-467a-8ae9-dfc9203f01e2', '9dc95223-1838-46ee-8bf6-a6706849bf76', 'document.getElementsByTagName(''judul'')', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/javascript-dom/js-get-element-by-id/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8fece134-457b-4cd0-8cab-25157087f04c', '9dc95223-1838-46ee-8bf6-a6706849bf76', 'document.querySelectorAll(''#judul'')', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/javascript-dom/js-click-event
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('4ca6bf4d-b42e-4534-8e22-6c0631396ec8', '70e47e94-b396-4455-83f5-8092ad3f8a4a', 'js-click-event', 'multiple_choice'::public.question_type, 'Event', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Event apa yang terjadi ketika sebuah tombol ditekan?', 'click terjadi saat elemen diklik. submit khusus form, dan load terjadi saat sumber selesai dimuat.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/javascript-dom/js-click-event/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d9bb83b2-baae-459a-8ddd-574b79afebd0', '4ca6bf4d-b42e-4534-8e22-6c0631396ec8', 'click', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/javascript-dom/js-click-event/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ca9357b4-79c2-4b03-81d3-2b53013a70bb', '4ca6bf4d-b42e-4534-8e22-6c0631396ec8', 'hover', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/javascript-dom/js-click-event/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('23a5477b-d804-47d7-8e27-1a53a7f3ec3e', '4ca6bf4d-b42e-4534-8e22-6c0631396ec8', 'submit', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/javascript-dom/js-click-event/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b915bcfe-923b-4fcc-802c-9d17186d92ff', '4ca6bf4d-b42e-4534-8e22-6c0631396ec8', 'load', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/javascript-dom/js-strict-equality
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('64fd6978-333b-415c-879c-b10e411b4fa0', '70e47e94-b396-4455-83f5-8092ad3f8a4a', 'js-strict-equality', 'fill_blank'::public.question_type, 'Operator', 'intermediate'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Operator yang membandingkan nilai sekaligus tipe data adalah ___', '=== membandingkan nilai dan tipe. == hanya membandingkan nilai setelah konversi tipe.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: pemrograman-web/javascript-dom/js-strict-equality/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('29fcc40e-df8a-42cc-821e-70540279569b', '64fd6978-333b-415c-879c-b10e411b4fa0', '===', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: pemrograman-web/javascript-dom/js-prevent-default
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('905c6931-0e8d-41fa-82b4-0595fe0f8544', '70e47e94-b396-4455-83f5-8092ad3f8a4a', 'js-prevent-default', 'multiple_choice'::public.question_type, 'Form', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Agar form tidak memuat ulang halaman saat dikirim, panggil…', 'preventDefault membatalkan perilaku bawaan form, yaitu memuat ulang halaman.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/javascript-dom/js-prevent-default/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1eb549e7-1dd1-461c-8b2c-c907f4769d27', '905c6931-0e8d-41fa-82b4-0595fe0f8544', 'event.preventDefault()', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/javascript-dom/js-prevent-default/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('148f231a-32e8-4653-8b2c-b35d4946ed02', '905c6931-0e8d-41fa-82b4-0595fe0f8544', 'event.stopPropagation()', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/javascript-dom/js-prevent-default/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('94baec32-074d-46c0-8d48-637b8098881b', '905c6931-0e8d-41fa-82b4-0595fe0f8544', 'window.reload()', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/javascript-dom/js-prevent-default/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f851fc8f-0428-4924-8a8d-f328285b7568', '905c6931-0e8d-41fa-82b4-0595fe0f8544', 'form.reset()', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: pemrograman-web/legendary-web-dom
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('73e64202-ab73-484d-8ee4-865a66ec7b82', 'c98e76ce-490d-4743-8b3d-7cd9c5330f3b', 'legendary-web-dom', 'Legendary JavaScript DOM', 'Tantangan lanjutan tentang DOM, event, dan perilaku browser.', 'legendary'::public.lesson_kind, 9, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: pemrograman-web/legendary-web-dom
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('06b48464-9d97-4964-8024-08ffda31216b', 'c98e76ce-490d-4743-8b3d-7cd9c5330f3b', 'lesson-legendary-web-dom', 'Legendary JavaScript DOM', 'Tantangan lanjutan tentang DOM, event, dan perilaku browser.', 'legendary'::public.node_kind, '73e64202-ab73-484d-8ee4-865a66ec7b82', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: pemrograman-web/legendary-web-dom/legendary-web-queryall
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('ca7def82-6723-4538-8399-63d0d7b82e20', '73e64202-ab73-484d-8ee4-865a66ec7b82', 'legendary-web-queryall', 'multiple_choice'::public.question_type, 'DOM', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'document.querySelectorAll(".item") mengembalikan…', 'querySelectorAll mengembalikan NodeList statis. Perubahan DOM setelah pemanggilan tidak otomatis memperbarui daftar tersebut.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/legendary-web-dom/legendary-web-queryall/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c1c19d61-f4a8-4a96-8053-e12e3331fd73', 'ca7def82-6723-4538-8399-63d0d7b82e20', 'NodeList statis berisi semua elemen yang cocok', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/legendary-web-dom/legendary-web-queryall/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('02c6eeda-28b4-462e-8faf-e1e6e76d5c7d', 'ca7def82-6723-4538-8399-63d0d7b82e20', 'HTMLCollection yang berubah otomatis', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/legendary-web-dom/legendary-web-queryall/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3a24e008-c5cd-4f65-8109-f4ece41cd2d9', 'ca7def82-6723-4538-8399-63d0d7b82e20', 'Array biasa', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/legendary-web-dom/legendary-web-queryall/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b68d29a3-7836-435e-87ed-43b534d17ef7', 'ca7def82-6723-4538-8399-63d0d7b82e20', 'Hanya elemen pertama yang cocok', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pemrograman-web/legendary-web-dom/legendary-web-listener
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('192f91f1-75ef-4fc2-8f33-3f50a9d095bf', '73e64202-ab73-484d-8ee4-865a66ec7b82', 'legendary-web-listener', 'fill_blank'::public.question_type, 'Event', 'intermediate'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Lengkapi: tombol.__( "click", () => simpan() );', 'addEventListener memasang handler tanpa menimpa handler lain pada elemen yang sama.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: pemrograman-web/legendary-web-dom/legendary-web-listener/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('d8ffcbb4-8f3a-453b-8229-bd10c150f5d3', '192f91f1-75ef-4fc2-8f33-3f50a9d095bf', 'addEventListener', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: pemrograman-web/legendary-web-dom/legendary-web-prevent
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('8ab05108-6319-441b-8d3d-818a8a88857c', '73e64202-ab73-484d-8ee4-865a66ec7b82', 'legendary-web-prevent', 'multiple_choice'::public.question_type, 'Event', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Apa efek event.preventDefault() pada handler submit form?', 'preventDefault membatalkan aksi bawaan browser. stopPropagation berbeda: ia menghentikan perambatan event.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pemrograman-web/legendary-web-dom/legendary-web-prevent/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d4cee241-921c-426c-8aeb-b2bd4a672022', '8ab05108-6319-441b-8d3d-818a8a88857c', 'Membatalkan perilaku bawaan form, yaitu memuat ulang halaman', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/legendary-web-dom/legendary-web-prevent/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('79c9060d-766d-498c-8b83-ac0ce2109ddd', '8ab05108-6319-441b-8d3d-818a8a88857c', 'Menghentikan semua event listener lain', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/legendary-web-dom/legendary-web-prevent/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3a733361-7bed-4918-81b1-7c538a460c80', '8ab05108-6319-441b-8d3d-818a8a88857c', 'Menghapus seluruh isi form', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pemrograman-web/legendary-web-dom/legendary-web-prevent/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0c71aa05-f1ff-49ee-85c3-3dba915c8455', '8ab05108-6319-441b-8d3d-818a8a88857c', 'Mengirim form ke server', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- subjects: basis-data
insert into public.subjects (id, slug, name, short_name, description, category, icon_key, accent_color, status, is_primary, sort_order)
values ('01751717-9e07-4bb4-8376-03db33ac1a8c', 'basis-data', 'Basis Data', 'Basis Data', 'Merancang tabel, relasi, dan query SQL untuk menyimpan data secara rapi dan konsisten.', 'teknologi', 'database', '#FF9F45', 'active'::public.subject_status, true, 2)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  accent_color = excluded.accent_color,
  status = excluded.status,
  is_primary = excluded.is_primary,
  sort_order = excluded.sort_order;

-- courses: basis-data
insert into public.courses (id, subject_id, slug, title, description, category, icon_key, sort_order, is_published)
values ('7c1781fb-9201-477c-84fa-e84e84551ae6', '01751717-9e07-4bb4-8376-03db33ac1a8c', 'basis-data', 'Basis Data', 'Merancang tabel, relasi, dan query SQL untuk menyimpan data secara rapi dan konsisten.', 'teknologi', 'database', 2, true)
on conflict (id) do update set
  subject_id = excluded.subject_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- course_levels: basis-data/beginner
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('29cec9e8-6184-4035-8f36-64eb3c34dea3', '7c1781fb-9201-477c-84fa-e84e84551ae6', 'beginner', 'Level 1 · Konsep Database', 'Mengenal tabel, kolom, baris, dan kunci dalam basis data relasional.', 'beginner'::public.difficulty_band, 0, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: basis-data/dasar-database
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('f7ebced1-3272-4d48-8a07-c826a4495a8a', '29cec9e8-6184-4035-8f36-64eb3c34dea3', 'dasar-database', 'Dasar Basis Data', 'Memahami bahan dasar sebelum menulis query SQL.', array['Menjelaskan tabel, baris, dan kolom', 'Memahami primary key dan foreign key', 'Mengenali peran constraint']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: basis-data/konsep-database
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('39a4a1b6-f899-4f46-867b-e06c9a1c7c1e', 'f7ebced1-3272-4d48-8a07-c826a4495a8a', 'konsep-database', 'Konsep Database', 'Istilah inti dalam basis data relasional.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: basis-data/konsep-database
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('b2f342e0-9039-4df7-8409-8811fdcf8217', 'f7ebced1-3272-4d48-8a07-c826a4495a8a', 'lesson-konsep-database', 'Konsep Database', 'Istilah inti dalam basis data relasional.', 'lesson'::public.node_kind, '39a4a1b6-f899-4f46-867b-e06c9a1c7c1e', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: basis-data/konsep-database/db-primary-key-function
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('99f22e9c-c0da-41d0-852a-5a530e6cf0bf', '39a4a1b6-f899-4f46-867b-e06c9a1c7c1e', 'db-primary-key-function', 'multiple_choice'::public.question_type, 'Primary Key', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Apa fungsi utama primary key pada sebuah tabel?', 'Primary key memastikan setiap baris dapat dibedakan dan tidak boleh berisi nilai yang sama.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/konsep-database/db-primary-key-function/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b528eea5-1745-47ff-80ff-daa4b343cf2d', '99f22e9c-c0da-41d0-852a-5a530e6cf0bf', 'Menjadi identitas unik setiap baris', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/konsep-database/db-primary-key-function/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('66055f77-a21b-4315-8e54-8feeb2b751eb', '99f22e9c-c0da-41d0-852a-5a530e6cf0bf', 'Mengurutkan data secara otomatis', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/konsep-database/db-primary-key-function/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c7ccf9bb-1ac4-4a62-8171-212a3a618f7f', '99f22e9c-c0da-41d0-852a-5a530e6cf0bf', 'Menyimpan password', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/konsep-database/db-primary-key-function/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3db33161-4522-46f9-8a23-954f8b3a5345', '99f22e9c-c0da-41d0-852a-5a530e6cf0bf', 'Menghapus data duplikat', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/konsep-database/db-table-shape
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('83d36f2b-4626-4f27-8a65-84d2a8656ee2', '39a4a1b6-f899-4f46-867b-e06c9a1c7c1e', 'db-table-shape', 'multiple_choice'::public.question_type, 'Tabel', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Sebuah tabel basis data terdiri dari…', 'Tabel menyimpan data dalam baris (record) dan kolom (field).', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/konsep-database/db-table-shape/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('35b90ce2-0e05-4c52-8905-7514c96316d1', '83d36f2b-4626-4f27-8a65-84d2a8656ee2', 'Baris dan kolom', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/konsep-database/db-table-shape/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('39d54cb7-913f-4226-81da-83e4959ee839', '83d36f2b-4626-4f27-8a65-84d2a8656ee2', 'Dokumen dan gambar', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/konsep-database/db-table-shape/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('18777ce2-508b-4475-8a72-f19f0b6e35de', '83d36f2b-4626-4f27-8a65-84d2a8656ee2', 'Folder dan file', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/konsep-database/db-table-shape/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('08a7fe43-b09b-4fd3-8e6a-6b0df9f6cd56', '83d36f2b-4626-4f27-8a65-84d2a8656ee2', 'Halaman dan paragraf', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/konsep-database/db-foreign-key
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('37331a0c-0e01-44d9-8de7-280227076907', '39a4a1b6-f899-4f46-867b-e06c9a1c7c1e', 'db-foreign-key', 'multiple_choice'::public.question_type, 'Foreign Key', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Foreign key digunakan untuk…', 'Foreign key merujuk ke primary key tabel lain sehingga hubungan antar tabel terjaga.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/konsep-database/db-foreign-key/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3a1bf7fb-64ee-4b32-8a76-eb42dd942e26', '37331a0c-0e01-44d9-8de7-280227076907', 'Menghubungkan tabel dengan tabel lain', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/konsep-database/db-foreign-key/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a049df3e-ad07-421b-8a26-8292b8d399f3', '37331a0c-0e01-44d9-8de7-280227076907', 'Mengenkripsi kolom', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/konsep-database/db-foreign-key/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e9941a5f-c95a-4529-86ce-5eb998336d32', '37331a0c-0e01-44d9-8de7-280227076907', 'Menghapus tabel otomatis', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/konsep-database/db-foreign-key/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a14a356d-d5ab-495c-8933-332676737c6e', '37331a0c-0e01-44d9-8de7-280227076907', 'Mengubah tipe data', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/konsep-database/db-primary-key-term
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('6d4e1308-b604-4b0e-8a2b-42d6b56a1167', '39a4a1b6-f899-4f46-867b-e06c9a1c7c1e', 'db-primary-key-term', 'fill_blank'::public.question_type, 'Primary Key', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Kolom yang menjadi identitas unik baris disebut ___ key.', 'Primary key bersifat unik dan biasanya tidak boleh kosong.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: basis-data/konsep-database/db-primary-key-term/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('4cf8e59c-c134-483c-8a74-f793db27bd78', '6d4e1308-b604-4b0e-8a2b-42d6b56a1167', 'primary', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: basis-data/konsep-database/db-field
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('220e4538-3cd3-461d-8af2-0e27f82f5ba2', '39a4a1b6-f899-4f46-867b-e06c9a1c7c1e', 'db-field', 'multiple_choice'::public.question_type, 'Field', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Dalam basis data relasional, field setara dengan…', 'Field adalah kolom yang menyimpan satu jenis informasi, misalnya nama atau email.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/konsep-database/db-field/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d401e37f-fd77-43f7-8874-e6a87bf95a38', '220e4538-3cd3-461d-8af2-0e27f82f5ba2', 'Kolom', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/konsep-database/db-field/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a3b4af21-e2fb-4db5-8436-565f7479432c', '220e4538-3cd3-461d-8af2-0e27f82f5ba2', 'Baris', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/konsep-database/db-field/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6a916e35-adfc-4c94-8d10-35560c77bf3a', '220e4538-3cd3-461d-8af2-0e27f82f5ba2', 'Tabel', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/konsep-database/db-field/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ebee01e9-3d7b-489d-8113-0a534142bc25', '220e4538-3cd3-461d-8af2-0e27f82f5ba2', 'Database', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: basis-data/database-review
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('a6199001-3a50-4354-8a2a-c511c45e5a67', 'f7ebced1-3272-4d48-8a07-c826a4495a8a', 'database-review', 'Review Dasar Database', 'Ulangi konsep kunci, query, dan penyaringan data.', 'review'::public.lesson_kind, 5, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: basis-data/database-review
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('f2f43f12-1e95-4b98-874c-2cce9d306096', 'f7ebced1-3272-4d48-8a07-c826a4495a8a', 'lesson-database-review', 'Review Dasar Database', 'Ulangi konsep kunci, query, dan penyaringan data.', 'review'::public.node_kind, 'a6199001-3a50-4354-8a2a-c511c45e5a67', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: basis-data/database-review/review-db-primary-key
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('300e39b6-20a7-472f-89ca-d961831a5911', 'a6199001-3a50-4354-8a2a-c511c45e5a67', 'review-db-primary-key', 'multiple_choice'::public.question_type, 'Primary Key', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Nilai pada kolom primary key harus…', 'Primary key mengidentifikasi setiap baris secara unik, sehingga tidak boleh duplikat atau kosong.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/database-review/review-db-primary-key/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9eb6f11b-c89d-4f04-86b5-1cdd5671a9c7', '300e39b6-20a7-472f-89ca-d961831a5911', 'Unik dan tidak null', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/database-review/review-db-primary-key/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('97404187-9843-43cc-8003-f10219854bd4', '300e39b6-20a7-472f-89ca-d961831a5911', 'Boleh berulang', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/database-review/review-db-primary-key/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('89ae36ce-0386-48e2-8dd2-b0688f632247', '300e39b6-20a7-472f-89ca-d961831a5911', 'Selalu berupa teks', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/database-review/review-db-primary-key/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('261e4272-2948-47f3-8143-1d2479a168d5', '300e39b6-20a7-472f-89ca-d961831a5911', 'Selalu diisi angka nol', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/database-review/review-db-select
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('c2831f23-4191-4e47-800c-82d6592c72ea', 'a6199001-3a50-4354-8a2a-c511c45e5a67', 'review-db-select', 'multiple_choice'::public.question_type, 'SQL', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Perintah SQL untuk mengambil data dari tabel adalah…', 'SELECT membaca data. INSERT menambah, UPDATE mengubah, dan DELETE menghapus.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/database-review/review-db-select/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5386c649-be92-466f-85f3-6c87c4225bab', 'c2831f23-4191-4e47-800c-82d6592c72ea', 'SELECT', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/database-review/review-db-select/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('50dce522-ddf1-43fd-887c-07f55800aaf3', 'c2831f23-4191-4e47-800c-82d6592c72ea', 'INSERT', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/database-review/review-db-select/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('4ae19c63-9ad6-4c9d-8c54-9c872d39ec86', 'c2831f23-4191-4e47-800c-82d6592c72ea', 'UPDATE', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/database-review/review-db-select/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2567e08e-064e-4806-8823-541920e15bf4', 'c2831f23-4191-4e47-800c-82d6592c72ea', 'DELETE', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/database-review/review-db-where
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('a332498a-21a1-4352-86b3-ab6d29550bab', 'a6199001-3a50-4354-8a2a-c511c45e5a67', 'review-db-where', 'typing'::public.question_type, 'SQL', 'beginner'::public.difficulty_band, 'Tulis jawaban pada kolom yang tersedia.', 'Tulis klausa SQL yang digunakan untuk menyaring baris berdasarkan kondisi.', 'Klausa WHERE ditempatkan setelah FROM untuk membatasi baris yang dikembalikan.', null, 15, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: basis-data/database-review/review-db-where/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('92f0fd5a-ee89-42f4-8861-cc18da29abd8', 'a332498a-21a1-4352-86b3-ab6d29550bab', 'where', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- lessons: basis-data/database-challenge
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('efce6efe-0e9e-4af3-89d7-0626505f79a9', 'f7ebced1-3272-4d48-8a07-c826a4495a8a', 'database-challenge', 'Tantangan Basis Data', 'Uji pemahaman relasi, JOIN, dan perubahan data.', 'challenge'::public.lesson_kind, 6, 10, 2, 2, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: basis-data/database-challenge
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('0f31070b-483a-467b-8744-0fb5efabecaf', 'f7ebced1-3272-4d48-8a07-c826a4495a8a', 'lesson-database-challenge', 'Tantangan Basis Data', 'Uji pemahaman relasi, JOIN, dan perubahan data.', 'challenge'::public.node_kind, 'efce6efe-0e9e-4af3-89d7-0626505f79a9', 20, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: basis-data/database-challenge/challenge-db-foreign-key
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('ecf94b62-3e7c-4a70-861d-73f1bbc346d8', 'efce6efe-0e9e-4af3-89d7-0626505f79a9', 'challenge-db-foreign-key', 'multiple_choice'::public.question_type, 'Foreign Key', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Apa fungsi foreign key?', 'Foreign key menjaga relasi antar tabel dengan merujuk primary key pada tabel lain.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/database-challenge/challenge-db-foreign-key/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e1741e30-2749-4cf4-817f-90edbcbecabc', 'ecf94b62-3e7c-4a70-861d-73f1bbc346d8', 'Menghubungkan baris ke primary key tabel lain', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/database-challenge/challenge-db-foreign-key/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0c0eec2d-3518-4191-8ea0-455ab18a4a9b', 'ecf94b62-3e7c-4a70-861d-73f1bbc346d8', 'Menghapus tabel secara otomatis', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/database-challenge/challenge-db-foreign-key/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('bfd3a0c3-dca6-4899-8d26-4b29e45b77d7', 'ecf94b62-3e7c-4a70-861d-73f1bbc346d8', 'Mengurutkan hasil query', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/database-challenge/challenge-db-foreign-key/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('dd67091b-e67e-4ade-835b-4490c146278f', 'ecf94b62-3e7c-4a70-861d-73f1bbc346d8', 'Menyimpan gambar di database', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/database-challenge/challenge-db-join
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('b35db766-e736-4019-835e-3bcf59fbe298', 'efce6efe-0e9e-4af3-89d7-0626505f79a9', 'challenge-db-join', 'multiple_choice'::public.question_type, 'JOIN', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'JOIN digunakan untuk…', 'JOIN mencocokkan baris antar tabel memakai kolom relasi yang ditentukan pada kondisi ON.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/database-challenge/challenge-db-join/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7a2c4866-8940-474d-803b-d9e5c70a8a36', 'b35db766-e736-4019-835e-3bcf59fbe298', 'Menggabungkan baris dari dua tabel berdasarkan relasi', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/database-challenge/challenge-db-join/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c7bd23b0-4673-4b66-8790-e1c9be153003', 'b35db766-e736-4019-835e-3bcf59fbe298', 'Membuat tabel baru tanpa data', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/database-challenge/challenge-db-join/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('46235be4-b34e-486a-866b-e97b04f6c93a', 'b35db766-e736-4019-835e-3bcf59fbe298', 'Mengubah tipe data kolom', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/database-challenge/challenge-db-join/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1d8f5096-da4f-4321-85f8-a9e2f83b7d35', 'b35db766-e736-4019-835e-3bcf59fbe298', 'Menghapus duplikasi otomatis', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/database-challenge/challenge-db-update
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('778d469e-4a7d-40f3-8047-620471fad62e', 'efce6efe-0e9e-4af3-89d7-0626505f79a9', 'challenge-db-update', 'fill_blank'::public.question_type, 'SQL', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Perintah SQL untuk mengubah data yang sudah ada adalah ___', 'UPDATE mengubah nilai kolom pada baris yang memenuhi klausa WHERE.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: basis-data/database-challenge/challenge-db-update/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('ba56f451-363e-41d2-8b55-b2dc6237c1d2', '778d469e-4a7d-40f3-8047-620471fad62e', 'update', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- course_levels: basis-data/elementary
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('96a33d9e-6e82-4bc6-8456-f15ec175ad54', '7c1781fb-9201-477c-84fa-e84e84551ae6', 'elementary', 'Level 2 · SQL Dasar', 'Mengambil dan mengubah data dengan perintah SQL dasar.', 'elementary'::public.difficulty_band, 1, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: basis-data/query-sql-dasar
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('f06a5910-4126-43c8-8948-203b9ad9d464', '96a33d9e-6e82-4bc6-8456-f15ec175ad54', 'query-sql-dasar', 'Query SQL Dasar', 'Empat operasi utama: membaca, menambah, mengubah, dan menghapus data.', array['Menulis SELECT dengan WHERE', 'Menambah data dengan INSERT', 'Mengubah data dengan UPDATE']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: basis-data/sql-dasar
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('d9dd6a23-62aa-4403-82b7-7cfaaeecc69a', 'f06a5910-4126-43c8-8948-203b9ad9d464', 'sql-dasar', 'SQL Dasar', 'Perintah SQL yang paling sering dipakai.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: basis-data/sql-dasar
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('f619adae-d026-4693-8124-3ae8ca0783f0', 'f06a5910-4126-43c8-8948-203b9ad9d464', 'lesson-sql-dasar', 'SQL Dasar', 'Perintah SQL yang paling sering dipakai.', 'lesson'::public.node_kind, 'd9dd6a23-62aa-4403-82b7-7cfaaeecc69a', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: basis-data/sql-dasar/sql-select
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('3826d15e-8d81-4493-8d01-25e78e741dd3', 'd9dd6a23-62aa-4403-82b7-7cfaaeecc69a', 'sql-select', 'multiple_choice'::public.question_type, 'SELECT', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Perintah SQL untuk mengambil data dari tabel adalah…', 'SELECT membaca data. INSERT menambah, UPDATE mengubah, dan DELETE menghapus.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/sql-dasar/sql-select/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9c2d7aa3-16af-423b-8084-4fba2e2afc9a', '3826d15e-8d81-4493-8d01-25e78e741dd3', 'SELECT', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/sql-dasar/sql-select/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('983b6993-d2d3-439c-8e5e-c5a86225fe49', '3826d15e-8d81-4493-8d01-25e78e741dd3', 'INSERT', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/sql-dasar/sql-select/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7a00a950-2d3f-4a29-893e-c9f2284a00e4', '3826d15e-8d81-4493-8d01-25e78e741dd3', 'UPDATE', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/sql-dasar/sql-select/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a93b6e82-4d95-4b2c-8a7e-7dbe3e9a139d', '3826d15e-8d81-4493-8d01-25e78e741dd3', 'DELETE', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/sql-dasar/sql-where
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('e943cbdb-46e9-4928-8440-f0818ed00347', 'd9dd6a23-62aa-4403-82b7-7cfaaeecc69a', 'sql-where', 'multiple_choice'::public.question_type, 'WHERE', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Klausa apa yang dipakai untuk menyaring baris berdasarkan kondisi?', 'WHERE menentukan kondisi yang harus dipenuhi sebuah baris agar ikut dikembalikan.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/sql-dasar/sql-where/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f1b2f592-dfdf-4646-8fab-02ff79c57f0d', 'e943cbdb-46e9-4928-8440-f0818ed00347', 'WHERE', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/sql-dasar/sql-where/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7094a179-8d19-4b7d-8083-e9c42be26884', 'e943cbdb-46e9-4928-8440-f0818ed00347', 'ORDER BY', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/sql-dasar/sql-where/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('54cccef3-cf75-4a9a-85c6-e4a7312e030d', 'e943cbdb-46e9-4928-8440-f0818ed00347', 'GROUP BY', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/sql-dasar/sql-where/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1bf701d0-a27e-4a20-8d41-ed89c8fd785f', 'e943cbdb-46e9-4928-8440-f0818ed00347', 'LIMIT', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/sql-dasar/sql-from
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('63545850-4f19-4685-8516-3ad6ed183a3d', 'd9dd6a23-62aa-4403-82b7-7cfaaeecc69a', 'sql-from', 'fill_blank'::public.question_type, 'FROM', 'elementary'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Lengkapi query berikut: SELECT * ___ siswa;', 'FROM menunjukkan tabel sumber data yang dibaca.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: basis-data/sql-dasar/sql-from/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('24f80f3d-eaf4-4a5f-8c64-4d1c950dd0ff', '63545850-4f19-4685-8516-3ad6ed183a3d', 'FROM', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: basis-data/sql-dasar/sql-insert
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('bbce8794-8906-4218-8bd9-b388092691a2', 'd9dd6a23-62aa-4403-82b7-7cfaaeecc69a', 'sql-insert', 'multiple_choice'::public.question_type, 'INSERT', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Perintah untuk menambah baris baru adalah…', 'INSERT INTO nama_tabel (kolom) VALUES (nilai) menambahkan baris baru.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/sql-dasar/sql-insert/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('93c75fba-50c5-4f6d-8161-9d280977e86e', 'bbce8794-8906-4218-8bd9-b388092691a2', 'INSERT INTO', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/sql-dasar/sql-insert/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('cd67f9c5-6d72-4700-8332-6b48b9c245a5', 'bbce8794-8906-4218-8bd9-b388092691a2', 'ADD ROW', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/sql-dasar/sql-insert/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ee6ce697-4e4b-4597-80d1-ea753cafd114', 'bbce8794-8906-4218-8bd9-b388092691a2', 'CREATE ROW', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/sql-dasar/sql-insert/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('cf4d37de-c646-4ec9-87f4-744845c0746c', 'bbce8794-8906-4218-8bd9-b388092691a2', 'APPEND', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/sql-dasar/sql-update
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('58614244-5db9-441f-84df-f83074a9422d', 'd9dd6a23-62aa-4403-82b7-7cfaaeecc69a', 'sql-update', 'multiple_choice'::public.question_type, 'UPDATE', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Perintah untuk mengubah data yang sudah ada adalah…', 'UPDATE mengubah nilai kolom pada baris yang memenuhi kondisi WHERE.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/sql-dasar/sql-update/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7a6f0cb2-18a7-44c7-8173-070ea38d1288', '58614244-5db9-441f-84df-f83074a9422d', 'UPDATE', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/sql-dasar/sql-update/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3298cba2-fa04-4a9f-88d3-e60941d36a03', '58614244-5db9-441f-84df-f83074a9422d', 'SELECT', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/sql-dasar/sql-update/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2fdd655e-c53c-4f49-84a5-10dc9e5ff107', '58614244-5db9-441f-84df-f83074a9422d', 'ALTER', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/sql-dasar/sql-update/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('045171f4-ba3a-49a4-824c-e39907c6cb7f', '58614244-5db9-441f-84df-f83074a9422d', 'REPLACE', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: basis-data/latihan-sql-dasar
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('1b98c814-937c-4b80-811a-1e70d5a40195', 'f06a5910-4126-43c8-8948-203b9ad9d464', 'latihan-sql-dasar', 'Latihan SQL Dasar', 'Latihan perintah SQL yang menjadi dasar pengambilan data.', 'practice'::public.lesson_kind, 6, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: basis-data/latihan-sql-dasar
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('82682d3d-1aa6-470e-8c78-fbcb061cf473', 'f06a5910-4126-43c8-8948-203b9ad9d464', 'lesson-latihan-sql-dasar', 'Latihan SQL Dasar', 'Latihan perintah SQL yang menjadi dasar pengambilan data.', 'practice'::public.node_kind, '1b98c814-937c-4b80-811a-1e70d5a40195', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: basis-data/latihan-sql-dasar/practice-db-select
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('c7396f97-68fc-41d2-8595-58110f0bdcd8', '1b98c814-937c-4b80-811a-1e70d5a40195', 'practice-db-select', 'multiple_choice'::public.question_type, 'SQL', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Perintah SQL untuk mengambil data dari tabel adalah…', 'SELECT membaca data. INSERT menambah, UPDATE mengubah, dan DELETE menghapus.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/latihan-sql-dasar/practice-db-select/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('58a4cf3c-6b1a-49d4-87ee-ae71aafcc9e3', 'c7396f97-68fc-41d2-8595-58110f0bdcd8', 'SELECT', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/latihan-sql-dasar/practice-db-select/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c0e4d7fa-f160-43ed-8ce7-23a54f08dd11', 'c7396f97-68fc-41d2-8595-58110f0bdcd8', 'INSERT', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/latihan-sql-dasar/practice-db-select/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('04cdb195-f9a9-4ef9-8ac0-be3d93410918', 'c7396f97-68fc-41d2-8595-58110f0bdcd8', 'UPDATE', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/latihan-sql-dasar/practice-db-select/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('622f1753-0fa9-4d77-89f5-90e96984b125', 'c7396f97-68fc-41d2-8595-58110f0bdcd8', 'DELETE', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/latihan-sql-dasar/practice-db-where
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('e1f76ca7-69ad-46bf-8e5b-774879429151', '1b98c814-937c-4b80-811a-1e70d5a40195', 'practice-db-where', 'multiple_choice'::public.question_type, 'SQL', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Klausa yang memfilter baris berdasarkan kondisi adalah…', 'WHERE menentukan baris yang lolos. ORDER BY mengurutkan, GROUP BY mengelompokkan, dan LIMIT membatasi jumlah hasil.', 'Klausa ini muncul sebelum ORDER BY.', 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/latihan-sql-dasar/practice-db-where/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('18416052-4347-4582-8005-083fae0d9775', 'e1f76ca7-69ad-46bf-8e5b-774879429151', 'WHERE', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/latihan-sql-dasar/practice-db-where/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3c129272-d173-403a-8184-d5b673228194', 'e1f76ca7-69ad-46bf-8e5b-774879429151', 'ORDER BY', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/latihan-sql-dasar/practice-db-where/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('573be458-3ad7-4d6f-80fa-4aa752ca2e31', 'e1f76ca7-69ad-46bf-8e5b-774879429151', 'GROUP BY', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/latihan-sql-dasar/practice-db-where/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('4bd32082-9d14-47a1-8767-bfd86b4efdbb', 'e1f76ca7-69ad-46bf-8e5b-774879429151', 'LIMIT', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/latihan-sql-dasar/practice-db-filter
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('a073350a-4518-4d9f-85db-a4d8e757b84f', '1b98c814-937c-4b80-811a-1e70d5a40195', 'practice-db-filter', 'fill_blank'::public.question_type, 'SQL', 'elementary'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Lengkapi: SELECT nama FROM siswa __ nilai > 80;', 'WHERE memfilter baris sehingga hanya siswa dengan nilai di atas 80 yang dikembalikan.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: basis-data/latihan-sql-dasar/practice-db-filter/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('7f791abc-ec0b-4183-8a00-395015119666', 'a073350a-4518-4d9f-85db-a4d8e757b84f', 'where', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- lessons: basis-data/checkpoint-kunci-dan-query
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('ac7e06b8-def9-4b80-839d-0659be398470', 'f06a5910-4126-43c8-8948-203b9ad9d464', 'checkpoint-kunci-dan-query', 'Checkpoint Kunci & Query', 'Pastikan pemahaman primary key, foreign key, dan pengurutan query.', 'review'::public.lesson_kind, 8, 10, 2, 2, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: basis-data/checkpoint-kunci-dan-query
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('43171603-6d93-48a8-86b8-df2694601e17', 'f06a5910-4126-43c8-8948-203b9ad9d464', 'lesson-checkpoint-kunci-dan-query', 'Checkpoint Kunci & Query', 'Pastikan pemahaman primary key, foreign key, dan pengurutan query.', 'checkpoint'::public.node_kind, 'ac7e06b8-def9-4b80-839d-0659be398470', 20, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: basis-data/checkpoint-kunci-dan-query/checkpoint-db-pk
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('9dad8928-73bf-41fe-8e19-c743a954d8cd', 'ac7e06b8-def9-4b80-839d-0659be398470', 'checkpoint-db-pk', 'multiple_choice'::public.question_type, 'Primary Key', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Fungsi utama primary key adalah…', 'Primary key menjamin setiap baris dapat dibedakan dan tidak boleh duplikat atau null.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/checkpoint-kunci-dan-query/checkpoint-db-pk/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5591c48c-8b67-4d2d-816b-55e89aa9bf23', '9dad8928-73bf-41fe-8e19-c743a954d8cd', 'Menjadi identitas unik setiap baris', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/checkpoint-kunci-dan-query/checkpoint-db-pk/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('77ae3fcd-7121-4f5a-8169-d14cec09b519', '9dad8928-73bf-41fe-8e19-c743a954d8cd', 'Mengurutkan data secara otomatis', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/checkpoint-kunci-dan-query/checkpoint-db-pk/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e2541096-5e15-476f-8041-f67ca62923a6', '9dad8928-73bf-41fe-8e19-c743a954d8cd', 'Menyimpan password', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/checkpoint-kunci-dan-query/checkpoint-db-pk/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2c667a4f-66c5-4c69-868f-132048ddfdc9', '9dad8928-73bf-41fe-8e19-c743a954d8cd', 'Menghapus data duplikat', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/checkpoint-kunci-dan-query/checkpoint-db-fk
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('7981bdf1-3749-4d21-8e1a-8538a06dfd9d', 'ac7e06b8-def9-4b80-839d-0659be398470', 'checkpoint-db-fk', 'multiple_choice'::public.question_type, 'Foreign Key', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Foreign key berfungsi untuk…', 'Foreign key menjaga integritas relasi: nilainya harus merujuk ke baris yang ada di tabel tujuan.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/checkpoint-kunci-dan-query/checkpoint-db-fk/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('bfea3268-2d8b-4278-858f-e7d162cc6016', '7981bdf1-3749-4d21-8e1a-8538a06dfd9d', 'Menghubungkan baris ke primary key tabel lain', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/checkpoint-kunci-dan-query/checkpoint-db-fk/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('81d11ae8-dc2d-4e70-8789-83dc754b4ac0', '7981bdf1-3749-4d21-8e1a-8538a06dfd9d', 'Menjadi identitas utama tabel sendiri', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/checkpoint-kunci-dan-query/checkpoint-db-fk/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c46790a8-93ab-4de8-827c-1bd9fad2e8c7', '7981bdf1-3749-4d21-8e1a-8538a06dfd9d', 'Menyimpan data biner', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/checkpoint-kunci-dan-query/checkpoint-db-fk/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('21d3e8bd-aed6-46be-863b-bc2d342f8c7c', '7981bdf1-3749-4d21-8e1a-8538a06dfd9d', 'Mengunci seluruh tabel', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/checkpoint-kunci-dan-query/checkpoint-db-order
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('1d74ffe6-2055-42f9-81b4-f586abe3bbbd', 'ac7e06b8-def9-4b80-839d-0659be398470', 'checkpoint-db-order', 'fill_blank'::public.question_type, 'SQL', 'elementary'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Lengkapi: SELECT * FROM siswa __ nama; agar hasil terurut menaik berdasarkan nama.', 'ORDER BY nama mengurutkan menaik secara default; tambahkan DESC untuk menurun.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: basis-data/checkpoint-kunci-dan-query/checkpoint-db-order/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('8ef852fd-fb39-4ffa-886b-ff1a148c6ad6', '1d74ffe6-2055-42f9-81b4-f586abe3bbbd', 'order by', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- course_levels: basis-data/intermediate
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('1c4494d1-6ae5-4d2e-88ca-54822f1629e7', '7c1781fb-9201-477c-84fa-e84e84551ae6', 'intermediate', 'Level 3 · Relasi dan JOIN', 'Menggabungkan tabel dan merancang data yang ternormalisasi.', 'intermediate'::public.difficulty_band, 2, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: basis-data/relasi-dan-join
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('0fb25963-f804-4894-8114-0460977ccafd', '1c4494d1-6ae5-4d2e-88ca-54822f1629e7', 'relasi-dan-join', 'Relasi dan JOIN', 'Data nyata jarang cukup disimpan dalam satu tabel.', array['Menggabungkan tabel dengan JOIN', 'Menjelaskan tujuan normalisasi', 'Mengurutkan hasil query']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: basis-data/relasi-join
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('63a16477-adb9-4c55-813e-9746c4839e8f', '0fb25963-f804-4894-8114-0460977ccafd', 'relasi-join', 'Relasi dan JOIN', 'Menghubungkan tabel tanpa menggandakan data.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: basis-data/relasi-join
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('34a0ec06-b541-4771-892d-80c8d7ec7536', '0fb25963-f804-4894-8114-0460977ccafd', 'lesson-relasi-join', 'Relasi dan JOIN', 'Menghubungkan tabel tanpa menggandakan data.', 'lesson'::public.node_kind, '63a16477-adb9-4c55-813e-9746c4839e8f', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: basis-data/relasi-join/db-inner-join
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('5f5e6f25-139c-48bf-8e03-357e6d2bc2b7', '63a16477-adb9-4c55-813e-9746c4839e8f', 'db-inner-join', 'multiple_choice'::public.question_type, 'JOIN', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'JOIN yang mengembalikan baris ketika ada kecocokan di kedua tabel disebut…', 'INNER JOIN hanya mengembalikan pasangan baris yang cocok di kedua tabel.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/relasi-join/db-inner-join/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('81c483a4-777c-4f86-89f1-fc8599f3a5b8', '5f5e6f25-139c-48bf-8e03-357e6d2bc2b7', 'INNER JOIN', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/relasi-join/db-inner-join/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('308d5350-bd73-4da9-808f-9d0ab55040c2', '5f5e6f25-139c-48bf-8e03-357e6d2bc2b7', 'CROSS JOIN', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/relasi-join/db-inner-join/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c06ab982-3c94-4120-88c6-053bb35c04bd', '5f5e6f25-139c-48bf-8e03-357e6d2bc2b7', 'LEFT JOIN', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/relasi-join/db-inner-join/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('bc898a65-1137-4258-8903-e49be09960c3', '5f5e6f25-139c-48bf-8e03-357e6d2bc2b7', 'UNION', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/relasi-join/db-normalization-goal
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('eaa0d6d4-9127-4715-8fc5-a0aed493ed71', '63a16477-adb9-4c55-813e-9746c4839e8f', 'db-normalization-goal', 'multiple_choice'::public.question_type, 'Normalisasi', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Tujuan utama normalisasi basis data adalah…', 'Normalisasi memecah data berulang agar konsisten dan menghindari anomali saat insert, update, atau delete.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/relasi-join/db-normalization-goal/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('efb49f17-4438-40b4-84fb-80f3ed485d65', 'eaa0d6d4-9127-4715-8fc5-a0aed493ed71', 'Mengurangi redundansi dan anomali data', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/relasi-join/db-normalization-goal/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('62c1f497-b340-4344-8d0a-ec44232a5b18', 'eaa0d6d4-9127-4715-8fc5-a0aed493ed71', 'Memperbanyak kolom', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/relasi-join/db-normalization-goal/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8d4cf94b-42f1-4460-8a30-4d7ded48ad7c', 'eaa0d6d4-9127-4715-8fc5-a0aed493ed71', 'Menghapus semua relasi', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/relasi-join/db-normalization-goal/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f6883d46-c0a0-4ae0-8ac7-452031d1c1d9', 'eaa0d6d4-9127-4715-8fc5-a0aed493ed71', 'Mempercepat semua query tanpa biaya', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/relasi-join/db-first-normal-form
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('618767ea-5d7a-4fc4-8c4f-551346478869', '63a16477-adb9-4c55-813e-9746c4839e8f', 'db-first-normal-form', 'multiple_choice'::public.question_type, 'Normalisasi', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Syarat utama bentuk normal pertama (1NF) adalah…', '1NF menuntut nilai tunggal per sel, tanpa daftar nilai dalam satu kolom.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/relasi-join/db-first-normal-form/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0a5fbbde-f686-47c8-8064-a555ab7ff504', '618767ea-5d7a-4fc4-8c4f-551346478869', 'Setiap nilai kolom bersifat atomik', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/relasi-join/db-first-normal-form/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('541dab2c-810f-4a95-859f-acf1e7b8af6c', '618767ea-5d7a-4fc4-8c4f-551346478869', 'Semua kolom bertipe teks', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/relasi-join/db-first-normal-form/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2358487b-f0b7-4f58-8209-8ba7b04e53ed', '618767ea-5d7a-4fc4-8c4f-551346478869', 'Tidak boleh ada primary key', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/relasi-join/db-first-normal-form/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('70b8946b-1cb8-419d-8ace-3dbbabb8105e', '618767ea-5d7a-4fc4-8c4f-551346478869', 'Semua tabel harus digabung', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/relasi-join/db-order-by
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('88f4f300-927e-4ecc-828b-c53b5453def4', '63a16477-adb9-4c55-813e-9746c4839e8f', 'db-order-by', 'fill_blank'::public.question_type, 'ORDER BY', 'intermediate'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Klausa untuk mengurutkan hasil query adalah ___ BY.', 'ORDER BY menentukan kolom dan arah pengurutan, misalnya ORDER BY nama ASC.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: basis-data/relasi-join/db-order-by/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('0e20b37c-3ec4-48e6-8835-b6b86c0021ff', '88f4f300-927e-4ecc-828b-c53b5453def4', 'ORDER', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: basis-data/relasi-join/db-foreign-key-purpose
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('14394d05-a665-42d9-859b-a3bc615c5af1', '63a16477-adb9-4c55-813e-9746c4839e8f', 'db-foreign-key-purpose', 'multiple_choice'::public.question_type, 'Integritas Data', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Foreign key membantu mencegah…', 'Foreign key menjaga integritas referensial sehingga data anak tidak menunjuk induk yang tidak ada.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/relasi-join/db-foreign-key-purpose/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d28e3447-c765-4341-87c0-5c11858cfb66', '14394d05-a665-42d9-859b-a3bc615c5af1', 'Data anak yang merujuk induk tidak ada', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/relasi-join/db-foreign-key-purpose/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('049c2ef1-d356-4601-8b21-7e17dc545a97', '14394d05-a665-42d9-859b-a3bc615c5af1', 'Semua query JOIN', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/relasi-join/db-foreign-key-purpose/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9b1529ed-242d-49c5-8bfd-7029f8eb8aa4', '14394d05-a665-42d9-859b-a3bc615c5af1', 'Penggunaan indeks', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/relasi-join/db-foreign-key-purpose/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('452c87ca-6776-4b54-8444-8b159a26c10f', '14394d05-a665-42d9-859b-a3bc615c5af1', 'Pembuatan tabel baru', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: basis-data/legendary-relasi-sql
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('21703e08-c854-4a42-8ef1-eb432ead6b3c', '0fb25963-f804-4894-8114-0460977ccafd', 'legendary-relasi-sql', 'Legendary Relasi & SQL', 'Tantangan lanjutan tentang JOIN, normalisasi, dan integritas data.', 'legendary'::public.lesson_kind, 9, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: basis-data/legendary-relasi-sql
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('f4887145-d017-4d55-8aca-190f2ba8efaa', '0fb25963-f804-4894-8114-0460977ccafd', 'lesson-legendary-relasi-sql', 'Legendary Relasi & SQL', 'Tantangan lanjutan tentang JOIN, normalisasi, dan integritas data.', 'legendary'::public.node_kind, '21703e08-c854-4a42-8ef1-eb432ead6b3c', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: basis-data/legendary-relasi-sql/legendary-db-inner
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('0e2ab240-0f88-450d-8445-3ba0b5690c00', '21703e08-c854-4a42-8ef1-eb432ead6b3c', 'legendary-db-inner', 'multiple_choice'::public.question_type, 'JOIN', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'INNER JOIN mengembalikan…', 'INNER JOIN hanya mempertahankan baris yang cocok di kedua sisi. LEFT JOIN mempertahankan seluruh tabel kiri.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/legendary-relasi-sql/legendary-db-inner/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('10773abd-eccb-458d-8f78-8fb9e9a1bd31', '0e2ab240-0f88-450d-8445-3ba0b5690c00', 'Baris yang memiliki pasangan di kedua tabel', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/legendary-relasi-sql/legendary-db-inner/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2a1077db-c6d0-4f2a-82bd-7ec5c9aba9ef', '0e2ab240-0f88-450d-8445-3ba0b5690c00', 'Semua baris tabel kiri saja', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/legendary-relasi-sql/legendary-db-inner/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('926fdb0c-1728-4dda-8585-c119fd2af497', '0e2ab240-0f88-450d-8445-3ba0b5690c00', 'Semua baris tabel kanan saja', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/legendary-relasi-sql/legendary-db-inner/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('11f2433c-4502-4857-8009-20042015589c', '0e2ab240-0f88-450d-8445-3ba0b5690c00', 'Semua baris tanpa syarat', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/legendary-relasi-sql/legendary-db-2nf
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('250f294b-682a-4f9e-8534-01ca089535e2', '21703e08-c854-4a42-8ef1-eb432ead6b3c', 'legendary-db-2nf', 'multiple_choice'::public.question_type, 'Normalisasi', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Bentuk normal kedua (2NF) terutama menghilangkan…', '2NF mensyaratkan 1NF terpenuhi dan setiap atribut non-kunci bergantung penuh pada seluruh kunci komposit.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: basis-data/legendary-relasi-sql/legendary-db-2nf/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('21292bc7-78e5-4b8a-8027-7cd0cc07e392', '250f294b-682a-4f9e-8534-01ca089535e2', 'Ketergantungan parsial pada kunci komposit', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/legendary-relasi-sql/legendary-db-2nf/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8a59cf7e-3f5a-4d03-87b8-8a9fe4f3326a', '250f294b-682a-4f9e-8534-01ca089535e2', 'Seluruh foreign key', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/legendary-relasi-sql/legendary-db-2nf/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('76589666-3e6f-4bbc-8aaa-1f990b005d0f', '250f294b-682a-4f9e-8534-01ca089535e2', 'Kolom bertipe teks', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: basis-data/legendary-relasi-sql/legendary-db-2nf/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2acec557-c544-4dee-887c-4b2b7b6c2a82', '250f294b-682a-4f9e-8534-01ca089535e2', 'Index pada tabel', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: basis-data/legendary-relasi-sql/legendary-db-join
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('dc33a54a-3abb-4022-8dd3-5edc74c22c3f', '21703e08-c854-4a42-8ef1-eb432ead6b3c', 'legendary-db-join', 'fill_blank'::public.question_type, 'SQL', 'intermediate'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Lengkapi: SELECT * FROM siswa __ kelas ON siswa.kelas_id = kelas.id;', 'JOIN menggabungkan tabel berdasarkan kondisi relasi pada klausa ON.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: basis-data/legendary-relasi-sql/legendary-db-join/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('0f772f9c-4edc-4c9e-8d80-48e4e23812ec', 'dc33a54a-3abb-4022-8dd3-5edc74c22c3f', 'join', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- subjects: ppb-flutter-dart
insert into public.subjects (id, slug, name, short_name, description, category, icon_key, accent_color, status, is_primary, sort_order)
values ('c70470ef-a13c-4209-8fbe-6619dd116410', 'ppb-flutter-dart', 'PPB — Flutter & Dart', 'PPB', 'Dasar pemrograman perangkat bergerak dengan Dart dan Flutter: widget, layout, state, dan navigasi.', 'teknologi', 'phone', '#B98CFF', 'active'::public.subject_status, true, 3)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  accent_color = excluded.accent_color,
  status = excluded.status,
  is_primary = excluded.is_primary,
  sort_order = excluded.sort_order;

-- courses: ppb-flutter-dart
insert into public.courses (id, subject_id, slug, title, description, category, icon_key, sort_order, is_published)
values ('ad929edd-d05c-4383-8b8d-35e2079e6051', 'c70470ef-a13c-4209-8fbe-6619dd116410', 'ppb-flutter-dart', 'PPB — Flutter & Dart', 'Dasar pemrograman perangkat bergerak dengan Dart dan Flutter: widget, layout, state, dan navigasi.', 'teknologi', 'phone', 3, true)
on conflict (id) do update set
  subject_id = excluded.subject_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- course_levels: ppb-flutter-dart/beginner
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('76fe3cbe-2a07-45ce-881e-66b3714a23e4', 'ad929edd-d05c-4383-8b8d-35e2079e6051', 'beginner', 'Level 1 · Dart Dasar', 'Mengenal tipe data, variabel, dan struktur dasar bahasa Dart.', 'beginner'::public.difficulty_band, 0, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: ppb-flutter-dart/dart-dasar
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('b45443a2-18a0-4f52-85fe-00175aa30180', '76fe3cbe-2a07-45ce-881e-66b3714a23e4', 'dart-dasar', 'Dart untuk Flutter', 'Flutter memakai Dart, jadi fondasi bahasanya perlu dipahami lebih dulu.', array['Mendeklarasikan variabel Dart', 'Mengenali tipe data umum', 'Mencetak output dan menangani null']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: ppb-flutter-dart/dart-dasar
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('2526b18f-5665-4d3c-8eef-9d1516100946', 'b45443a2-18a0-4f52-85fe-00175aa30180', 'dart-dasar', 'Dart Dasar', 'Variabel, tipe data, dan null safety.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: ppb-flutter-dart/dart-dasar
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('5b504a47-5182-49c1-8487-f0fef9f2c8d7', 'b45443a2-18a0-4f52-85fe-00175aa30180', 'lesson-dart-dasar', 'Dart Dasar', 'Variabel, tipe data, dan null safety.', 'lesson'::public.node_kind, '2526b18f-5665-4d3c-8eef-9d1516100946', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: ppb-flutter-dart/dart-dasar/dart-const
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('54194040-b16f-4542-88fb-e63806fbba3d', '2526b18f-5665-4d3c-8eef-9d1516100946', 'dart-const', 'multiple_choice'::public.question_type, 'Dart', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Kata kunci Dart untuk nilai yang sudah diketahui saat kompilasi adalah…', 'const menandai nilai konstan saat kompilasi. final juga tidak berubah, tetapi nilainya boleh ditentukan saat runtime.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/dart-dasar/dart-const/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7f81bdc2-f3b5-4cdb-8f56-505ed27bc05d', '54194040-b16f-4542-88fb-e63806fbba3d', 'const', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/dart-dasar/dart-const/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0a77fb14-a804-4457-89d1-18f782bb73e0', '54194040-b16f-4542-88fb-e63806fbba3d', 'final', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/dart-dasar/dart-const/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2f3c6cb4-8b4a-4f06-8edd-ccf05ebe2d1b', '54194040-b16f-4542-88fb-e63806fbba3d', 'late', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/dart-dasar/dart-const/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7fa5858f-a9d5-4bef-8ccc-4992b81294f0', '54194040-b16f-4542-88fb-e63806fbba3d', 'static', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/dart-dasar/dart-string
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('02df48d4-c44a-4fd5-8db2-ef413d3381f1', '2526b18f-5665-4d3c-8eef-9d1516100946', 'dart-string', 'multiple_choice'::public.question_type, 'Tipe Data', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Tipe data Dart untuk teks adalah…', 'String menyimpan rangkaian karakter. Teks diapit tanda kutip tunggal atau ganda.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/dart-dasar/dart-string/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('acb7e6df-69c5-48b9-8562-b765ccd0b6d1', '02df48d4-c44a-4fd5-8db2-ef413d3381f1', 'String', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/dart-dasar/dart-string/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d6d15d42-82e7-497a-8d1a-80fb3af43af2', '02df48d4-c44a-4fd5-8db2-ef413d3381f1', 'Text', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/dart-dasar/dart-string/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('555b55d5-db3f-4255-8b12-cdb847b4cf00', '02df48d4-c44a-4fd5-8db2-ef413d3381f1', 'Char', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/dart-dasar/dart-string/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('007c8471-f74d-43bc-846a-42f7bf02fe4d', '02df48d4-c44a-4fd5-8db2-ef413d3381f1', 'Word', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/dart-dasar/dart-list
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('9f5fb768-a8df-44d2-853b-16903dc67739', '2526b18f-5665-4d3c-8eef-9d1516100946', 'dart-list', 'multiple_choice'::public.question_type, 'Tipe Data', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Tipe data Dart untuk kumpulan nilai berurutan adalah…', 'List menyimpan elemen berurutan dan dapat diakses dengan indeks. Map menyimpan pasangan kunci-nilai.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/dart-dasar/dart-list/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('04ef5f6d-45d2-4732-8d62-476b8b706477', '9f5fb768-a8df-44d2-853b-16903dc67739', 'List', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/dart-dasar/dart-list/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8d392109-e3c9-493a-8628-7c03cea589ce', '9f5fb768-a8df-44d2-853b-16903dc67739', 'Map', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/dart-dasar/dart-list/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e141e9e0-4c31-412c-8c51-d23e5a16c11c', '9f5fb768-a8df-44d2-853b-16903dc67739', 'Set', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/dart-dasar/dart-list/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3122387b-9c6e-498b-8a97-732c154165f6', '9f5fb768-a8df-44d2-853b-16903dc67739', 'Future', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/dart-dasar/dart-print
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('e1750dd9-3bf9-4d72-83bb-ca9ef4f8e58c', '2526b18f-5665-4d3c-8eef-9d1516100946', 'dart-print', 'fill_blank'::public.question_type, 'Dart', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Fungsi untuk mencetak teks ke konsol adalah ___(''Halo'');', 'print mengirim teks ke konsol dan sering dipakai saat debugging.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: ppb-flutter-dart/dart-dasar/dart-print/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('102d5a2a-976e-4489-89b9-d4db6455e9fa', 'e1750dd9-3bf9-4d72-83bb-ca9ef4f8e58c', 'print', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: ppb-flutter-dart/dart-dasar/dart-null-safety
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('ce870516-6d54-41c8-82fd-1fad980b3d0f', '2526b18f-5665-4d3c-8eef-9d1516100946', 'dart-null-safety', 'multiple_choice'::public.question_type, 'Null Safety', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Tanda ? pada tipe seperti String? berarti variabel tersebut…', 'String? menandakan tipe nullable, sehingga nilainya boleh null dan harus diperiksa sebelum dipakai.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/dart-dasar/dart-null-safety/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2923f329-a9b9-4059-81de-55f8e998c21b', 'ce870516-6d54-41c8-82fd-1fad980b3d0f', 'Boleh bernilai null', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/dart-dasar/dart-null-safety/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1a2151ae-976c-4bc7-8c4b-fb03b72700bf', 'ce870516-6d54-41c8-82fd-1fad980b3d0f', 'Wajib berisi teks', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/dart-dasar/dart-null-safety/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7730f617-be41-46c5-8e1a-63fe75263a43', 'ce870516-6d54-41c8-82fd-1fad980b3d0f', 'Tidak dapat diubah', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/dart-dasar/dart-null-safety/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('208b35df-6d17-470c-8a72-29ca3bf573ea', 'ce870516-6d54-41c8-82fd-1fad980b3d0f', 'Otomatis menjadi angka', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: ppb-flutter-dart/flutter-review
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('79a0840f-87a6-4e18-83a6-f7db56379821', 'b45443a2-18a0-4f52-85fe-00175aa30180', 'flutter-review', 'Review Dart dan Flutter', 'Ulangi titik masuk program, widget, dan dependensi.', 'review'::public.lesson_kind, 5, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: ppb-flutter-dart/flutter-review
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('1fc2df59-b99e-44ef-8668-0000756ac9d8', 'b45443a2-18a0-4f52-85fe-00175aa30180', 'lesson-flutter-review', 'Review Dart dan Flutter', 'Ulangi titik masuk program, widget, dan dependensi.', 'review'::public.node_kind, '79a0840f-87a6-4e18-83a6-f7db56379821', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: ppb-flutter-dart/flutter-review/review-dart-main
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('908e5a0f-effd-454a-89dc-fcab98f48f76', '79a0840f-87a6-4e18-83a6-f7db56379821', 'review-dart-main', 'multiple_choice'::public.question_type, 'Dart', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Fungsi yang menjadi titik masuk program Dart adalah…', 'Program Dart dimulai dari fungsi main(). Flutter memanggil runApp() di dalamnya.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/flutter-review/review-dart-main/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('72fd56fb-19ed-4687-8499-b9f911c44643', '908e5a0f-effd-454a-89dc-fcab98f48f76', 'main()', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/flutter-review/review-dart-main/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('37e703ae-7177-4feb-8d57-c42b6f73abf1', '908e5a0f-effd-454a-89dc-fcab98f48f76', 'start()', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/flutter-review/review-dart-main/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('351342f0-4995-406d-8407-2ecead70fe40', '908e5a0f-effd-454a-89dc-fcab98f48f76', 'init()', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/flutter-review/review-dart-main/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('67754893-6a51-4429-8e98-9ebae357c20a', '908e5a0f-effd-454a-89dc-fcab98f48f76', 'run()', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/flutter-review/review-flutter-stateless
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('c17f2dbe-e771-4075-8ada-6d448a5d50f7', '79a0840f-87a6-4e18-83a6-f7db56379821', 'review-flutter-stateless', 'multiple_choice'::public.question_type, 'Widget', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'StatelessWidget cocok untuk widget yang…', 'StatelessWidget tidak memiliki state yang berubah. Jika tampilan perlu berubah, gunakan StatefulWidget.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/flutter-review/review-flutter-stateless/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('14941ebb-35e9-4cf3-8a76-f53e23c9ba0f', 'c17f2dbe-e771-4075-8ada-6d448a5d50f7', 'Tampilannya tidak berubah setelah dibuat', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/flutter-review/review-flutter-stateless/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('46454b64-3b99-4343-83ef-eec6534c9207', 'c17f2dbe-e771-4075-8ada-6d448a5d50f7', 'Selalu menyimpan data sementara', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/flutter-review/review-flutter-stateless/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e7a95351-7caa-434b-8650-abe861488035', 'c17f2dbe-e771-4075-8ada-6d448a5d50f7', 'Hanya dapat digunakan sekali', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/flutter-review/review-flutter-stateless/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a3413136-99d0-4f39-8619-0aab042c6e44', 'c17f2dbe-e771-4075-8ada-6d448a5d50f7', 'Tidak memiliki anak widget', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/flutter-review/review-flutter-pubspec
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('a5a2f612-dbe0-4c9f-8dda-76e3759d73f1', '79a0840f-87a6-4e18-83a6-f7db56379821', 'review-flutter-pubspec', 'typing'::public.question_type, 'Flutter', 'beginner'::public.difficulty_band, 'Tulis jawaban pada kolom yang tersedia.', 'Tulis nama file konfigurasi dependensi dan metadata proyek Flutter.', 'pubspec.yaml menyimpan nama proyek, versi, aset, dan daftar dependency Flutter.', null, 15, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: ppb-flutter-dart/flutter-review/review-flutter-pubspec/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('f060c114-dc92-4e88-8ace-158affa0d528', 'a5a2f612-dbe0-4c9f-8dda-76e3759d73f1', 'pubspec.yaml', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- lessons: ppb-flutter-dart/flutter-challenge
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('2a3bd110-196d-49ce-89b7-a9d9da603082', 'b45443a2-18a0-4f52-85fe-00175aa30180', 'flutter-challenge', 'Tantangan Dart dan Flutter', 'Latihan state, immutability, dan widget dasar.', 'challenge'::public.lesson_kind, 6, 10, 2, 2, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: ppb-flutter-dart/flutter-challenge
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('79675202-46ec-437b-8190-980f58312b2f', 'b45443a2-18a0-4f52-85fe-00175aa30180', 'lesson-flutter-challenge', 'Tantangan Dart dan Flutter', 'Latihan state, immutability, dan widget dasar.', 'challenge'::public.node_kind, '2a3bd110-196d-49ce-89b7-a9d9da603082', 20, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: ppb-flutter-dart/flutter-challenge/challenge-flutter-setstate
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('862187ae-0826-4191-8262-944be2dd2cd5', '2a3bd110-196d-49ce-89b7-a9d9da603082', 'challenge-flutter-setstate', 'multiple_choice'::public.question_type, 'State', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Apa fungsi setState() pada StatefulWidget?', 'setState menandai widget kotor sehingga Flutter menjadwalkan pembangunan ulang UI dengan nilai terbaru.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/flutter-challenge/challenge-flutter-setstate/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('32adcf61-ae60-4d3e-803e-a36811cf2a4d', '862187ae-0826-4191-8262-944be2dd2cd5', 'Memberi tahu Flutter bahwa state berubah dan UI perlu dibangun ulang', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/flutter-challenge/challenge-flutter-setstate/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d77517c4-7e99-4018-83ba-cadf855ad967', '862187ae-0826-4191-8262-944be2dd2cd5', 'Menyimpan data ke database', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/flutter-challenge/challenge-flutter-setstate/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6461e2ca-ca4a-4a4e-8777-6c15edd0d594', '862187ae-0826-4191-8262-944be2dd2cd5', 'Menutup aplikasi', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/flutter-challenge/challenge-flutter-setstate/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('68de04c3-bdbb-4eb9-81a1-a64e1cafe552', '862187ae-0826-4191-8262-944be2dd2cd5', 'Mengubah tema secara permanen', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/flutter-challenge/challenge-dart-final
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('4ccd2ed8-fa5f-48fa-8765-f61e8575209e', '2a3bd110-196d-49ce-89b7-a9d9da603082', 'challenge-dart-final', 'multiple_choice'::public.question_type, 'Dart', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Kata kunci final pada variabel berarti…', 'final menetapkan nilai sekali. const lebih ketat karena nilainya harus diketahui saat kompilasi.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/flutter-challenge/challenge-dart-final/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('990031a9-b4fd-4040-8fe4-b70e9f5c699b', '4ccd2ed8-fa5f-48fa-8765-f61e8575209e', 'Nilainya tidak dapat diubah setelah diinisialisasi', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/flutter-challenge/challenge-dart-final/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b7e937c8-0bbd-4cbb-81b7-25d7f4a53f72', '4ccd2ed8-fa5f-48fa-8765-f61e8575209e', 'Nilai selalu null', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/flutter-challenge/challenge-dart-final/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f0056279-d99f-494a-8218-c92a0f607f5d', '4ccd2ed8-fa5f-48fa-8765-f61e8575209e', 'Variabel bersifat global', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/flutter-challenge/challenge-dart-final/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0302f7b8-12fa-4bf0-8e25-9793d988652b', '4ccd2ed8-fa5f-48fa-8765-f61e8575209e', 'Variabel hanya dapat dipakai sekali', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/flutter-challenge/challenge-flutter-text
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('368a72c7-b1ac-4b59-8763-d7ad20783bb0', '2a3bd110-196d-49ce-89b7-a9d9da603082', 'challenge-flutter-text', 'fill_blank'::public.question_type, 'Widget', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Widget Flutter untuk menampilkan teks adalah ___', 'Widget Text menampilkan string. Atribut style mengatur ukuran, warna, dan bobot huruf.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: ppb-flutter-dart/flutter-challenge/challenge-flutter-text/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('042d5118-10e9-4a28-8098-b77fc034032e', '368a72c7-b1ac-4b59-8763-d7ad20783bb0', 'text', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- question_answers: ppb-flutter-dart/flutter-challenge/challenge-flutter-text/1
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('5d5f3176-bbe3-4216-8cda-f7b3d66e74df', '368a72c7-b1ac-4b59-8763-d7ad20783bb0', 'Text', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- course_levels: ppb-flutter-dart/elementary
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('767ed8b8-2eaa-43fd-8d8c-154bbac6330f', 'ad929edd-d05c-4383-8b8d-35e2079e6051', 'elementary', 'Level 2 · Widget Flutter', 'Menyusun antarmuka dari widget dan layout dasar Flutter.', 'elementary'::public.difficulty_band, 1, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: ppb-flutter-dart/widget-flutter
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('32808930-79cf-4479-81b0-ef2142c98e2b', '767ed8b8-2eaa-43fd-8d8c-154bbac6330f', 'widget-flutter', 'Menyusun Widget', 'Semua tampilan Flutter dibangun dari widget yang disusun bertingkat.', array['Membedakan StatelessWidget dan widget dasar', 'Menyusun layout vertikal', 'Menambahkan jarak dan teks']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: ppb-flutter-dart/widget-flutter
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('cf6a6019-87f4-473c-8739-f50bc5b09437', '32808930-79cf-4479-81b0-ef2142c98e2b', 'widget-flutter', 'Widget Flutter', 'Widget inti untuk membangun layar aplikasi.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: ppb-flutter-dart/widget-flutter
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('14312ff6-7380-4745-8c85-e1f9129766f0', '32808930-79cf-4479-81b0-ef2142c98e2b', 'lesson-widget-flutter', 'Widget Flutter', 'Widget inti untuk membangun layar aplikasi.', 'lesson'::public.node_kind, 'cf6a6019-87f4-473c-8739-f50bc5b09437', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: ppb-flutter-dart/widget-flutter/flutter-stateless
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('ff108e8c-7dcc-4663-89db-d43fdccae594', 'cf6a6019-87f4-473c-8739-f50bc5b09437', 'flutter-stateless', 'multiple_choice'::public.question_type, 'Widget', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Widget yang tidak memiliki state yang berubah disebut…', 'StatelessWidget menggambarkan tampilan yang tidak berubah karena state internal.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/widget-flutter/flutter-stateless/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('09116933-ca04-47b7-8639-b68e6bee26f3', 'ff108e8c-7dcc-4663-89db-d43fdccae594', 'StatelessWidget', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/widget-flutter/flutter-stateless/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d51318e6-4b8a-42da-84f7-c9b48cd64d53', 'ff108e8c-7dcc-4663-89db-d43fdccae594', 'StatefulWidget', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/widget-flutter/flutter-stateless/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('da63dfbb-aa00-400f-80a9-2c5a80878dc8', 'ff108e8c-7dcc-4663-89db-d43fdccae594', 'InheritedWidget', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/widget-flutter/flutter-stateless/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ab177dc2-e884-48c4-8f4b-941be0eccfa5', 'ff108e8c-7dcc-4663-89db-d43fdccae594', 'StreamBuilder', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/widget-flutter/flutter-materialapp
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('9a52dc77-50e0-406c-825c-644ab42094f6', 'cf6a6019-87f4-473c-8739-f50bc5b09437', 'flutter-materialapp', 'multiple_choice'::public.question_type, 'Widget', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Widget akar yang menyiapkan tema dan navigasi Material adalah…', 'MaterialApp membungkus aplikasi dengan tema, rute, dan konfigurasi Material.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/widget-flutter/flutter-materialapp/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e29c224d-82c3-42e7-8dea-c79c6672640e', '9a52dc77-50e0-406c-825c-644ab42094f6', 'MaterialApp', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/widget-flutter/flutter-materialapp/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e37792f6-c480-4a76-801e-85c21828856b', '9a52dc77-50e0-406c-825c-644ab42094f6', 'Container', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/widget-flutter/flutter-materialapp/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5f79e71c-bd97-4803-8776-af5836d23563', '9a52dc77-50e0-406c-825c-644ab42094f6', 'Scaffold', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/widget-flutter/flutter-materialapp/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5ae7c4f1-22a0-402c-838e-a74ddc617a1f', '9a52dc77-50e0-406c-825c-644ab42094f6', 'Column', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/widget-flutter/flutter-column
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('eb9f5004-0c4e-419a-81ed-856ba7913231', 'cf6a6019-87f4-473c-8739-f50bc5b09437', 'flutter-column', 'multiple_choice'::public.question_type, 'Layout', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Widget untuk menyusun anak elemen secara vertikal adalah…', 'Column menata anak dari atas ke bawah. Row menata dari kiri ke kanan.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/widget-flutter/flutter-column/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9118aee3-f516-4966-8f33-80597c2cfcbb', 'eb9f5004-0c4e-419a-81ed-856ba7913231', 'Column', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/widget-flutter/flutter-column/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9b51edf6-bcbb-4c24-83db-85c202acfa68', 'eb9f5004-0c4e-419a-81ed-856ba7913231', 'Row', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/widget-flutter/flutter-column/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('953c4880-6fb1-4885-8a3d-a787819d6800', 'eb9f5004-0c4e-419a-81ed-856ba7913231', 'Stack', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/widget-flutter/flutter-column/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a21c9386-92f5-4dad-8ff2-06eefbc9bbcd', 'eb9f5004-0c4e-419a-81ed-856ba7913231', 'Wrap', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/widget-flutter/flutter-padding
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('514ee17d-ac4e-4179-851a-eb6e1efc5401', 'cf6a6019-87f4-473c-8739-f50bc5b09437', 'flutter-padding', 'multiple_choice'::public.question_type, 'Layout', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Widget untuk memberi jarak di sekeliling anak elemen adalah…', 'Padding membungkus anak dengan ruang kosong. SizedBox juga dapat memberi jarak, tetapi Padding lebih eksplisit untuk tujuan itu.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/widget-flutter/flutter-padding/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5ba8f096-6759-4813-8a7e-dfc995d10ab6', '514ee17d-ac4e-4179-851a-eb6e1efc5401', 'Padding', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/widget-flutter/flutter-padding/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('368fd5fc-557e-48cf-870b-aa361ca53c00', '514ee17d-ac4e-4179-851a-eb6e1efc5401', 'SizedBox', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/widget-flutter/flutter-padding/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1d706232-db0a-444d-8485-dbba3151f4bf', '514ee17d-ac4e-4179-851a-eb6e1efc5401', 'Center', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/widget-flutter/flutter-padding/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('11a4d1ca-1df7-4b74-87aa-b911b33baca1', '514ee17d-ac4e-4179-851a-eb6e1efc5401', 'Align', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/widget-flutter/flutter-text
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('534b4216-94b6-43f5-8ffa-be56a53b5ab9', 'cf6a6019-87f4-473c-8739-f50bc5b09437', 'flutter-text', 'fill_blank'::public.question_type, 'Widget', 'elementary'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Widget untuk menampilkan teks adalah ___(''Halo'').', 'Text menampilkan rangkaian karakter. Gaya teks diatur lewat properti style.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: ppb-flutter-dart/widget-flutter/flutter-text/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('0d17bd0b-a585-41f9-8c59-cbe535c24ff6', '534b4216-94b6-43f5-8ffa-be56a53b5ab9', 'Text', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- lessons: ppb-flutter-dart/latihan-widget-dasar
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('a3f749bd-47db-4168-8a1a-86a234494bc6', '32808930-79cf-4479-81b0-ef2142c98e2b', 'latihan-widget-dasar', 'Latihan Widget Dasar', 'Latihan menyusun widget teks, kolom, dan jarak.', 'practice'::public.lesson_kind, 6, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: ppb-flutter-dart/latihan-widget-dasar
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('465cc11f-7710-439b-847c-6548c75b319a', '32808930-79cf-4479-81b0-ef2142c98e2b', 'lesson-latihan-widget-dasar', 'Latihan Widget Dasar', 'Latihan menyusun widget teks, kolom, dan jarak.', 'practice'::public.node_kind, 'a3f749bd-47db-4168-8a1a-86a234494bc6', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: ppb-flutter-dart/latihan-widget-dasar/practice-ppb-text
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('bd0b1a06-bdf6-4048-8baf-d9bf7f76deaa', 'a3f749bd-47db-4168-8a1a-86a234494bc6', 'practice-ppb-text', 'multiple_choice'::public.question_type, 'Widget', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Widget Flutter untuk menampilkan teks adalah…', 'Text menampilkan rangkaian karakter. Gaya diatur lewat parameter style.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/latihan-widget-dasar/practice-ppb-text/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('765bbe3a-da00-4cb8-8d8f-8485cba11539', 'bd0b1a06-bdf6-4048-8baf-d9bf7f76deaa', 'Text', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/latihan-widget-dasar/practice-ppb-text/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8ede2c24-ac28-4386-8506-38b3fb16b6b5', 'bd0b1a06-bdf6-4048-8baf-d9bf7f76deaa', 'Label', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/latihan-widget-dasar/practice-ppb-text/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('037fb649-ac63-4fb0-8964-f88d5721c20b', 'bd0b1a06-bdf6-4048-8baf-d9bf7f76deaa', 'Span', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/latihan-widget-dasar/practice-ppb-text/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a378597e-751c-46bf-8817-ed13212de2b2', 'bd0b1a06-bdf6-4048-8baf-d9bf7f76deaa', 'Paragraph', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/latihan-widget-dasar/practice-ppb-column
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('c77da13b-3835-4483-897e-7f1f530e8aa8', 'a3f749bd-47db-4168-8a1a-86a234494bc6', 'practice-ppb-column', 'multiple_choice'::public.question_type, 'Layout', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Widget yang menyusun anak secara vertikal adalah…', 'Column menyusun anak dari atas ke bawah. Row menyusun dari kiri ke kanan.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/latihan-widget-dasar/practice-ppb-column/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5c5f0407-4da0-4fe7-8e04-a7b67a0f38e0', 'c77da13b-3835-4483-897e-7f1f530e8aa8', 'Column', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/latihan-widget-dasar/practice-ppb-column/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ccf4812d-9e71-46ce-82be-137ab619c4ca', 'c77da13b-3835-4483-897e-7f1f530e8aa8', 'Row', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/latihan-widget-dasar/practice-ppb-column/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('586aea09-df99-4aef-8b4e-c43f959f3330', 'c77da13b-3835-4483-897e-7f1f530e8aa8', 'Stack', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/latihan-widget-dasar/practice-ppb-column/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c9bc2389-b68c-46e1-8cb1-60a471783f2a', 'c77da13b-3835-4483-897e-7f1f530e8aa8', 'Container', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/latihan-widget-dasar/practice-ppb-padding
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('70a5942c-f9c2-4166-879f-3e09e3f731fa', 'a3f749bd-47db-4168-8a1a-86a234494bc6', 'practice-ppb-padding', 'fill_blank'::public.question_type, 'Layout', 'elementary'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Lengkapi: __( padding: EdgeInsets.all(16), child: Text("Halo") )', 'Padding membungkus anak dan menambahkan ruang di sekelilingnya.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: ppb-flutter-dart/latihan-widget-dasar/practice-ppb-padding/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('9d5133c4-12b1-4e4b-8330-63bd5cef5d21', '70a5942c-f9c2-4166-879f-3e09e3f731fa', 'Padding', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- lessons: ppb-flutter-dart/checkpoint-widget-flutter
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('3346378b-b4ac-4b60-8317-35c7e5af6ae8', '32808930-79cf-4479-81b0-ef2142c98e2b', 'checkpoint-widget-flutter', 'Checkpoint Widget Flutter', 'Periksa pemahaman state dan method inti widget.', 'review'::public.lesson_kind, 8, 10, 2, 2, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: ppb-flutter-dart/checkpoint-widget-flutter
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('faba3fcd-b8f9-4154-8456-9dca3f78a153', '32808930-79cf-4479-81b0-ef2142c98e2b', 'lesson-checkpoint-widget-flutter', 'Checkpoint Widget Flutter', 'Periksa pemahaman state dan method inti widget.', 'checkpoint'::public.node_kind, '3346378b-b4ac-4b60-8317-35c7e5af6ae8', 20, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: ppb-flutter-dart/checkpoint-widget-flutter/checkpoint-ppb-stateful
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('2378852d-27b5-4cbb-8c22-f5ed9e1ccaae', '3346378b-b4ac-4b60-8317-35c7e5af6ae8', 'checkpoint-ppb-stateful', 'multiple_choice'::public.question_type, 'State', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Widget yang memiliki state dan dapat berubah saat runtime adalah…', 'StatefulWidget memiliki objek State yang dapat memicu rebuild lewat setState.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/checkpoint-widget-flutter/checkpoint-ppb-stateful/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a0a01bd2-d896-4348-8e36-e123a5a82b13', '2378852d-27b5-4cbb-8c22-f5ed9e1ccaae', 'StatefulWidget', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/checkpoint-widget-flutter/checkpoint-ppb-stateful/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('42d39ebd-94e3-430b-8fd5-abd00cfc9cfd', '2378852d-27b5-4cbb-8c22-f5ed9e1ccaae', 'StatelessWidget', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/checkpoint-widget-flutter/checkpoint-ppb-stateful/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7639eac6-c694-45fe-8655-e4440e71a860', '2378852d-27b5-4cbb-8c22-f5ed9e1ccaae', 'InheritedWidget', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/checkpoint-widget-flutter/checkpoint-ppb-stateful/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('75898cfe-349b-4a3e-8239-7a65f369cc6b', '2378852d-27b5-4cbb-8c22-f5ed9e1ccaae', 'PreferredSizeWidget', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/checkpoint-widget-flutter/checkpoint-ppb-build
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('3230c28b-d499-4598-88ef-ed69d99155f7', '3346378b-b4ac-4b60-8317-35c7e5af6ae8', 'checkpoint-ppb-build', 'multiple_choice'::public.question_type, 'State', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Method yang wajib diimplementasikan pada kelas State adalah…', 'build mengembalikan widget yang akan dirender. Method lain opsional sesuai kebutuhan siklus hidup.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/checkpoint-widget-flutter/checkpoint-ppb-build/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ca20ba2e-2854-418f-85eb-0992e6a63d0e', '3230c28b-d499-4598-88ef-ed69d99155f7', 'build', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/checkpoint-widget-flutter/checkpoint-ppb-build/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('95c2d0f3-70a3-49e1-8d47-f3de144d2a22', '3230c28b-d499-4598-88ef-ed69d99155f7', 'initState', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/checkpoint-widget-flutter/checkpoint-ppb-build/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('002b4277-f750-4b74-86d9-d32e1982549c', '3230c28b-d499-4598-88ef-ed69d99155f7', 'dispose', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/checkpoint-widget-flutter/checkpoint-ppb-build/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('40af9852-d6be-46bb-838e-995443c5c832', '3230c28b-d499-4598-88ef-ed69d99155f7', 'setState', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/checkpoint-widget-flutter/checkpoint-ppb-image
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('12e21fb2-abca-437b-86a7-2c424a13eb5a', '3346378b-b4ac-4b60-8317-35c7e5af6ae8', 'checkpoint-ppb-image', 'multiple_choice'::public.question_type, 'Widget', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Constructor Image untuk menampilkan gambar dari aset aplikasi adalah…', 'Image.asset membaca gambar yang didaftarkan di pubspec.yaml. Image.network mengambil gambar dari URL.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/checkpoint-widget-flutter/checkpoint-ppb-image/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('770019d7-54b7-4b14-80a1-1e4e0a901b6e', '12e21fb2-abca-437b-86a7-2c424a13eb5a', 'Image.asset', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/checkpoint-widget-flutter/checkpoint-ppb-image/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d332fff4-b527-448e-8eb2-02fd18cbbb6a', '12e21fb2-abca-437b-86a7-2c424a13eb5a', 'Image.network', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/checkpoint-widget-flutter/checkpoint-ppb-image/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8c369e95-e2c3-4827-8b58-622d5e3ada93', '12e21fb2-abca-437b-86a7-2c424a13eb5a', 'Image.file', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/checkpoint-widget-flutter/checkpoint-ppb-image/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5596bbc1-3ccc-4d76-89dc-c80fd1462b52', '12e21fb2-abca-437b-86a7-2c424a13eb5a', 'Image.memory', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- course_levels: ppb-flutter-dart/intermediate
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('70e18278-4736-4e68-8867-0e5376f8e36a', 'ad929edd-d05c-4383-8b8d-35e2079e6051', 'intermediate', 'Level 3 · State dan Navigasi', 'Mengelola perubahan data dan berpindah halaman pada aplikasi Flutter.', 'intermediate'::public.difficulty_band, 2, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: ppb-flutter-dart/state-navigasi
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('d57b2995-9718-438c-8cc6-3d002656fa5f', '70e18278-4736-4e68-8867-0e5376f8e36a', 'state-navigasi', 'State dan Navigasi', 'Aplikasi nyata perlu bereaksi terhadap input dan berpindah layar.', array['Menggunakan StatefulWidget', 'Memperbarui tampilan dengan setState', 'Berpindah halaman dengan Navigator']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: ppb-flutter-dart/state-navigasi
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('6b450bba-82c9-47d0-8abc-cf641638785e', 'd57b2995-9718-438c-8cc6-3d002656fa5f', 'state-navigasi', 'State dan Navigasi', 'Membuat aplikasi merespons perubahan dan perpindahan layar.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: ppb-flutter-dart/state-navigasi
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('89fe235e-d8ea-4211-80d8-6c8c5eef642b', 'd57b2995-9718-438c-8cc6-3d002656fa5f', 'lesson-state-navigasi', 'State dan Navigasi', 'Membuat aplikasi merespons perubahan dan perpindahan layar.', 'lesson'::public.node_kind, '6b450bba-82c9-47d0-8abc-cf641638785e', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: ppb-flutter-dart/state-navigasi/flutter-stateful
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('46229677-2643-4d6b-8f58-b5166ded964b', '6b450bba-82c9-47d0-8abc-cf641638785e', 'flutter-stateful', 'multiple_choice'::public.question_type, 'State', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Widget yang dapat berubah tampilannya karena state disebut…', 'StatefulWidget memiliki objek State yang dapat memicu pembangunan ulang tampilan.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/state-navigasi/flutter-stateful/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('bb9962cf-ffc6-40cb-8d54-fe02cc48caa4', '46229677-2643-4d6b-8f58-b5166ded964b', 'StatefulWidget', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/state-navigasi/flutter-stateful/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('95372f47-9d2a-40c2-8535-3f66dc337616', '46229677-2643-4d6b-8f58-b5166ded964b', 'StatelessWidget', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/state-navigasi/flutter-stateful/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('11689ec6-3c1e-4c74-81b4-f96a237ba3fc', '46229677-2643-4d6b-8f58-b5166ded964b', 'MaterialApp', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/state-navigasi/flutter-stateful/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e757d622-e880-4327-80c5-c6a98b06ba32', '46229677-2643-4d6b-8f58-b5166ded964b', 'Text', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/state-navigasi/flutter-setstate
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('2c68f5ab-6ab7-47da-8b55-9be006d957cb', '6b450bba-82c9-47d0-8abc-cf641638785e', 'flutter-setstate', 'multiple_choice'::public.question_type, 'State', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Method yang memberi tahu Flutter bahwa state berubah adalah…', 'setState membungkus perubahan state dan menjadwalkan pembangunan ulang widget.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/state-navigasi/flutter-setstate/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f85984a6-f090-46ca-8c16-7056c0d1ef16', '2c68f5ab-6ab7-47da-8b55-9be006d957cb', 'setState', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/state-navigasi/flutter-setstate/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7fa75cbc-05cb-48ef-8bfe-b287eecb51f1', '2c68f5ab-6ab7-47da-8b55-9be006d957cb', 'initState', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/state-navigasi/flutter-setstate/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('953e2f12-b7b7-49ef-8900-0cfe0bce6db1', '2c68f5ab-6ab7-47da-8b55-9be006d957cb', 'dispose', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/state-navigasi/flutter-setstate/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0c8c9162-96f2-4c2d-83d4-36cb91c6da76', '2c68f5ab-6ab7-47da-8b55-9be006d957cb', 'build', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/state-navigasi/flutter-navigator
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('7815a4a0-9d07-4e37-849d-dde59e164a1d', '6b450bba-82c9-47d0-8abc-cf641638785e', 'flutter-navigator', 'multiple_choice'::public.question_type, 'Navigasi', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Cara umum membuka halaman baru di Flutter adalah…', 'Navigator.push menambahkan rute baru ke tumpukan navigasi.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/state-navigasi/flutter-navigator/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ca6d0bee-a0a9-44da-8f02-74e8819cd379', '7815a4a0-9d07-4e37-849d-dde59e164a1d', 'Navigator.push(context, route)', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/state-navigasi/flutter-navigator/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a00e0006-b4d7-4887-8b89-bd3fb7b0f7e3', '7815a4a0-9d07-4e37-849d-dde59e164a1d', 'window.open(url)', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/state-navigasi/flutter-navigator/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5110e40a-da55-4262-8f3c-27219fe907a6', '7815a4a0-9d07-4e37-849d-dde59e164a1d', 'Navigator.remove()', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/state-navigasi/flutter-navigator/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6173fc7d-e6d8-48c7-85e9-d1133b862c71', '7815a4a0-9d07-4e37-849d-dde59e164a1d', 'Scaffold.push()', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/state-navigasi/flutter-button
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('f641c6e9-94bd-4023-8bef-af4295b8c9d5', '6b450bba-82c9-47d0-8abc-cf641638785e', 'flutter-button', 'multiple_choice'::public.question_type, 'Widget', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Widget tombol Material yang umum dipakai untuk aksi utama adalah…', 'ElevatedButton tampil sebagai tombol dengan latar dan elevasi. TextButton lebih ringan secara visual.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/state-navigasi/flutter-button/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('63b1d1fb-fe45-4bff-8943-5ceeadc10817', 'f641c6e9-94bd-4023-8bef-af4295b8c9d5', 'ElevatedButton', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/state-navigasi/flutter-button/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('46fa89ad-0dab-443c-8e99-0149280ee655', 'f641c6e9-94bd-4023-8bef-af4295b8c9d5', 'TextButton', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/state-navigasi/flutter-button/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('80e9dd9b-7c76-410e-8a87-fa3ceab48cf5', 'f641c6e9-94bd-4023-8bef-af4295b8c9d5', 'IconButton', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/state-navigasi/flutter-button/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e2fff1ce-6fde-4cc9-8bd2-86ea23729a4c', 'f641c6e9-94bd-4023-8bef-af4295b8c9d5', 'FloatingActionButton', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/state-navigasi/flutter-build-return
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('08574e4d-f881-4890-8bf1-83d62d67b2af', '6b450bba-82c9-47d0-8abc-cf641638785e', 'flutter-build-return', 'fill_blank'::public.question_type, 'Widget', 'intermediate'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Method build pada widget mengembalikan objek bertipe ___.', 'build mendeskripsikan tampilan dan mengembalikan Widget yang akan dirender.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: ppb-flutter-dart/state-navigasi/flutter-build-return/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('e8a9e3fd-d354-4d04-8e0e-a3b5b2e89c69', '08574e4d-f881-4890-8bf1-83d62d67b2af', 'Widget', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- lessons: ppb-flutter-dart/legendary-state-navigasi
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('cadb837a-318e-44b1-8305-567ad3fd86b7', 'd57b2995-9718-438c-8cc6-3d002656fa5f', 'legendary-state-navigasi', 'Legendary State & Navigasi', 'Tantangan lanjutan tentang rebuild, state, dan perpindahan halaman.', 'legendary'::public.lesson_kind, 9, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: ppb-flutter-dart/legendary-state-navigasi
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('d0138615-28f3-4ef7-8e1c-45c9e84bff33', 'd57b2995-9718-438c-8cc6-3d002656fa5f', 'lesson-legendary-state-navigasi', 'Legendary State & Navigasi', 'Tantangan lanjutan tentang rebuild, state, dan perpindahan halaman.', 'legendary'::public.node_kind, 'cadb837a-318e-44b1-8305-567ad3fd86b7', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: ppb-flutter-dart/legendary-state-navigasi/legendary-ppb-setstate
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('60649e7b-0985-4f86-8314-6d096a8c6ff3', 'cadb837a-318e-44b1-8305-567ad3fd86b7', 'legendary-ppb-setstate', 'multiple_choice'::public.question_type, 'State', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Memanggil setState di dalam State akan…', 'setState memberi tahu framework bahwa state berubah sehingga build dijalankan ulang.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/legendary-state-navigasi/legendary-ppb-setstate/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('558c6001-fa54-4f8c-8af8-4c8059b803ff', '60649e7b-0985-4f86-8314-6d096a8c6ff3', 'Menjadwalkan rebuild widget tersebut', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/legendary-state-navigasi/legendary-ppb-setstate/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8c617669-0e3f-4b2c-8b65-259a3c5b9986', '60649e7b-0985-4f86-8314-6d096a8c6ff3', 'Langsung mengganti halaman', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/legendary-state-navigasi/legendary-ppb-setstate/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b3f67e7f-6348-4de3-85f7-b2f805538a92', '60649e7b-0985-4f86-8314-6d096a8c6ff3', 'Menghapus state sebelumnya', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/legendary-state-navigasi/legendary-ppb-setstate/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('92ae91e8-964b-4d37-8c83-238f7e261f7d', '60649e7b-0985-4f86-8314-6d096a8c6ff3', 'Menghentikan aplikasi', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/legendary-state-navigasi/legendary-ppb-navigator
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('21129db9-ad17-4d67-83c5-705ba6ef4c2e', 'cadb837a-318e-44b1-8305-567ad3fd86b7', 'legendary-ppb-navigator', 'multiple_choice'::public.question_type, 'Navigasi', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Cara membuka halaman baru di Flutter adalah…', 'Navigator.push menambahkan route baru ke tumpukan. Navigator.pop kembali ke route sebelumnya.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: ppb-flutter-dart/legendary-state-navigasi/legendary-ppb-navigator/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('960890db-612f-4b2f-8294-d3f7c812fa1c', '21129db9-ad17-4d67-83c5-705ba6ef4c2e', 'Navigator.push dengan MaterialPageRoute', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/legendary-state-navigasi/legendary-ppb-navigator/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('bbd01f49-758d-4b2f-810d-5711390f20e9', '21129db9-ad17-4d67-83c5-705ba6ef4c2e', 'Navigator.pop dengan MaterialPageRoute', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/legendary-state-navigasi/legendary-ppb-navigator/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0816f536-5588-446b-86f4-115091e84d55', '21129db9-ad17-4d67-83c5-705ba6ef4c2e', 'setState dengan MaterialPageRoute', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: ppb-flutter-dart/legendary-state-navigasi/legendary-ppb-navigator/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6baedfd9-6ced-4e9a-85fa-cba21c6cf498', '21129db9-ad17-4d67-83c5-705ba6ef4c2e', 'build dengan MaterialPageRoute', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: ppb-flutter-dart/legendary-state-navigasi/legendary-ppb-push
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('d08165c5-697d-4323-8549-c2301db2e761', 'cadb837a-318e-44b1-8305-567ad3fd86b7', 'legendary-ppb-push', 'fill_blank'::public.question_type, 'Navigasi', 'intermediate'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Lengkapi: Navigator.__(context, MaterialPageRoute(builder: (_) => HalamanBaru()));', 'push menempatkan halaman baru di atas halaman saat ini.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: ppb-flutter-dart/legendary-state-navigasi/legendary-ppb-push/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('7530aab3-d9a8-4369-816a-775ed2c4d4dd', 'd08165c5-697d-4323-8549-c2301db2e761', 'push', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- subjects: bahasa-inggris
insert into public.subjects (id, slug, name, short_name, description, category, icon_key, accent_color, status, is_primary, sort_order)
values ('d8d5aabe-eb39-448a-8708-1f2a882eb18d', 'bahasa-inggris', 'Bahasa Inggris', 'Inggris', 'Kosakata, tata bahasa, dan membaca teks sederhana untuk percakapan sehari-hari.', 'bahasa', 'language', '#4CD1C0', 'active'::public.subject_status, true, 4)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  accent_color = excluded.accent_color,
  status = excluded.status,
  is_primary = excluded.is_primary,
  sort_order = excluded.sort_order;

-- courses: bahasa-inggris
insert into public.courses (id, subject_id, slug, title, description, category, icon_key, sort_order, is_published)
values ('f58a09a8-f8d3-465c-884c-4e02cb4f8706', 'd8d5aabe-eb39-448a-8708-1f2a882eb18d', 'bahasa-inggris', 'Bahasa Inggris', 'Kosakata, tata bahasa, dan membaca teks sederhana untuk percakapan sehari-hari.', 'bahasa', 'language', 4, true)
on conflict (id) do update set
  subject_id = excluded.subject_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- course_levels: bahasa-inggris/beginner
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('01b2bc59-8416-42c2-86ee-7cbbc3b94120', 'f58a09a8-f8d3-465c-884c-4e02cb4f8706', 'beginner', 'Level 1 · Greetings & Vocabulary', 'Menyapa, memperkenalkan diri, dan mengenal kosakata sehari-hari.', 'beginner'::public.difficulty_band, 0, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: bahasa-inggris/sapaan-dan-kosakata
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('b7a20137-8711-43b7-81d0-f67ec776bbb5', '01b2bc59-8416-42c2-86ee-7cbbc3b94120', 'sapaan-dan-kosakata', 'Sapaan dan Kosakata', 'Langkah pertama berbahasa Inggris adalah berani menyapa dan menamai benda.', array['Menggunakan sapaan sesuai waktu', 'Memperkenalkan nama diri', 'Mengenali bentuk jamak sederhana']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: bahasa-inggris/greetings-vocabulary
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('f0515b28-98c2-4f02-81da-1f2be92efb99', 'b7a20137-8711-43b7-81d0-f67ec776bbb5', 'greetings-vocabulary', 'Greetings & Vocabulary', 'Sapaan, perkenalan, dan kosakata dasar.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-inggris/greetings-vocabulary
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('303b3cfa-67c9-470d-8539-ab5266ffbf9c', 'b7a20137-8711-43b7-81d0-f67ec776bbb5', 'lesson-greetings-vocabulary', 'Greetings & Vocabulary', 'Sapaan, perkenalan, dan kosakata dasar.', 'lesson'::public.node_kind, 'f0515b28-98c2-4f02-81da-1f2be92efb99', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: bahasa-inggris/greetings-vocabulary/en-good-morning
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('dd045d68-5c4c-45ef-861a-1bec6e4a806e', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-good-morning', 'multiple_choice'::public.question_type, 'Greetings', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Ucapan yang tepat pada pagi hari adalah…', 'Good morning dipakai dari pagi hingga siang. Good night dipakai saat berpisah untuk tidur.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/greetings-vocabulary/en-good-morning/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('4474cfdf-ba15-47ce-8bfa-153833283153', 'dd045d68-5c4c-45ef-861a-1bec6e4a806e', 'Good morning', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-good-morning/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('43a5cac6-8778-48cc-86a4-cf1aa0d00bcc', 'dd045d68-5c4c-45ef-861a-1bec6e4a806e', 'Good night', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-good-morning/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('686acee6-9916-4426-88a2-e2a4cd14b3e7', 'dd045d68-5c4c-45ef-861a-1bec6e4a806e', 'Good evening', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-good-morning/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('485b1a8d-f2c3-460d-8781-2127f618f10a', 'dd045d68-5c4c-45ef-861a-1bec6e4a806e', 'Goodbye', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/greetings-vocabulary/en-apple-meaning
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('978610d6-fb6e-4a01-8e65-d68004d84cbf', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-apple-meaning', 'multiple_choice'::public.question_type, 'Vocabulary', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Kata "apple" dalam bahasa Indonesia berarti…', 'Apple berarti apel. Jeruk adalah orange, mangga adalah mango, dan pisang adalah banana.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/greetings-vocabulary/en-apple-meaning/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('82a7b6dc-764b-475d-85fa-110a1f59e5a6', '978610d6-fb6e-4a01-8e65-d68004d84cbf', 'Apel', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-apple-meaning/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('59632360-06ab-44cd-852b-d8c9aa5a09e5', '978610d6-fb6e-4a01-8e65-d68004d84cbf', 'Jeruk', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-apple-meaning/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8393bb35-c2ff-4532-8877-dd75a055d122', '978610d6-fb6e-4a01-8e65-d68004d84cbf', 'Mangga', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-apple-meaning/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f537af45-32ba-42e7-8c91-16d298b819dc', '978610d6-fb6e-4a01-8e65-d68004d84cbf', 'Pisang', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/greetings-vocabulary/en-introduce-name
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('d08b02a2-3b25-432a-889f-fe404b48d4da', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-introduce-name', 'multiple_choice'::public.question_type, 'Introduction', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Kalimat yang tepat untuk memperkenalkan nama adalah…', 'Pola baku perkenalan adalah "My name is …" dengan to be is untuk subjek tunggal.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/greetings-vocabulary/en-introduce-name/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8708952b-4b0c-4bcd-8116-debf4970ed6d', 'd08b02a2-3b25-432a-889f-fe404b48d4da', 'My name is Kiko', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-introduce-name/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('81b4e05d-a65d-4f41-80fb-7047d3224ef5', 'd08b02a2-3b25-432a-889f-fe404b48d4da', 'My name are Kiko', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-introduce-name/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('349b4bd6-fbd7-479a-8db1-c67397379545', 'd08b02a2-3b25-432a-889f-fe404b48d4da', 'I name Kiko', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-introduce-name/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7c23be51-7d1a-4399-8dab-b37e2a3528fc', 'd08b02a2-3b25-432a-889f-fe404b48d4da', 'Me name Kiko', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/greetings-vocabulary/en-spell-name
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('ee896b6b-66bf-4665-8b19-1433009b0753', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-spell-name', 'fill_blank'::public.question_type, 'Speaking', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Lengkapi pertanyaan berikut: How do you ___ your name?', 'How do you spell your name? berarti "Bagaimana ejaan namamu?".', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-inggris/greetings-vocabulary/en-spell-name/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('2549af7e-2a7e-4b4d-8485-3dcd52e8dd92', 'ee896b6b-66bf-4665-8b19-1433009b0753', 'spell', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: bahasa-inggris/greetings-vocabulary/en-plural-book
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('88358320-4c32-4c16-8034-9ddacf25bd88', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-plural-book', 'multiple_choice'::public.question_type, 'Grammar', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Bentuk jamak dari "book" adalah…', 'Kata benda countable umumnya ditambah -s untuk bentuk jamak: book menjadi books.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/greetings-vocabulary/en-plural-book/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6391b86d-790b-4e10-8854-66f10bba58e2', '88358320-4c32-4c16-8034-9ddacf25bd88', 'books', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-plural-book/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9b5fb114-38d9-4142-8423-88dc81f38111', '88358320-4c32-4c16-8034-9ddacf25bd88', 'bookes', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-plural-book/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c7c6cf42-018e-4eaa-894d-2a4b3a2845ae', '88358320-4c32-4c16-8034-9ddacf25bd88', 'bookies', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-plural-book/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('98690df7-a29c-45ec-82b3-8147d9b73c48', '88358320-4c32-4c16-8034-9ddacf25bd88', 'book', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/greetings-vocabulary/en-wordbank-daily-routine
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('92f73554-d3ad-4376-8830-464ce3e7e90d', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-wordbank-daily-routine', 'word_bank'::public.question_type, 'Word Bank', 'beginner'::public.difficulty_band, 'Susun jawaban dengan mengetuk kata yang tersedia.', 'Susun kalimat: "Dia pergi ke sekolah setiap hari."', 'Kalimat simple present untuk she memakai goes. Kata "go" adalah pengecoh yang tidak diperlukan.', 'Pola: subjek + kata kerja + tempat + keterangan waktu.', 15, '{}'::jsonb, 5, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/greetings-vocabulary/en-wordbank-daily-routine/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8be15095-c59f-4499-81d1-119aeb7381cc', '92f73554-d3ad-4376-8830-464ce3e7e90d', 'She', false, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-wordbank-daily-routine/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b3d14ab4-346a-4141-83d8-be509f16e262', '92f73554-d3ad-4376-8830-464ce3e7e90d', 'goes', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-wordbank-daily-routine/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('188e37eb-5f69-43a4-8677-d3514b7a2787', '92f73554-d3ad-4376-8830-464ce3e7e90d', 'to', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-wordbank-daily-routine/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9451a36c-5410-4243-8447-b32f3e213c44', '92f73554-d3ad-4376-8830-464ce3e7e90d', 'school', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-wordbank-daily-routine/4
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f6016cbf-6ac7-43e5-841f-7546d13fedd7', '92f73554-d3ad-4376-8830-464ce3e7e90d', 'every', false, 4)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-wordbank-daily-routine/5
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('acbf6dce-34ef-4ac6-8bca-bc95619851b2', '92f73554-d3ad-4376-8830-464ce3e7e90d', 'day', false, 5)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-wordbank-daily-routine/6
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('472dc0b4-6fee-4099-89c2-d3a14c1b66d7', '92f73554-d3ad-4376-8830-464ce3e7e90d', 'go', false, 6)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_answers: bahasa-inggris/greetings-vocabulary/en-wordbank-daily-routine/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('a1fd18b9-b933-47c6-8065-90a777b6c8d4', '92f73554-d3ad-4376-8830-464ce3e7e90d', 'She goes to school every day', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: bahasa-inggris/greetings-vocabulary/en-builder-daily-routine
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('6dafef3c-0916-4290-88e3-d261aabb925c', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-builder-daily-routine', 'sentence_builder'::public.question_type, 'Sentence Builder', 'beginner'::public.difficulty_band, 'Susun kata acak menjadi kalimat yang benar.', 'Susun kata acak menjadi kalimat yang benar.', 'Urutan baku kalimat adalah subjek + kata kerja + tempat + keterangan waktu.', 'Mulai dari subjek "She".', 15, '{}'::jsonb, 6, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/greetings-vocabulary/en-builder-daily-routine/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c13c1f34-74d8-488c-8edc-29e7b49ff4ca', '6dafef3c-0916-4290-88e3-d261aabb925c', 'every', false, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-builder-daily-routine/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0462e6bc-1535-4056-8eba-82117c880be5', '6dafef3c-0916-4290-88e3-d261aabb925c', 'She', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-builder-daily-routine/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('74b0c081-fc7d-4684-8c65-152e460e6904', '6dafef3c-0916-4290-88e3-d261aabb925c', 'day', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-builder-daily-routine/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ad6bebb2-f737-4136-8e3d-6b8ac12f9712', '6dafef3c-0916-4290-88e3-d261aabb925c', 'school', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-builder-daily-routine/4
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('989c2ae0-277c-4e09-8c5d-00b2cc59afd7', '6dafef3c-0916-4290-88e3-d261aabb925c', 'goes', false, 4)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-builder-daily-routine/5
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('723b9175-609d-4951-85f5-3a1814f2d20d', '6dafef3c-0916-4290-88e3-d261aabb925c', 'to', false, 5)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_answers: bahasa-inggris/greetings-vocabulary/en-builder-daily-routine/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('e69bca4b-f1d1-4beb-81a9-d587a82a33cd', '6dafef3c-0916-4290-88e3-d261aabb925c', 'She goes to school every day', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: bahasa-inggris/greetings-vocabulary/en-fill-daily-routine
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('2899750f-6675-4107-8c71-3403689987f0', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-fill-daily-routine', 'fill_blank'::public.question_type, 'Grammar', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'She __ to school every day.', 'Subjek "She" memakai bentuk goes pada simple present.', 'Perhatikan akhiran kata kerja untuk subjek orang ketiga tunggal.', 10, '{}'::jsonb, 7, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-inggris/greetings-vocabulary/en-fill-daily-routine/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('e224ad38-f919-4adc-8615-9947e85bbe69', '2899750f-6675-4107-8c71-3403689987f0', 'goes', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: bahasa-inggris/greetings-vocabulary/en-matching-vocabulary
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('3805fd09-0b60-496b-8f9e-2c6edd1d5a2c', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-matching-vocabulary', 'matching_pairs'::public.question_type, 'Vocabulary', 'beginner'::public.difficulty_band, 'Cocokkan setiap item di kolom kiri dengan pasangannya di kolom kanan.', 'Cocokkan kata bahasa Inggris dengan artinya.', 'apple = apel, book = buku, house = rumah, dan water = air.', 'Ingat kosakata benda sehari-hari.', 20, '{}'::jsonb, 8, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_pairs: bahasa-inggris/greetings-vocabulary/en-matching-vocabulary/pair-0
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('dd942db6-3ae7-475c-8b26-02bbc487470b', '3805fd09-0b60-496b-8f9e-2c6edd1d5a2c', 'ebdd6176-f546-48c8-8dc5-10843b686ad7', '89b54561-56a3-45e3-8235-91360e96b0fe', 'apple', 'apel', 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- question_pairs: bahasa-inggris/greetings-vocabulary/en-matching-vocabulary/pair-1
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('a15a2b16-5722-49b8-8510-0c352b36cca0', '3805fd09-0b60-496b-8f9e-2c6edd1d5a2c', '3c7665cd-4244-45d0-8af3-fcf57609a2eb', 'ea032a59-02a3-419a-8d02-ad32830cd930', 'book', 'buku', 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- question_pairs: bahasa-inggris/greetings-vocabulary/en-matching-vocabulary/pair-2
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('47bb6ad4-eecd-4e8c-8c71-3b0e6a1b81a5', '3805fd09-0b60-496b-8f9e-2c6edd1d5a2c', 'aee27713-b1b8-494f-83ac-2a85b7510e66', 'f27c144f-9292-415f-81d4-cfc69712bc74', 'house', 'rumah', 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- question_pairs: bahasa-inggris/greetings-vocabulary/en-matching-vocabulary/pair-3
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('9123c306-f7c7-4591-83c2-b8fa301d03a6', '3805fd09-0b60-496b-8f9e-2c6edd1d5a2c', '9dc9a7c4-526f-43dd-8620-4d63364e1426', 'dbfb3f3e-9544-466e-85c4-94d1f0869490', 'water', 'air', 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/greetings-vocabulary/en-picture-book
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('9764eb59-5e22-45ba-8c4d-133a76fe4507', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-picture-book', 'picture_identification'::public.question_type, 'Vocabulary', 'beginner'::public.difficulty_band, 'Pilih nama yang sesuai dengan gambar.', 'Gambar ini menunjukkan benda apa?', 'Gambar menunjukkan buku, sehingga jawaban yang benar adalah book.', null, 10, '{}'::jsonb, 9, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/greetings-vocabulary/en-picture-book/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('dbbcb2a6-1e65-448d-82f5-13dc1d13f142', '9764eb59-5e22-45ba-8c4d-133a76fe4507', 'book', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-picture-book/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('34b49dfb-4c83-4431-8aae-61aeac465883', '9764eb59-5e22-45ba-8c4d-133a76fe4507', 'globe', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-picture-book/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e2e1b023-6c14-491f-8b52-bf12df01af2a', '9764eb59-5e22-45ba-8c4d-133a76fe4507', 'laptop', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-picture-book/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c70b0995-6abf-4caa-8694-496cbbc2ec8f', '9764eb59-5e22-45ba-8c4d-133a76fe4507', 'clock', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_media: bahasa-inggris/greetings-vocabulary/en-picture-book/media-0
insert into public.question_media (id, question_id, media_kind, url, alt_text, sort_order)
values ('9b5e0732-b2ae-4b54-88d1-0acb6fa39d91', '9764eb59-5e22-45ba-8c4d-133a76fe4507', 'image', '/assets/pictures/book.svg', 'Buku hijau dalam keadaan tertutup', 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  media_kind = excluded.media_kind,
  url = excluded.url,
  alt_text = excluded.alt_text,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/greetings-vocabulary/en-picture-globe
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('e81e322e-357d-4dd6-8bcc-e847b4f895e6', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-picture-globe', 'picture_identification'::public.question_type, 'Vocabulary', 'beginner'::public.difficulty_band, 'Pilih nama yang sesuai dengan gambar.', 'Gambar ini menunjukkan benda apa?', 'Gambar menunjukkan globe atau bola dunia, sehingga jawabannya globe.', null, 10, '{}'::jsonb, 10, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/greetings-vocabulary/en-picture-globe/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a1c2cee3-4720-4761-8c5f-086aa553d0da', 'e81e322e-357d-4dd6-8bcc-e847b4f895e6', 'book', false, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-picture-globe/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('73c67b8b-0271-48e6-8198-9c20763c9723', 'e81e322e-357d-4dd6-8bcc-e847b4f895e6', 'globe', true, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-picture-globe/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('90d0880c-e20d-4a40-8819-5462f13ae581', 'e81e322e-357d-4dd6-8bcc-e847b4f895e6', 'laptop', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-picture-globe/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7b69fea7-6156-44a4-8cc6-aa444a60ef06', 'e81e322e-357d-4dd6-8bcc-e847b4f895e6', 'phone', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_media: bahasa-inggris/greetings-vocabulary/en-picture-globe/media-0
insert into public.question_media (id, question_id, media_kind, url, alt_text, sort_order)
values ('a672af88-005b-439e-8fb4-9713049c13d7', 'e81e322e-357d-4dd6-8bcc-e847b4f895e6', 'image', '/assets/pictures/globe.svg', 'Bola dunia biru dengan daratan hijau', 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  media_kind = excluded.media_kind,
  url = excluded.url,
  alt_text = excluded.alt_text,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/greetings-vocabulary/en-picture-laptop
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('3dcb8684-7552-4cf4-8030-d9c76dbacf5d', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-picture-laptop', 'picture_identification'::public.question_type, 'Vocabulary', 'beginner'::public.difficulty_band, 'Pilih nama yang sesuai dengan gambar.', 'Gambar ini menunjukkan benda apa?', 'Gambar menunjukkan laptop, sehingga jawaban yang benar adalah laptop.', null, 10, '{}'::jsonb, 11, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/greetings-vocabulary/en-picture-laptop/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('26da206f-83ac-4293-825d-c769b23acd82', '3dcb8684-7552-4cf4-8030-d9c76dbacf5d', 'calculator', false, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-picture-laptop/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('39c93b02-3083-4f8f-8f0c-69e32a2d9d8c', '3dcb8684-7552-4cf4-8030-d9c76dbacf5d', 'book', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-picture-laptop/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d29a83b1-1938-4e69-8ac8-c078c8326e9d', '3dcb8684-7552-4cf4-8030-d9c76dbacf5d', 'laptop', true, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-picture-laptop/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('cbf602b4-1636-461b-8362-6497fa91084b', '3dcb8684-7552-4cf4-8030-d9c76dbacf5d', 'globe', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_media: bahasa-inggris/greetings-vocabulary/en-picture-laptop/media-0
insert into public.question_media (id, question_id, media_kind, url, alt_text, sort_order)
values ('44fad780-8f01-4648-8b11-46060e6379b7', '3dcb8684-7552-4cf4-8030-d9c76dbacf5d', 'image', '/assets/pictures/laptop.svg', 'Laptop abu-abu dengan layar biru', 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  media_kind = excluded.media_kind,
  url = excluded.url,
  alt_text = excluded.alt_text,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/greetings-vocabulary/en-listening-classroom
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('59b667f3-9847-4ec1-822e-bf03b192a790', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-listening-classroom', 'listening'::public.question_type, 'Listening', 'beginner'::public.difficulty_band, 'Dengarkan audio, lalu pilih jawaban yang sesuai.', 'Apa instruksi yang kamu dengar?', 'Instruksi yang diucapkan adalah "Please open your book to page ten", yaitu membuka buku ke halaman sepuluh.', 'Perhatikan kata "open" dan angka "ten".', 15, '{"speech":"Please open your book to page ten.","lang":"en-US"}'::jsonb, 12, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/greetings-vocabulary/en-listening-classroom/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b30f8a9d-dccc-449c-8298-e1de66e5f034', '59b667f3-9847-4ec1-822e-bf03b192a790', 'Tolong buka bukumu ke halaman sepuluh.', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-listening-classroom/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9889cba6-3d57-4c0c-8faa-1654cc35962b', '59b667f3-9847-4ec1-822e-bf03b192a790', 'Tolong tutup bukumu dan dengarkan.', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-listening-classroom/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9abbc8a5-3926-4339-83c4-067064872e28', '59b667f3-9847-4ec1-822e-bf03b192a790', 'Tolong tulis namamu di papan tulis.', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-listening-classroom/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b7fc39c2-a1d1-4fc1-8596-7b0bc6dd3c96', '59b667f3-9847-4ec1-822e-bf03b192a790', 'Tolong baca halaman dua puluh.', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/greetings-vocabulary/en-listening-greeting
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('35a7a7e2-3a03-402e-81c1-c76d7232a051', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-listening-greeting', 'listening'::public.question_type, 'Listening', 'beginner'::public.difficulty_band, 'Dengarkan audio, lalu pilih jawaban yang sesuai.', 'Sapaan apa yang kamu dengar?', 'Kalimat "Good morning, how are you today?" berarti selamat pagi, apa kabar hari ini.', 'Fokus pada "Good morning" dan "how are you".', 15, '{"speech":"Good morning, how are you today?","lang":"en-US"}'::jsonb, 13, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/greetings-vocabulary/en-listening-greeting/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5e7ece56-7005-4d16-87f6-e87d3ff19a7b', '35a7a7e2-3a03-402e-81c1-c76d7232a051', 'Selamat pagi, apa kabar hari ini?', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-listening-greeting/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f442b2fc-bd72-4b39-8e75-7c47abde9112', '35a7a7e2-3a03-402e-81c1-c76d7232a051', 'Selamat malam, sampai jumpa besok.', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-listening-greeting/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('47f3bc6a-b2de-44f3-836d-98201c1eb8a7', '35a7a7e2-3a03-402e-81c1-c76d7232a051', 'Selamat siang, terima kasih banyak.', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-listening-greeting/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('73e917b9-9c94-4a1e-8e14-45e6d8a9ef82', '35a7a7e2-3a03-402e-81c1-c76d7232a051', 'Selamat pagi, siapa namamu?', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/greetings-vocabulary/en-speaking-greeting
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('7e066a48-0180-458d-8768-7905eb7e7c63', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-speaking-greeting', 'speaking'::public.question_type, 'Speaking', 'beginner'::public.difficulty_band, 'Ucapkan kalimat berikut, lalu periksa apakah ucapanmu dikenali.', 'Ucapkan sapaan: "Good morning, how are you?"', 'Sapaan yang benar adalah "Good morning, how are you?". Penilaian memeriksa apakah ucapan dikenali, bukan memberi skor pengucapan buatan.', 'Ucapkan dengan jelas dan perlahan.', 15, '{"speech":"Good morning, how are you?","lang":"en-US"}'::jsonb, 14, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-inggris/greetings-vocabulary/en-speaking-greeting/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('ea523edb-66f7-46a0-8273-5985abf10a25', '7e066a48-0180-458d-8768-7905eb7e7c63', 'good morning how are you', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- question_answers: bahasa-inggris/greetings-vocabulary/en-speaking-greeting/1
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('202d7e3c-f745-491e-8a1d-62b139cc64fc', '7e066a48-0180-458d-8768-7905eb7e7c63', 'good morning, how are you?', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: bahasa-inggris/greetings-vocabulary/en-translation-library
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('3c7a7b13-09a9-4c6c-8d5a-97fedffcfddd', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-translation-library', 'translation'::public.question_type, 'Translation', 'beginner'::public.difficulty_band, 'Susun terjemahan dari kata yang tersedia atau ketik jawabanmu sendiri.', 'Terjemahkan ke bahasa Inggris: "Saya membaca buku di perpustakaan."', 'Kalimat "Saya membaca buku di perpustakaan" menjadi "I read a book in the library". Kata "reads" adalah pengecoh karena subjeknya "I".', 'Gunakan bentuk dasar "read" untuk subjek "I".', 15, '{}'::jsonb, 15, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/greetings-vocabulary/en-translation-library/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('402a5ee2-b5fe-4b27-833d-c4a62feb3256', '3c7a7b13-09a9-4c6c-8d5a-97fedffcfddd', 'I', false, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-translation-library/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('01b8a8ee-3417-4596-8bbd-bdff84709345', '3c7a7b13-09a9-4c6c-8d5a-97fedffcfddd', 'read', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-translation-library/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('351fd3dd-7395-4d2a-8d8d-da6f1103abd7', '3c7a7b13-09a9-4c6c-8d5a-97fedffcfddd', 'a', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-translation-library/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('125ecd78-5802-427b-8794-95dea52cf5da', '3c7a7b13-09a9-4c6c-8d5a-97fedffcfddd', 'book', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-translation-library/4
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9cd51c99-30fa-4dcb-8468-89c8aa0cfefc', '3c7a7b13-09a9-4c6c-8d5a-97fedffcfddd', 'in', false, 4)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-translation-library/5
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5cb3732d-d03f-4e4e-80cf-eab3f2cce8e5', '3c7a7b13-09a9-4c6c-8d5a-97fedffcfddd', 'the', false, 5)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-translation-library/6
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3376d376-76e4-42c9-8cda-ed74a69e771d', '3c7a7b13-09a9-4c6c-8d5a-97fedffcfddd', 'library', false, 6)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-translation-library/7
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e81fc2b2-3cb8-4e99-8bcf-5df3d2607c93', '3c7a7b13-09a9-4c6c-8d5a-97fedffcfddd', 'reads', false, 7)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_answers: bahasa-inggris/greetings-vocabulary/en-translation-library/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('527442e7-3fd8-4c7b-8d0b-ee6867b47e9c', '3c7a7b13-09a9-4c6c-8d5a-97fedffcfddd', 'I read a book in the library', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: bahasa-inggris/greetings-vocabulary/en-conversation-teacher
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('77c15c49-287f-48f9-83cd-cb1fd2624a10', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-conversation-teacher', 'conversation'::public.question_type, 'Conversation', 'beginner'::public.difficulty_band, 'Baca percakapan, lalu pilih respons yang paling tepat.', 'Kamu bertemu gurumu di pagi hari. Pilih respons yang paling sopan.', 'Respons sopan membalas sapaan pagi dan menjawab pertanyaan kabar: "Good morning, Ma''am. We are fine, thank you."', 'Balas sapaan terlebih dahulu, lalu jawab pertanyaan kabarnya.', 15, '{"npc":{"name":"Bu Rani","role":"Guru bahasa Inggris"},"screens":[{"speaker":"Bu Rani","line":"Good morning, students. How are you today?"}],"responses":["Bu Rani smiles. \"I am fine too, thank you. Please sit down.\"","Bu Rani frowns. \"It is still morning, not night.\"","Bu Rani waits. \"I asked how you are, not who you are.\"","Bu Rani looks puzzled. \"A book cannot answer me.\""],"lang":"en-US"}'::jsonb, 16, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/greetings-vocabulary/en-conversation-teacher/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('fee47ca4-0028-4f0e-88a1-d67b6493845d', '77c15c49-287f-48f9-83cd-cb1fd2624a10', 'Good morning, Ma''am. We are fine, thank you.', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-conversation-teacher/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f9940025-2075-45c0-859d-748627925e78', '77c15c49-287f-48f9-83cd-cb1fd2624a10', 'Good night, Ma''am. See you tomorrow.', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-conversation-teacher/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d0cbb71c-69b8-4151-851b-46748c127e99', '77c15c49-287f-48f9-83cd-cb1fd2624a10', 'I am a student in this class.', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-conversation-teacher/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('89ffe941-fd04-4ce3-89f1-c6382982b4c6', '77c15c49-287f-48f9-83cd-cb1fd2624a10', 'How are you, book?', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/greetings-vocabulary/en-story-kiko-garden
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('fcd8eaef-4df5-4603-89ce-407ed34cafb8', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-story-kiko-garden', 'story'::public.question_type, 'Reading', 'beginner'::public.difficulty_band, 'Baca cerita sampai selesai, lalu jawab pertanyaan pemahaman.', 'Mengapa Kiko membawa lentera ke taman?', 'Cerita menyebut langit mendung dan lampu taman mati, sehingga Kiko membawa lentera agar taman terang kembali.', 'Perhatikan alasan yang Kiko ucapkan sendiri.', 20, '{"screens":[{"narration":"Setiap sore Kiko menyiram tanaman di taman sekolah. Hari itu langit mendung dan lampu taman mati."},{"speaker":"Kiko","line":"Taman ini terlalu gelap. Teman-teman tidak bisa membaca nama tanaman.","choices":[{"label":"Bantu Kiko mencari lampu","reply":"Kamu menyalakan lampu taman bersama Kiko. Taman kembali terang dan nama tanaman bisa dibaca."},{"label":"Tunggu sampai besok","reply":"Kiko menghela napas. \"Besok taman akan lebih gelap lagi.\""}]},{"narration":"Kiko mengambil lentera kecil dari kelas, lalu menggantungnya di pagar taman. Taman kembali terang."}],"lang":"id-ID"}'::jsonb, 17, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/greetings-vocabulary/en-story-kiko-garden/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('dfb61471-f7e3-46ba-8d1d-6309e3ab9489', 'fcd8eaef-4df5-4603-89ce-407ed34cafb8', 'Karena lampu taman mati dan taman menjadi gelap.', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-story-kiko-garden/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0548d7ed-edab-4ac2-86b3-d17cb6c38bff', 'fcd8eaef-4df5-4603-89ce-407ed34cafb8', 'Karena Kiko ingin menjual lentera itu.', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-story-kiko-garden/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ea0fea25-9b39-43a7-8877-7a4ce054c36c', 'fcd8eaef-4df5-4603-89ce-407ed34cafb8', 'Karena taman sekolah akan ditutup.', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/greetings-vocabulary/en-story-kiko-garden/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('082ab85b-580a-4ac2-813a-cb6a4bd85fc6', 'fcd8eaef-4df5-4603-89ce-407ed34cafb8', 'Karena Kiko lupa membawa buku.', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/greetings-vocabulary/en-matching-school
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('61f08fe6-1b04-4042-813b-83dd1ea42390', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-matching-school', 'matching_pairs'::public.question_type, 'Vocabulary', 'beginner'::public.difficulty_band, 'Cocokkan setiap item di kolom kiri dengan pasangannya di kolom kanan.', 'Cocokkan benda dan tempat di sekolah dengan artinya.', 'pencil = pensil, teacher = guru, classroom = ruang kelas, homework = pekerjaan rumah, library = perpustakaan, chair = kursi.', 'Ingat kosakata yang sering muncul di sekolah.', 20, '{}'::jsonb, 18, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_pairs: bahasa-inggris/greetings-vocabulary/en-matching-school/pair-0
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('e9dae19d-c436-4e48-8389-c47cbb955049', '61f08fe6-1b04-4042-813b-83dd1ea42390', '3412bc59-7d12-43cb-86d6-936addc07ef8', 'b7a9d31d-5dbb-4a14-83cf-72c9e9efacd1', 'pencil', 'pensil', 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- question_pairs: bahasa-inggris/greetings-vocabulary/en-matching-school/pair-1
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('fdfdd0f4-bf54-49a7-8ebf-90e78118fc2b', '61f08fe6-1b04-4042-813b-83dd1ea42390', 'c47c668d-7a9b-4151-8eb1-8f64deb90bad', 'a1aa3994-2b9e-427c-8bde-02041dafa28a', 'teacher', 'guru', 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- question_pairs: bahasa-inggris/greetings-vocabulary/en-matching-school/pair-2
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('1137b4bc-d32e-41c4-8a72-f715cd232a50', '61f08fe6-1b04-4042-813b-83dd1ea42390', '22a1418f-a73a-4638-8f32-20e64a15e647', '1eb0e2dd-2ac3-4f26-8354-81357a41a595', 'classroom', 'ruang kelas', 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- question_pairs: bahasa-inggris/greetings-vocabulary/en-matching-school/pair-3
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('c70c0b28-33dd-4043-8126-4e7b462ba133', '61f08fe6-1b04-4042-813b-83dd1ea42390', 'fdaa1262-787b-46ea-84e0-eebcb5159b7f', '67487dbc-c3f5-48a7-84d4-7e0f3aae74de', 'homework', 'pekerjaan rumah', 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- question_pairs: bahasa-inggris/greetings-vocabulary/en-matching-school/pair-4
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('7accd9f6-0fca-4857-8672-b1210a7f9200', '61f08fe6-1b04-4042-813b-83dd1ea42390', 'bd2ee32a-f970-4182-840d-f26bdf6e9788', '345c68e8-0fe2-4dc4-8e10-f2490523ab86', 'library', 'perpustakaan', 4)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- question_pairs: bahasa-inggris/greetings-vocabulary/en-matching-school/pair-5
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('111dccb8-cfb5-416f-8a70-12015d46f298', '61f08fe6-1b04-4042-813b-83dd1ea42390', 'bdd4edc4-0ddb-4633-8bb0-47707f86949e', 'a723e45e-153a-4805-8caa-55ebc0b5bdbc', 'chair', 'kursi', 5)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/greetings-vocabulary/en-matching-verbs
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('35058079-7842-46b3-8d50-544531e2f862', 'f0515b28-98c2-4f02-81da-1f2be92efb99', 'en-matching-verbs', 'matching_pairs'::public.question_type, 'Vocabulary', 'beginner'::public.difficulty_band, 'Cocokkan setiap item di kolom kiri dengan pasangannya di kolom kanan.', 'Cocokkan kata kerja bahasa Inggris dengan artinya.', 'read = membaca, write = menulis, listen = mendengarkan, speak = berbicara, study = belajar.', 'Kata kerja dasar yang sering dipakai di kelas.', 20, '{}'::jsonb, 19, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_pairs: bahasa-inggris/greetings-vocabulary/en-matching-verbs/pair-0
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('c8b43ca4-fd4e-4cb4-86c9-a01a37c92d3b', '35058079-7842-46b3-8d50-544531e2f862', 'a6101748-afbb-4b98-8892-c4e3098e11da', '0fd57d92-fbd1-4d64-8670-2043808cc026', 'read', 'membaca', 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- question_pairs: bahasa-inggris/greetings-vocabulary/en-matching-verbs/pair-1
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('e35ea190-8243-4c5c-8b42-963544a6bee3', '35058079-7842-46b3-8d50-544531e2f862', 'a5e87a39-2dfc-41e4-8398-4a0c3c592a8e', 'de2c4ddf-de01-4751-8cb2-171b5bb02052', 'write', 'menulis', 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- question_pairs: bahasa-inggris/greetings-vocabulary/en-matching-verbs/pair-2
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('b4e8bede-a250-41a4-8adf-33275cb7f172', '35058079-7842-46b3-8d50-544531e2f862', 'aeee2261-9e4c-4390-8d36-296b656022ce', '7fbd53e4-c552-4fb5-8f1f-e30da4ce5240', 'listen', 'mendengarkan', 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- question_pairs: bahasa-inggris/greetings-vocabulary/en-matching-verbs/pair-3
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('4bb47ddd-18af-4396-83e3-808b6974af5f', '35058079-7842-46b3-8d50-544531e2f862', '3b0799bb-ed85-4d29-82cd-536844a80bfa', '5cd3b259-a2b7-4676-8bc4-1fa33f744316', 'speak', 'berbicara', 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- question_pairs: bahasa-inggris/greetings-vocabulary/en-matching-verbs/pair-4
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('0e8fbfc8-4ca8-48ee-8cf0-6de777661ebd', '35058079-7842-46b3-8d50-544531e2f862', 'bce1bbb0-f456-4ca2-83fd-4688ace8cba0', 'a531c4aa-c4fd-4b1f-8ddd-5582905853f9', 'study', 'belajar', 4)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- lessons: bahasa-inggris/english-review
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('9ba64941-a507-4dc7-8fc1-b2b4daf77c47', 'b7a20137-8711-43b7-81d0-f67ec776bbb5', 'english-review', 'English Review', 'Review simple present, past tense, and everyday vocabulary.', 'review'::public.lesson_kind, 5, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-inggris/english-review
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('1d06a7fe-e4f6-4fff-821d-a4b477f5f131', 'b7a20137-8711-43b7-81d0-f67ec776bbb5', 'lesson-english-review', 'English Review', 'Review simple present, past tense, and everyday vocabulary.', 'review'::public.node_kind, '9ba64941-a507-4dc7-8fc1-b2b4daf77c47', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: bahasa-inggris/english-review/review-english-third-person
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('71a83cff-e8ca-499d-89c9-a7df353e6483', '9ba64941-a507-4dc7-8fc1-b2b4daf77c47', 'review-english-third-person', 'multiple_choice'::public.question_type, 'Grammar', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'She ___ to school every day.', 'Subjek orang ketiga tunggal (she) memakai bentuk goes pada simple present.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/english-review/review-english-third-person/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('22b12f79-4178-47ca-81c5-e62727ddc45f', '71a83cff-e8ca-499d-89c9-a7df353e6483', 'goes', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/english-review/review-english-third-person/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('29d87bad-6bd5-47df-8cfb-b4ffad453e94', '71a83cff-e8ca-499d-89c9-a7df353e6483', 'go', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/english-review/review-english-third-person/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('bd82e44e-6119-4ab0-86a3-7bd97a2f5ffe', '71a83cff-e8ca-499d-89c9-a7df353e6483', 'going', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/english-review/review-english-third-person/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7b61a039-7b6b-4180-88db-3288e3b63d70', '71a83cff-e8ca-499d-89c9-a7df353e6483', 'gone', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/english-review/review-english-past-go
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('ea2364a6-910c-49f4-8d2c-ef9602cc4791', '9ba64941-a507-4dc7-8fc1-b2b4daf77c47', 'review-english-past-go', 'multiple_choice'::public.question_type, 'Tenses', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'What is the past tense of "go"?', 'Bentuk past tense dari go adalah went. Gone adalah past participle.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/english-review/review-english-past-go/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('185d1de4-cfe2-410d-8f41-780ea0b6a402', 'ea2364a6-910c-49f4-8d2c-ef9602cc4791', 'went', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/english-review/review-english-past-go/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('08e14d0d-f96a-4dc3-8297-2b1bf4ea2ff4', 'ea2364a6-910c-49f4-8d2c-ef9602cc4791', 'goed', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/english-review/review-english-past-go/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5b0cc7e5-292a-4719-852e-012574640db0', 'ea2364a6-910c-49f4-8d2c-ef9602cc4791', 'gone', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/english-review/review-english-past-go/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9c6ff8f0-c4f8-4a41-873c-df1c45de1ebd', 'ea2364a6-910c-49f4-8d2c-ef9602cc4791', 'going', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/english-review/review-english-book
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('61b402c6-bcb5-4e63-8fae-b960ed6fde00', '9ba64941-a507-4dc7-8fc1-b2b4daf77c47', 'review-english-book', 'typing'::public.question_type, 'Vocabulary', 'beginner'::public.difficulty_band, 'Tulis jawaban pada kolom yang tersedia.', 'Write the English word for "buku".', '"Buku" dalam Bahasa Inggris adalah book.', null, 15, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-inggris/english-review/review-english-book/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('0fc4f796-e922-4905-8869-0ec1454b5fa7', '61b402c6-bcb5-4e63-8fae-b960ed6fde00', 'book', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- lessons: bahasa-inggris/english-challenge
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('199ce85e-7a32-43ba-8edb-437e250548dc', 'b7a20137-8711-43b7-81d0-f67ec776bbb5', 'english-challenge', 'English Challenge', 'Tantangan present perfect, preposition, dan struktur kalimat.', 'challenge'::public.lesson_kind, 6, 10, 2, 2, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-inggris/english-challenge
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('85bc1c89-7e62-4692-85dc-bc36261ff998', 'b7a20137-8711-43b7-81d0-f67ec776bbb5', 'lesson-english-challenge', 'English Challenge', 'Tantangan present perfect, preposition, dan struktur kalimat.', 'challenge'::public.node_kind, '199ce85e-7a32-43ba-8edb-437e250548dc', 20, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: bahasa-inggris/english-challenge/challenge-english-present-perfect
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('457e4d21-7161-4f42-8b46-940ec7dd7cc1', '199ce85e-7a32-43ba-8edb-437e250548dc', 'challenge-english-present-perfect', 'multiple_choice'::public.question_type, 'Tenses', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'They ___ lived here since 2020.', 'Subjek they memakai have pada present perfect: have + past participle (lived).', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/english-challenge/challenge-english-present-perfect/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d1d5ea19-f5bc-47b0-8e0d-bee7a8d0ede6', '457e4d21-7161-4f42-8b46-940ec7dd7cc1', 'have', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/english-challenge/challenge-english-present-perfect/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e2acf9dd-bec2-4520-8d82-275f0441acd8', '457e4d21-7161-4f42-8b46-940ec7dd7cc1', 'has', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/english-challenge/challenge-english-present-perfect/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('618f3201-8bd6-4250-88a8-0e9c913b333b', '457e4d21-7161-4f42-8b46-940ec7dd7cc1', 'had', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/english-challenge/challenge-english-present-perfect/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('20a7f95c-22ff-4a91-8892-a604fd8a65e4', '457e4d21-7161-4f42-8b46-940ec7dd7cc1', 'having', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/english-challenge/challenge-english-interested
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('b9ef9f41-c957-45b5-8a78-64aed5bdd757', '199ce85e-7a32-43ba-8edb-437e250548dc', 'challenge-english-interested', 'fill_blank'::public.question_type, 'Preposition', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'I am interested ___ learning English.', 'Ungkapan yang benar adalah interested in, bukan interested on atau at.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-inggris/english-challenge/challenge-english-interested/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('b4452be8-5797-4482-8e10-16d18cefc139', 'b9ef9f41-c957-45b5-8a78-64aed5bdd757', 'in', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: bahasa-inggris/english-challenge/challenge-english-negative
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('345fb490-a916-418c-8f4f-fa739e3ae89c', '199ce85e-7a32-43ba-8edb-437e250548dc', 'challenge-english-negative', 'multiple_choice'::public.question_type, 'Grammar', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Choose the correct sentence.', 'Untuk he/she/it pada simple present, bentuk negatifnya memakai doesn''t + verb dasar.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/english-challenge/challenge-english-negative/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('232ffd89-d57f-4fd6-8fbd-121cebd9e52a', '345fb490-a916-418c-8f4f-fa739e3ae89c', 'He doesn''t like coffee.', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/english-challenge/challenge-english-negative/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1cb62b2b-60ac-4fe2-8e95-aedaa8c92d54', '345fb490-a916-418c-8f4f-fa739e3ae89c', 'He don''t like coffee.', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/english-challenge/challenge-english-negative/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c1720bc4-8842-4d75-8fa4-1ca6b6682fdc', '345fb490-a916-418c-8f4f-fa739e3ae89c', 'He not likes coffee.', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/english-challenge/challenge-english-negative/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('92b4b527-b16b-43a0-83ad-59cfc9ae1996', '345fb490-a916-418c-8f4f-fa739e3ae89c', 'He no like coffee.', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- course_levels: bahasa-inggris/elementary
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('0a07368b-5cc7-49e8-8bf5-212f6eee5afe', 'f58a09a8-f8d3-465c-884c-4e02cb4f8706', 'elementary', 'Level 2 · Simple Present', 'Membicarakan kebiasaan dan rutinitas dengan simple present tense.', 'elementary'::public.difficulty_band, 1, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: bahasa-inggris/simple-present
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('05f1c0c9-b953-4f02-8486-037722bcd7fa', '0a07368b-5cc7-49e8-8bf5-212f6eee5afe', 'simple-present', 'Simple Present', 'Tense ini dipakai untuk kebiasaan, fakta, dan jadwal tetap.', array['Memilih bentuk kata kerja untuk subjek orang ketiga', 'Membuat kalimat negatif', 'Menyusun pertanyaan dengan do/does']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: bahasa-inggris/simple-present
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('cfe5773d-6947-4a29-8780-e7d86be007d7', '05f1c0c9-b953-4f02-8486-037722bcd7fa', 'simple-present', 'Simple Present', 'Kebiasaan sehari-hari dalam bahasa Inggris.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-inggris/simple-present
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('bf6a1afa-af3c-4e89-8e72-9316b5fc46a4', '05f1c0c9-b953-4f02-8486-037722bcd7fa', 'lesson-simple-present', 'Simple Present', 'Kebiasaan sehari-hari dalam bahasa Inggris.', 'lesson'::public.node_kind, 'cfe5773d-6947-4a29-8780-e7d86be007d7', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: bahasa-inggris/simple-present/en-third-person-goes
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('75ff211b-29ad-4484-84e9-8e04a0bf47c1', 'cfe5773d-6947-4a29-8780-e7d86be007d7', 'en-third-person-goes', 'multiple_choice'::public.question_type, 'Grammar', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'She ___ to school every day.', 'Subjek he/she/it memakai kata kerja bentuk -s pada simple present: she goes.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/simple-present/en-third-person-goes/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('414ad727-979e-4518-88ea-3a35d48cfd3f', '75ff211b-29ad-4484-84e9-8e04a0bf47c1', 'goes', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/simple-present/en-third-person-goes/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('dcda8316-146d-4b89-8fe2-f89167ee9baf', '75ff211b-29ad-4484-84e9-8e04a0bf47c1', 'go', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/simple-present/en-third-person-goes/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8c93c80d-ae93-43d2-815a-f52864060206', '75ff211b-29ad-4484-84e9-8e04a0bf47c1', 'going', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/simple-present/en-third-person-goes/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5661f971-0a99-4c4a-8959-04bdcfb4f9dd', '75ff211b-29ad-4484-84e9-8e04a0bf47c1', 'gone', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/simple-present/en-negative-dont
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('0346662a-29c4-47a0-83f5-53129357b631', 'cfe5773d-6947-4a29-8780-e7d86be007d7', 'en-negative-dont', 'multiple_choice'::public.question_type, 'Grammar', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'They ___ like coffee.', 'Subjek they memakai don''t untuk kalimat negatif. Doesn''t dipakai untuk he/she/it.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/simple-present/en-negative-dont/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f33e036b-1216-4944-8a02-cd616d424bde', '0346662a-29c4-47a0-83f5-53129357b631', 'don''t', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/simple-present/en-negative-dont/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e813c730-2b3a-4f46-8f80-e2737c571806', '0346662a-29c4-47a0-83f5-53129357b631', 'doesn''t', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/simple-present/en-negative-dont/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('516032d1-c1fe-4e7d-8593-ced63f07f071', '0346662a-29c4-47a0-83f5-53129357b631', 'isn''t', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/simple-present/en-negative-dont/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('cf23f50f-0077-4a58-859d-e4e75ed984bb', '0346662a-29c4-47a0-83f5-53129357b631', 'aren''t', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/simple-present/en-question-do
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('b902d357-97eb-4535-8b3b-c4e6da252d10', 'cfe5773d-6947-4a29-8780-e7d86be007d7', 'en-question-do', 'multiple_choice'::public.question_type, 'Grammar', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', '___ you speak English?', 'Pertanyaan dengan subjek you memakai Do di awal kalimat: Do you speak English?', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/simple-present/en-question-do/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('97bba693-7b8b-43e8-84ed-bd6a2eaf07db', 'b902d357-97eb-4535-8b3b-c4e6da252d10', 'Do', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/simple-present/en-question-do/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0f65d592-927e-4f3f-88ce-7431a7897727', 'b902d357-97eb-4535-8b3b-c4e6da252d10', 'Does', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/simple-present/en-question-do/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b9ec1c3d-8a9f-4829-8e26-6ae443d471d8', 'b902d357-97eb-4535-8b3b-c4e6da252d10', 'Are', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/simple-present/en-question-do/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('32a8347e-ea0b-4cde-8a54-ea13e0ffeb90', 'b902d357-97eb-4535-8b3b-c4e6da252d10', 'Is', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/simple-present/en-to-be-am
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('92b27608-c8e6-47fa-8ea0-1d9dcffd7106', 'cfe5773d-6947-4a29-8780-e7d86be007d7', 'en-to-be-am', 'fill_blank'::public.question_type, 'Grammar', 'elementary'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Lengkapi kalimat: I ___ a student.', 'To be untuk subjek I adalah am. You/we/they memakai are, sedangkan he/she/it memakai is.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-inggris/simple-present/en-to-be-am/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('19ebabbb-1c2b-4bef-888d-6f9361f05d35', '92b27608-c8e6-47fa-8ea0-1d9dcffd7106', 'am', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: bahasa-inggris/simple-present/en-adverb-position
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('e951e034-eb91-4af4-890f-9f7d7624ab8c', 'cfe5773d-6947-4a29-8780-e7d86be007d7', 'en-adverb-position', 'multiple_choice'::public.question_type, 'Grammar', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Kalimat dengan adverb of frequency yang benar adalah…', 'Adverb of frequency seperti always biasanya diletakkan sebelum kata kerja utama.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/simple-present/en-adverb-position/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('decf09c8-ca36-43df-831e-555caee0a028', 'e951e034-eb91-4af4-890f-9f7d7624ab8c', 'She always studies at night.', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/simple-present/en-adverb-position/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ce081766-f829-4262-8cf0-1c180c7b6d1c', 'e951e034-eb91-4af4-890f-9f7d7624ab8c', 'She studies always at night.', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/simple-present/en-adverb-position/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('44b99146-858b-4a74-8d98-f2ae3b6969e2', 'e951e034-eb91-4af4-890f-9f7d7624ab8c', 'Always she studies at night.', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/simple-present/en-adverb-position/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8b8df5c9-6be2-4a91-878a-e3f4fef0e5a5', 'e951e034-eb91-4af4-890f-9f7d7624ab8c', 'She studies at night always.', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: bahasa-inggris/latihan-simple-present
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('baa3ca13-70a4-4064-8c72-20b143c4a6a9', '05f1c0c9-b953-4f02-8486-037722bcd7fa', 'latihan-simple-present', 'Latihan Simple Present', 'Latihan membentuk kalimat simple present untuk rutinitas.', 'practice'::public.lesson_kind, 6, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-inggris/latihan-simple-present
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('a1670f24-636a-42c3-8f79-c2fabafdc7bf', '05f1c0c9-b953-4f02-8486-037722bcd7fa', 'lesson-latihan-simple-present', 'Latihan Simple Present', 'Latihan membentuk kalimat simple present untuk rutinitas.', 'practice'::public.node_kind, 'baa3ca13-70a4-4064-8c72-20b143c4a6a9', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: bahasa-inggris/latihan-simple-present/practice-eng-goes
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('d45c37cf-aa03-46fa-8473-5bea4bf5e648', 'baa3ca13-70a4-4064-8c72-20b143c4a6a9', 'practice-eng-goes', 'multiple_choice'::public.question_type, 'Simple Present', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'She ___ to school every day.', 'Subjek she memakai bentuk goes pada simple present. Go dipakai untuk I, you, we, dan they.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/latihan-simple-present/practice-eng-goes/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('fd3dc3b1-4648-45a8-8fdf-7fcd861da3a8', 'd45c37cf-aa03-46fa-8473-5bea4bf5e648', 'goes', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/latihan-simple-present/practice-eng-goes/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8221a98b-8f3c-40ab-8f9d-1ff1ce76b401', 'd45c37cf-aa03-46fa-8473-5bea4bf5e648', 'go', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/latihan-simple-present/practice-eng-goes/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2e6e721d-ac1e-498c-8124-7362e478c52a', 'd45c37cf-aa03-46fa-8473-5bea4bf5e648', 'going', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/latihan-simple-present/practice-eng-goes/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9862fc53-7ae4-442b-86a9-8fa3bdc3a650', 'd45c37cf-aa03-46fa-8473-5bea4bf5e648', 'gone', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/latihan-simple-present/practice-eng-dont
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('71628c6c-82c4-43a6-8251-f6d1a648f2a5', 'baa3ca13-70a4-4064-8c72-20b143c4a6a9', 'practice-eng-dont', 'multiple_choice'::public.question_type, 'Simple Present', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'They ___ like coffee.', 'They memakai don''t. Doesn''t hanya untuk he, she, dan it.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/latihan-simple-present/practice-eng-dont/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1c2e245b-937d-477e-8b97-a0e2e126ae86', '71628c6c-82c4-43a6-8251-f6d1a648f2a5', 'don''t', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/latihan-simple-present/practice-eng-dont/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('53dfb5f2-f226-450c-84d0-fdb1014de082', '71628c6c-82c4-43a6-8251-f6d1a648f2a5', 'doesn''t', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/latihan-simple-present/practice-eng-dont/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('878a2c53-8ff1-4ac3-8b55-0803cb2072bb', '71628c6c-82c4-43a6-8251-f6d1a648f2a5', 'isn''t', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/latihan-simple-present/practice-eng-dont/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('55faa772-b30b-4709-86d3-a2b9332a6eb5', '71628c6c-82c4-43a6-8251-f6d1a648f2a5', 'not', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/latihan-simple-present/practice-eng-plays
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('14771885-4838-4904-89d1-159cd34c58e6', 'baa3ca13-70a4-4064-8c72-20b143c4a6a9', 'practice-eng-plays', 'fill_blank'::public.question_type, 'Simple Present', 'elementary'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'My brother __ (play) football on Sundays.', 'My brother setara dengan he, sehingga kata kerja mendapat akhiran -s: plays.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-inggris/latihan-simple-present/practice-eng-plays/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('cf088a5b-5104-4396-8f51-bbced9a122e9', '14771885-4838-4904-89d1-159cd34c58e6', 'plays', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- lessons: bahasa-inggris/checkpoint-simple-present
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('bfa85fdd-25eb-48ec-827d-f87d774c06e0', '05f1c0c9-b953-4f02-8486-037722bcd7fa', 'checkpoint-simple-present', 'Checkpoint Simple Present', 'Pastikan aturan kata kerja dan pertanyaan simple present.', 'review'::public.lesson_kind, 8, 10, 2, 2, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-inggris/checkpoint-simple-present
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('caddbca3-46c1-46b2-8f1b-1266d0233c62', '05f1c0c9-b953-4f02-8486-037722bcd7fa', 'lesson-checkpoint-simple-present', 'Checkpoint Simple Present', 'Pastikan aturan kata kerja dan pertanyaan simple present.', 'checkpoint'::public.node_kind, 'bfa85fdd-25eb-48ec-827d-f87d774c06e0', 20, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: bahasa-inggris/checkpoint-simple-present/checkpoint-eng-third
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('da5d402b-6705-40b1-81f4-454b3461070e', 'bfa85fdd-25eb-48ec-827d-f87d774c06e0', 'checkpoint-eng-third', 'multiple_choice'::public.question_type, 'Grammar', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Pada simple present, kata kerja untuk he/she/it…', 'He, she, dan it memakai bentuk kata kerja dengan -s/-es, misalnya works dan watches.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/checkpoint-simple-present/checkpoint-eng-third/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('40c77f52-dec4-4051-8b4c-23b661689fad', 'da5d402b-6705-40b1-81f4-454b3461070e', 'Mendapat akhiran -s atau -es', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/checkpoint-simple-present/checkpoint-eng-third/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('58e01dfa-dfe7-4df3-87a7-161f37a2c013', 'da5d402b-6705-40b1-81f4-454b3461070e', 'Selalu memakai -ing', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/checkpoint-simple-present/checkpoint-eng-third/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('94be298c-d4f4-4ed8-8ccc-fced5ab2740b', 'da5d402b-6705-40b1-81f4-454b3461070e', 'Tidak berubah', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/checkpoint-simple-present/checkpoint-eng-third/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b8a5da7b-1b8a-4698-8397-940de819b2ae', 'da5d402b-6705-40b1-81f4-454b3461070e', 'Selalu didahului to', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/checkpoint-simple-present/checkpoint-eng-do
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('3cfeebd0-3d3c-4399-8f75-a98f8ebe6c2f', 'bfa85fdd-25eb-48ec-827d-f87d774c06e0', 'checkpoint-eng-do', 'multiple_choice'::public.question_type, 'Grammar', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', '___ you speak English?', 'Pertanyaan simple present untuk you memakai Do. Does dipakai untuk he/she/it.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/checkpoint-simple-present/checkpoint-eng-do/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('77cc03f6-996c-4371-89d1-b9e1d70d6622', '3cfeebd0-3d3c-4399-8f75-a98f8ebe6c2f', 'Do', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/checkpoint-simple-present/checkpoint-eng-do/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b54c2832-1781-46bb-8ea2-63f2eb37269e', '3cfeebd0-3d3c-4399-8f75-a98f8ebe6c2f', 'Does', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/checkpoint-simple-present/checkpoint-eng-do/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3b8ebdfc-e654-49bc-8ff4-bc1022de2d87', '3cfeebd0-3d3c-4399-8f75-a98f8ebe6c2f', 'Are', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/checkpoint-simple-present/checkpoint-eng-do/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a4d006a8-24ea-46d4-886b-ef780415d086', '3cfeebd0-3d3c-4399-8f75-a98f8ebe6c2f', 'Is', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/checkpoint-simple-present/checkpoint-eng-watches
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('718752d1-c09d-410e-861c-c2105709b2b1', 'bfa85fdd-25eb-48ec-827d-f87d774c06e0', 'checkpoint-eng-watches', 'typing'::public.question_type, 'Grammar', 'elementary'::public.difficulty_band, 'Tulis jawaban pada kolom yang tersedia.', 'Write the correct present form of "watch" for he/she/it.', 'Kata kerja berakhiran -ch mendapat -es: watch menjadi watches.', null, 15, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-inggris/checkpoint-simple-present/checkpoint-eng-watches/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('c299db68-9d8e-4926-867b-f9663737ca6a', '718752d1-c09d-410e-861c-c2105709b2b1', 'watches', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- course_levels: bahasa-inggris/intermediate
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('eff5faf6-b8ec-42b5-8bee-0ad86af0f0ec', 'f58a09a8-f8d3-465c-884c-4e02cb4f8706', 'intermediate', 'Level 3 · Past Tense & Reading', 'Menceritakan kejadian lampau dan memahami teks pendek.', 'intermediate'::public.difficulty_band, 2, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: bahasa-inggris/past-tense-reading
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('e0185f34-8b58-4753-8380-a1027cb50272', 'eff5faf6-b8ec-42b5-8bee-0ad86af0f0ec', 'past-tense-reading', 'Past Tense dan Membaca', 'Menceritakan pengalaman membutuhkan bentuk lampau dan pemahaman konteks.', array['Menggunakan bentuk lampau kata kerja umum', 'Membedakan past simple dan past continuous', 'Menarik kesimpulan dari teks pendek']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: bahasa-inggris/past-tense-reading
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('5ae0f534-d9b1-4251-8357-df3bd7bdb8ba', 'e0185f34-8b58-4753-8380-a1027cb50272', 'past-tense-reading', 'Past Tense & Reading', 'Menceritakan kejadian yang sudah terjadi.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-inggris/past-tense-reading
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('fc0a81f0-cb16-4329-8151-e099e50ceee0', 'e0185f34-8b58-4753-8380-a1027cb50272', 'lesson-past-tense-reading', 'Past Tense & Reading', 'Menceritakan kejadian yang sudah terjadi.', 'lesson'::public.node_kind, '5ae0f534-d9b1-4251-8357-df3bd7bdb8ba', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: bahasa-inggris/past-tense-reading/en-past-go
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('3d244263-282d-4d7c-847b-a31665306438', '5ae0f534-d9b1-4251-8357-df3bd7bdb8ba', 'en-past-go', 'multiple_choice'::public.question_type, 'Grammar', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Bentuk lampau dari "go" adalah…', 'Go adalah kata kerja tidak beraturan: go – went – gone.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/past-tense-reading/en-past-go/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a2d3640c-c448-4ccd-87a9-71e4e004900b', '3d244263-282d-4d7c-847b-a31665306438', 'went', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/past-tense-reading/en-past-go/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9f6707ad-04dc-4168-89b2-127e862eb8b9', '3d244263-282d-4d7c-847b-a31665306438', 'goed', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/past-tense-reading/en-past-go/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9fb16994-f6d3-4e71-8cb5-0588378a14a6', '3d244263-282d-4d7c-847b-a31665306438', 'gone', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/past-tense-reading/en-past-go/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f5053a0d-5ffa-4653-88a6-dcd34bf57fc6', '3d244263-282d-4d7c-847b-a31665306438', 'going', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/past-tense-reading/en-past-continuous
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('1433d078-7ded-4839-8238-ec63fe1dbba2', '5ae0f534-d9b1-4251-8357-df3bd7bdb8ba', 'en-past-continuous', 'multiple_choice'::public.question_type, 'Grammar', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'They ___ football when it started to rain.', 'Past continuous (were + verb-ing) dipakai untuk aksi yang sedang berlangsung saat kejadian lain terjadi.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/past-tense-reading/en-past-continuous/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d04e0af3-0e01-45da-8a51-d2c21929ef85', '1433d078-7ded-4839-8238-ec63fe1dbba2', 'were playing', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/past-tense-reading/en-past-continuous/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a1bdd507-ca9f-4c3b-83af-bf73e61a947f', '1433d078-7ded-4839-8238-ec63fe1dbba2', 'play', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/past-tense-reading/en-past-continuous/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('127c92b0-8809-447c-8116-dd1640361ed8', '1433d078-7ded-4839-8238-ec63fe1dbba2', 'have played', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/past-tense-reading/en-past-continuous/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8c2f7e06-26fd-4a63-8355-e5a94e80b95a', '1433d078-7ded-4839-8238-ec63fe1dbba2', 'plays', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/past-tense-reading/en-interested-in
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('30862741-dd8e-4ce3-8c0f-61754de1d12f', '5ae0f534-d9b1-4251-8357-df3bd7bdb8ba', 'en-interested-in', 'multiple_choice'::public.question_type, 'Preposition', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'She is interested ___ learning Japanese.', 'Kata sifat interested selalu berpasangan dengan preposisi in.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/past-tense-reading/en-interested-in/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7fa877fe-2b39-42ba-80d5-95607957429c', '30862741-dd8e-4ce3-8c0f-61754de1d12f', 'in', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/past-tense-reading/en-interested-in/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('54e43d34-06ca-4831-8276-fc879c616fcf', '30862741-dd8e-4ce3-8c0f-61754de1d12f', 'on', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/past-tense-reading/en-interested-in/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('094e0777-eec3-4eff-893d-29e858c1aa8b', '30862741-dd8e-4ce3-8c0f-61754de1d12f', 'at', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/past-tense-reading/en-interested-in/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9d7fa2c6-7b3f-4162-8c72-ebaf82ec3494', '30862741-dd8e-4ce3-8c0f-61754de1d12f', 'for', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/past-tense-reading/en-comparative-easy
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('47707c70-c837-4323-858a-f87538fca3ce', '5ae0f534-d9b1-4251-8357-df3bd7bdb8ba', 'en-comparative-easy', 'fill_blank'::public.question_type, 'Grammar', 'intermediate'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Bentuk comparative dari "easy" adalah ___.', 'Kata sifat dua suku kata berakhiran -y mengubah y menjadi i lalu ditambah -er: easier.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-inggris/past-tense-reading/en-comparative-easy/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('57e902a9-f2d1-4c9c-823f-cd88b09a72a0', '47707c70-c837-4323-858a-f87538fca3ce', 'easier', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: bahasa-inggris/past-tense-reading/en-reading-inference
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('72e7e119-3bb7-4cf0-828b-41b3c152988f', '5ae0f534-d9b1-4251-8357-df3bd7bdb8ba', 'en-reading-inference', 'multiple_choice'::public.question_type, 'Reading', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Rina woke up late, so she missed the bus. Why did Rina miss the bus?', 'Kata "so" menunjukkan akibat. Penyebab yang disebutkan adalah Rina bangun terlambat.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/past-tense-reading/en-reading-inference/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f3291db9-87d4-4ea5-8962-6df434c1568a', '72e7e119-3bb7-4cf0-828b-41b3c152988f', 'Because she woke up late', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/past-tense-reading/en-reading-inference/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('864d5e59-4cbe-4634-8569-c3fc54a9f93a', '72e7e119-3bb7-4cf0-828b-41b3c152988f', 'Because the bus was early', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/past-tense-reading/en-reading-inference/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7d440bfa-3f63-48b2-8416-dfd7979710a8', '72e7e119-3bb7-4cf0-828b-41b3c152988f', 'Because she walked to school', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/past-tense-reading/en-reading-inference/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('26d38eb4-075a-48a2-864a-080322791ff5', '72e7e119-3bb7-4cf0-828b-41b3c152988f', 'Because she forgot her bag', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: bahasa-inggris/legendary-past-tense
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('7e51f1bd-8638-434d-803a-231c52260475', 'e0185f34-8b58-4753-8380-a1027cb50272', 'legendary-past-tense', 'Legendary Past Tense', 'Tantangan lanjutan tentang kalimat lampau dan kata kerja bantu.', 'legendary'::public.lesson_kind, 9, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-inggris/legendary-past-tense
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('96e3d752-87f1-4afc-8e65-941720f755d5', 'e0185f34-8b58-4753-8380-a1027cb50272', 'lesson-legendary-past-tense', 'Legendary Past Tense', 'Tantangan lanjutan tentang kalimat lampau dan kata kerja bantu.', 'legendary'::public.node_kind, '7e51f1bd-8638-434d-803a-231c52260475', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: bahasa-inggris/legendary-past-tense/legendary-eng-watched
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('f2bce1c0-4eff-41c9-8147-483be42f4d78', '7e51f1bd-8638-434d-803a-231c52260475', 'legendary-eng-watched', 'multiple_choice'::public.question_type, 'Past Tense', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Yesterday I ___ a movie.', 'Penanda waktu yesterday menuntut simple past: watched.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/legendary-past-tense/legendary-eng-watched/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c1c1f483-3f7e-4609-85a9-86d13fa9e15d', 'f2bce1c0-4eff-41c9-8147-483be42f4d78', 'watched', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/legendary-past-tense/legendary-eng-watched/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('01466530-74a3-4430-8c88-c3a1e67fec54', 'f2bce1c0-4eff-41c9-8147-483be42f4d78', 'watch', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/legendary-past-tense/legendary-eng-watched/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3c52112a-8cd2-498e-8e2f-6575cf132ae6', 'f2bce1c0-4eff-41c9-8147-483be42f4d78', 'watching', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/legendary-past-tense/legendary-eng-watched/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3715c3b5-6a4a-4ef6-8118-f71ad5dad1b9', 'f2bce1c0-4eff-41c9-8147-483be42f4d78', 'watches', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/legendary-past-tense/legendary-eng-didnt
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('6ed51da6-a417-4c8f-86c4-97e4b9d5f7cd', '7e51f1bd-8638-434d-803a-231c52260475', 'legendary-eng-didnt', 'multiple_choice'::public.question_type, 'Past Tense', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'She didn''t ___ to the party.', 'Setelah didn''t, kata kerja kembali ke bentuk dasar (go), bukan bentuk lampau.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-inggris/legendary-past-tense/legendary-eng-didnt/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3537fabe-b848-4899-8ec6-637d2a2860cf', '6ed51da6-a417-4c8f-86c4-97e4b9d5f7cd', 'go', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/legendary-past-tense/legendary-eng-didnt/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b8f48670-6646-4fe5-849d-1c9775f214f7', '6ed51da6-a417-4c8f-86c4-97e4b9d5f7cd', 'goes', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/legendary-past-tense/legendary-eng-didnt/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2a37dc45-2fcc-43d4-8cd5-7093b0596786', '6ed51da6-a417-4c8f-86c4-97e4b9d5f7cd', 'went', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-inggris/legendary-past-tense/legendary-eng-didnt/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2cec3e24-df12-48fb-87bd-2b25c570028e', '6ed51da6-a417-4c8f-86c4-97e4b9d5f7cd', 'gone', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-inggris/legendary-past-tense/legendary-eng-visited
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('248fa55a-df43-483e-8673-37df9863854e', '7e51f1bd-8638-434d-803a-231c52260475', 'legendary-eng-visited', 'fill_blank'::public.question_type, 'Past Tense', 'intermediate'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'They __ (visit) the museum last week.', 'Last week menunjukkan simple past. Visit adalah kata kerja beraturan, sehingga menjadi visited.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-inggris/legendary-past-tense/legendary-eng-visited/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('be4e8173-0272-4c47-8139-fc51c574e1eb', '248fa55a-df43-483e-8673-37df9863854e', 'visited', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- subjects: bahasa-indonesia
insert into public.subjects (id, slug, name, short_name, description, category, icon_key, accent_color, status, is_primary, sort_order)
values ('c9d610d3-5d60-4d25-810a-bf61f627b94b', 'bahasa-indonesia', 'Bahasa Indonesia', 'B. Indonesia', 'Ejaan, kalimat efektif, dan pemahaman teks agar gagasan tersampaikan dengan jelas.', 'bahasa', 'book', '#FF7B7B', 'active'::public.subject_status, true, 5)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  accent_color = excluded.accent_color,
  status = excluded.status,
  is_primary = excluded.is_primary,
  sort_order = excluded.sort_order;

-- courses: bahasa-indonesia
insert into public.courses (id, subject_id, slug, title, description, category, icon_key, sort_order, is_published)
values ('94d6efe7-984f-4321-8ef0-a419e0cfe5c2', 'c9d610d3-5d60-4d25-810a-bf61f627b94b', 'bahasa-indonesia', 'Bahasa Indonesia', 'Ejaan, kalimat efektif, dan pemahaman teks agar gagasan tersampaikan dengan jelas.', 'bahasa', 'book', 5, true)
on conflict (id) do update set
  subject_id = excluded.subject_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- course_levels: bahasa-indonesia/beginner
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('32ff5c52-53fd-42cd-8489-30c216985cdf', '94d6efe7-984f-4321-8ef0-a419e0cfe5c2', 'beginner', 'Level 1 · Ejaan dan Kalimat', 'Aturan dasar huruf kapital, tanda baca, dan kata baku.', 'beginner'::public.difficulty_band, 0, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: bahasa-indonesia/ejaan-dasar
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('0368f41e-d403-4a46-8b1b-cdb4915f79e9', '32ff5c52-53fd-42cd-8489-30c216985cdf', 'ejaan-dasar', 'Ejaan dan Kalimat Dasar', 'Ejaan yang tepat membuat tulisan mudah dipahami dan terpercaya.', array['Menggunakan huruf kapital dengan tepat', 'Memilih tanda baca yang sesuai', 'Membedakan kata baku dan tidak baku']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: bahasa-indonesia/ejaan-dasar
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('75c30eb4-e575-4159-8dcc-6ee667a975ca', '0368f41e-d403-4a46-8b1b-cdb4915f79e9', 'ejaan-dasar', 'Ejaan Dasar', 'Huruf kapital, tanda baca, dan kata baku.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-indonesia/ejaan-dasar
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('2b9e0aa0-fa69-45bd-8a83-54fe376fab6f', '0368f41e-d403-4a46-8b1b-cdb4915f79e9', 'lesson-ejaan-dasar', 'Ejaan Dasar', 'Huruf kapital, tanda baca, dan kata baku.', 'lesson'::public.node_kind, '75c30eb4-e575-4159-8dcc-6ee667a975ca', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: bahasa-indonesia/ejaan-dasar/id-huruf-kapital
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('10c9c883-de4c-4b70-8b85-63d665e39ae5', '75c30eb4-e575-4159-8dcc-6ee667a975ca', 'id-huruf-kapital', 'multiple_choice'::public.question_type, 'Ejaan', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Huruf kapital dipakai pada…', 'Huruf pertama awal kalimat ditulis kapital. Kata lain mengikuti aturan, misalnya nama diri juga kapital.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/ejaan-dasar/id-huruf-kapital/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f768239a-5717-4ff2-8919-d4284e9ae124', '10c9c883-de4c-4b70-8b85-63d665e39ae5', 'Huruf pertama awal kalimat', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-huruf-kapital/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f29f8a78-c818-4ae0-8617-ba2eb9826f16', '10c9c883-de4c-4b70-8b85-63d665e39ae5', 'Setiap kata dalam kalimat', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-huruf-kapital/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e3c2030f-d9bd-4fc3-8642-15bf1a0e3e10', '10c9c883-de4c-4b70-8b85-63d665e39ae5', 'Akhir setiap kata', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-huruf-kapital/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2aabae78-d006-49df-85da-0ccdf4978526', '10c9c883-de4c-4b70-8b85-63d665e39ae5', 'Semua kata kerja', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/ejaan-dasar/id-tanda-titik
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('e24282e4-596a-4be8-8c4f-dea3c1f754c6', '75c30eb4-e575-4159-8dcc-6ee667a975ca', 'id-tanda-titik', 'multiple_choice'::public.question_type, 'Tanda Baca', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Tanda baca yang mengakhiri kalimat berita adalah…', 'Kalimat berita diakhiri titik. Tanda tanya untuk pertanyaan dan tanda seru untuk perintah atau seruan.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/ejaan-dasar/id-tanda-titik/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('68b91cac-230c-43b6-80b8-7b73ac40d7e8', 'e24282e4-596a-4be8-8c4f-dea3c1f754c6', 'Titik (.)', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-tanda-titik/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('02d185e3-5e22-4759-8949-5125aac4eda6', 'e24282e4-596a-4be8-8c4f-dea3c1f754c6', 'Tanda tanya (?)', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-tanda-titik/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3341a9cc-c572-4bbf-8cda-d8e5ae648df2', 'e24282e4-596a-4be8-8c4f-dea3c1f754c6', 'Tanda seru (!)', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-tanda-titik/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('73adecfc-3990-42d0-8059-cc5a5de99eab', 'e24282e4-596a-4be8-8c4f-dea3c1f754c6', 'Titik dua (:)', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/ejaan-dasar/id-kata-baku
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('8e17f360-28ad-4ba5-851c-1460c4e85392', '75c30eb4-e575-4159-8dcc-6ee667a975ca', 'id-kata-baku', 'multiple_choice'::public.question_type, 'Kata Baku', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Bentuk baku yang benar adalah…', 'Menurut KBBI, bentuk baku adalah praktik, bukan praktek.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/ejaan-dasar/id-kata-baku/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('643feff5-5634-4368-8c5f-96a893173b31', '8e17f360-28ad-4ba5-851c-1460c4e85392', 'praktik', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-kata-baku/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f9ca27dd-e803-4381-8cac-e29f01ac3bf3', '8e17f360-28ad-4ba5-851c-1460c4e85392', 'praktek', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-kata-baku/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e4203658-0151-4aae-866c-29b82b456d8f', '8e17f360-28ad-4ba5-851c-1460c4e85392', 'praktiek', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-kata-baku/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c039828a-8008-4dfa-877c-32b40cfb6cb2', '8e17f360-28ad-4ba5-851c-1460c4e85392', 'prakteek', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/ejaan-dasar/id-imbuhan-menulis
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('68616fc9-3a34-4a43-86a0-1179cd7847ff', '75c30eb4-e575-4159-8dcc-6ee667a975ca', 'id-imbuhan-menulis', 'fill_blank'::public.question_type, 'Imbuhan', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Gabungan imbuhan me- dan kata "tulis" menghasilkan kata ___.', 'Awalan me- berubah menjadi men- di depan kata yang diawali t, sehingga menjadi menulis.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-indonesia/ejaan-dasar/id-imbuhan-menulis/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('0416c439-1d3b-4331-81be-8ba38b7f3015', '68616fc9-3a34-4a43-86a0-1179cd7847ff', 'menulis', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: bahasa-indonesia/ejaan-dasar/id-subjek-predikat
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('7bc6aa5c-1571-450b-8886-15db8dd370ea', '75c30eb4-e575-4159-8dcc-6ee667a975ca', 'id-subjek-predikat', 'multiple_choice'::public.question_type, 'Kalimat', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Predikat pada kalimat "Ani membaca buku" adalah…', 'Ani adalah subjek, membaca adalah predikat, dan buku adalah objek.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/ejaan-dasar/id-subjek-predikat/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7ae7afe8-dbe3-49ff-8bba-a21e99e708c9', '7bc6aa5c-1571-450b-8886-15db8dd370ea', 'membaca', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-subjek-predikat/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('578ba5e1-3cfd-4d1d-8a4e-e52b13190322', '7bc6aa5c-1571-450b-8886-15db8dd370ea', 'Ani', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-subjek-predikat/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('68b42679-abfe-40c4-815e-ecdd34bb284a', '7bc6aa5c-1571-450b-8886-15db8dd370ea', 'buku', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-subjek-predikat/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b3c83a92-1640-44e1-8a03-39a0d7cb438d', '7bc6aa5c-1571-450b-8886-15db8dd370ea', 'Ani membaca', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/ejaan-dasar/id-listening-ejaan
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('b7df5e29-9369-4cc7-80fa-06b1d88ed84f', '75c30eb4-e575-4159-8dcc-6ee667a975ca', 'id-listening-ejaan', 'listening'::public.question_type, 'Listening', 'beginner'::public.difficulty_band, 'Dengarkan audio, lalu pilih jawaban yang sesuai.', 'Apa instruksi yang kamu dengar?', 'Instruksi "Bacalah buku itu dengan saksama" meminta kita membaca buku dengan teliti.', 'Perhatikan kata "bacalah" dan "saksama".', 15, '{"speech":"Bacalah buku itu dengan saksama.","lang":"id-ID"}'::jsonb, 5, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/ejaan-dasar/id-listening-ejaan/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7ef12366-2b04-4007-8963-25f5324284c6', 'b7df5e29-9369-4cc7-80fa-06b1d88ed84f', 'Membaca buku dengan saksama', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-listening-ejaan/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a92d71ff-aed8-41b1-8ee4-e6fe2f1b0b33', 'b7df5e29-9369-4cc7-80fa-06b1d88ed84f', 'Menutup buku dan keluar kelas', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-listening-ejaan/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('77526536-6bc1-4622-8e71-db424fd97a19', 'b7df5e29-9369-4cc7-80fa-06b1d88ed84f', 'Menulis judul buku di papan tulis', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-listening-ejaan/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('bcf74190-4f43-45ad-89c0-2c87580d01a3', 'b7df5e29-9369-4cc7-80fa-06b1d88ed84f', 'Mengembalikan buku ke lemari', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/ejaan-dasar/id-speaking-perpustakaan
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('3fb10d2a-3848-45f1-8168-47c1143fee64', '75c30eb4-e575-4159-8dcc-6ee667a975ca', 'id-speaking-perpustakaan', 'speaking'::public.question_type, 'Speaking', 'beginner'::public.difficulty_band, 'Ucapkan kalimat berikut, lalu periksa apakah ucapanmu dikenali.', 'Ucapkan kalimat: "Saya membaca buku di perpustakaan."', 'Kalimat yang benar adalah "Saya membaca buku di perpustakaan". Penilaian memeriksa apakah ucapan dikenali, bukan memberi skor pengucapan buatan.', 'Ucapkan setiap kata dengan jelas.', 15, '{"speech":"Saya membaca buku di perpustakaan.","lang":"id-ID"}'::jsonb, 6, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-indonesia/ejaan-dasar/id-speaking-perpustakaan/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('1e969be2-1356-4ed8-8021-f0742b5af3e8', '3fb10d2a-3848-45f1-8168-47c1143fee64', 'saya membaca buku di perpustakaan', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- question_answers: bahasa-indonesia/ejaan-dasar/id-speaking-perpustakaan/1
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('7a7360fc-2f4b-4f8f-8a1b-bfe56beeaeb2', '3fb10d2a-3848-45f1-8168-47c1143fee64', 'saya membaca buku di perpustakaan.', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: bahasa-indonesia/ejaan-dasar/id-fill-dua-rumpang
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('b06a8677-80ab-4b19-887f-34da67a1ce8b', '75c30eb4-e575-4159-8dcc-6ee667a975ca', 'id-fill-dua-rumpang', 'fill_blank'::public.question_type, 'Kalimat', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Ani __ buku di perpustakaan dan __ catatan di rumah.', 'Kata kerja yang tepat adalah membaca untuk buku dan menulis untuk catatan. Kedua rumpang diisi sesuai kegiatan yang dilakukan.', 'Gunakan kata kerja yang sesuai dengan objeknya.', 10, '{}'::jsonb, 7, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-indonesia/ejaan-dasar/id-fill-dua-rumpang/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('a88121af-969c-4e77-8df4-488f1d89d4c0', 'b06a8677-80ab-4b19-887f-34da67a1ce8b', 'membaca menulis', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: bahasa-indonesia/ejaan-dasar/id-conversation-guru
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('722e75ff-aff2-4281-89a5-ea4537094a95', '75c30eb4-e575-4159-8dcc-6ee667a975ca', 'id-conversation-guru', 'conversation'::public.question_type, 'Conversation', 'beginner'::public.difficulty_band, 'Baca percakapan, lalu pilih respons yang paling tepat.', 'Bu Sari menanyakan tugas membaca. Pilih respons yang paling tepat.', 'Respons yang tepat menjawab pertanyaan guru dengan jujur dan menyebut kegiatan membaca serta mencatat kata baku.', 'Jawab pertanyaan "apakah sudah membaca" terlebih dahulu.', 15, '{"npc":{"name":"Bu Sari","role":"Guru bahasa Indonesia"},"screens":[{"speaker":"Bu Sari","line":"Selamat pagi. Apakah kamu sudah membaca teks tentang ejaan?"}],"responses":["Bu Sari tersenyum. \"Bagus. Sekarang jelaskan satu kata baku yang kamu temukan.\"","Bu Sari mengangguk. \"Baik, baca sekarang, lalu kita bahas bersama.\"","Bu Sari mengingatkan. \"Ini masih pagi, bukan malam.\"","Bu Sari menanggapi. \"Panjang bukan alasan untuk tidak membaca.\""],"lang":"id-ID"}'::jsonb, 8, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/ejaan-dasar/id-conversation-guru/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7d0e2bf6-e0c0-47ed-8bec-e70010cf2557', '722e75ff-aff2-4281-89a5-ea4537094a95', 'Sudah, Bu. Saya sudah membaca dan mencatat kata bakunya.', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-conversation-guru/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0353324c-57b1-4967-8c0b-01078e483dff', '722e75ff-aff2-4281-89a5-ea4537094a95', 'Belum, Bu. Saya tidak membawa buku.', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-conversation-guru/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a6116879-d3fa-45a7-8787-5b95c4ec25c9', '722e75ff-aff2-4281-89a5-ea4537094a95', 'Selamat malam, Bu. Sampai jumpa.', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-conversation-guru/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('fbbd5442-6e6e-4b39-8504-67c6ab43cef5', '722e75ff-aff2-4281-89a5-ea4537094a95', 'Teks itu sangat panjang.', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/ejaan-dasar/id-story-kalimat-efektif
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('204e313d-ca59-458d-83bf-25b89dbfa66d', '75c30eb4-e575-4159-8dcc-6ee667a975ca', 'id-story-kalimat-efektif', 'story'::public.question_type, 'Reading', 'beginner'::public.difficulty_band, 'Baca cerita sampai selesai, lalu jawab pertanyaan pemahaman.', 'Mengapa Rani menulis ulang kalimatnya?', 'Kata "para" dan bentuk ulang "siswa-siswa" sama-sama menandai jamak, sehingga salah satunya harus dihilangkan agar kalimat efektif.', 'Perhatikan dua penanda jamak dalam kalimat Rani.', 20, '{"screens":[{"narration":"Rani menulis kalimat \"para siswa-siswa berkumpul di lapangan\" di papan tulis."},{"speaker":"Rani","line":"Guruku bilang kata \"para\" sudah menunjukkan banyak. Kenapa kalimatku masih terasa berlebihan?","choices":[{"label":"Hapus salah satu penanda jamak","reply":"Rani menghapus bentuk ulang \"siswa-siswa\". Kalimatnya menjadi \"Para siswa berkumpul di lapangan.\""},{"label":"Tambahkan kata \"sangat\"","reply":"Rani menambahkan \"sangat\", tetapi kalimatnya justru makin berlebihan."},{"label":"Ubah menjadi kalimat tanya","reply":"Rani mengubahnya menjadi pertanyaan, padahal maksudnya memberi informasi."}]},{"narration":"Rani menulis ulang kalimat menjadi \"Para siswa berkumpul di lapangan.\" Kalimat itu ringkas dan tidak mengulang makna jamak."}],"lang":"id-ID"}'::jsonb, 9, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/ejaan-dasar/id-story-kalimat-efektif/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9e0ddef4-1d27-43e7-85cd-3e67a2d4caa8', '204e313d-ca59-458d-83bf-25b89dbfa66d', 'Karena kata "para" dan "siswa-siswa" sama-sama menyatakan jamak.', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-story-kalimat-efektif/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('64295212-4065-4c57-8fdc-601a98b5170d', '204e313d-ca59-458d-83bf-25b89dbfa66d', 'Karena kalimatnya terlalu pendek.', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-story-kalimat-efektif/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('cf6f4d40-cce2-46dc-858b-5fbe554d0902', '204e313d-ca59-458d-83bf-25b89dbfa66d', 'Karena Rani ingin membuat puisi.', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/ejaan-dasar/id-story-kalimat-efektif/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5d635320-8b5f-4ae6-821f-d748f819459f', '204e313d-ca59-458d-83bf-25b89dbfa66d', 'Karena guru meminta semua kalimat dihapus.', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/ejaan-dasar/id-matching-ejaan
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('b931e99f-e6cc-4fcb-8216-3c0a89d3d724', '75c30eb4-e575-4159-8dcc-6ee667a975ca', 'id-matching-ejaan', 'matching_pairs'::public.question_type, 'Ejaan', 'beginner'::public.difficulty_band, 'Cocokkan setiap item di kolom kiri dengan pasangannya di kolom kanan.', 'Cocokkan istilah dengan keterangannya.', 'Praktik adalah bentuk baku, praktek tidak baku, karena menandai sebab, dan titik mengakhiri kalimat berita.', 'Gunakan KBBI sebagai acuan bentuk baku.', 20, '{}'::jsonb, 10, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_pairs: bahasa-indonesia/ejaan-dasar/id-matching-ejaan/pair-0
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('3010ef2c-3e1c-41ee-8a42-4555afd30be8', 'b931e99f-e6cc-4fcb-8216-3c0a89d3d724', 'bf26abc0-2bab-441a-8dc4-040751961b3b', '7b6c14b5-b6f9-4107-827d-5f1a94d01f4b', 'praktik', 'bentuk baku', 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- question_pairs: bahasa-indonesia/ejaan-dasar/id-matching-ejaan/pair-1
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('34339a13-b114-4512-8c2a-5772c1d4a23a', 'b931e99f-e6cc-4fcb-8216-3c0a89d3d724', '204f87d1-7152-422f-855f-42345e5657d6', 'c5c2fad1-51b2-42a1-8569-0eb0671d692a', 'praktek', 'bentuk tidak baku', 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- question_pairs: bahasa-indonesia/ejaan-dasar/id-matching-ejaan/pair-2
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('5618a43f-e871-4c68-86c0-158c205260b2', 'b931e99f-e6cc-4fcb-8216-3c0a89d3d724', 'e112ecf5-c3af-4bc0-879f-587bb02b7c53', '9be72c00-0c25-4a9f-84ad-da78535ffaf8', 'karena', 'konjungsi sebab', 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- question_pairs: bahasa-indonesia/ejaan-dasar/id-matching-ejaan/pair-3
insert into public.question_pairs (id, question_id, left_id, right_id, left_label, right_label, sort_order)
values ('6103d85b-e967-4312-8b30-cf49af00a9a7', 'b931e99f-e6cc-4fcb-8216-3c0a89d3d724', '324a9232-6672-41f6-8efb-d11d7275af57', '3c822398-cbda-400c-8121-7375cfa5621e', 'titik', 'akhir kalimat berita', 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  left_id = excluded.left_id,
  right_id = excluded.right_id,
  left_label = excluded.left_label,
  right_label = excluded.right_label,
  sort_order = excluded.sort_order;

-- lessons: bahasa-indonesia/indonesia-review
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('3eb21734-0205-454b-8656-c801ac5ddfcd', '0368f41e-d403-4a46-8b1b-cdb4915f79e9', 'indonesia-review', 'Review Bahasa Indonesia', 'Ulangi ejaan, kalimat efektif, dan kata baku.', 'review'::public.lesson_kind, 5, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-indonesia/indonesia-review
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('d4eb25b4-e8f9-472a-8e24-34e659264523', '0368f41e-d403-4a46-8b1b-cdb4915f79e9', 'lesson-indonesia-review', 'Review Bahasa Indonesia', 'Ulangi ejaan, kalimat efektif, dan kata baku.', 'review'::public.node_kind, '3eb21734-0205-454b-8656-c801ac5ddfcd', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: bahasa-indonesia/indonesia-review/review-indonesia-preposition
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('b197cdfb-066f-4053-892e-ee4f6ebd3627', '3eb21734-0205-454b-8656-c801ac5ddfcd', 'review-indonesia-preposition', 'multiple_choice'::public.question_type, 'Ejaan', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Penulisan kata depan "di" yang benar adalah…', 'Kata depan di ditulis terpisah dari kata yang mengikutinya, seperti di rumah. Awalan di- ditulis serangkai, seperti ditulis.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/indonesia-review/review-indonesia-preposition/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('49b52bda-5306-41f7-8f90-96ce6e611770', 'b197cdfb-066f-4053-892e-ee4f6ebd3627', 'di rumah', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/indonesia-review/review-indonesia-preposition/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1e77741e-97ca-4c96-889e-945d7b6f885a', 'b197cdfb-066f-4053-892e-ee4f6ebd3627', 'dirumah', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/indonesia-review/review-indonesia-preposition/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('4979c67d-9bd8-481a-81f6-e8c6d4f9dc63', 'b197cdfb-066f-4053-892e-ee4f6ebd3627', 'di-rumah', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/indonesia-review/review-indonesia-preposition/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('53dbb579-1c76-4d99-806c-9c026d9ffb8c', 'b197cdfb-066f-4053-892e-ee4f6ebd3627', 'DiRumah', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/indonesia-review/review-indonesia-effective
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('6a0d1b2d-2bb7-4636-81b8-bd9eb9de8aa6', '3eb21734-0205-454b-8656-c801ac5ddfcd', 'review-indonesia-effective', 'multiple_choice'::public.question_type, 'Kalimat Efektif', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Kalimat yang paling efektif adalah…', 'Kata para sudah bermakna jamak, sehingga tidak perlu diulang dengan semua atau siswa-siswa.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/indonesia-review/review-indonesia-effective/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('887aa639-f086-48de-8a94-886d5817a174', '6a0d1b2d-2bb7-4636-81b8-bd9eb9de8aa6', 'Para siswa mengikuti upacara.', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/indonesia-review/review-indonesia-effective/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0007bbd1-9821-4cef-88ff-eae17c9fbc34', '6a0d1b2d-2bb7-4636-81b8-bd9eb9de8aa6', 'Para siswa-siswa mengikuti upacara.', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/indonesia-review/review-indonesia-effective/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('fec08847-61b9-4a0b-8603-5b47e25c9a6b', '6a0d1b2d-2bb7-4636-81b8-bd9eb9de8aa6', 'Semua para siswa mengikuti upacara.', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/indonesia-review/review-indonesia-effective/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('db174d2a-648a-4b5e-8d69-5edf42159ddd', '6a0d1b2d-2bb7-4636-81b8-bd9eb9de8aa6', 'Para semua siswa mengikuti upacara.', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/indonesia-review/review-indonesia-aktivitas
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('d2983eb3-08b6-4a58-85ac-39c1a1dcb900', '3eb21734-0205-454b-8656-c801ac5ddfcd', 'review-indonesia-aktivitas', 'typing'::public.question_type, 'Kata Baku', 'beginner'::public.difficulty_band, 'Tulis jawaban pada kolom yang tersedia.', 'Tulis bentuk baku dari kata "aktifitas".', 'Bentuk baku yang tercatat adalah aktivitas, bukan aktifitas.', null, 15, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-indonesia/indonesia-review/review-indonesia-aktivitas/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('3dec82da-9c75-425a-8fcd-5872672cf43b', 'd2983eb3-08b6-4a58-85ac-39c1a1dcb900', 'aktivitas', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- lessons: bahasa-indonesia/indonesia-challenge
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('871f9c88-cb4a-4804-8a24-922202e52f75', '0368f41e-d403-4a46-8b1b-cdb4915f79e9', 'indonesia-challenge', 'Tantangan Bahasa Indonesia', 'Latihan struktur teks, konjungsi, dan ketepatan ejaan.', 'challenge'::public.lesson_kind, 6, 10, 2, 2, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-indonesia/indonesia-challenge
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('85c6d1c2-dabd-4d1a-896e-b1174123d87f', '0368f41e-d403-4a46-8b1b-cdb4915f79e9', 'lesson-indonesia-challenge', 'Tantangan Bahasa Indonesia', 'Latihan struktur teks, konjungsi, dan ketepatan ejaan.', 'challenge'::public.node_kind, '871f9c88-cb4a-4804-8a24-922202e52f75', 20, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: bahasa-indonesia/indonesia-challenge/challenge-indonesia-procedure
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('dcb32268-e15e-4dec-8a16-1b731fb8b5d1', '871f9c88-cb4a-4804-8a24-922202e52f75', 'challenge-indonesia-procedure', 'multiple_choice'::public.question_type, 'Teks Prosedur', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Struktur teks prosedur yang tepat adalah…', 'Teks prosedur memuat tujuan, alat/bahan bila diperlukan, lalu langkah-langkah yang berurutan.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/indonesia-challenge/challenge-indonesia-procedure/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('24421300-9223-4cd9-85ec-2256b86a68b6', 'dcb32268-e15e-4dec-8a16-1b731fb8b5d1', 'Tujuan, alat dan bahan, langkah-langkah', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/indonesia-challenge/challenge-indonesia-procedure/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('200fd29a-7cb3-4bb8-8d44-a536daa3627f', 'dcb32268-e15e-4dec-8a16-1b731fb8b5d1', 'Orientasi, komplikasi, resolusi', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/indonesia-challenge/challenge-indonesia-procedure/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b60664ce-ced9-4087-80d1-351a1c94f791', 'dcb32268-e15e-4dec-8a16-1b731fb8b5d1', 'Pernyataan umum, deretan penjelas, interpretasi', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/indonesia-challenge/challenge-indonesia-procedure/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1fad0d84-35a4-43b0-8296-55317ada0191', 'dcb32268-e15e-4dec-8a16-1b731fb8b5d1', 'Abstraksi, krisis, koda', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/indonesia-challenge/challenge-indonesia-karena
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('7efbee57-17cf-47b3-868c-2bb78d3ce38f', '871f9c88-cb4a-4804-8a24-922202e52f75', 'challenge-indonesia-karena', 'fill_blank'::public.question_type, 'Konjungsi', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Hubungan sebab-akibat dapat ditandai dengan konjungsi ___', 'Karena menandai sebab. Akibatnya dapat ditandai dengan sehingga atau maka.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-indonesia/indonesia-challenge/challenge-indonesia-karena/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('2fea3f53-bb1c-4e58-80e7-1640e14e9e91', '7efbee57-17cf-47b3-868c-2bb78d3ce38f', 'karena', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: bahasa-indonesia/indonesia-challenge/challenge-indonesia-spelling
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('9978e1c4-d701-4c55-8ae9-b7747cff82a3', '871f9c88-cb4a-4804-8a24-922202e52f75', 'challenge-indonesia-spelling', 'multiple_choice'::public.question_type, 'Ejaan', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Kalimat dengan ejaan yang benar adalah…', 'Huruf pertama kalimat diawali kapital, dan kata depan di ditulis terpisah.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/indonesia-challenge/challenge-indonesia-spelling/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('facdccd7-e09c-427e-8f80-d7d03bb3aa7e', '9978e1c4-d701-4c55-8ae9-b7747cff82a3', 'Saya membeli buku di toko.', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/indonesia-challenge/challenge-indonesia-spelling/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('db507b8c-c36d-4734-8150-4e3550247ef6', '9978e1c4-d701-4c55-8ae9-b7747cff82a3', 'Saya membeli buku ditoko.', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/indonesia-challenge/challenge-indonesia-spelling/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('187d99fc-e927-4411-80bf-c89107d975e2', '9978e1c4-d701-4c55-8ae9-b7747cff82a3', 'saya membeli buku di toko.', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/indonesia-challenge/challenge-indonesia-spelling/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('13d0a9bc-7492-47ae-8a62-51db1a31c33a', '9978e1c4-d701-4c55-8ae9-b7747cff82a3', 'Saya membeli buku di-toko.', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- course_levels: bahasa-indonesia/elementary
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('9a2008ec-209d-47dd-8f7a-6db9394c0e1d', '94d6efe7-984f-4321-8ef0-a419e0cfe5c2', 'elementary', 'Level 2 · Kalimat Efektif', 'Menulis kalimat ringkas, logis, dan mudah dipahami.', 'elementary'::public.difficulty_band, 1, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: bahasa-indonesia/kalimat-efektif
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('616debd1-94cd-446d-8cdb-b0195faa0709', '9a2008ec-209d-47dd-8f7a-6db9394c0e1d', 'kalimat-efektif', 'Kalimat Efektif', 'Kalimat efektif menyampaikan gagasan tanpa kata mubazir.', array['Menghindari pemborosan kata', 'Menggunakan konjungsi dengan tepat', 'Menentukan gagasan utama paragraf']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: bahasa-indonesia/kalimat-efektif
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('747bbdac-6635-440b-88f1-b66b50a73e03', '616debd1-94cd-446d-8cdb-b0195faa0709', 'kalimat-efektif', 'Kalimat Efektif', 'Menulis jelas dan tidak bertele-tele.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-indonesia/kalimat-efektif
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('e0e901aa-18ee-4fe4-8f83-84c954c48e47', '616debd1-94cd-446d-8cdb-b0195faa0709', 'lesson-kalimat-efektif', 'Kalimat Efektif', 'Menulis jelas dan tidak bertele-tele.', 'lesson'::public.node_kind, '747bbdac-6635-440b-88f1-b66b50a73e03', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: bahasa-indonesia/kalimat-efektif/id-kalimat-ringkas
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('04fe7ae5-cde9-404f-8796-acd909ce046f', '747bbdac-6635-440b-88f1-b66b50a73e03', 'id-kalimat-ringkas', 'multiple_choice'::public.question_type, 'Kalimat Efektif', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Kalimat paling efektif adalah…', 'Kata "para" sudah bermakna jamak sehingga tidak perlu digabung dengan bentuk ulang siswa-siswa.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/kalimat-efektif/id-kalimat-ringkas/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('932a0741-89b8-4c4d-84fa-7699c436402c', '04fe7ae5-cde9-404f-8796-acd909ce046f', 'Para siswa berkumpul di lapangan.', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/kalimat-efektif/id-kalimat-ringkas/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0b3fba36-d58a-49b9-852f-bd3c9678abc6', '04fe7ae5-cde9-404f-8796-acd909ce046f', 'Para siswa-siswa pada berkumpul di lapangan.', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/kalimat-efektif/id-kalimat-ringkas/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6bbc723b-9244-4868-8536-3e1b6054ce54', '04fe7ae5-cde9-404f-8796-acd909ce046f', 'Siswa-siswa para berkumpul di lapangan.', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/kalimat-efektif/id-kalimat-ringkas/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9ea3a018-676f-4d4d-870c-c057684d86d9', '04fe7ae5-cde9-404f-8796-acd909ce046f', 'Para dari siswa berkumpul di lapangan.', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/kalimat-efektif/id-konjungsi-sebab
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('ec99aa80-8e98-4a2c-87eb-6293acf38678', '747bbdac-6635-440b-88f1-b66b50a73e03', 'id-konjungsi-sebab', 'multiple_choice'::public.question_type, 'Konjungsi', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Konjungsi yang menyatakan sebab adalah…', 'Karena menandai sebab. Tetapi dan meskipun menandai pertentangan, sedangkan sehingga menandai akibat.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/kalimat-efektif/id-konjungsi-sebab/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e3a45f91-7183-4254-87f9-9aa1a68eaf1a', 'ec99aa80-8e98-4a2c-87eb-6293acf38678', 'karena', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/kalimat-efektif/id-konjungsi-sebab/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9902f4d9-e061-4bf2-8505-2b133cbee9d0', 'ec99aa80-8e98-4a2c-87eb-6293acf38678', 'tetapi', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/kalimat-efektif/id-konjungsi-sebab/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b53c931f-d7a4-42b9-8adf-78778796d898', 'ec99aa80-8e98-4a2c-87eb-6293acf38678', 'sehingga', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/kalimat-efektif/id-konjungsi-sebab/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8321b6a1-6f02-4598-8aae-da4debb4290f', 'ec99aa80-8e98-4a2c-87eb-6293acf38678', 'meskipun', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/kalimat-efektif/id-kalimat-tanya
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('856a45a0-4cbd-409b-845b-5977a17c5c6a', '747bbdac-6635-440b-88f1-b66b50a73e03', 'id-kalimat-tanya', 'multiple_choice'::public.question_type, 'Tanda Baca', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Kalimat "Kapan kamu belajar" seharusnya diakhiri…', 'Kalimat tanya diakhiri tanda tanya, bukan titik.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/kalimat-efektif/id-kalimat-tanya/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6559a8df-5acd-409a-881c-b3b994fd7842', '856a45a0-4cbd-409b-845b-5977a17c5c6a', 'Tanda tanya (?)', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/kalimat-efektif/id-kalimat-tanya/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d7f6f5a1-86b8-4f7b-89fa-02dcd1094ab1', '856a45a0-4cbd-409b-845b-5977a17c5c6a', 'Titik (.)', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/kalimat-efektif/id-kalimat-tanya/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9444c5d2-4064-4c7d-8c84-0ac735940dc5', '856a45a0-4cbd-409b-845b-5977a17c5c6a', 'Tanda seru (!)', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/kalimat-efektif/id-kalimat-tanya/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7344d2ff-a9d3-4a4b-8b3a-d4175857e972', '856a45a0-4cbd-409b-845b-5977a17c5c6a', 'Titik koma (;)', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/kalimat-efektif/id-kata-depan-di
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('2c015969-8ac2-428f-8cba-3c35b6631bfa', '747bbdac-6635-440b-88f1-b66b50a73e03', 'id-kata-depan-di', 'fill_blank'::public.question_type, 'Kata Depan', 'elementary'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Buku itu terletak ___ atas meja.', 'Kata depan di ditulis terpisah dari kata tempat, seperti di atas dan di rumah.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-indonesia/kalimat-efektif/id-kata-depan-di/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('908d5d49-b41d-4ab2-8194-aede76c8b8e8', '2c015969-8ac2-428f-8cba-3c35b6631bfa', 'di', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: bahasa-indonesia/kalimat-efektif/id-gagasan-utama
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('5250ba21-2456-4e2c-864e-4c6d65e3684e', '747bbdac-6635-440b-88f1-b66b50a73e03', 'id-gagasan-utama', 'multiple_choice'::public.question_type, 'Paragraf', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Gagasan utama sebuah paragraf biasanya terdapat pada…', 'Gagasan utama dituangkan dalam kalimat utama, lalu dijelaskan oleh kalimat penjelas.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/kalimat-efektif/id-gagasan-utama/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b67072bf-f964-40b8-8b96-dcd0cc3f455e', '5250ba21-2456-4e2c-864e-4c6d65e3684e', 'Kalimat utama', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/kalimat-efektif/id-gagasan-utama/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('09c69e72-cd88-491c-848a-2d11fba6f7c8', '5250ba21-2456-4e2c-864e-4c6d65e3684e', 'Kalimat terakhir saja', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/kalimat-efektif/id-gagasan-utama/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0c614ab3-ec0e-41a3-82d3-0e5b96b24715', '5250ba21-2456-4e2c-864e-4c6d65e3684e', 'Semua kalimat penjelas', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/kalimat-efektif/id-gagasan-utama/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ffe875ab-cec4-439e-89cc-06252b591f9e', '5250ba21-2456-4e2c-864e-4c6d65e3684e', 'Judul bacaan', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: bahasa-indonesia/latihan-kalimat-efektif
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('d49e1fa3-3e86-4e0b-8d45-1ac34637a366', '616debd1-94cd-446d-8cdb-b0195faa0709', 'latihan-kalimat-efektif', 'Latihan Kalimat Efektif', 'Latihan menghilangkan pemborosan dan memilih bentuk baku.', 'practice'::public.lesson_kind, 6, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-indonesia/latihan-kalimat-efektif
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('15e248c2-20b6-4725-816d-a7c38b0542ac', '616debd1-94cd-446d-8cdb-b0195faa0709', 'lesson-latihan-kalimat-efektif', 'Latihan Kalimat Efektif', 'Latihan menghilangkan pemborosan dan memilih bentuk baku.', 'practice'::public.node_kind, 'd49e1fa3-3e86-4e0b-8d45-1ac34637a366', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: bahasa-indonesia/latihan-kalimat-efektif/practice-id-para
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('688caa9e-7dc5-40ca-8d75-3408e9723334', 'd49e1fa3-3e86-4e0b-8d45-1ac34637a366', 'practice-id-para', 'multiple_choice'::public.question_type, 'Kalimat Efektif', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Pilih kalimat efektif yang benar.', 'Kata para sudah bermakna jamak, sehingga tidak perlu diulang dengan siswa-siswa atau semuanya.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/latihan-kalimat-efektif/practice-id-para/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ddde1499-dad3-4831-8f85-60ebf32f6ecb', '688caa9e-7dc5-40ca-8d75-3408e9723334', 'Para siswa mengikuti upacara.', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/latihan-kalimat-efektif/practice-id-para/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a0e89771-a4b9-47d5-8555-56dc64c351d6', '688caa9e-7dc5-40ca-8d75-3408e9723334', 'Para siswa-siswa mengikuti upacara.', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/latihan-kalimat-efektif/practice-id-para/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d098b698-4c60-4138-8efd-e88affe203e4', '688caa9e-7dc5-40ca-8d75-3408e9723334', 'Para siswa-siswa semuanya mengikuti upacara.', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/latihan-kalimat-efektif/practice-id-para/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('218d2a01-f84a-4542-8921-edb5788e74cd', '688caa9e-7dc5-40ca-8d75-3408e9723334', 'Semua para siswa-siswa mengikuti upacara.', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/latihan-kalimat-efektif/practice-id-baku
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('ec9a1576-679e-481a-80c9-6fb72e8dd26a', 'd49e1fa3-3e86-4e0b-8d45-1ac34637a366', 'practice-id-baku', 'multiple_choice'::public.question_type, 'Kata Baku', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Bentuk baku yang sesuai KBBI adalah…', 'Kata baku menurut KBBI adalah praktik, bukan praktek.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/latihan-kalimat-efektif/practice-id-baku/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('10a1ac73-9fbc-4049-88bc-863fb2f2aca7', 'ec9a1576-679e-481a-80c9-6fb72e8dd26a', 'praktik', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/latihan-kalimat-efektif/practice-id-baku/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0c309ae6-3f65-4f3f-8613-89036ea279a3', 'ec9a1576-679e-481a-80c9-6fb72e8dd26a', 'praktek', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/latihan-kalimat-efektif/practice-id-baku/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('974a81d9-f9e9-4740-8a11-af67318d1bf2', 'ec9a1576-679e-481a-80c9-6fb72e8dd26a', 'praktiek', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/latihan-kalimat-efektif/practice-id-baku/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9ba697f0-acd9-4d0c-85c1-87a18dfa3bff', 'ec9a1576-679e-481a-80c9-6fb72e8dd26a', 'prakteq', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/latihan-kalimat-efektif/practice-id-analisis
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('286bc5e6-80e2-472b-8f52-dbb5d766e11d', 'd49e1fa3-3e86-4e0b-8d45-1ac34637a366', 'practice-id-analisis', 'fill_blank'::public.question_type, 'Kata Baku', 'elementary'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Bentuk baku dari kata ''analisa'' adalah __.', 'KBBI mencatat analisis sebagai bentuk baku; analisa adalah bentuk tidak baku.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-indonesia/latihan-kalimat-efektif/practice-id-analisis/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('ee06fa61-59c9-4a71-8d77-c956d1beabcb', '286bc5e6-80e2-472b-8f52-dbb5d766e11d', 'analisis', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- lessons: bahasa-indonesia/checkpoint-ejaan-kalimat
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('036180fd-8576-4fac-8c0c-86cbc4d82809', '616debd1-94cd-446d-8cdb-b0195faa0709', 'checkpoint-ejaan-kalimat', 'Checkpoint Ejaan & Kalimat', 'Periksa unsur kalimat dan penulisan kata depan.', 'review'::public.lesson_kind, 8, 10, 2, 2, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-indonesia/checkpoint-ejaan-kalimat
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('b050fe71-7cb8-4aaf-8257-32b5ce486ddf', '616debd1-94cd-446d-8cdb-b0195faa0709', 'lesson-checkpoint-ejaan-kalimat', 'Checkpoint Ejaan & Kalimat', 'Periksa unsur kalimat dan penulisan kata depan.', 'checkpoint'::public.node_kind, '036180fd-8576-4fac-8c0c-86cbc4d82809', 20, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: bahasa-indonesia/checkpoint-ejaan-kalimat/checkpoint-id-unsur
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('b5f9d46e-d760-4422-8ab3-62ee451037a1', '036180fd-8576-4fac-8c0c-86cbc4d82809', 'checkpoint-id-unsur', 'multiple_choice'::public.question_type, 'Struktur Kalimat', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Kalimat minimal memiliki…', 'Subjek dan predikat adalah unsur minimal sebuah kalimat. Objek dan keterangan bersifat tambahan.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/checkpoint-ejaan-kalimat/checkpoint-id-unsur/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('850659d2-73c1-47e8-8ea1-0944a563e861', 'b5f9d46e-d760-4422-8ab3-62ee451037a1', 'subjek dan predikat', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/checkpoint-ejaan-kalimat/checkpoint-id-unsur/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('54f6199b-b59b-4413-8b9b-6cf37a58c619', 'b5f9d46e-d760-4422-8ab3-62ee451037a1', 'subjek dan objek', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/checkpoint-ejaan-kalimat/checkpoint-id-unsur/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('fe6d2b49-0316-467c-8c72-5b9e46605dc6', 'b5f9d46e-d760-4422-8ab3-62ee451037a1', 'predikat dan keterangan', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/checkpoint-ejaan-kalimat/checkpoint-id-unsur/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('88009fa4-b8f3-4da5-86ec-792441a3523f', 'b5f9d46e-d760-4422-8ab3-62ee451037a1', 'objek dan pelengkap', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/checkpoint-ejaan-kalimat/checkpoint-id-di
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('82210b56-3839-4837-8767-3f7b8dc99190', '036180fd-8576-4fac-8c0c-86cbc4d82809', 'checkpoint-id-di', 'multiple_choice'::public.question_type, 'Ejaan', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Penulisan "di" sebagai kata depan yang benar adalah…', 'Sebagai kata depan penunjuk tempat, di ditulis terpisah: di rumah. Sebagai awalan, ditulis serangkai: ditulis.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/checkpoint-ejaan-kalimat/checkpoint-id-di/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5138b12e-2c90-47cb-83e4-0f0dbe09ca84', '82210b56-3839-4837-8767-3f7b8dc99190', 'di rumah', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/checkpoint-ejaan-kalimat/checkpoint-id-di/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('668e34b8-fca0-4a1d-8457-874d994d3414', '82210b56-3839-4837-8767-3f7b8dc99190', 'dirumah', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/checkpoint-ejaan-kalimat/checkpoint-id-di/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('faac8eb7-ad44-471e-8255-23737c054a92', '82210b56-3839-4837-8767-3f7b8dc99190', 'di-rumah', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/checkpoint-ejaan-kalimat/checkpoint-id-di/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c81d56ef-1cd2-465a-8625-6dce4cb20b8e', '82210b56-3839-4837-8767-3f7b8dc99190', 'dirumah-', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/checkpoint-ejaan-kalimat/checkpoint-id-zaman
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('6c5cd715-5af9-4e50-87df-fade7d3300ba', '036180fd-8576-4fac-8c0c-86cbc4d82809', 'checkpoint-id-zaman', 'typing'::public.question_type, 'Kata Baku', 'elementary'::public.difficulty_band, 'Tulis jawaban pada kolom yang tersedia.', 'Tulis bentuk baku dari kata ''jaman''.', 'Bentuk baku menurut KBBI adalah zaman, bukan jaman.', null, 15, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-indonesia/checkpoint-ejaan-kalimat/checkpoint-id-zaman/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('807e71ee-b2ea-400a-8fef-1ccd1be524ce', '6c5cd715-5af9-4e50-87df-fade7d3300ba', 'zaman', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- course_levels: bahasa-indonesia/intermediate
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('49f79176-3092-4f08-8df2-67fcf74547d0', '94d6efe7-984f-4321-8ef0-a419e0cfe5c2', 'intermediate', 'Level 3 · Teks dan Gagasan', 'Mengenali jenis teks, fakta, opini, dan unsur berita.', 'intermediate'::public.difficulty_band, 2, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: bahasa-indonesia/teks-dan-gagasan
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('d5898c76-f1c6-48e1-834b-821c99f8d163', '49f79176-3092-4f08-8df2-67fcf74547d0', 'teks-dan-gagasan', 'Teks dan Gagasan', 'Pembaca yang kritis membedakan informasi dan pendapat.', array['Mengenali tujuan teks eksposisi', 'Membedakan fakta dan opini', 'Mengenali unsur berita']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: bahasa-indonesia/teks-dan-gagasan
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('c847d1e1-3c9c-4e49-8efe-ab22ede9c9f1', 'd5898c76-f1c6-48e1-834b-821c99f8d163', 'teks-dan-gagasan', 'Teks dan Gagasan', 'Membaca kritis dan menulis terstruktur.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-indonesia/teks-dan-gagasan
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('5b00f1c7-0d32-45d3-882a-d53bd8d619fd', 'd5898c76-f1c6-48e1-834b-821c99f8d163', 'lesson-teks-dan-gagasan', 'Teks dan Gagasan', 'Membaca kritis dan menulis terstruktur.', 'lesson'::public.node_kind, 'c847d1e1-3c9c-4e49-8efe-ab22ede9c9f1', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: bahasa-indonesia/teks-dan-gagasan/id-eksposisi-tujuan
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('11b871df-d560-47a6-8910-c8fd72467c66', 'c847d1e1-3c9c-4e49-8efe-ab22ede9c9f1', 'id-eksposisi-tujuan', 'multiple_choice'::public.question_type, 'Jenis Teks', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Tujuan utama teks eksposisi adalah…', 'Eksposisi memaparkan informasi disertai fakta dan penalaran agar pembaca memahami suatu gagasan.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/teks-dan-gagasan/id-eksposisi-tujuan/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('55dddb17-5d8a-4eed-8a4b-3ebda8a06bf8', '11b871df-d560-47a6-8910-c8fd72467c66', 'Memaparkan informasi dan gagasan', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/teks-dan-gagasan/id-eksposisi-tujuan/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('84c80c90-820c-4aea-86f3-e78f3c583914', '11b871df-d560-47a6-8910-c8fd72467c66', 'Menghibur pembaca dengan cerita fiksi', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/teks-dan-gagasan/id-eksposisi-tujuan/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('08361f3d-e2f5-483f-8b96-9833ac8607e9', '11b871df-d560-47a6-8910-c8fd72467c66', 'Mengajak pembaca membeli produk', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/teks-dan-gagasan/id-eksposisi-tujuan/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('693538a3-a4ec-4d3a-87e1-42c73ae5180b', '11b871df-d560-47a6-8910-c8fd72467c66', 'Menceritakan pengalaman pribadi', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/teks-dan-gagasan/id-personifikasi
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('7da05bee-f72e-4da5-8284-04c6bf1cef4b', 'c847d1e1-3c9c-4e49-8efe-ab22ede9c9f1', 'id-personifikasi', 'multiple_choice'::public.question_type, 'Majas', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Kalimat yang mengandung personifikasi adalah…', 'Personifikasi memberikan sifat manusia kepada benda, misalnya angin yang "berbisik".', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/teks-dan-gagasan/id-personifikasi/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('4ccfff67-0a09-4ba2-836b-6eec0c8667f2', '7da05bee-f72e-4da5-8284-04c6bf1cef4b', 'Angin berbisik lembut di telinga.', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/teks-dan-gagasan/id-personifikasi/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d62091dd-fc88-477b-80f9-1e7a88c06687', '7da05bee-f72e-4da5-8284-04c6bf1cef4b', 'Dia berlari secepat kilat.', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/teks-dan-gagasan/id-personifikasi/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7d3db38f-6870-48c8-81ef-0ca3eb0c4618', '7da05bee-f72e-4da5-8284-04c6bf1cef4b', 'Wajahnya bulat seperti bulan.', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/teks-dan-gagasan/id-personifikasi/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1cddcac9-f4bf-499e-8ab3-f2ed3bcbfe3c', '7da05bee-f72e-4da5-8284-04c6bf1cef4b', 'Ani membaca buku di perpustakaan.', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/teks-dan-gagasan/id-opini
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('4b2c0e62-9bfa-4fa8-8781-7c0380404715', 'c847d1e1-3c9c-4e49-8efe-ab22ede9c9f1', 'id-opini', 'multiple_choice'::public.question_type, 'Fakta dan Opini', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Pernyataan yang merupakan opini adalah…', 'Opini berisi penilaian pribadi dan ditandai frasa seperti "menurut saya". Pernyataan lain dapat diverifikasi.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/teks-dan-gagasan/id-opini/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d5e1b9da-da0d-4129-84b2-e827e55336ab', '4b2c0e62-9bfa-4fa8-8781-7c0380404715', 'Menurut saya, film itu membosankan.', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/teks-dan-gagasan/id-opini/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('027419b9-77f1-45c7-8fe9-64b52979e3b1', '4b2c0e62-9bfa-4fa8-8781-7c0380404715', 'Film itu berdurasi 120 menit.', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/teks-dan-gagasan/id-opini/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d257f26d-dbfc-481d-8608-f577c2a95dd4', '4b2c0e62-9bfa-4fa8-8781-7c0380404715', 'Film itu dirilis pada 2024.', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/teks-dan-gagasan/id-opini/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('64cf50b9-7c63-40cc-86d3-872acff01705', '4b2c0e62-9bfa-4fa8-8781-7c0380404715', 'Film itu disutradarai oleh Rani.', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/teks-dan-gagasan/id-unsur-berita
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('92b30329-5390-4508-8dee-3c0592afa352', 'c847d1e1-3c9c-4e49-8efe-ab22ede9c9f1', 'id-unsur-berita', 'fill_blank'::public.question_type, 'Berita', 'intermediate'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Unsur berita yang menjelaskan alasan terjadinya peristiwa disebut ___.', 'Rumus 5W1H mencakup what, who, when, where, why, dan how. Why menjelaskan alasan peristiwa.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-indonesia/teks-dan-gagasan/id-unsur-berita/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('d4730a66-d555-4d35-8e55-cbc6d1869530', '92b30329-5390-4508-8dee-3c0592afa352', 'why', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- question_answers: bahasa-indonesia/teks-dan-gagasan/id-unsur-berita/1
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('4477531c-32d2-4d5f-8029-36564ba6ecb2', '92b30329-5390-4508-8dee-3c0592afa352', 'mengapa', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: bahasa-indonesia/teks-dan-gagasan/id-simpulan
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('04b20e53-eefd-43b4-85a5-4ca5af99f012', 'c847d1e1-3c9c-4e49-8efe-ab22ede9c9f1', 'id-simpulan', 'multiple_choice'::public.question_type, 'Membaca', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Simpulan yang tepat harus berdasarkan…', 'Simpulan yang baik ditarik dari informasi dan bukti yang tersedia di dalam teks.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/teks-dan-gagasan/id-simpulan/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('00de1420-0c3e-4687-8daf-36c82b8e8327', '04b20e53-eefd-43b4-85a5-4ca5af99f012', 'Informasi pada teks', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/teks-dan-gagasan/id-simpulan/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('76da9d4f-24b9-4d58-8552-96d3ac18f47e', '04b20e53-eefd-43b4-85a5-4ca5af99f012', 'Dugaan tanpa bukti', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/teks-dan-gagasan/id-simpulan/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f8276b3b-88c3-45fe-861e-f8cdf6c9a474', '04b20e53-eefd-43b4-85a5-4ca5af99f012', 'Pendapat populer', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/teks-dan-gagasan/id-simpulan/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('557f9364-5df0-4c47-8c34-26f6d31debfe', '04b20e53-eefd-43b4-85a5-4ca5af99f012', 'Judul saja', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: bahasa-indonesia/legendary-jenis-teks
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('e2105d75-a72c-4e7a-8634-abb705cc1820', 'd5898c76-f1c6-48e1-834b-821c99f8d163', 'legendary-jenis-teks', 'Legendary Jenis Teks', 'Tantangan lanjutan membedakan tujuan dan struktur teks.', 'legendary'::public.lesson_kind, 9, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-indonesia/legendary-jenis-teks
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('85c6dbcf-fcd3-4c4e-8f54-0f66b4e3d4f1', 'd5898c76-f1c6-48e1-834b-821c99f8d163', 'lesson-legendary-jenis-teks', 'Legendary Jenis Teks', 'Tantangan lanjutan membedakan tujuan dan struktur teks.', 'legendary'::public.node_kind, 'e2105d75-a72c-4e7a-8634-abb705cc1820', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: bahasa-indonesia/legendary-jenis-teks/legendary-id-argumentasi
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('6d7e9931-92a1-4dff-86c7-a4974c79f208', 'e2105d75-a72c-4e7a-8634-abb705cc1820', 'legendary-id-argumentasi', 'multiple_choice'::public.question_type, 'Teks Argumentasi', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Tujuan utama teks argumentasi adalah…', 'Teks argumentasi memuat pendapat yang didukung alasan dan bukti agar pembaca meyakini sudut pandang penulis.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/legendary-jenis-teks/legendary-id-argumentasi/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a276c8b4-7a95-4e41-873b-fd3e231d6e32', '6d7e9931-92a1-4dff-86c7-a4974c79f208', 'Meyakinkan pembaca dengan alasan dan bukti', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/legendary-jenis-teks/legendary-id-argumentasi/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e056de73-5c4b-44d1-8658-c1954e1cdf90', '6d7e9931-92a1-4dff-86c7-a4974c79f208', 'Menghibur pembaca dengan cerita', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/legendary-jenis-teks/legendary-id-argumentasi/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('55fc35e9-9e53-4d7b-8e40-aefda0017b1d', '6d7e9931-92a1-4dff-86c7-a4974c79f208', 'Menjelaskan langkah membuat sesuatu', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/legendary-jenis-teks/legendary-id-argumentasi/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3b2ef48b-6693-4e5f-8e01-44197671001d', '6d7e9931-92a1-4dff-86c7-a4974c79f208', 'Mendeskripsikan ciri fisik objek', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/legendary-jenis-teks/legendary-id-prosedur
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('467e68fe-4078-419f-887e-b79c4a275432', 'e2105d75-a72c-4e7a-8634-abb705cc1820', 'legendary-id-prosedur', 'multiple_choice'::public.question_type, 'Teks Prosedur', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Struktur teks prosedur yang tepat adalah…', 'Teks prosedur memandu pembaca melakukan sesuatu melalui tujuan, alat/bahan, dan langkah berurutan.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: bahasa-indonesia/legendary-jenis-teks/legendary-id-prosedur/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a79365c2-a623-4d21-80b9-f3f635bd7bb7', '467e68fe-4078-419f-887e-b79c4a275432', 'Tujuan, alat dan bahan, langkah-langkah', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/legendary-jenis-teks/legendary-id-prosedur/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8449e500-c688-4377-8a72-bb2ffce60bb5', '467e68fe-4078-419f-887e-b79c4a275432', 'Orientasi, komplikasi, resolusi', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/legendary-jenis-teks/legendary-id-prosedur/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7902d8eb-593a-4761-88dc-1162dbef2b9f', '467e68fe-4078-419f-887e-b79c4a275432', 'Tesis, argumen, penegasan ulang', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: bahasa-indonesia/legendary-jenis-teks/legendary-id-prosedur/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('464cacfe-80c8-4151-8b77-692181dce483', '467e68fe-4078-419f-887e-b79c4a275432', 'Identifikasi, deskripsi bagian, penutup', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: bahasa-indonesia/legendary-jenis-teks/legendary-id-eksposisi
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('48a7c5b8-5a78-4da3-8c93-1085f01bd3d2', 'e2105d75-a72c-4e7a-8634-abb705cc1820', 'legendary-id-eksposisi', 'fill_blank'::public.question_type, 'Teks Eksposisi', 'intermediate'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Teks yang menjelaskan gagasan atau proses secara informatif disebut teks __.', 'Teks eksposisi memaparkan informasi dan gagasan tanpa bertujuan memengaruhi pembaca seperti argumentasi.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: bahasa-indonesia/legendary-jenis-teks/legendary-id-eksposisi/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('ab274927-43be-45b0-8855-214359801e17', '48a7c5b8-5a78-4da3-8c93-1085f01bd3d2', 'eksposisi', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- subjects: pendidikan-pancasila
insert into public.subjects (id, slug, name, short_name, description, category, icon_key, accent_color, status, is_primary, sort_order)
values ('ff355534-5773-463e-84c4-423687f64ef5', 'pendidikan-pancasila', 'Pendidikan Pancasila', 'PPK', 'Memahami Pancasila, norma, hak dan kewajiban, serta peran warga negara dalam kehidupan bersama.', 'sosial', 'shield', '#FFC83D', 'active'::public.subject_status, true, 6)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  accent_color = excluded.accent_color,
  status = excluded.status,
  is_primary = excluded.is_primary,
  sort_order = excluded.sort_order;

-- courses: pendidikan-pancasila
insert into public.courses (id, subject_id, slug, title, description, category, icon_key, sort_order, is_published)
values ('e3a2067d-cbe7-4be5-8743-e5ad75b7eff6', 'ff355534-5773-463e-84c4-423687f64ef5', 'pendidikan-pancasila', 'Pendidikan Pancasila', 'Memahami Pancasila, norma, hak dan kewajiban, serta peran warga negara dalam kehidupan bersama.', 'sosial', 'shield', 6, true)
on conflict (id) do update set
  subject_id = excluded.subject_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- course_levels: pendidikan-pancasila/beginner
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('c15bc3bb-a443-4553-8f1d-1dd80b25d1d1', 'e3a2067d-cbe7-4be5-8743-e5ad75b7eff6', 'beginner', 'Level 1 · Pancasila', 'Mengenal lima sila, lambang, dan semboyan bangsa Indonesia.', 'beginner'::public.difficulty_band, 0, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: pendidikan-pancasila/pancasila-dasar
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('0700d939-e5c2-4363-8c02-e3783ab7edf3', 'c15bc3bb-a443-4553-8f1d-1dd80b25d1d1', 'pancasila-dasar', 'Pancasila sebagai Dasar Negara', 'Pancasila adalah fondasi nilai yang menyatukan kehidupan berbangsa.', array['Menyebutkan lima sila Pancasila secara berurutan', 'Mengaitkan lambang dengan sila', 'Memahami makna semboyan bangsa']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: pendidikan-pancasila/pancasila-dasar
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('0d9a2b2c-1ee7-49c8-8657-a457d66d60f5', '0700d939-e5c2-4363-8c02-e3783ab7edf3', 'pancasila-dasar', 'Pancasila Dasar', 'Lima sila dan lambangnya.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: pendidikan-pancasila/pancasila-dasar
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('3f887925-4aba-4950-8f06-fbbe243a45c6', '0700d939-e5c2-4363-8c02-e3783ab7edf3', 'lesson-pancasila-dasar', 'Pancasila Dasar', 'Lima sila dan lambangnya.', 'lesson'::public.node_kind, '0d9a2b2c-1ee7-49c8-8657-a457d66d60f5', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: pendidikan-pancasila/pancasila-dasar/ppk-sila-pertama
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('fde6db3f-c4d4-407a-80ea-8baaab5d29cd', '0d9a2b2c-1ee7-49c8-8657-a457d66d60f5', 'ppk-sila-pertama', 'multiple_choice'::public.question_type, 'Pancasila', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Bunyi sila pertama Pancasila adalah…', 'Sila pertama menegaskan Ketuhanan Yang Maha Esa. Sila kedua tentang kemanusiaan yang adil dan beradab.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/pancasila-dasar/ppk-sila-pertama/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7c10f989-5b56-4860-81fe-efe7ed2a1c6d', 'fde6db3f-c4d4-407a-80ea-8baaab5d29cd', 'Ketuhanan Yang Maha Esa', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-dasar/ppk-sila-pertama/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ba137232-ff75-4d51-8359-4546663f9f34', 'fde6db3f-c4d4-407a-80ea-8baaab5d29cd', 'Kemanusiaan yang adil dan beradab', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-dasar/ppk-sila-pertama/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('98e3bd64-752c-4951-8e62-5a109e0eecce', 'fde6db3f-c4d4-407a-80ea-8baaab5d29cd', 'Persatuan Indonesia', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-dasar/ppk-sila-pertama/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('cd6e52fc-9ebe-4f46-8325-cd83375d4cab', 'fde6db3f-c4d4-407a-80ea-8baaab5d29cd', 'Keadilan sosial bagi seluruh rakyat Indonesia', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/pancasila-dasar/ppk-jumlah-sila
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('52544703-1e61-42dc-85b5-ad6eb41e46a6', '0d9a2b2c-1ee7-49c8-8657-a457d66d60f5', 'ppk-jumlah-sila', 'multiple_choice'::public.question_type, 'Pancasila', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Pancasila terdiri atas…', 'Pancasila berarti lima dasar, sehingga terdiri atas lima sila.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/pancasila-dasar/ppk-jumlah-sila/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8081adc0-553f-40ab-88b4-036b47eb21bc', '52544703-1e61-42dc-85b5-ad6eb41e46a6', 'Lima sila', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-dasar/ppk-jumlah-sila/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('bcf525ab-255d-4e88-8585-da5533c91de4', '52544703-1e61-42dc-85b5-ad6eb41e46a6', 'Tiga sila', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-dasar/ppk-jumlah-sila/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1e718dfa-9f21-4d6c-8fe8-ad32c2d83a6e', '52544703-1e61-42dc-85b5-ad6eb41e46a6', 'Empat sila', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-dasar/ppk-jumlah-sila/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d0369298-6735-42e7-8de0-0bb9cd3e4002', '52544703-1e61-42dc-85b5-ad6eb41e46a6', 'Enam sila', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/pancasila-dasar/ppk-lambang-kedua
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('ee1a9eac-df31-49e8-85c6-e5f27d0f55bb', '0d9a2b2c-1ee7-49c8-8657-a457d66d60f5', 'ppk-lambang-kedua', 'multiple_choice'::public.question_type, 'Lambang', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Lambang sila kedua Pancasila adalah…', 'Rantai melambangkan kemanusiaan yang saling terhubung. Bintang melambangkan sila pertama.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/pancasila-dasar/ppk-lambang-kedua/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9c65d62d-5a0b-4c78-8f79-263c016f5dcb', 'ee1a9eac-df31-49e8-85c6-e5f27d0f55bb', 'Rantai', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-dasar/ppk-lambang-kedua/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('bd57dec9-ea8c-445a-8285-5ae98eb395a8', 'ee1a9eac-df31-49e8-85c6-e5f27d0f55bb', 'Bintang', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-dasar/ppk-lambang-kedua/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c8d77c1b-607e-41c9-8e9f-c3567253f513', 'ee1a9eac-df31-49e8-85c6-e5f27d0f55bb', 'Pohon beringin', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-dasar/ppk-lambang-kedua/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('277b8ee2-6366-414d-8539-dd81e450cea4', 'ee1a9eac-df31-49e8-85c6-e5f27d0f55bb', 'Kepala banteng', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/pancasila-dasar/ppk-bhinneka
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('5b8d8b6e-6c7b-4789-893c-819c70fa1b07', '0d9a2b2c-1ee7-49c8-8657-a457d66d60f5', 'ppk-bhinneka', 'fill_blank'::public.question_type, 'Semboyan', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Semboyan bangsa Indonesia adalah ___ Tunggal Ika.', 'Bhinneka Tunggal Ika berarti berbeda-beda tetapi tetap satu.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: pendidikan-pancasila/pancasila-dasar/ppk-bhinneka/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('985717d9-34d8-4d68-885f-2798f4f79520', '5b8d8b6e-6c7b-4789-893c-819c70fa1b07', 'Bhinneka', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: pendidikan-pancasila/pancasila-dasar/ppk-sila-persatuan
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('a19b9a8c-c801-4aa5-8bfd-d312535b9a10', '0d9a2b2c-1ee7-49c8-8657-a457d66d60f5', 'ppk-sila-persatuan', 'multiple_choice'::public.question_type, 'Pancasila', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Sila yang menekankan persatuan bangsa adalah sila…', 'Sila ketiga berbunyi Persatuan Indonesia dan dilambangkan pohon beringin.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/pancasila-dasar/ppk-sila-persatuan/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('63b4f485-7d40-41b9-81ae-36f201efb736', 'a19b9a8c-c801-4aa5-8bfd-d312535b9a10', 'Ketiga', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-dasar/ppk-sila-persatuan/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('604702a7-16ef-4ae0-8c66-0bf55cd3c840', 'a19b9a8c-c801-4aa5-8bfd-d312535b9a10', 'Pertama', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-dasar/ppk-sila-persatuan/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('66edfdc3-161b-4e25-8747-c1d2f5983ddc', 'a19b9a8c-c801-4aa5-8bfd-d312535b9a10', 'Kedua', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-dasar/ppk-sila-persatuan/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('80bd784f-9fe0-4a5b-8903-d48ded3f0da7', 'a19b9a8c-c801-4aa5-8bfd-d312535b9a10', 'Keempat', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: pendidikan-pancasila/pancasila-review
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('18851fbb-b35b-457a-8b87-132ce1bedad1', '0700d939-e5c2-4363-8c02-e3783ab7edf3', 'pancasila-review', 'Review Pancasila', 'Ulangi nilai sila, dasar hukum, dan kewarganegaraan.', 'review'::public.lesson_kind, 5, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: pendidikan-pancasila/pancasila-review
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('5f5449f7-fe7c-41da-83a1-3b290b02c100', '0700d939-e5c2-4363-8c02-e3783ab7edf3', 'lesson-pancasila-review', 'Review Pancasila', 'Ulangi nilai sila, dasar hukum, dan kewarganegaraan.', 'review'::public.node_kind, '18851fbb-b35b-457a-8b87-132ce1bedad1', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: pendidikan-pancasila/pancasila-review/review-pancasila-first
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('f9790f1d-7a53-4861-8a47-ff4cca37d865', '18851fbb-b35b-457a-8b87-132ce1bedad1', 'review-pancasila-first', 'multiple_choice'::public.question_type, 'Pancasila', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Sila pertama Pancasila berbunyi…', 'Sila pertama menegaskan Ketuhanan Yang Maha Esa sebagai dasar kehidupan beragama bangsa.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/pancasila-review/review-pancasila-first/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6dc94251-5e0d-48a6-84f5-c82bf1513ca5', 'f9790f1d-7a53-4861-8a47-ff4cca37d865', 'Ketuhanan Yang Maha Esa', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-review/review-pancasila-first/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('202d41a5-fc9b-41f3-873c-a548470b0029', 'f9790f1d-7a53-4861-8a47-ff4cca37d865', 'Kemanusiaan yang adil dan beradab', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-review/review-pancasila-first/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('4487a626-c1b7-409a-8eac-d828681fe6ba', 'f9790f1d-7a53-4861-8a47-ff4cca37d865', 'Persatuan Indonesia', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-review/review-pancasila-first/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ea1d3d85-2360-4db4-884e-75d9abc55adf', 'f9790f1d-7a53-4861-8a47-ff4cca37d865', 'Keadilan sosial bagi seluruh rakyat Indonesia', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/pancasila-review/review-pancasila-constitution
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('5b8a386e-cb19-4394-8c25-51e512c9ee64', '18851fbb-b35b-457a-8b87-132ce1bedad1', 'review-pancasila-constitution', 'multiple_choice'::public.question_type, 'Konstitusi', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Dasar hukum tertulis utama negara Indonesia adalah…', 'UUD 1945 adalah konstitusi tertulis. Pancasila adalah dasar negara dan sumber nilai.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/pancasila-review/review-pancasila-constitution/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1082d77e-0c31-4998-8054-4d7ea81e8600', '5b8a386e-cb19-4394-8c25-51e512c9ee64', 'UUD 1945', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-review/review-pancasila-constitution/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e836b9ce-6fcb-47da-8f6d-84eb6bf4b69f', '5b8a386e-cb19-4394-8c25-51e512c9ee64', 'Pancasila', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-review/review-pancasila-constitution/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b1e13d30-ad4e-4454-8f4b-568778067f5e', '5b8a386e-cb19-4394-8c25-51e512c9ee64', 'Keputusan Presiden', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-review/review-pancasila-constitution/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7e86cfa3-ea61-4236-81b3-83aed55b182b', '5b8a386e-cb19-4394-8c25-51e512c9ee64', 'Peraturan Daerah', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/pancasila-review/review-pancasila-fifth
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('d17418a7-c399-480b-80b9-90762ebc40a9', '18851fbb-b35b-457a-8b87-132ce1bedad1', 'review-pancasila-fifth', 'fill_blank'::public.question_type, 'Pancasila', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Sila ke-___ berbunyi "Keadilan sosial bagi seluruh rakyat Indonesia".', 'Sila kelima menekankan keadilan sosial bagi seluruh rakyat Indonesia.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: pendidikan-pancasila/pancasila-review/review-pancasila-fifth/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('fa58a489-1ecd-4797-80e6-f4a0a7d29b6f', 'd17418a7-c399-480b-80b9-90762ebc40a9', '5', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- question_answers: pendidikan-pancasila/pancasila-review/review-pancasila-fifth/1
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('c3c0fa7d-fcd5-4b16-8a18-dcec1c0e5f9f', 'd17418a7-c399-480b-80b9-90762ebc40a9', 'lima', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- lessons: pendidikan-pancasila/pancasila-challenge
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('c83e4b4f-38dc-42a1-847d-1b71c9c614b1', '0700d939-e5c2-4363-8c02-e3783ab7edf3', 'pancasila-challenge', 'Tantangan Pancasila', 'Latihan demokrasi, hak, kewajiban, dan gotong royong.', 'challenge'::public.lesson_kind, 6, 10, 2, 2, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: pendidikan-pancasila/pancasila-challenge
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('49b5956b-6531-40e5-8563-b848f6597cef', '0700d939-e5c2-4363-8c02-e3783ab7edf3', 'lesson-pancasila-challenge', 'Tantangan Pancasila', 'Latihan demokrasi, hak, kewajiban, dan gotong royong.', 'challenge'::public.node_kind, 'c83e4b4f-38dc-42a1-847d-1b71c9c614b1', 20, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: pendidikan-pancasila/pancasila-challenge/challenge-pancasila-democracy
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('f0f3e66b-7b38-4927-87cb-612f3c2b0d10', 'c83e4b4f-38dc-42a1-847d-1b71c9c614b1', 'challenge-pancasila-democracy', 'multiple_choice'::public.question_type, 'Demokrasi', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Prinsip utama demokrasi adalah…', 'Demokrasi menempatkan kedaulatan rakyat sebagai dasar, diwujudkan melalui pemilu dan partisipasi publik.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/pancasila-challenge/challenge-pancasila-democracy/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0e9b4304-7d96-4b33-81c7-c065b8022df9', 'f0f3e66b-7b38-4927-87cb-612f3c2b0d10', 'Kedaulatan berada di tangan rakyat', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-challenge/challenge-pancasila-democracy/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7834dd1c-daab-4839-8c75-bac8942d0374', 'f0f3e66b-7b38-4927-87cb-612f3c2b0d10', 'Kekuasaan dipegang satu orang', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-challenge/challenge-pancasila-democracy/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('35936585-d7f5-40cb-8c68-7561aedd3791', 'f0f3e66b-7b38-4927-87cb-612f3c2b0d10', 'Rakyat tidak perlu memilih pemimpin', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-challenge/challenge-pancasila-democracy/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3ca84f35-c3ef-4363-84fe-0bc9addce552', 'f0f3e66b-7b38-4927-87cb-612f3c2b0d10', 'Hukum hanya berlaku bagi pejabat', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/pancasila-challenge/challenge-pancasila-obligation
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('ce396e62-951c-40d9-8a53-f5a6fb7c4d7f', 'c83e4b4f-38dc-42a1-847d-1b71c9c614b1', 'challenge-pancasila-obligation', 'multiple_choice'::public.question_type, 'Hak dan Kewajiban', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Contoh kewajiban warga negara adalah…', 'Membayar pajak adalah kewajiban. Pelayanan kesehatan dan pendidikan lebih tepat disebut hak.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/pancasila-challenge/challenge-pancasila-obligation/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d8ef684b-4517-45b6-86c8-830e71824021', 'ce396e62-951c-40d9-8a53-f5a6fb7c4d7f', 'Membayar pajak', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-challenge/challenge-pancasila-obligation/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d33c6169-de39-4f23-8997-648c8e24ca38', 'ce396e62-951c-40d9-8a53-f5a6fb7c4d7f', 'Mendapat pelayanan kesehatan', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-challenge/challenge-pancasila-obligation/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c774548f-f03d-4e1e-8eef-477daebe555e', 'ce396e62-951c-40d9-8a53-f5a6fb7c4d7f', 'Memilih sekolah', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/pancasila-challenge/challenge-pancasila-obligation/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('783cf042-88b4-4c55-8aac-d12a4e566659', 'ce396e62-951c-40d9-8a53-f5a6fb7c4d7f', 'Menerima upah', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/pancasila-challenge/challenge-pancasila-gotong-royong
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('ce56183f-4feb-4c61-82ce-30268974021c', 'c83e4b4f-38dc-42a1-847d-1b71c9c614b1', 'challenge-pancasila-gotong-royong', 'fill_blank'::public.question_type, 'Keberagaman', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Bekerja sama tanpa pamrih untuk kepentingan bersama disebut ___', 'Gotong royong mencerminkan kerja sama sukarela dan kebersamaan dalam masyarakat.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: pendidikan-pancasila/pancasila-challenge/challenge-pancasila-gotong-royong/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('6c2ecb0a-bb2d-4104-8404-9c8d3f9a5c7a', 'ce56183f-4feb-4c61-82ce-30268974021c', 'gotong royong', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- course_levels: pendidikan-pancasila/elementary
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('a5293c00-418c-42e7-86fe-44e480f7db1a', 'e3a2067d-cbe7-4be5-8743-e5ad75b7eff6', 'elementary', 'Level 2 · Norma, Hak, dan Kewajiban', 'Menerapkan norma serta menyeimbangkan hak dan kewajiban di sekolah dan rumah.', 'elementary'::public.difficulty_band, 1, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: pendidikan-pancasila/norma-hak-kewajiban
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('60cee85a-e5f5-4df0-89d4-9fa0306850f0', 'a5293c00-418c-42e7-86fe-44e480f7db1a', 'norma-hak-kewajiban', 'Norma dan Tanggung Jawab', 'Hidup bersama membutuhkan aturan yang disepakati dan dijalankan.', array['Membedakan jenis norma', 'Menyebutkan hak dan kewajiban siswa', 'Menerapkan musyawarah dan toleransi']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: pendidikan-pancasila/norma-hak-kewajiban
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('0333966d-2c0e-471e-8972-4f45103d20ed', '60cee85a-e5f5-4df0-89d4-9fa0306850f0', 'norma-hak-kewajiban', 'Norma, Hak, dan Kewajiban', 'Aturan dan tanggung jawab dalam kehidupan bersama.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: pendidikan-pancasila/norma-hak-kewajiban
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('f81db75c-2648-4dd7-84e3-a92f511f2a0d', '60cee85a-e5f5-4df0-89d4-9fa0306850f0', 'lesson-norma-hak-kewajiban', 'Norma, Hak, dan Kewajiban', 'Aturan dan tanggung jawab dalam kehidupan bersama.', 'lesson'::public.node_kind, '0333966d-2c0e-471e-8972-4f45103d20ed', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: pendidikan-pancasila/norma-hak-kewajiban/ppk-norma-agama
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('dd99b61b-a3d9-4f4d-88f4-bba15f4c8f3f', '0333966d-2c0e-471e-8972-4f45103d20ed', 'ppk-norma-agama', 'multiple_choice'::public.question_type, 'Norma', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Norma yang bersumber dari ajaran agama disebut norma…', 'Norma agama berasal dari ajaran agama. Norma hukum bersumber dari peraturan negara.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/norma-hak-kewajiban/ppk-norma-agama/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c0d9952d-ee6c-4f4b-8b2d-a21a8d6d6cf2', 'dd99b61b-a3d9-4f4d-88f4-bba15f4c8f3f', 'Agama', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/norma-hak-kewajiban/ppk-norma-agama/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0127c635-6073-45b9-805a-f1f943ad4cce', 'dd99b61b-a3d9-4f4d-88f4-bba15f4c8f3f', 'Hukum', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/norma-hak-kewajiban/ppk-norma-agama/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a1ecef9e-7b11-4ade-8eb0-3fcec16e7dc8', 'dd99b61b-a3d9-4f4d-88f4-bba15f4c8f3f', 'Kesopanan', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/norma-hak-kewajiban/ppk-norma-agama/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f80735d8-909c-4acd-8011-7f3c51befee3', 'dd99b61b-a3d9-4f4d-88f4-bba15f4c8f3f', 'Kebiasaan', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/norma-hak-kewajiban/ppk-hak-siswa
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('6a23597d-1035-4295-8ddf-0bcede4dc0de', '0333966d-2c0e-471e-8972-4f45103d20ed', 'ppk-hak-siswa', 'multiple_choice'::public.question_type, 'Hak', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Hak seorang siswa di sekolah adalah…', 'Setiap siswa berhak memperoleh pendidikan. Membolos dan merusak fasilitas justru melanggar kewajiban.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/norma-hak-kewajiban/ppk-hak-siswa/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3ab2120d-a01e-4711-8eb8-ff2c4e591b9a', '6a23597d-1035-4295-8ddf-0bcede4dc0de', 'Mendapat pendidikan dan bimbingan', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/norma-hak-kewajiban/ppk-hak-siswa/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0c89a390-2ca7-4821-877f-f70f6c05d47b', '6a23597d-1035-4295-8ddf-0bcede4dc0de', 'Membolos tanpa alasan', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/norma-hak-kewajiban/ppk-hak-siswa/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('10c97b8e-5fd3-4e08-8484-f10f3364a288', '6a23597d-1035-4295-8ddf-0bcede4dc0de', 'Merusak fasilitas sekolah', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/norma-hak-kewajiban/ppk-hak-siswa/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('53ef28a9-76fa-437c-803a-464910fffea3', '6a23597d-1035-4295-8ddf-0bcede4dc0de', 'Mengabaikan tugas', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/norma-hak-kewajiban/ppk-kewajiban
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('235a2bb7-1dfe-40cc-8f6c-73f056d1a86e', '0333966d-2c0e-471e-8972-4f45103d20ed', 'ppk-kewajiban', 'multiple_choice'::public.question_type, 'Kewajiban', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Contoh kewajiban siswa di kelas adalah…', 'Kewajiban adalah hal yang harus dilakukan, misalnya menaati tata tertib dan menyelesaikan tugas.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/norma-hak-kewajiban/ppk-kewajiban/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('beceb165-c1c2-4806-8489-5648ba50e89c', '235a2bb7-1dfe-40cc-8f6c-73f056d1a86e', 'Menaati tata tertib dan mengerjakan tugas', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/norma-hak-kewajiban/ppk-kewajiban/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a7662982-6b66-4a9e-857e-0d8afcbfb298', '235a2bb7-1dfe-40cc-8f6c-73f056d1a86e', 'Meminta nilai tanpa belajar', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/norma-hak-kewajiban/ppk-kewajiban/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8d7dd183-087a-4dc2-873e-6c5d703da995', '235a2bb7-1dfe-40cc-8f6c-73f056d1a86e', 'Mengatur semua keputusan guru', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/norma-hak-kewajiban/ppk-kewajiban/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('51a34d9a-b174-4027-864d-a3db2a21c41c', '235a2bb7-1dfe-40cc-8f6c-73f056d1a86e', 'Datang hanya saat ingin', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/norma-hak-kewajiban/ppk-mufakat
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('bba3abdf-794f-408c-80c2-9084f29bebc9', '0333966d-2c0e-471e-8972-4f45103d20ed', 'ppk-mufakat', 'fill_blank'::public.question_type, 'Musyawarah', 'elementary'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Musyawarah dilakukan untuk mencapai ___.', 'Musyawarah bertujuan mencapai mufakat, yaitu kesepakatan bersama tanpa memaksakan kehendak.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: pendidikan-pancasila/norma-hak-kewajiban/ppk-mufakat/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('550ace04-69bc-42d1-806c-79666bbbccee', 'bba3abdf-794f-408c-80c2-9084f29bebc9', 'mufakat', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: pendidikan-pancasila/norma-hak-kewajiban/ppk-toleransi
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('591d19f3-4750-499d-87bb-b78e1fa8d04a', '0333966d-2c0e-471e-8972-4f45103d20ed', 'ppk-toleransi', 'multiple_choice'::public.question_type, 'Toleransi', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Sikap toleransi yang tepat adalah…', 'Toleransi berarti menghargai perbedaan tanpa memaksakan pandangan sendiri.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/norma-hak-kewajiban/ppk-toleransi/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('71817ad5-906f-4bfd-8b1f-7444219e6e8a', '591d19f3-4750-499d-87bb-b78e1fa8d04a', 'Menghargai teman yang berbeda agama dan suku', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/norma-hak-kewajiban/ppk-toleransi/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f8b97262-8a8f-42a3-8832-7ddceab92404', '591d19f3-4750-499d-87bb-b78e1fa8d04a', 'Memaksa teman mengikuti kebiasaan kita', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/norma-hak-kewajiban/ppk-toleransi/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('45ebf065-484a-41cc-80ba-fed60b017ec0', '591d19f3-4750-499d-87bb-b78e1fa8d04a', 'Menolak bekerja sama dengan siapa pun', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/norma-hak-kewajiban/ppk-toleransi/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('66027206-d759-4670-87f6-bd57a95af57b', '591d19f3-4750-499d-87bb-b78e1fa8d04a', 'Menertawakan cara ibadah orang lain', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: pendidikan-pancasila/latihan-norma-dan-hak
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('1bb824f9-ab51-4272-8953-062f34518556', '60cee85a-e5f5-4df0-89d4-9fa0306850f0', 'latihan-norma-dan-hak', 'Latihan Norma & Hak', 'Latihan membedakan jenis norma dan contoh hak warga negara.', 'practice'::public.lesson_kind, 6, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: pendidikan-pancasila/latihan-norma-dan-hak
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('10290b5c-471e-49bf-87ad-b0605a5d0c3e', '60cee85a-e5f5-4df0-89d4-9fa0306850f0', 'lesson-latihan-norma-dan-hak', 'Latihan Norma & Hak', 'Latihan membedakan jenis norma dan contoh hak warga negara.', 'practice'::public.node_kind, '1bb824f9-ab51-4272-8953-062f34518556', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: pendidikan-pancasila/latihan-norma-dan-hak/practice-ppk-kesusilaan
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('e7706bc6-9e3f-496a-8fc0-6ef38b3d13fb', '1bb824f9-ab51-4272-8953-062f34518556', 'practice-ppk-kesusilaan', 'multiple_choice'::public.question_type, 'Norma', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Norma yang bersumber dari hati nurani manusia adalah norma…', 'Norma kesusilaan tumbuh dari hati nurani. Norma hukum bersumber dari negara, norma agama dari ajaran agama.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/latihan-norma-dan-hak/practice-ppk-kesusilaan/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3f3b1f96-a7de-4289-8aa2-e6fbaa5312b2', 'e7706bc6-9e3f-496a-8fc0-6ef38b3d13fb', 'kesusilaan', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/latihan-norma-dan-hak/practice-ppk-kesusilaan/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2dd29884-ff6f-4351-8843-1d920151af95', 'e7706bc6-9e3f-496a-8fc0-6ef38b3d13fb', 'hukum', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/latihan-norma-dan-hak/practice-ppk-kesusilaan/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6c1b42e6-bfa0-40f1-8d2b-c120f520d83c', 'e7706bc6-9e3f-496a-8fc0-6ef38b3d13fb', 'agama', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/latihan-norma-dan-hak/practice-ppk-kesusilaan/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('99a97ff4-a983-460f-882a-729d53b0224b', 'e7706bc6-9e3f-496a-8fc0-6ef38b3d13fb', 'kesopanan', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/latihan-norma-dan-hak/practice-ppk-hak
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('8c376c64-250d-4c70-8dfd-1c24b06bd256', '1bb824f9-ab51-4272-8953-062f34518556', 'practice-ppk-hak', 'multiple_choice'::public.question_type, 'Hak', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Contoh hak warga negara adalah…', 'Pendidikan adalah hak. Membayar pajak, menaati hukum, dan menjaga ketertiban adalah kewajiban.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/latihan-norma-dan-hak/practice-ppk-hak/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6d92cf51-015e-45f0-8d7c-21060a7ac2f9', '8c376c64-250d-4c70-8dfd-1c24b06bd256', 'Memperoleh pendidikan', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/latihan-norma-dan-hak/practice-ppk-hak/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6daff3ae-1bd5-4656-8900-b60b34b616a8', '8c376c64-250d-4c70-8dfd-1c24b06bd256', 'Membayar pajak', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/latihan-norma-dan-hak/practice-ppk-hak/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a015ebaf-c79e-486d-8080-564488b1722d', '8c376c64-250d-4c70-8dfd-1c24b06bd256', 'Menaati hukum', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/latihan-norma-dan-hak/practice-ppk-hak/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e546f649-cb92-4a7e-843f-b5a3bbb35b40', '8c376c64-250d-4c70-8dfd-1c24b06bd256', 'Menjaga ketertiban', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/latihan-norma-dan-hak/practice-ppk-hukum
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('f67a3fbb-e59c-48d3-8e1a-a1bf902e641f', '1bb824f9-ab51-4272-8953-062f34518556', 'practice-ppk-hukum', 'fill_blank'::public.question_type, 'Norma', 'elementary'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Norma yang memiliki sanksi tegas dan tertulis dari negara adalah norma __.', 'Norma hukum bersifat mengikat dan sanksinya ditegakkan oleh negara.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: pendidikan-pancasila/latihan-norma-dan-hak/practice-ppk-hukum/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('dae29878-4ec8-4343-8fa9-509ab3bdef5a', 'f67a3fbb-e59c-48d3-8e1a-a1bf902e641f', 'hukum', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- lessons: pendidikan-pancasila/checkpoint-pancasila
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('ca4242a8-a188-439f-8039-95a95ecd172e', '60cee85a-e5f5-4df0-89d4-9fa0306850f0', 'checkpoint-pancasila', 'Checkpoint Pancasila', 'Periksa pemahaman dasar negara dan lambang sila.', 'review'::public.lesson_kind, 8, 10, 2, 2, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: pendidikan-pancasila/checkpoint-pancasila
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('331437df-e838-491c-878c-a17e1a27ca99', '60cee85a-e5f5-4df0-89d4-9fa0306850f0', 'lesson-checkpoint-pancasila', 'Checkpoint Pancasila', 'Periksa pemahaman dasar negara dan lambang sila.', 'checkpoint'::public.node_kind, 'ca4242a8-a188-439f-8039-95a95ecd172e', 20, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: pendidikan-pancasila/checkpoint-pancasila/checkpoint-ppk-dasar
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('8f915a64-0483-4e60-8a34-13553e7fe4f0', 'ca4242a8-a188-439f-8039-95a95ecd172e', 'checkpoint-ppk-dasar', 'multiple_choice'::public.question_type, 'Pancasila', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Kedudukan Pancasila bagi Indonesia adalah…', 'Pancasila adalah dasar negara sekaligus pandangan hidup bangsa Indonesia.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/checkpoint-pancasila/checkpoint-ppk-dasar/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8abd7bb5-92ff-406a-81a7-81d19fead8d4', '8f915a64-0483-4e60-8a34-13553e7fe4f0', 'dasar negara dan pandangan hidup', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/checkpoint-pancasila/checkpoint-ppk-dasar/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8df100f0-a9c0-4169-83ec-9bf3432533b0', '8f915a64-0483-4e60-8a34-13553e7fe4f0', 'lagu kebangsaan', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/checkpoint-pancasila/checkpoint-ppk-dasar/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('819e2f3e-586d-4352-82fd-a4a540c9ef11', '8f915a64-0483-4e60-8a34-13553e7fe4f0', 'nama lembaga negara', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/checkpoint-pancasila/checkpoint-ppk-dasar/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a39d97c4-ae8a-4761-830f-9167fd6a8463', '8f915a64-0483-4e60-8a34-13553e7fe4f0', 'bahasa resmi', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/checkpoint-pancasila/checkpoint-ppk-sila3
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('12239395-ad3a-4015-8334-8591b2b6b560', 'ca4242a8-a188-439f-8039-95a95ecd172e', 'checkpoint-ppk-sila3', 'multiple_choice'::public.question_type, 'Pancasila', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Lambang sila ketiga Pancasila adalah…', 'Sila ketiga "Persatuan Indonesia" dilambangkan pohon beringin. Padi dan kapas melambangkan sila kelima.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/checkpoint-pancasila/checkpoint-ppk-sila3/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7f3d98e5-116f-4e15-811f-b46506a882de', '12239395-ad3a-4015-8334-8591b2b6b560', 'pohon beringin', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/checkpoint-pancasila/checkpoint-ppk-sila3/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6643c2e4-c219-4921-835a-f2f796823454', '12239395-ad3a-4015-8334-8591b2b6b560', 'padi dan kapas', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/checkpoint-pancasila/checkpoint-ppk-sila3/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('994b08dc-165d-401d-8d7f-9b16ac706c7c', '12239395-ad3a-4015-8334-8591b2b6b560', 'kepala banteng', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/checkpoint-pancasila/checkpoint-ppk-sila3/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('499fa054-624b-42d7-8e01-4cbdb4408b54', '12239395-ad3a-4015-8334-8591b2b6b560', 'rantai', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/checkpoint-pancasila/checkpoint-ppk-sila2
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('ce483f60-5045-4ed9-86b3-3e31cc4fe615', 'ca4242a8-a188-439f-8039-95a95ecd172e', 'checkpoint-ppk-sila2', 'typing'::public.question_type, 'Pancasila', 'elementary'::public.difficulty_band, 'Tulis jawaban pada kolom yang tersedia.', 'Tulis bunyi sila kedua Pancasila.', 'Sila kedua berbunyi "Kemanusiaan yang adil dan beradab" dan dilambangkan rantai.', null, 15, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: pendidikan-pancasila/checkpoint-pancasila/checkpoint-ppk-sila2/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('cafdfc3f-c43d-4978-8fe0-fa295d1af748', 'ce483f60-5045-4ed9-86b3-3e31cc4fe615', 'Kemanusiaan yang adil dan beradab', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- course_levels: pendidikan-pancasila/intermediate
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('65b598e6-9d90-4bd2-84a2-831549dee090', 'e3a2067d-cbe7-4be5-8743-e5ad75b7eff6', 'intermediate', 'Level 3 · Warga Negara', 'Memahami demokrasi, konstitusi, dan peran warga negara.', 'intermediate'::public.difficulty_band, 2, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: pendidikan-pancasila/warga-negara
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('8e829868-edb7-4752-85be-0840a352fecf', '65b598e6-9d90-4bd2-84a2-831549dee090', 'warga-negara', 'Menjadi Warga Negara', 'Negara demokratis membutuhkan warga yang paham hak politik dan tanggung jawabnya.', array['Menjelaskan makna demokrasi', 'Mengenali peran UUD 1945', 'Menerapkan gotong royong']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: pendidikan-pancasila/warga-negara
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('78dea9ed-6cfa-4d21-891f-3a104ad12f6e', '8e829868-edb7-4752-85be-0840a352fecf', 'warga-negara', 'Warga Negara', 'Demokrasi, konstitusi, dan partisipasi.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: pendidikan-pancasila/warga-negara
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('5e05ad81-dcf4-4688-8085-a54caaf27b9a', '8e829868-edb7-4752-85be-0840a352fecf', 'lesson-warga-negara', 'Warga Negara', 'Demokrasi, konstitusi, dan partisipasi.', 'lesson'::public.node_kind, '78dea9ed-6cfa-4d21-891f-3a104ad12f6e', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: pendidikan-pancasila/warga-negara/ppk-demokrasi
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('ac641467-93b6-484a-8c1f-a427f50191df', '78dea9ed-6cfa-4d21-891f-3a104ad12f6e', 'ppk-demokrasi', 'multiple_choice'::public.question_type, 'Demokrasi', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Salah satu ciri utama negara demokrasi adalah…', 'Demokrasi menghargai kedaulatan rakyat, termasuk melalui pemilu yang bebas, umum, dan rahasia.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/warga-negara/ppk-demokrasi/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('797ebdb3-105d-4285-89cd-182de9c4bcdb', 'ac641467-93b6-484a-8c1f-a427f50191df', 'Pemilihan umum yang bebas dan rahasia', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/warga-negara/ppk-demokrasi/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d73f662f-d08b-47ff-8408-7de69a54f7b5', 'ac641467-93b6-484a-8c1f-a427f50191df', 'Kekuasaan dipegang satu orang selamanya', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/warga-negara/ppk-demokrasi/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('699daf67-0b4c-4c74-8acf-905a1ab5e0fe', 'ac641467-93b6-484a-8c1f-a427f50191df', 'Warga dilarang menyampaikan pendapat', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/warga-negara/ppk-demokrasi/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6f3c00a3-7606-4c12-8602-88469afb87a6', 'ac641467-93b6-484a-8c1f-a427f50191df', 'Hukum hanya berlaku bagi sebagian orang', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/warga-negara/ppk-uud-1945
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('fd13070d-3085-41ee-8ea1-ae99497cb322', '78dea9ed-6cfa-4d21-891f-3a104ad12f6e', 'ppk-uud-1945', 'multiple_choice'::public.question_type, 'Konstitusi', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Undang-Undang Dasar Negara Republik Indonesia Tahun 1945 berkedudukan sebagai…', 'UUD 1945 adalah hukum dasar tertinggi yang menjadi acuan seluruh peraturan di Indonesia.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/warga-negara/ppk-uud-1945/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('4119f15e-ee02-48ba-8cf9-1ed17378ceb5', 'fd13070d-3085-41ee-8ea1-ae99497cb322', 'Hukum dasar tertinggi', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/warga-negara/ppk-uud-1945/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2ba672f9-d5f9-4f19-8cdd-c66b43e8660d', 'fd13070d-3085-41ee-8ea1-ae99497cb322', 'Peraturan daerah', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/warga-negara/ppk-uud-1945/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a585b230-892b-4476-8e81-ccba1c1f7e0e', 'fd13070d-3085-41ee-8ea1-ae99497cb322', 'Keputusan sekolah', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/warga-negara/ppk-uud-1945/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('eba08c09-cbf6-4355-887e-68a8a68a9a07', 'fd13070d-3085-41ee-8ea1-ae99497cb322', 'Pedoman perusahaan', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/warga-negara/ppk-nkri
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('cca6c4fa-e1a6-4e19-8ed3-248c68b63691', '78dea9ed-6cfa-4d21-891f-3a104ad12f6e', 'ppk-nkri', 'multiple_choice'::public.question_type, 'Negara', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'NKRI singkatan dari…', 'NKRI adalah Negara Kesatuan Republik Indonesia, bentuk negara yang bersatu dan berdaulat.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/warga-negara/ppk-nkri/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('fe3ec855-5ff1-4cf9-82b7-4018c8a14eaa', 'cca6c4fa-e1a6-4e19-8ed3-248c68b63691', 'Negara Kesatuan Republik Indonesia', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/warga-negara/ppk-nkri/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ef2307f2-5459-40e6-82c0-bb57ffaca8a7', 'cca6c4fa-e1a6-4e19-8ed3-248c68b63691', 'Negara Kekuasaan Republik Indonesia', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/warga-negara/ppk-nkri/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d5688d23-aab0-454d-84b7-4f99fb2e722c', 'cca6c4fa-e1a6-4e19-8ed3-248c68b63691', 'Negara Kebangsaan Rakyat Indonesia', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/warga-negara/ppk-nkri/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('904f73d1-99d7-453c-86b8-b04f5a9d1da9', 'cca6c4fa-e1a6-4e19-8ed3-248c68b63691', 'Negara Kesatuan Rakyat Indonesia', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/warga-negara/ppk-gotong-royong
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('11974388-c95f-477a-82f6-ed88b651900a', '78dea9ed-6cfa-4d21-891f-3a104ad12f6e', 'ppk-gotong-royong', 'fill_blank'::public.question_type, 'Gotong Royong', 'intermediate'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Bekerja bersama untuk kepentingan bersama disebut gotong ___.', 'Gotong royong mencerminkan solidaritas dan kebersamaan warga.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: pendidikan-pancasila/warga-negara/ppk-gotong-royong/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('1ec3985c-a907-4953-8528-2f33948cc0f1', '11974388-c95f-477a-82f6-ed88b651900a', 'royong', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: pendidikan-pancasila/warga-negara/ppk-partisipasi
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('9a012f1b-a91a-4046-84fc-e5f6a12d30b9', '78dea9ed-6cfa-4d21-891f-3a104ad12f6e', 'ppk-partisipasi', 'multiple_choice'::public.question_type, 'Partisipasi', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Bentuk partisipasi warga negara yang baik adalah…', 'Partisipasi positif dapat dilakukan lewat kegiatan sosial, menjaga lingkungan, dan mematuhi aturan.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/warga-negara/ppk-partisipasi/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('12ab6f3f-d6c1-4a3e-8a2a-d1049bce4fe1', '9a012f1b-a91a-4046-84fc-e5f6a12d30b9', 'Mengikuti kegiatan sosial dan menjaga lingkungan', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/warga-negara/ppk-partisipasi/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('864601a7-56ff-426d-877d-0066d4860242', '9a012f1b-a91a-4046-84fc-e5f6a12d30b9', 'Menyebarkan berita palsu', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/warga-negara/ppk-partisipasi/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e23b8860-804f-4880-8813-6181aa62c7bf', '9a012f1b-a91a-4046-84fc-e5f6a12d30b9', 'Membuang sampah ke sungai', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/warga-negara/ppk-partisipasi/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e1cc3f7b-771c-4d52-817d-55316dde4a99', '9a012f1b-a91a-4046-84fc-e5f6a12d30b9', 'Menghindari semua kewajiban', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: pendidikan-pancasila/legendary-warga-negara
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('c0342b70-fc03-40e2-8357-a8f3ea8f9c1b', '8e829868-edb7-4752-85be-0840a352fecf', 'legendary-warga-negara', 'Legendary Warga Negara', 'Tantangan lanjutan tentang demokrasi, kewajiban, dan konstitusi.', 'legendary'::public.lesson_kind, 9, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: pendidikan-pancasila/legendary-warga-negara
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('0783fa4f-4a74-46a1-82c7-731eb5bf8ab7', '8e829868-edb7-4752-85be-0840a352fecf', 'lesson-legendary-warga-negara', 'Legendary Warga Negara', 'Tantangan lanjutan tentang demokrasi, kewajiban, dan konstitusi.', 'legendary'::public.node_kind, 'c0342b70-fc03-40e2-8357-a8f3ea8f9c1b', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: pendidikan-pancasila/legendary-warga-negara/legendary-ppk-demokrasi
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('415f8aa9-b844-412f-822f-13796c35f814', 'c0342b70-fc03-40e2-8357-a8f3ea8f9c1b', 'legendary-ppk-demokrasi', 'multiple_choice'::public.question_type, 'Demokrasi', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Pengambilan keputusan dalam demokrasi Pancasila mengutamakan…', 'Demokrasi Pancasila menempatkan musyawarah untuk mufakat sebagai jalan utama; pemungutan suara menjadi alternatif terakhir.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/legendary-warga-negara/legendary-ppk-demokrasi/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ff4c3e7e-9a12-4710-8c7f-e340f17883e1', '415f8aa9-b844-412f-822f-13796c35f814', 'Musyawarah untuk mencapai mufakat', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/legendary-warga-negara/legendary-ppk-demokrasi/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('317e2589-9c9f-424b-8d21-fd62fb8a647b', '415f8aa9-b844-412f-822f-13796c35f814', 'Keputusan satu orang', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/legendary-warga-negara/legendary-ppk-demokrasi/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7f193525-f3ab-4124-8f88-e8282d8c8cc1', '415f8aa9-b844-412f-822f-13796c35f814', 'Kekuatan mayoritas tanpa diskusi', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/legendary-warga-negara/legendary-ppk-demokrasi/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('83fc585b-2393-4a12-864b-d6281ea506d6', '415f8aa9-b844-412f-822f-13796c35f814', 'Keputusan pihak asing', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/legendary-warga-negara/legendary-ppk-kewajiban
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('e9ef8dc5-b2d3-496e-8938-2ca4549efeda', 'c0342b70-fc03-40e2-8357-a8f3ea8f9c1b', 'legendary-ppk-kewajiban', 'multiple_choice'::public.question_type, 'Kewajiban', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Berikut yang termasuk kewajiban warga negara adalah…', 'Menaati hukum dan membayar pajak adalah kewajiban konstitusional warga negara.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: pendidikan-pancasila/legendary-warga-negara/legendary-ppk-kewajiban/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('42e7d1af-aa19-4e0f-8864-cde20b2bd3e2', 'e9ef8dc5-b2d3-496e-8938-2ca4549efeda', 'Menaati hukum dan membayar pajak', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/legendary-warga-negara/legendary-ppk-kewajiban/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('73a6cec7-cfae-471a-8825-b371898cd9ba', 'e9ef8dc5-b2d3-496e-8938-2ca4549efeda', 'Memilih pemimpin favorit saja', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/legendary-warga-negara/legendary-ppk-kewajiban/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8ed9b51b-1b39-4df0-87f7-f8c788c466b0', 'e9ef8dc5-b2d3-496e-8938-2ca4549efeda', 'Menolak semua aturan', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: pendidikan-pancasila/legendary-warga-negara/legendary-ppk-kewajiban/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('37491472-2820-457f-8773-4c3c07ca885a', 'e9ef8dc5-b2d3-496e-8938-2ca4549efeda', 'Menuntut hak tanpa kewajiban', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: pendidikan-pancasila/legendary-warga-negara/legendary-ppk-mk
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('f7f458cc-bb6f-498d-8cff-6e6e2a79c050', 'c0342b70-fc03-40e2-8357-a8f3ea8f9c1b', 'legendary-ppk-mk', 'fill_blank'::public.question_type, 'Konstitusi', 'intermediate'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Lembaga yang berwenang menguji undang-undang terhadap UUD 1945 adalah Mahkamah __.', 'Mahkamah Konstitusi menguji undang-undang terhadap UUD 1945, sedangkan Mahkamah Agung menguji peraturan di bawah undang-undang.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: pendidikan-pancasila/legendary-warga-negara/legendary-ppk-mk/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('11776eea-d424-42c8-88ab-138ee692fb54', 'f7f458cc-bb6f-498d-8cff-6e6e2a79c050', 'Konstitusi', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- subjects: matematika
insert into public.subjects (id, slug, name, short_name, description, category, icon_key, accent_color, status, is_primary, sort_order)
values ('340be96d-6d62-43c1-83f5-fbd41b206e9e', 'matematika', 'Matematika', 'Matematika', 'Berlatih operasi bilangan, pecahan, persen, dan aljabar dasar dengan soal yang bertahap.', 'sains', 'calculator', '#5D8DFF', 'active'::public.subject_status, true, 7)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  accent_color = excluded.accent_color,
  status = excluded.status,
  is_primary = excluded.is_primary,
  sort_order = excluded.sort_order;

-- courses: matematika
insert into public.courses (id, subject_id, slug, title, description, category, icon_key, sort_order, is_published)
values ('a5a6d16c-ada2-42ce-8c4b-da187abf160a', '340be96d-6d62-43c1-83f5-fbd41b206e9e', 'matematika', 'Matematika', 'Berlatih operasi bilangan, pecahan, persen, dan aljabar dasar dengan soal yang bertahap.', 'sains', 'calculator', 7, true)
on conflict (id) do update set
  subject_id = excluded.subject_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- course_levels: matematika/beginner
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('30016f06-0d87-48ef-8768-959646638266', 'a5a6d16c-ada2-42ce-8c4b-da187abf160a', 'beginner', 'Level 1 · Bilangan dan Operasi', 'Operasi hitung dasar dan nilai tempat bilangan.', 'beginner'::public.difficulty_band, 0, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: matematika/operasi-bilangan
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('58f6ab6f-e776-4c21-8976-e9a230e4720a', '30016f06-0d87-48ef-8768-959646638266', 'operasi-bilangan', 'Operasi Bilangan', 'Penjumlahan, pengurangan, perkalian, dan pembagian adalah fondasi matematika.', array['Menghitung operasi dasar dengan tepat', 'Mengenali nilai tempat bilangan', 'Membandingkan bilangan']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: matematika/operasi-bilangan
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('226e2b73-f60f-4b4f-8e92-f3b2f2fb6f9b', '58f6ab6f-e776-4c21-8976-e9a230e4720a', 'operasi-bilangan', 'Bilangan dan Operasi', 'Hitung dengan teliti dan pahami nilai tempat.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: matematika/operasi-bilangan
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('4c17c870-9889-460e-8d74-f26641ce2472', '58f6ab6f-e776-4c21-8976-e9a230e4720a', 'lesson-operasi-bilangan', 'Bilangan dan Operasi', 'Hitung dengan teliti dan pahami nilai tempat.', 'lesson'::public.node_kind, '226e2b73-f60f-4b4f-8e92-f3b2f2fb6f9b', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: matematika/operasi-bilangan/mtk-penjumlahan
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('9901846a-bc86-4251-879e-ecb035ac61be', '226e2b73-f60f-4b4f-8e92-f3b2f2fb6f9b', 'mtk-penjumlahan', 'multiple_choice'::public.question_type, 'Aritmetika', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Hasil dari 7 + 5 adalah…', '7 + 5 = 12.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/operasi-bilangan/mtk-penjumlahan/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('bae7a184-0a6f-4481-8b67-dddc81d59f4e', '9901846a-bc86-4251-879e-ecb035ac61be', '12', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/operasi-bilangan/mtk-penjumlahan/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e2a76107-80a6-499a-8323-8bc5dc12da6f', '9901846a-bc86-4251-879e-ecb035ac61be', '11', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/operasi-bilangan/mtk-penjumlahan/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('646367ff-6cc5-4d20-8456-0cb14e943240', '9901846a-bc86-4251-879e-ecb035ac61be', '13', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/operasi-bilangan/mtk-penjumlahan/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2b4a3ea9-c4f2-4fb6-8420-0f8081b3c20e', '9901846a-bc86-4251-879e-ecb035ac61be', '10', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/operasi-bilangan/mtk-perkalian
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('dfe9001b-81b2-4f0b-8f98-74695ce31a66', '226e2b73-f60f-4b4f-8e92-f3b2f2fb6f9b', 'mtk-perkalian', 'multiple_choice'::public.question_type, 'Aritmetika', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Hasil dari 9 × 3 adalah…', '9 × 3 = 27, karena 9 + 9 + 9 = 27.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/operasi-bilangan/mtk-perkalian/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f5fafac6-d89f-4018-8f81-573f695d7338', 'dfe9001b-81b2-4f0b-8f98-74695ce31a66', '27', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/operasi-bilangan/mtk-perkalian/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('10d43777-dabb-47b0-8065-d78a4620b4b7', 'dfe9001b-81b2-4f0b-8f98-74695ce31a66', '24', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/operasi-bilangan/mtk-perkalian/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e0018beb-5205-4d7f-8b26-fd1d87e1c844', 'dfe9001b-81b2-4f0b-8f98-74695ce31a66', '21', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/operasi-bilangan/mtk-perkalian/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a7649aa4-9438-408a-8c11-c9dcfc03a655', 'dfe9001b-81b2-4f0b-8f98-74695ce31a66', '36', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/operasi-bilangan/mtk-pembagian
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('61c5cb09-5282-4bc0-856f-40e353175eb1', '226e2b73-f60f-4b4f-8e92-f3b2f2fb6f9b', 'mtk-pembagian', 'multiple_choice'::public.question_type, 'Aritmetika', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Hasil dari 24 ÷ 6 adalah…', '24 ÷ 6 = 4 karena 6 × 4 = 24.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/operasi-bilangan/mtk-pembagian/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9ef7667a-c2bc-4ebf-8b6e-5e006ca326d0', '61c5cb09-5282-4bc0-856f-40e353175eb1', '4', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/operasi-bilangan/mtk-pembagian/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('06db761f-140c-45dd-89c6-f36fc8d26e8f', '61c5cb09-5282-4bc0-856f-40e353175eb1', '3', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/operasi-bilangan/mtk-pembagian/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f4673401-6e8f-4e28-8397-d818f5717dc5', '61c5cb09-5282-4bc0-856f-40e353175eb1', '5', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/operasi-bilangan/mtk-pembagian/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('192423a1-8bec-48f6-83b0-c75610427c06', '61c5cb09-5282-4bc0-856f-40e353175eb1', '6', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/operasi-bilangan/mtk-pengurangan
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('aa86750b-abe7-4566-84c1-fc060d03fc79', '226e2b73-f60f-4b4f-8e92-f3b2f2fb6f9b', 'mtk-pengurangan', 'fill_blank'::public.question_type, 'Aritmetika', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Hasil dari 15 − 8 adalah ___.', '15 − 8 = 7. Periksa dengan 8 + 7 = 15.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: matematika/operasi-bilangan/mtk-pengurangan/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('42272735-1254-4824-889c-932b03118e0e', 'aa86750b-abe7-4566-84c1-fc060d03fc79', '7', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: matematika/operasi-bilangan/mtk-nilai-tempat
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('0cf858e5-7317-4f04-8394-4ac25e4d61c2', '226e2b73-f60f-4b4f-8e92-f3b2f2fb6f9b', 'mtk-nilai-tempat', 'multiple_choice'::public.question_type, 'Nilai Tempat', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Nilai tempat angka 4 pada bilangan 3.482 adalah…', '3.482 terbaca tiga ribu empat ratus delapan puluh dua, sehingga angka 4 berada di tempat ratusan.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/operasi-bilangan/mtk-nilai-tempat/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d4b4e234-92ed-453f-8129-85c46c39ee84', '0cf858e5-7317-4f04-8394-4ac25e4d61c2', 'Ratusan', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/operasi-bilangan/mtk-nilai-tempat/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('24ff4899-d6d8-412b-804e-18eb378d34ee', '0cf858e5-7317-4f04-8394-4ac25e4d61c2', 'Ribuan', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/operasi-bilangan/mtk-nilai-tempat/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9e24990b-c36b-40ea-8370-af84b691d769', '0cf858e5-7317-4f04-8394-4ac25e4d61c2', 'Puluhan', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/operasi-bilangan/mtk-nilai-tempat/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f186446e-7947-460e-82ca-e74e46d09dc0', '0cf858e5-7317-4f04-8394-4ac25e4d61c2', 'Satuan', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: matematika/math-review
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('17e40bad-0f63-42f1-8628-95c76d6e0073', '58f6ab6f-e776-4c21-8976-e9a230e4720a', 'math-review', 'Review Matematika', 'Ulangi operasi bilangan, aljabar dasar, dan perhitungan.', 'review'::public.lesson_kind, 5, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: matematika/math-review
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('059e596a-c7b4-448b-8dab-912508e28266', '58f6ab6f-e776-4c21-8976-e9a230e4720a', 'lesson-math-review', 'Review Matematika', 'Ulangi operasi bilangan, aljabar dasar, dan perhitungan.', 'review'::public.node_kind, '17e40bad-0f63-42f1-8628-95c76d6e0073', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: matematika/math-review/review-math-multiply
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('877a70ab-31cb-487c-8f7f-a1ded6dde381', '17e40bad-0f63-42f1-8628-95c76d6e0073', 'review-math-multiply', 'multiple_choice'::public.question_type, 'Operasi Bilangan', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Hasil dari 12 × 8 adalah…', '12 × 8 = 96. Periksa dengan 10 × 8 = 80 ditambah 2 × 8 = 16.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/math-review/review-math-multiply/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('4151fb72-e05c-4fda-8fbb-b2bfc95961c7', '877a70ab-31cb-487c-8f7f-a1ded6dde381', '96', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/math-review/review-math-multiply/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8a24a976-69f1-46ca-8924-36a76510344c', '877a70ab-31cb-487c-8f7f-a1ded6dde381', '86', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/math-review/review-math-multiply/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d4e9048d-69f5-4f1a-8bbe-e61fa6ac2a87', '877a70ab-31cb-487c-8f7f-a1ded6dde381', '108', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/math-review/review-math-multiply/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7272c72b-71aa-49b4-8f2d-fdf9e43bb450', '877a70ab-31cb-487c-8f7f-a1ded6dde381', '92', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/math-review/review-math-algebra
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('c4ab564f-033d-40d0-8cf6-3a5c4c818080', '17e40bad-0f63-42f1-8628-95c76d6e0073', 'review-math-algebra', 'multiple_choice'::public.question_type, 'Aljabar', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Bentuk sederhana dari 2x + 3x adalah…', 'Suku sejenis dapat dijumlahkan koefisiennya: 2 + 3 = 5, sehingga hasilnya 5x.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/math-review/review-math-algebra/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6f42b4b5-868c-44b0-8d62-1dbcade58b32', 'c4ab564f-033d-40d0-8cf6-3a5c4c818080', '5x', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/math-review/review-math-algebra/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9b8404fd-0230-472b-8697-133c9ac28c24', 'c4ab564f-033d-40d0-8cf6-3a5c4c818080', '6x', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/math-review/review-math-algebra/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('afcddf70-e112-4dfa-8a0e-c115d9d4ba20', 'c4ab564f-033d-40d0-8cf6-3a5c4c818080', '5x²', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/math-review/review-math-algebra/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f00dbaff-4c03-4110-83aa-f6fa5f0cfba6', 'c4ab564f-033d-40d0-8cf6-3a5c4c818080', 'x + 5', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/math-review/review-math-add
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('b775ccd3-f153-46d1-8dcd-bfd6223226f4', '17e40bad-0f63-42f1-8628-95c76d6e0073', 'review-math-add', 'typing'::public.question_type, 'Operasi Bilangan', 'beginner'::public.difficulty_band, 'Tulis jawaban pada kolom yang tersedia.', 'Berapa hasil dari 15 + 27?', '15 + 27 = 42.', null, 15, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: matematika/math-review/review-math-add/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('c96380c9-0dbd-49b0-8189-54a0ba15ad5c', 'b775ccd3-f153-46d1-8dcd-bfd6223226f4', '42', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- lessons: matematika/math-challenge
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('6b17f7b2-cb36-44cd-856d-8248a2f1c24d', '58f6ab6f-e776-4c21-8976-e9a230e4720a', 'math-challenge', 'Tantangan Matematika', 'Latihan persamaan, rata-rata, dan geometri.', 'challenge'::public.lesson_kind, 6, 10, 2, 2, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: matematika/math-challenge
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('c2349219-6f00-4ad9-88ce-931930d3317f', '58f6ab6f-e776-4c21-8976-e9a230e4720a', 'lesson-math-challenge', 'Tantangan Matematika', 'Latihan persamaan, rata-rata, dan geometri.', 'challenge'::public.node_kind, '6b17f7b2-cb36-44cd-856d-8248a2f1c24d', 20, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: matematika/math-challenge/challenge-math-linear
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('438e0bd5-bbfe-42ff-8a83-63efd6f98292', '6b17f7b2-cb36-44cd-856d-8248a2f1c24d', 'challenge-math-linear', 'multiple_choice'::public.question_type, 'Persamaan', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Jika 2x + 4 = 12, maka nilai x adalah…', 'Kurangi kedua ruas dengan 4: 2x = 8. Bagi dengan 2: x = 4.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/math-challenge/challenge-math-linear/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9b8bbe0f-4ee0-4c0e-8c03-8ae5e06d0982', '438e0bd5-bbfe-42ff-8a83-63efd6f98292', '4', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/math-challenge/challenge-math-linear/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('cbd3ea85-58c3-4cf8-8b47-c72c135c64cf', '438e0bd5-bbfe-42ff-8a83-63efd6f98292', '6', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/math-challenge/challenge-math-linear/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c4c09de2-92db-4f70-8043-dceb01a84ee4', '438e0bd5-bbfe-42ff-8a83-63efd6f98292', '8', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/math-challenge/challenge-math-linear/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f0d7746e-2435-43e3-8971-d3bc6c01b252', '438e0bd5-bbfe-42ff-8a83-63efd6f98292', '3', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/math-challenge/challenge-math-mean
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('dbad7bb6-23ca-4aca-80b7-ee85d73bcfe4', '6b17f7b2-cb36-44cd-856d-8248a2f1c24d', 'challenge-math-mean', 'multiple_choice'::public.question_type, 'Statistik', 'beginner'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Rata-rata dari 4, 6, 8, dan 10 adalah…', 'Jumlah data 4 + 6 + 8 + 10 = 28. Dibagi 4 data menghasilkan 7.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/math-challenge/challenge-math-mean/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f0014fe8-d8ba-42b4-8c4f-abbc584f7177', 'dbad7bb6-23ca-4aca-80b7-ee85d73bcfe4', '7', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/math-challenge/challenge-math-mean/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('37f9d052-4806-4fae-82a8-ac9cfcc41d06', 'dbad7bb6-23ca-4aca-80b7-ee85d73bcfe4', '6', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/math-challenge/challenge-math-mean/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('4a458ee3-13cc-4d9f-8eb0-9e1328e3a0c7', 'dbad7bb6-23ca-4aca-80b7-ee85d73bcfe4', '8', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/math-challenge/challenge-math-mean/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a77bacb5-f267-4c15-82ed-9e5fa563ff40', 'dbad7bb6-23ca-4aca-80b7-ee85d73bcfe4', '9', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/math-challenge/challenge-math-area
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('f5739af9-3bd5-4320-8df6-92896ef90f19', '6b17f7b2-cb36-44cd-856d-8248a2f1c24d', 'challenge-math-area', 'fill_blank'::public.question_type, 'Geometri', 'beginner'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Luas persegi panjang dengan panjang 8 cm dan lebar 5 cm adalah ___ cm².', 'Luas persegi panjang = panjang × lebar = 8 × 5 = 40 cm².', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: matematika/math-challenge/challenge-math-area/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('a5a56fbd-5ac9-4b67-8fa4-a82958d96bd3', 'f5739af9-3bd5-4320-8df6-92896ef90f19', '40', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- course_levels: matematika/elementary
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('85eaf15d-3066-4a99-87c5-5985052f1a7a', 'a5a6d16c-ada2-42ce-8c4b-da187abf160a', 'elementary', 'Level 2 · Pecahan dan Persen', 'Mengolah pecahan, desimal, dan persen dalam soal sehari-hari.', 'elementary'::public.difficulty_band, 1, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: matematika/pecahan-persen
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('bba212ce-5a98-4b55-88c8-b5327df9e7f1', '85eaf15d-3066-4a99-87c5-5985052f1a7a', 'pecahan-persen', 'Pecahan, Desimal, dan Persen', 'Tiga bentuk bilangan yang saling berhubungan dan sering muncul di kehidupan.', array['Menjumlahkan pecahan berpenyebut berbeda', 'Mengubah persen ke desimal', 'Menghitung bagian dari suatu jumlah']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: matematika/pecahan-persen
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('0050d0c3-291a-40da-86e9-e6ea7a1e131d', 'bba212ce-5a98-4b55-88c8-b5327df9e7f1', 'pecahan-persen', 'Pecahan dan Persen', 'Mengubah dan menghitung bagian dari keseluruhan.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: matematika/pecahan-persen
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('ebb7d178-847b-42be-89b6-426917cfde35', 'bba212ce-5a98-4b55-88c8-b5327df9e7f1', 'lesson-pecahan-persen', 'Pecahan dan Persen', 'Mengubah dan menghitung bagian dari keseluruhan.', 'lesson'::public.node_kind, '0050d0c3-291a-40da-86e9-e6ea7a1e131d', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: matematika/pecahan-persen/mtk-pecahan-jumlah
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('b881bd57-4637-4bc1-87d3-443ce0ff5f88', '0050d0c3-291a-40da-86e9-e6ea7a1e131d', 'mtk-pecahan-jumlah', 'multiple_choice'::public.question_type, 'Pecahan', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Hasil dari 1/2 + 1/4 adalah…', 'Samakan penyebut menjadi 4: 1/2 = 2/4, lalu 2/4 + 1/4 = 3/4.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/pecahan-persen/mtk-pecahan-jumlah/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8f407f67-0450-4ac2-8373-db61a29daa55', 'b881bd57-4637-4bc1-87d3-443ce0ff5f88', '3/4', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/pecahan-persen/mtk-pecahan-jumlah/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7e9ce165-c625-4283-8b67-1d18386aaddc', 'b881bd57-4637-4bc1-87d3-443ce0ff5f88', '2/6', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/pecahan-persen/mtk-pecahan-jumlah/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c2a44db4-eb26-4cd5-8eae-1785355fc105', 'b881bd57-4637-4bc1-87d3-443ce0ff5f88', '1/6', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/pecahan-persen/mtk-pecahan-jumlah/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0c42d9fe-ce52-4a3e-861c-5f8465196b2a', 'b881bd57-4637-4bc1-87d3-443ce0ff5f88', '2/4', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/pecahan-persen/mtk-persen-desimal
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('52790d8c-5392-4430-8170-065c9eaca110', '0050d0c3-291a-40da-86e9-e6ea7a1e131d', 'mtk-persen-desimal', 'multiple_choice'::public.question_type, 'Persen', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Bentuk desimal dari 25% adalah…', '25% berarti 25 per 100, sehingga sama dengan 0,25.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/pecahan-persen/mtk-persen-desimal/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9eb907c3-dec5-476b-8f1a-8f703ea4b708', '52790d8c-5392-4430-8170-065c9eaca110', '0,25', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/pecahan-persen/mtk-persen-desimal/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9924c8cf-357a-4959-89d5-34f3c8246df0', '52790d8c-5392-4430-8170-065c9eaca110', '2,5', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/pecahan-persen/mtk-persen-desimal/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('fae76e8f-5709-49d1-843e-5c19321aef6b', '52790d8c-5392-4430-8170-065c9eaca110', '0,025', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/pecahan-persen/mtk-persen-desimal/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('7f4fbe17-2883-4d59-8ddd-9d126045f8e7', '52790d8c-5392-4430-8170-065c9eaca110', '25,0', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/pecahan-persen/mtk-pecahan-desimal
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('39cdeeb5-eddc-4b62-8956-68a9645f2d94', '0050d0c3-291a-40da-86e9-e6ea7a1e131d', 'mtk-pecahan-desimal', 'multiple_choice'::public.question_type, 'Desimal', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Bentuk desimal dari 1/5 adalah…', '1/5 = 2/10 = 0,2.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/pecahan-persen/mtk-pecahan-desimal/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('59685c13-4499-4eba-88e5-ae53306ad01b', '39cdeeb5-eddc-4b62-8956-68a9645f2d94', '0,2', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/pecahan-persen/mtk-pecahan-desimal/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9db3c202-e8b9-41b8-8601-19edfe5d86d3', '39cdeeb5-eddc-4b62-8956-68a9645f2d94', '0,5', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/pecahan-persen/mtk-pecahan-desimal/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('3bb02020-b3a6-49b9-8698-450bc5bd09a7', '39cdeeb5-eddc-4b62-8956-68a9645f2d94', '0,15', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/pecahan-persen/mtk-pecahan-desimal/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('dfd236ba-c81c-43bd-84ad-63403f76ba80', '39cdeeb5-eddc-4b62-8956-68a9645f2d94', '1,5', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/pecahan-persen/mtk-bagian-dari-jumlah
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('d7f95274-b63e-4f9f-883b-42bcb4139068', '0050d0c3-291a-40da-86e9-e6ea7a1e131d', 'mtk-bagian-dari-jumlah', 'fill_blank'::public.question_type, 'Pecahan', 'elementary'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Nilai dari 3/4 dari 20 adalah ___.', '20 ÷ 4 = 5, lalu 5 × 3 = 15. Jadi 3/4 dari 20 adalah 15.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: matematika/pecahan-persen/mtk-bagian-dari-jumlah/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('66410935-37ef-4cd1-8114-95f7b89e0244', 'd7f95274-b63e-4f9f-883b-42bcb4139068', '15', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: matematika/pecahan-persen/mtk-banding-desimal
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('9aa0b133-fabf-4a81-8ce4-499196e8068d', '0050d0c3-291a-40da-86e9-e6ea7a1e131d', 'mtk-banding-desimal', 'multiple_choice'::public.question_type, 'Perbandingan', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Bilangan yang lebih besar antara 0,7 dan 0,65 adalah…', '0,7 sama dengan 0,70, sehingga lebih besar daripada 0,65.', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/pecahan-persen/mtk-banding-desimal/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('82a83559-3788-4141-8925-3cbe28b3f49f', '9aa0b133-fabf-4a81-8ce4-499196e8068d', '0,7', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/pecahan-persen/mtk-banding-desimal/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a0159aaa-9abc-46ea-86a2-bbee80332d78', '9aa0b133-fabf-4a81-8ce4-499196e8068d', '0,65', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/pecahan-persen/mtk-banding-desimal/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e7f8184e-bc80-4de3-86e2-28bc2ea7c542', '9aa0b133-fabf-4a81-8ce4-499196e8068d', 'Sama besar', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/pecahan-persen/mtk-banding-desimal/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ad18f2f6-dc2b-4840-8316-581d0392f0c1', '9aa0b133-fabf-4a81-8ce4-499196e8068d', 'Tidak dapat dibandingkan', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: matematika/latihan-pecahan-persen
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('9a855116-7e1b-413d-8114-e2ff87bde029', 'bba212ce-5a98-4b55-88c8-b5327df9e7f1', 'latihan-pecahan-persen', 'Latihan Pecahan & Persen', 'Latihan mengubah pecahan, persen, dan desimal.', 'practice'::public.lesson_kind, 6, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: matematika/latihan-pecahan-persen
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('40476820-bada-4d3c-8e63-52f7f1c5a28c', 'bba212ce-5a98-4b55-88c8-b5327df9e7f1', 'lesson-latihan-pecahan-persen', 'Latihan Pecahan & Persen', 'Latihan mengubah pecahan, persen, dan desimal.', 'practice'::public.node_kind, '9a855116-7e1b-413d-8114-e2ff87bde029', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: matematika/latihan-pecahan-persen/practice-math-suma
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('4cd4ba08-2169-4265-8812-d577accd1361', '9a855116-7e1b-413d-8114-e2ff87bde029', 'practice-math-suma', 'multiple_choice'::public.question_type, 'Pecahan', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Hasil dari 1/2 + 1/4 adalah…', 'Samakan penyebut menjadi 4: 1/2 = 2/4, lalu 2/4 + 1/4 = 3/4.', 'Penyebut terkecil yang sama adalah 4.', 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/latihan-pecahan-persen/practice-math-suma/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('cc402a33-f1c9-4bf9-8362-73a746ae6c77', '4cd4ba08-2169-4265-8812-d577accd1361', '3/4', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/latihan-pecahan-persen/practice-math-suma/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('18e2d554-7ea7-456f-81ab-fc6a766752d3', '4cd4ba08-2169-4265-8812-d577accd1361', '2/6', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/latihan-pecahan-persen/practice-math-suma/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c48f8ae7-210c-406c-82cb-8c83154f4785', '4cd4ba08-2169-4265-8812-d577accd1361', '1/6', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/latihan-pecahan-persen/practice-math-suma/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6a53c2e5-b57d-4e6d-836f-999d92b55de9', '4cd4ba08-2169-4265-8812-d577accd1361', '2/4', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/latihan-pecahan-persen/practice-math-persen
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('7fb3288d-6a9c-40b4-8556-14cdeeab1449', '9a855116-7e1b-413d-8114-e2ff87bde029', 'practice-math-persen', 'multiple_choice'::public.question_type, 'Persen', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', '25% dari 80 adalah…', '25% = 1/4, sehingga 80 : 4 = 20.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/latihan-pecahan-persen/practice-math-persen/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('669383d9-2f9d-4299-810b-16a394001055', '7fb3288d-6a9c-40b4-8556-14cdeeab1449', '20', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/latihan-pecahan-persen/practice-math-persen/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('25b9aed6-5513-4545-88b0-eb4efc8a4ab2', '7fb3288d-6a9c-40b4-8556-14cdeeab1449', '15', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/latihan-pecahan-persen/practice-math-persen/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('4e96b2a3-5656-4378-88ea-7ab273500b23', '7fb3288d-6a9c-40b4-8556-14cdeeab1449', '25', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/latihan-pecahan-persen/practice-math-persen/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('648745e5-bd5d-4fa6-84b0-f80a1e569a4c', '7fb3288d-6a9c-40b4-8556-14cdeeab1449', '32', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/latihan-pecahan-persen/practice-math-desimal
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('7f1f8ef8-2e73-42d2-80fc-268001365fb0', '9a855116-7e1b-413d-8114-e2ff87bde029', 'practice-math-desimal', 'fill_blank'::public.question_type, 'Desimal', 'elementary'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Ubah 0,6 menjadi persen: __%', 'Kalikan desimal dengan 100: 0,6 × 100 = 60%.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: matematika/latihan-pecahan-persen/practice-math-desimal/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('9815bc3d-080e-46b9-868c-5c8877202a89', '7f1f8ef8-2e73-42d2-80fc-268001365fb0', '60', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- lessons: matematika/checkpoint-pecahan-persen
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('d191006d-1e8f-4af1-80c7-ef5478382954', 'bba212ce-5a98-4b55-88c8-b5327df9e7f1', 'checkpoint-pecahan-persen', 'Checkpoint Pecahan & Persen', 'Pastikan kemampuan membandingkan dan menghitung persen.', 'review'::public.lesson_kind, 8, 10, 2, 2, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: matematika/checkpoint-pecahan-persen
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('9c93d99d-5336-452d-882a-5aebff9cf0ac', 'bba212ce-5a98-4b55-88c8-b5327df9e7f1', 'lesson-checkpoint-pecahan-persen', 'Checkpoint Pecahan & Persen', 'Pastikan kemampuan membandingkan dan menghitung persen.', 'checkpoint'::public.node_kind, 'd191006d-1e8f-4af1-80c7-ef5478382954', 20, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: matematika/checkpoint-pecahan-persen/checkpoint-math-desimal
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('490e1ba2-48c1-4bec-8117-5cf07871ee29', 'd191006d-1e8f-4af1-80c7-ef5478382954', 'checkpoint-math-desimal', 'multiple_choice'::public.question_type, 'Pecahan', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Bentuk desimal dari 3/5 adalah…', '3 : 5 = 0,6. Pembilang dibagi penyebut menghasilkan desimal.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/checkpoint-pecahan-persen/checkpoint-math-desimal/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('49877d5d-5d2c-45d8-8227-fb8a4661ff0a', '490e1ba2-48c1-4bec-8117-5cf07871ee29', '0,6', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/checkpoint-pecahan-persen/checkpoint-math-desimal/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('eb87df3c-1c32-47cf-88cb-4cd5fa803a02', '490e1ba2-48c1-4bec-8117-5cf07871ee29', '0,35', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/checkpoint-pecahan-persen/checkpoint-math-desimal/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a3035ddd-00d6-4751-8417-653c68aa1f2d', '490e1ba2-48c1-4bec-8117-5cf07871ee29', '0,53', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/checkpoint-pecahan-persen/checkpoint-math-desimal/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('57ba7d06-2102-4648-836d-0a15d5588daf', '490e1ba2-48c1-4bec-8117-5cf07871ee29', '1,6', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/checkpoint-pecahan-persen/checkpoint-math-banding
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('1d0e9920-d1ec-4c21-8db5-7a3c293df0b6', 'd191006d-1e8f-4af1-80c7-ef5478382954', 'checkpoint-math-banding', 'multiple_choice'::public.question_type, 'Perbandingan', 'elementary'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Perbandingan yang benar antara 2/3 dan 3/5 adalah…', '2/3 ≈ 0,667 dan 3/5 = 0,6, sehingga 2/3 lebih besar.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/checkpoint-pecahan-persen/checkpoint-math-banding/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('49e8b355-813d-476a-8ad9-48734bf3caf7', '1d0e9920-d1ec-4c21-8db5-7a3c293df0b6', '2/3 > 3/5', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/checkpoint-pecahan-persen/checkpoint-math-banding/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0d9bf309-2f90-4472-86a5-67c891d57fa6', '1d0e9920-d1ec-4c21-8db5-7a3c293df0b6', '2/3 < 3/5', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/checkpoint-pecahan-persen/checkpoint-math-banding/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('ebcf7798-074c-46c5-8c9c-51fea1dc8410', '1d0e9920-d1ec-4c21-8db5-7a3c293df0b6', '2/3 = 3/5', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/checkpoint-pecahan-persen/checkpoint-math-banding/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1107dd71-c841-4915-80fc-94cd8c2f98ce', '1d0e9920-d1ec-4c21-8db5-7a3c293df0b6', 'Tidak dapat dibandingkan', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/checkpoint-pecahan-persen/checkpoint-math-persen
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('6297cf5b-8cbc-41b1-844d-522eb247e6b3', 'd191006d-1e8f-4af1-80c7-ef5478382954', 'checkpoint-math-persen', 'typing'::public.question_type, 'Persen', 'elementary'::public.difficulty_band, 'Tulis jawaban pada kolom yang tersedia.', 'Hitung 15% dari 200.', '15% = 0,15; 0,15 × 200 = 30.', null, 15, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: matematika/checkpoint-pecahan-persen/checkpoint-math-persen/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('d4965e93-9019-49e9-84c7-aab040cf7fad', '6297cf5b-8cbc-41b1-844d-522eb247e6b3', '30', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- course_levels: matematika/intermediate
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('d9f7904d-34cc-43d9-8ba7-1043a3fa2072', 'a5a6d16c-ada2-42ce-8c4b-da187abf160a', 'intermediate', 'Level 3 · Aljabar Dasar', 'Menyelesaikan persamaan, menyederhanakan bentuk, dan memahami gradien.', 'intermediate'::public.difficulty_band, 2, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: matematika/aljabar-dasar
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('28000005-2a94-4712-8424-3f9cbdb6a724', 'd9f7904d-34cc-43d9-8ba7-1043a3fa2072', 'aljabar-dasar', 'Aljabar Dasar', 'Huruf dalam aljabar mewakili bilangan yang belum diketahui.', array['Menyelesaikan persamaan linear satu variabel', 'Mengalikan bentuk aljabar', 'Menentukan gradien garis']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: matematika/aljabar-dasar
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('3c7a1294-0ee7-48ea-84dd-001fb3fead29', '28000005-2a94-4712-8424-3f9cbdb6a724', 'aljabar-dasar', 'Aljabar Dasar', 'Persamaan, bentuk aljabar, dan gradien.', 'lesson'::public.lesson_kind, 7, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: matematika/aljabar-dasar
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('66f7d889-32e5-4512-8728-daa28b77ccc3', '28000005-2a94-4712-8424-3f9cbdb6a724', 'lesson-aljabar-dasar', 'Aljabar Dasar', 'Persamaan, bentuk aljabar, dan gradien.', 'lesson'::public.node_kind, '3c7a1294-0ee7-48ea-84dd-001fb3fead29', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: matematika/aljabar-dasar/mtk-persamaan-linear
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('3bc66a03-77e3-407a-8ba6-0ddde4978a10', '3c7a1294-0ee7-48ea-84dd-001fb3fead29', 'mtk-persamaan-linear', 'multiple_choice'::public.question_type, 'Persamaan', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Jika 2x + 3 = 11, maka nilai x adalah…', 'Kurangi 3 dari kedua ruas: 2x = 8. Bagi 2: x = 4.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/aljabar-dasar/mtk-persamaan-linear/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('d3a0983c-bd3c-4bc6-8943-1e67529d1eee', '3bc66a03-77e3-407a-8ba6-0ddde4978a10', '4', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/aljabar-dasar/mtk-persamaan-linear/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('78310cb7-e3e5-49d3-8faa-46a5bc77141e', '3bc66a03-77e3-407a-8ba6-0ddde4978a10', '5', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/aljabar-dasar/mtk-persamaan-linear/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('0e837d7e-3d0e-4f36-8386-7589beceb08e', '3bc66a03-77e3-407a-8ba6-0ddde4978a10', '6', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/aljabar-dasar/mtk-persamaan-linear/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('8707319c-570d-49df-846c-54fefef4d6aa', '3bc66a03-77e3-407a-8ba6-0ddde4978a10', '3', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/aljabar-dasar/mtk-ekspansi
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('05ce2718-31ad-437f-83f5-671d67fc7ddf', '3c7a1294-0ee7-48ea-84dd-001fb3fead29', 'mtk-ekspansi', 'multiple_choice'::public.question_type, 'Bentuk Aljabar', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Bentuk sederhana dari 3(x + 2) adalah…', 'Gunakan sifat distributif: 3 × x + 3 × 2 = 3x + 6.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/aljabar-dasar/mtk-ekspansi/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('db9e1121-1592-4343-8819-03c808f7c90f', '05ce2718-31ad-437f-83f5-671d67fc7ddf', '3x + 6', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/aljabar-dasar/mtk-ekspansi/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('33fb817e-684e-4c08-82d5-675aeebf1ebf', '05ce2718-31ad-437f-83f5-671d67fc7ddf', '3x + 2', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/aljabar-dasar/mtk-ekspansi/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('9781ce79-38b2-431a-8273-ec50514bc1d4', '05ce2718-31ad-437f-83f5-671d67fc7ddf', 'x + 6', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/aljabar-dasar/mtk-ekspansi/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('1cf41cd9-50f7-479c-88d5-fa8b8e69e97f', '05ce2718-31ad-437f-83f5-671d67fc7ddf', '3x + 5', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/aljabar-dasar/mtk-gradien
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('a6b4f8e5-5a21-44bd-856d-435c311fba6d', '3c7a1294-0ee7-48ea-84dd-001fb3fead29', 'mtk-gradien', 'multiple_choice'::public.question_type, 'Gradien', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Gradien garis y = 2x + 1 adalah…', 'Pada bentuk y = mx + c, m adalah gradien. Di sini m = 2.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/aljabar-dasar/mtk-gradien/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('73803b47-fd31-4577-8529-02f75c068199', 'a6b4f8e5-5a21-44bd-856d-435c311fba6d', '2', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/aljabar-dasar/mtk-gradien/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('4a30309e-95a1-49e4-88f7-32edf0265536', 'a6b4f8e5-5a21-44bd-856d-435c311fba6d', '1', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/aljabar-dasar/mtk-gradien/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b996fffd-0160-403d-87b1-3c455c35f522', 'a6b4f8e5-5a21-44bd-856d-435c311fba6d', '−2', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/aljabar-dasar/mtk-gradien/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('af6257e5-9a0e-4c99-85ab-955777334b19', 'a6b4f8e5-5a21-44bd-856d-435c311fba6d', '1/2', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/aljabar-dasar/mtk-substitusi
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('db5e542a-b389-4dba-89ab-072a5193ffdb', '3c7a1294-0ee7-48ea-84dd-001fb3fead29', 'mtk-substitusi', 'fill_blank'::public.question_type, 'Aljabar', 'intermediate'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Jika x = 5, nilai dari 2x − 3 adalah ___.', 'Substitusi x = 5: 2(5) − 3 = 10 − 3 = 7.', null, 10, '{}'::jsonb, 3, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: matematika/aljabar-dasar/mtk-substitusi/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('68c1126f-da4e-452e-8367-c33bc3ac7ef8', 'db5e542a-b389-4dba-89ab-072a5193ffdb', '7', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- questions: matematika/aljabar-dasar/mtk-faktor
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('51d3dc0a-4b8d-42bc-8b23-d6fc9c12cfbc', '3c7a1294-0ee7-48ea-84dd-001fb3fead29', 'mtk-faktor', 'multiple_choice'::public.question_type, 'Faktorisasi', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Faktor dari x² − 9 adalah…', 'Bentuk a² − b² = (a − b)(a + b). Dengan a = x dan b = 3 diperoleh (x − 3)(x + 3).', null, 10, '{}'::jsonb, 4, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/aljabar-dasar/mtk-faktor/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c52069f2-a799-4bde-899f-3af778c20fd9', '51d3dc0a-4b8d-42bc-8b23-d6fc9c12cfbc', '(x − 3)(x + 3)', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/aljabar-dasar/mtk-faktor/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('b3431699-b101-4e5f-88eb-5f567568dc0d', '51d3dc0a-4b8d-42bc-8b23-d6fc9c12cfbc', '(x − 9)(x + 1)', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/aljabar-dasar/mtk-faktor/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6cce8316-d7fc-4918-822b-a0c619813a3b', '51d3dc0a-4b8d-42bc-8b23-d6fc9c12cfbc', '(x − 3)(x − 3)', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/aljabar-dasar/mtk-faktor/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('6014dc26-fe30-496a-887c-9ce8d8755eb4', '51d3dc0a-4b8d-42bc-8b23-d6fc9c12cfbc', '(x + 9)(x − 1)', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- lessons: matematika/legendary-aljabar
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('35e2b008-3fe1-48d2-836d-b33466bc4373', '28000005-2a94-4712-8424-3f9cbdb6a724', 'legendary-aljabar', 'Legendary Aljabar', 'Tantangan lanjutan menyelesaikan persamaan dan substitusi.', 'legendary'::public.lesson_kind, 9, 10, 2, 1, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: matematika/legendary-aljabar
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('869a697d-b65e-41e8-8400-82dcf40f7802', '28000005-2a94-4712-8424-3f9cbdb6a724', 'lesson-legendary-aljabar', 'Legendary Aljabar', 'Tantangan lanjutan menyelesaikan persamaan dan substitusi.', 'legendary'::public.node_kind, '35e2b008-3fe1-48d2-836d-b33466bc4373', 10, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- questions: matematika/legendary-aljabar/legendary-math-linear
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('790bf680-0806-480b-8d48-dd7cfac3367d', '35e2b008-3fe1-48d2-836d-b33466bc4373', 'legendary-math-linear', 'multiple_choice'::public.question_type, 'Persamaan', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Jika 2x + 6 = 18, nilai x adalah…', 'Kurangi 6 dari kedua sisi: 2x = 12, lalu bagi 2: x = 6.', null, 10, '{}'::jsonb, 0, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/legendary-aljabar/legendary-math-linear/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('5e5e68bf-0fc5-491d-8b21-a32319fbf2f4', '790bf680-0806-480b-8d48-dd7cfac3367d', '6', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/legendary-aljabar/legendary-math-linear/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('a03b5f18-a605-4d2c-8ee7-bacbedb9e362', '790bf680-0806-480b-8d48-dd7cfac3367d', '12', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/legendary-aljabar/legendary-math-linear/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('c73eacd9-1160-4950-85a8-6d5454e4e3bf', '790bf680-0806-480b-8d48-dd7cfac3367d', '24', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/legendary-aljabar/legendary-math-linear/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('362fe6cf-4e71-45eb-8b4e-5fad43fd3c8b', '790bf680-0806-480b-8d48-dd7cfac3367d', '3', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/legendary-aljabar/legendary-math-distribusi
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('0d561779-7b15-480d-8272-7044b9daf9a4', '35e2b008-3fe1-48d2-836d-b33466bc4373', 'legendary-math-distribusi', 'multiple_choice'::public.question_type, 'Aljabar', 'intermediate'::public.difficulty_band, 'Pilih satu jawaban yang paling tepat.', 'Bentuk sederhana dari 3(x + 2) adalah…', 'Kalikan 3 dengan setiap suku di dalam kurung: 3x + 6.', null, 10, '{}'::jsonb, 1, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_options: matematika/legendary-aljabar/legendary-math-distribusi/0
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('2b1217f4-d4db-42ed-82a7-1eb8b804526b', '0d561779-7b15-480d-8272-7044b9daf9a4', '3x + 6', true, 0)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/legendary-aljabar/legendary-math-distribusi/1
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('258dda9b-0cdf-4101-81d3-5eaaa906892f', '0d561779-7b15-480d-8272-7044b9daf9a4', '3x + 2', false, 1)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/legendary-aljabar/legendary-math-distribusi/2
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('e48c5928-43e2-4d66-85b2-4691815b1af8', '0d561779-7b15-480d-8272-7044b9daf9a4', 'x + 6', false, 2)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- question_options: matematika/legendary-aljabar/legendary-math-distribusi/3
insert into public.question_options (id, question_id, label, is_correct, sort_order)
values ('f5b153b0-4b88-4b00-87fe-8fffc3151f35', '0d561779-7b15-480d-8272-7044b9daf9a4', '3x + 5', false, 3)
on conflict (id) do update set
  question_id = excluded.question_id,
  label = excluded.label,
  is_correct = excluded.is_correct,
  sort_order = excluded.sort_order;

-- questions: matematika/legendary-aljabar/legendary-math-substitusi
insert into public.questions (id, lesson_id, slug, type, topic, difficulty, instruction, prompt, explanation, hint, points, scene, sort_order, is_active)
values ('b6cd7dc5-f633-4f68-8b90-272d430f52f6', '35e2b008-3fe1-48d2-836d-b33466bc4373', 'legendary-math-substitusi', 'fill_blank'::public.question_type, 'Substitusi', 'intermediate'::public.difficulty_band, 'Lengkapi bagian rumpang dengan jawaban yang tepat.', 'Jika x = 4, nilai 2x + 5 adalah __.', 'Substitusi x = 4: 2(4) + 5 = 8 + 5 = 13.', null, 10, '{}'::jsonb, 2, true)
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  slug = excluded.slug,
  type = excluded.type,
  topic = excluded.topic,
  difficulty = excluded.difficulty,
  instruction = excluded.instruction,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  hint = excluded.hint,
  points = excluded.points,
  scene = excluded.scene,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- question_answers: matematika/legendary-aljabar/legendary-math-substitusi/0
insert into public.question_answers (id, question_id, answer, is_case_sensitive)
values ('cebf1e78-2bae-491f-83a2-30a7368e0d53', 'b6cd7dc5-f633-4f68-8b90-272d430f52f6', '13', false)
on conflict (id) do update set
  question_id = excluded.question_id,
  answer = excluded.answer,
  is_case_sensitive = excluded.is_case_sensitive;

-- subjects: bahasa-sambas
insert into public.subjects (id, slug, name, short_name, description, category, icon_key, accent_color, status, is_primary, sort_order)
values ('d5d8a4bb-1dbc-4268-895e-94778a29fca1', 'bahasa-sambas', 'Bahasa Sambas', 'Sambas', 'Mengenal kosakata dan percakapan Bahasa Sambas. Bank soal disiapkan oleh pemilik konten.', 'bahasa-daerah', 'globe', '#E9A23B', 'active'::public.subject_status, false, 10)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  accent_color = excluded.accent_color,
  status = excluded.status,
  is_primary = excluded.is_primary,
  sort_order = excluded.sort_order;

-- courses: bahasa-sambas
insert into public.courses (id, subject_id, slug, title, description, category, icon_key, sort_order, is_published)
values ('4ca9b2b4-405c-4473-8a64-521e3db7fa8f', 'd5d8a4bb-1dbc-4268-895e-94778a29fca1', 'bahasa-sambas', 'Bahasa Sambas', 'Mengenal kosakata dan percakapan Bahasa Sambas. Bank soal disiapkan oleh pemilik konten.', 'bahasa-daerah', 'globe', 10, true)
on conflict (id) do update set
  subject_id = excluded.subject_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- course_levels: bahasa-sambas/beginner
insert into public.course_levels (id, course_id, slug, title, description, difficulty, sort_order, is_published)
values ('48341da0-f89c-4d58-8d50-e13bfbbfd58e', '4ca9b2b4-405c-4473-8a64-521e3db7fa8f', 'beginner', 'Level 1 · Kosakata Sehari-hari', 'Kosakata dasar untuk sapaan dan percakapan sehari-hari.', 'beginner'::public.difficulty_band, 0, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- units: bahasa-sambas/sapaan-sambas
insert into public.units (id, course_level_id, slug, title, description, objectives, sort_order, is_published)
values ('ed2b7f5e-3a2c-4f12-850b-80ce4dd77504', '48341da0-f89c-4d58-8d50-e13bfbbfd58e', 'sapaan-sambas', 'Sapaan dan Salam', 'Unit pembuka Bahasa Sambas. Materi dan soal akan diisi oleh pemilik konten.', array['Mengenal sapaan dasar Bahasa Sambas', 'Menggunakan kosakata sehari-hari dalam konteks sederhana']::text[], 0, true)
on conflict (id) do update set
  course_level_id = excluded.course_level_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  objectives = excluded.objectives,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- lessons: bahasa-sambas/sapaan-dasar
insert into public.lessons (id, unit_id, slug, title, description, kind, estimated_minutes, xp_reward, coin_reward, sort_order, is_published)
values ('7f5a2d52-f17c-45cc-8846-714b6adc8551', 'ed2b7f5e-3a2c-4f12-850b-80ce4dd77504', 'sapaan-dasar', 'Sapaan Dasar', 'Kerangka lesson pertama Bahasa Sambas. Soal belum tersedia.', 'lesson'::public.lesson_kind, 5, 10, 2, 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  estimated_minutes = excluded.estimated_minutes,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- learning_nodes: bahasa-sambas/sapaan-dasar
insert into public.learning_nodes (id, unit_id, slug, title, description, node_type, lesson_id, sort_order, is_active)
values ('64efcf42-110b-4dd3-8f92-59639f5a2119', 'ed2b7f5e-3a2c-4f12-850b-80ce4dd77504', 'lesson-sapaan-dasar', 'Sapaan Dasar', 'Kerangka lesson pertama Bahasa Sambas. Soal belum tersedia.', 'lesson'::public.node_kind, '7f5a2d52-f17c-45cc-8846-714b6adc8551', 0, true)
on conflict (id) do update set
  unit_id = excluded.unit_id,
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  node_type = excluded.node_type,
  lesson_id = excluded.lesson_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- subjects: bahasa-jawa
insert into public.subjects (id, slug, name, short_name, description, category, icon_key, accent_color, status, is_primary, sort_order)
values ('be31b341-e1f9-432e-84e6-c4bef26810d0', 'bahasa-jawa', 'Bahasa Jawa', 'Jawa', 'Mata pelajaran Bahasa Jawa sedang dikembangkan oleh developer dan belum dapat dimainkan.', 'bahasa-daerah', 'globe', '#C7A15A', 'development'::public.subject_status, false, 11)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  accent_color = excluded.accent_color,
  status = excluded.status,
  is_primary = excluded.is_primary,
  sort_order = excluded.sort_order;

-- subjects: bahasa-sunda
insert into public.subjects (id, slug, name, short_name, description, category, icon_key, accent_color, status, is_primary, sort_order)
values ('4bbefac5-d0ae-46ea-8806-8b3ac33aad72', 'bahasa-sunda', 'Bahasa Sunda', 'Sunda', 'Mata pelajaran Bahasa Sunda sedang dikembangkan oleh developer dan belum dapat dimainkan.', 'bahasa-daerah', 'globe', '#7FB069', 'development'::public.subject_status, false, 12)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  category = excluded.category,
  icon_key = excluded.icon_key,
  accent_color = excluded.accent_color,
  status = excluded.status,
  is_primary = excluded.is_primary,
  sort_order = excluded.sort_order;

commit;

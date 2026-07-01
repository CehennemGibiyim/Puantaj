ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS sorumlu_hemsire text,
  ADD COLUMN IF NOT EXISTS saglik_bakim_muduru text,
  ADD COLUMN IF NOT EXISTS bashekim text;

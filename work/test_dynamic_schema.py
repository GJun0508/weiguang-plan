import unittest
from pathlib import Path


SQL_PATH = Path(__file__).parents[1] / 'supabase' / 'migrations' / '20260924_dynamic_content.sql'


class DynamicSchemaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sql = SQL_PATH.read_text()

    def test_migration_creates_public_content_tables_and_columns(self):
        for table in ('projects', 'project_updates', 'site_stats', 'ledger_entries'):
            self.assertIn(f'create table public.{table}', self.sql)
        for field in ('slug text not null unique', 'published boolean not null', 'project_id uuid', 'entry_type text'):
            self.assertIn(field, self.sql)

    def test_migration_has_constraints_and_updated_at_support(self):
        self.assertIn('check (progress between 0 and 100)', self.sql)
        self.assertIn("check (entry_type in ('income', 'expense'))", self.sql)
        self.assertIn('create or replace function public.set_updated_at()', self.sql)
        self.assertIn('create trigger projects_updated_at', self.sql)

    def test_public_content_policies_only_expose_published_rows(self):
        for table in ('projects', 'project_updates', 'site_stats', 'ledger_entries'):
            self.assertIn(f'on public.{table} for select to anon, authenticated', self.sql)
        self.assertEqual(self.sql.count('using (published = true);'), 4)

    def test_migration_does_not_contain_account_or_donation_system(self):
        for forbidden in ('auth.users', 'profiles', 'project_follows', 'is_admin', 'donation_stars', 'alter publication'):
            self.assertNotIn(forbidden, self.sql)


if __name__ == '__main__':
    unittest.main()

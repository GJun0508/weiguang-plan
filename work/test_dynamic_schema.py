import pathlib
import unittest


ROOT = pathlib.Path(__file__).parents[1]
MIGRATION = ROOT / "supabase/migrations/20260924_dynamic_content.sql"


class DynamicSchemaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sql = MIGRATION.read_text()

    def test_migration_creates_content_tables_and_columns(self):
        for table in (
            "profiles",
            "projects",
            "project_updates",
            "project_follows",
            "site_stats",
            "ledger_entries",
        ):
            self.assertIn(f"create table public.{table}", self.sql)
        for field in (
            "slug text not null unique",
            "published boolean not null default false",
            "progress integer not null default 0",
            "project_id uuid not null references public.projects",
            "primary key (user_id, project_id)",
            "entry_type text not null",
            "as_of_date date",
        ):
            self.assertIn(field, self.sql)

    def test_migration_has_constraints_and_updated_at_support(self):
        self.assertIn("check (progress between 0 and 100)", self.sql)
        self.assertIn("create or replace function public.set_updated_at", self.sql)
        self.assertIn("create trigger", self.sql)
        self.assertIn("create or replace function public.is_admin", self.sql)
        self.assertIn("security definer", self.sql)

    def test_public_content_and_owner_policies_are_present(self):
        self.assertIn("enable row level security", self.sql)
        self.assertIn("published = true", self.sql)
        self.assertIn("auth.uid()", self.sql)
        self.assertIn("public.is_admin()", self.sql)
        self.assertIn("project_follows for insert", self.sql)
        self.assertIn("project_follows for delete", self.sql)

    def test_migration_does_not_touch_frozen_donation_schema(self):
        self.assertNotIn("donation_stars", self.sql)
        self.assertNotIn("alter publication", self.sql)
        self.assertNotIn("user_id", self.sql.split("project_follows", 1)[0])


if __name__ == "__main__":
    unittest.main()

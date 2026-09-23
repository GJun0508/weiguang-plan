import pathlib
import unittest


ROOT = pathlib.Path(__file__).parents[1]


class RealtimeSkyContractTests(unittest.TestCase):
    def test_sql_limits_public_star_fields(self):
        sql_path = ROOT / "supabase/donation_stars.sql"
        self.assertTrue(sql_path.is_file(), str(sql_path))
        sql = sql_path.read_text()
        self.assertIn("create table public.donation_stars", sql)
        self.assertIn("client_id uuid not null unique", sql)
        self.assertIn("amount integer not null check (amount between 1 and 999999)", sql)
        self.assertIn("alter table public.donation_stars enable row level security", sql)
        self.assertIn("alter publication supabase_realtime add table public.donation_stars", sql)

    def test_public_config_has_no_privileged_key(self):
        config_path = ROOT / "supabase-config.js"
        self.assertTrue(config_path.is_file(), str(config_path))
        config = config_path.read_text().lower()
        self.assertIn("publishablekey", config)
        self.assertNotIn("service_role", config)


if __name__ == "__main__":
    unittest.main()

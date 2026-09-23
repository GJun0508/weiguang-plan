import pathlib
import unittest
from html.parser import HTMLParser


ROOT = pathlib.Path(__file__).parents[1]


class ScriptCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.sources = []

    def handle_starttag(self, tag, attrs):
        if tag != "script":
            return
        source = dict(attrs).get("src")
        if source:
            self.sources.append(source)


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

    def test_page_loads_shared_client_before_donation_logic(self):
        parser = ScriptCollector()
        parser.feed((ROOT / "index.html").read_text())
        self.assertIn("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", parser.sources)
        self.assertIn("supabase-config.js", parser.sources)
        self.assertIn("shared-stars.js", parser.sources)
        self.assertLess(parser.sources.index("shared-stars.js"), parser.sources.index("donation.js"))


if __name__ == "__main__":
    unittest.main()

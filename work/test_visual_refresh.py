import pathlib
import unittest


ROOT = pathlib.Path(__file__).parents[1]


class VisualRefreshTests(unittest.TestCase):
    def test_site_uses_cinnabar_paper_and_ink_palette(self):
        css = (ROOT / "styles.css").read_text() + (ROOT / "theme.css").read_text()
        self.assertIn("--ink:#12110f", css.lower())
        self.assertIn("--paper:#f0ebe1", css.lower())
        self.assertIn("--cinnabar:#c63d2f", css.lower())

    def test_all_people_photos_use_local_chinese_documentary_assets(self):
        html = (ROOT / "index.html").read_text()
        expected = [
            "assets/china-reading.jpg",
            "assets/china-artisan.jpg",
            "assets/china-water-village.jpg",
            "assets/china-community.jpg",
            "assets/china-elder.jpg",
        ]
        for path in expected:
            self.assertIn(path, html)
            self.assertTrue((ROOT / path).is_file(), path)

    def test_old_people_photo_urls_are_removed(self):
        html = (ROOT / "index.html").read_text()
        old_ids = [
            "photo-1488521787991-ed7bbaae773c",
            "photo-1459908676235-d5f02a50184b",
            "photo-1495195134817-aeb325a55b65",
        ]
        for old_id in old_ids:
            self.assertNotIn(old_id, html)

    def test_donation_page_uses_a_local_real_night_sky(self):
        css = (ROOT / "theme.css").read_text()
        self.assertIn('url("assets/night-sky.jpg")', css)
        self.assertTrue((ROOT / "assets/night-sky.jpg").is_file())


if __name__ == "__main__":
    unittest.main()

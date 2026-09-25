import pathlib
import unittest


ROOT = pathlib.Path(__file__).parents[1]


class SkyDonationDesignTests(unittest.TestCase):
    def test_donation_uses_fullscreen_landscape_scene(self):
        css = (ROOT / "donation.css").read_text()
        self.assertIn(".donation-scene", css)
        self.assertIn('url("assets/night-sky.jpg")', css)
        self.assertIn("grid-template-columns:minmax(360px,440px) 1fr", css)

    def test_sky_stars_have_hover_and_click_details(self):
        script = (ROOT / "donation.js").read_text()
        self.assertIn("star-tooltip", script)
        self.assertIn("pointermove", script)
        self.assertIn("pointerdown", script)
        self.assertIn("anonymousLabel", script)

    def test_completed_donation_launches_from_confirm_button(self):
        script = (ROOT / "donation.js").read_text()
        self.assertIn("startX", script)
        self.assertIn("buttonRect", script)
        self.assertIn("canvasRect", script)

    def test_tooltip_flips_left_near_right_edge(self):
        css = (ROOT / "donation.css").read_text()
        script = (ROOT / "donation.js").read_text()
        self.assertIn(".star-tooltip.align-left", css)
        self.assertIn("align-left", script)
        self.assertIn("canvasWidth * 0.65", script)

    def test_donation_stars_are_bright_white_diamonds(self):
        script = (ROOT / "donation.js").read_text()
        self.assertIn("drawDiamondStar", script)
        self.assertIn("'#ffffff'", script)
        self.assertIn("context.rotate(Math.PI / 4)", script)

    def test_night_sky_has_ambient_meteor_animation(self):
        script = (ROOT / "donation.js").read_text()
        self.assertIn("const meteors = []", script)
        self.assertIn("function spawnMeteor", script)
        self.assertIn("function drawMeteor", script)
        self.assertIn("nextMeteorAt", script)


if __name__ == "__main__":
    unittest.main()

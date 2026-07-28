import os
import time
from typing import Optional, Any

from app.config import settings
from app.utils.logger import get_logger

class ScraperManager:
    """
    Manages Playwright browser instance, persistent context, and provides pages for scrapers.
    Implements retry and challenge detection mechanisms.
    """
    def __init__(self, headless: Optional[bool] = None, profile_dir: Optional[str] = None):
        self.logger = get_logger("scraper.playwright_manager")
        self.headless = headless if headless is not None else settings.HEADLESS_MODE
        self.profile_dir = profile_dir or os.path.join(os.getcwd(), "data", "browser_profile")
        
        self.playwright: Optional[Any] = None
        self.context: Optional[Any] = None
        self.page: Optional[Any] = None
        self._launched_headless: Optional[bool] = None  # track how the context was launched
        
        os.makedirs(self.profile_dir, exist_ok=True)

    def start(self) -> Any:
        """Initialize Playwright and return a new or existing Page."""
        import asyncio
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            try:
                asyncio.get_event_loop()
            except RuntimeError:
                asyncio.set_event_loop(asyncio.new_event_loop())

        from playwright.sync_api import sync_playwright

        # If headless mode changed (e.g. user switched to visible), restart the browser
        if self.playwright is not None and self._launched_headless != self.headless:
            self.logger.info(f"Headless mode changed ({self._launched_headless} → {self.headless}). Restarting browser...")
            self.stop()

        if self.playwright is None:
            is_windows = os.name == 'nt'
            use_real_browser = is_windows and not self.headless  # Use real Edge on Windows visible mode

            self.logger.info(
                f"Initializing Playwright "
                f"({'Microsoft Edge' if use_real_browser else 'Chromium'}, headless={self.headless})..."
            )
            self.playwright = sync_playwright().start()

            if use_real_browser:
                # On Windows visible mode: use the real Edge browser
                # This passes Cloudflare since it has real fingerprints
                browser_args = ["--disable-blink-features=AutomationControlled"]
                channel = "msedge"
                user_agent = None  # Let Edge use its own real UA (don't spoof)
            else:
                # On Linux (Render) or headless: use bundled Chromium with stealth args
                browser_args = [
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                ]
                channel = None
                user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

            launch_kwargs = dict(
                user_data_dir=self.profile_dir,
                headless=self.headless,
                args=browser_args,
                viewport={"width": 1280, "height": 900},
            )
            if channel:
                launch_kwargs["channel"] = channel
            if user_agent:
                launch_kwargs["user_agent"] = user_agent

            try:
                self.context = self.playwright.chromium.launch_persistent_context(**launch_kwargs)
            except Exception as profile_err:
                # Profile directory is likely locked by another process (Windows limitation)
                # Fall back to a temp profile so the scraper can still run
                import tempfile
                tmp_dir = tempfile.mkdtemp(prefix="pw_profile_")
                self.logger.warning(f"Persistent profile locked ({profile_err}). Using temp profile: {tmp_dir}")
                launch_kwargs["user_data_dir"] = tmp_dir
                self.context = self.playwright.chromium.launch_persistent_context(**launch_kwargs)



            # Remove webdriver property to evade bot detection
            self.context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self._launched_headless = self.headless

        if not self.context.pages:
            self.page = self.context.new_page()
        else:
            self.page = self.context.pages[0]

        return self.page

    def stop(self):
        """Graceful shutdown of browser and Playwright."""
        self.logger.info("Stopping Playwright browser...")
        try:
            if self.context:
                self.context.close()
                self.context = None
            if self.playwright:
                self.playwright.stop()
                self.playwright = None
            self._launched_headless = None
        except Exception as e:
            self.logger.error(f"Error during Playwright shutdown: {e}")

    def safe_goto(self, url: str, retries: int = 2, min_delay: float = 2.0, max_delay: float = 5.0) -> bool:
        """
        Navigate to a URL safely, dealing with Cloudflare or CAPTCHA challenges.
        Implements exponential backoff. Raises on persistent challenge.
        """
        assert self.page is not None, "Browser not started"
        
        for attempt in range(1, retries + 1):
            try:
                self.logger.info(f"Navigate attempt {attempt}/{retries}: {url}")
                self.page.goto(url, wait_until="domcontentloaded", timeout=30000)
                
                # Check for challenge pages
                if self._is_challenge_page():
                    self.logger.warning(f"Challenge detected on {url} (attempt {attempt})")
                    resolved = self._handle_challenge()
                    if not resolved:
                        if attempt >= retries:
                            raise Exception(
                                f"Cloudflare/CAPTCHA challenge on {url} — could not bypass after {retries} attempts. "
                                "Please open the site manually in a browser to solve the challenge."
                            )
                        # Still have retries left — backoff and try again
                        sleep_time = min(min_delay * (2 ** (attempt - 1)), max_delay)
                        self.logger.info(f"Retrying in {sleep_time:.1f}s...")
                        time.sleep(sleep_time)
                        continue
                
                return True
                
            except Exception as e:
                self.logger.warning(f"Attempt {attempt} failed: {e}")
                if attempt < retries:
                    sleep_time = min(min_delay * (2 ** (attempt - 1)), max_delay)
                    self.logger.info(f"Retrying in {sleep_time:.1f}s...")
                    time.sleep(sleep_time)
                else:
                    self.logger.error(f"Failed to load {url} after {retries} attempts: {e}")
                    raise
                    
        return False


    def _is_challenge_page(self) -> bool:
        """Detect Cloudflare, CAPTCHA, or Access Denied pages."""
        content = self.page.content().lower()
        title = self.page.title().lower()
        
        challenge_indicators = [
            "verifying you are human",
            "checking if the site connection is secure",
            "cloudflare",
            "attention required!",
            "access denied",
            "captcha"
        ]
        
        # Fast check via title or common phrases
        if any(ind in title for ind in challenge_indicators):
            return True
            
        if any(ind in content for ind in challenge_indicators):
            return True
            
        return False

    def _handle_challenge(self) -> bool:
        """
        Wait for Cloudflare to resolve.
        - Visible mode (headless=False): wait up to 5 minutes for manual user interaction
        - Headless mode: wait 15 seconds for auto-resolve only
        Returns True if resolved, False if still blocked.
        """
        if not self.headless:
            # User can see the browser — give them time to solve CAPTCHA manually
            wait_seconds = 300  # 5 minutes
            self.logger.info(
                f"[VISIBLE MODE] Cloudflare challenge detected. "
                f"Please solve it in the open browser window. Waiting up to {wait_seconds}s..."
            )
        else:
            wait_seconds = 15
            self.logger.info("Waiting for challenge to automatically resolve...")

        try:
            for _ in range(wait_seconds):
                if not self._is_challenge_page():
                    self.logger.info("Challenge resolved successfully.")
                    return True
                time.sleep(1)
        except Exception as e:
            self.logger.error(f"Error while waiting for challenge: {e}")

        if not self.headless:
            self.logger.warning("Challenge was not solved within 5 minutes. Browser will close.")
        else:
            self.logger.warning("Challenge did not resolve automatically within time limit.")
        return False


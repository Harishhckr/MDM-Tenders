"""
Tender247 Scraper — class-based, returns normalized dicts.
"""
import time
import re
from typing import List, Dict, Tuple

from selenium.webdriver.common.by import By
from selenium.common.exceptions import UnexpectedAlertPresentException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from app.scrapers.base import BaseScraper
from app.config import settings

BASE_URL = "https://www.tender247.com"


class Tender247Scraper(BaseScraper):
    SOURCE = "tender247"

    def scrape(self, keyword: str) -> List[Dict]:
        results: List[Dict] = []
        try:
            links = self._get_all_links(keyword)
            self.logger.info("[Tender247] Found %d links for '%s'", len(links), keyword)
            for url in links:
                self.check_stop()
                item = self._check_tender(url, keyword)
                if item:
                    results.append(item)
        except Exception as exc:
            self.logger.error("[Tender247] scrape error: %s", exc)
        return results

    def _format_keyword(self, keyword: str) -> str:
        kw = re.sub(r"[&/()]", " ", keyword.strip())
        kw = re.sub(r"\s+", " ", kw)
        if " " in kw:
            return f'%22{kw.replace(" ", "%20")}%22'
        return kw

    def _handle_alert(self) -> None:
        try:
            alert = self.driver.switch_to.alert
            alert.accept()
            time.sleep(1)
        except Exception:
            pass

    def _get_all_links(self, keyword: str) -> List[str]:
        url = f"{BASE_URL}/keyword/{self._format_keyword(keyword)}+tenders"
        self.safe_get(url, delay=4)
        self._handle_alert()
        self.driver.refresh()
        time.sleep(4)
        self._handle_alert()

        links: List[str] = []
        page = 1
        while page <= settings.MAX_PAGES:
            self.check_stop()
            try:
                # Wait for the page/results to load up to 10 seconds
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//a[contains(@href,'/tender-details/')]"))
                )
            except Exception:
                self.logger.info(f"[Tender247] No results loaded for '{keyword}' on page {page}")
                break

            els = self.driver.find_elements(By.XPATH, "//a[contains(@href,'/tender-details/')]")
            for el in els:
                href = self.attr_of(el, "href")
                if href and href not in links:
                    links.append(href)
            # next page
            next_found = False
            for sel in ["//a[contains(text(),'Next')]", "//a[contains(text(),'›')]"]:
                btns = self.driver.find_elements(By.XPATH, sel)
                for btn in btns:
                    if btn.is_displayed():
                        self.js_click(btn)
                        time.sleep(3)
                        self._handle_alert()
                        next_found = True
                        break
                if next_found:
                    break
            if not next_found:
                break
            page += 1
        return list(set(links))

    def _check_tender(self, url: str, keyword: str) -> Dict | None:
        try:
            self.safe_get(url, delay=2)
            self._handle_alert()
            phrase = keyword.lower().strip()

            brief = ""
            
            # 1. Try meta description first (highly reliable on Tender247)
            try:
                meta = self.driver.find_element(By.XPATH, "//meta[@name='description']")
                content = meta.get_attribute("content")
                if content and len(content) > 30 and "procure.tender247.com" not in content.lower():
                    brief = content.replace("Tender for", "").strip()[:500]
            except Exception:
                pass

            # 2. Extract Tender Brief from .capitalize class
            if not brief:
                try:
                    els = self.driver.find_elements(By.CSS_SELECTOR, ".capitalize")
                    for el in els:
                        txt = self.text_of(el)
                        if len(txt) > 30 and "procure.tender247.com" not in txt.lower():
                            brief = txt[:500]
                            break
                except Exception:
                    pass

            # 3. Fallback table selectors
            if not brief:
                fallback_xpaths = [
                    "//td[contains(normalize-space(.),'Tender Description')]/following-sibling::td",
                    "//td[contains(normalize-space(.),'Work Description')]/following-sibling::td",
                    "//td[contains(normalize-space(.),'Tender Brief')]/following-sibling::td",
                    "//td[contains(normalize-space(.),'Brief')]/following-sibling::td",
                    "//div[contains(text(),'Brief')]/following-sibling::div",
                    "//div[contains(@class,'workDesc')]",
                ]
                for sel in fallback_xpaths:
                    try:
                        els = self.driver.find_elements(By.XPATH, sel)
                        for el in els:
                            txt = self.text_of(el).strip()
                            if len(txt) > 30 and "procure.tender247.com" not in txt.lower():
                                brief = txt[:500]
                                break
                    except Exception:
                        pass
                    if brief:
                        break

            # ── Keyword match check — only keep if keyword is in brief ───────
            if brief and phrase not in brief.lower():
                self.logger.debug("[Tender247] Keyword '%s' not in brief, skipping %s", keyword, url)
                return None

            # Extract fields
            full_text = self.page_text()
            tender_id = self._extract(full_text, r"T247\s*ID\s*[:\-]?\s*(\S+)")
            start_date = self._extract(full_text, r"(?:Opening|Publish) Date[:\s]*(\d{1,2}\s+[A-Za-z]+\s+\d{4})")
            end_date   = self._extract(full_text, r"(?:Submission|Last|Closing) Date[:\s]*(\d{1,2}\s+[A-Za-z]+\s+\d{4})")
            location   = self._extract(full_text, r"([^,\n]+,\s*[^,\n]+,\s*India)")
            title = ""
            try:
                title = self.text_of(self.driver.find_element(By.TAG_NAME, "h1"))
            except Exception:
                pass

            # Clean URL tender ID from query parameters
            raw_url_id = url.strip("/").split("/")[-1]
            clean_url_id = raw_url_id.split("?")[0]

            return self.normalize(
                source="tender247",
                tender_id=tender_id or clean_url_id,
                title=title or brief[:250],
                description=brief or title,
                location=location,
                start_date=start_date,
                end_date=end_date,
                link=url.split("?")[0], # Clean link as well
                keyword=keyword,
            )
        except Exception as exc:
            self.logger.warning("[Tender247] page error %s: %s", url, exc)
            return None

    def _extract(self, text: str, pattern: str) -> str:
        m = re.search(pattern, text, re.IGNORECASE)
        return m.group(1).strip() if m else ""
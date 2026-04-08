"""
TenderOnTime Scraper — No Filter Version
- Navigates to advanceSearch URL with keyword
- Scans up to 5 pages of tender listings
- Visits each tender detail page
- Checks Summary for keyword match
- Saves matching tenders
"""

import time
import re
from typing import List, Dict, Optional, Tuple

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from app.scrapers.base import BaseScraper


class TenderOnTimeScraper(BaseScraper):
    SOURCE = "tenderontime"

    def scrape(self, keyword: str) -> List[Dict]:
        """
        Main scraping method:
        1. Build search URL with keyword
        2. Scan up to 5 pages of listings
        3. Visit each tender detail page
        4. If keyword found in Summary → save tender
        """
        results = []

        try:
            # Step 1: Build search URL and navigate
            formatted = self._format_keyword(keyword)
            search_url = f"https://www.tendersontime.com/tenders/advanceSearch?q={formatted}"
            self.logger.info(f"[TenderOnTime] Loading: {search_url}")
            self.safe_get(search_url, delay=5)

            # Step 2: Wait for page to load
            time.sleep(3)

            # Step 3: Get total result count
            result_count = self._get_result_count()
            self.logger.info(f"[TenderOnTime] Found {result_count} total results for '{keyword}'")

            # Step 4: Process up to 5 pages
            # Phase 1: Collect metadata from all pages
            page = 1
            max_pages = 5
            seen_urls = set()
            listings = []

            while page <= max_pages:
                self.logger.info(f"[TenderOnTime] Phase 1: Collecting page {page}/{max_pages}")
                time.sleep(2)

                items = self._find_tender_items()
                if not items and page == 1:
                    self.logger.warning(f"No tenders found for '{keyword}'")
                    break
                if not items:
                    self.logger.info(f"No more tenders on page {page}")
                    break

                self.logger.info(f"Found {len(items)} tenders on page {page}")
                for item in items:
                    try:
                        data = self._extract_listing_metadata(item, seen_urls)
                        if data:
                            listings.append(data)
                    except Exception as e:
                        pass

                if not self._next_page():
                    self.logger.info("No more pages available")
                    break
                page += 1
                time.sleep(2)

            self.logger.info(f"[TenderOnTime] Phase 1 Complete. Found {len(listings)} links. Starting Phase 2.")

            # Phase 2: Visit each collected link
            for idx, data in enumerate(listings, 1):
                self.logger.info(f"  [TenderOnTime] Checking detail {idx}/{len(listings)}: {data['tot_ref'] or data['title'][:30]}")
                try:
                    tender = self._visit_and_check_summary(data, keyword)
                    if tender:
                        results.append(tender)
                        self.logger.info(f"    ✅ Saved: {tender.get('tender_id')}")
                except Exception as e:
                    self.logger.debug(f"    Detail error: {e}")

        except Exception as e:
            self.logger.error(f"Scrape error: {e}")

        self.logger.info(f"Total tenders found for '{keyword}': {len(results)}")
        return results

    def _format_keyword(self, keyword: str) -> str:
        """Format keyword for URL - replace spaces with %20"""
        return keyword.strip().replace(" ", "%20")

    def _get_result_count(self) -> int:
        """Get total number of results from the page"""
        try:
            result_elem = self.driver.find_element(By.ID, "resultcount")
            text = result_elem.text
            match = re.search(r'\[(\d+)\]', text)
            if match:
                return int(match.group(1))
        except Exception:
            pass
        return 0

    def _find_tender_items(self) -> List:
        """Find tender items on the page"""
        selectors = [
            "div.listingbox.ng-scope",
            "div.listingbox",
            "div.tender-item"
        ]
        for sel in selectors:
            items = self.driver.find_elements(By.CSS_SELECTOR, sel)
            if items:
                return items
        return []

    def _extract_listing_metadata(self, item, seen_urls: set) -> Optional[Dict]:
        """Extract basic data from the listing row without visiting details"""
        try:
            # Extract title and link
            title, href = self._extract_title_and_link(item)
            if not href or href in seen_urls:
                return None
            seen_urls.add(href)

            # Extract listing data
            deadline = self._extract_deadline(item)
            tot_ref = self._extract_tot_ref(item)
            country = self._extract_country(item)

            return {
                "title": title,
                "href": href,
                "deadline": deadline,
                "tot_ref": tot_ref,
                "country": country
            }
        except Exception:
            return None

    def _visit_and_check_summary(self, data: Dict, keyword: str) -> Optional[Dict]:
        """Visit detail page and extract if keyword is found"""
        try:
            # Visit detail page
            self.safe_get(data["href"], delay=2)

            # Check keyword in Summary section
            found, excerpt = self._check_summary(keyword)

            if not found:
                return None

            # Extract additional details from detail page
            posting_date = self._get_posting_date()

            tender_data = self.normalize(
                source="tenderontime",
                tender_id=data["tot_ref"] or data["href"].strip("/").split("/")[-1],
                title=data["title"] or excerpt[:250],
                description=excerpt,
                location=data["country"],
                start_date=posting_date,
                end_date=data["deadline"],
                link=data["href"],
                keyword=keyword,
            )

            return tender_data

        except Exception as e:
            self.logger.debug(f"Process error: {e}")
            return None

    def _extract_title_and_link(self, item) -> Tuple[str, Optional[str]]:
        """Extract title and detail link from listing item"""
        try:
            link_el = item.find_element(By.CSS_SELECTOR, "a.truncatetext.ng-binding")
            title = link_el.text.strip()
            href = link_el.get_attribute("href")
            return title, href
        except:
            pass

        try:
            link_el = item.find_element(By.CSS_SELECTOR, "a.listing-prod-view.mobbtn")
            href = link_el.get_attribute("href")
            title = item.find_element(By.CSS_SELECTOR, "a.truncatetext").text.strip()
            return title, href
        except:
            pass

        return "", None

    def _extract_deadline(self, item) -> str:
        """Extract deadline from listing item"""
        try:
            deadline_el = item.find_element(By.CSS_SELECTOR, "div.deadline strong.ng-binding")
            return deadline_el.text.strip()
        except:
            pass

        try:
            deadline_el = item.find_element(By.XPATH, ".//p[contains(text(), 'Deadline')]/strong")
            return deadline_el.text.strip()
        except:
            pass
        return ""

    def _extract_tot_ref(self, item) -> str:
        """Extract TOT Reference Number from listing item"""
        try:
            text = item.text
            match = re.search(r'TOT Ref\. No\.?:?\s*(\d+)', text)
            if match:
                return match.group(1)
        except:
            pass

        try:
            ref_el = item.find_element(By.XPATH, ".//p[contains(text(), 'TOT Ref. No.')]/strong")
            return ref_el.text.strip()
        except:
            pass
        return ""

    def _extract_country(self, item) -> str:
        """Extract country from listing item"""
        try:
            flag_span = item.find_element(By.CSS_SELECTOR, "span.flag-icon")
            parent = flag_span.find_element(By.XPATH, "..")
            strong = parent.find_element(By.TAG_NAME, "strong")
            return strong.text.strip()
        except:
            pass

        try:
            text = item.text
            countries = ['India', 'South Korea', 'USA', 'Spain', 'United Kingdom', 'Belgium', 'Czech Republic']
            for country in countries:
                if country in text:
                    return country
        except:
            pass
        return ""

    def _check_summary(self, keyword: str) -> Tuple[bool, str]:
        """Check if keyword appears in the Summary section on detail page"""
        phrase = keyword.lower()

        try:
            # Find all strong.strval elements
            summaries = self.driver.find_elements(By.CSS_SELECTOR, "strong.strval")
            for s in summaries:
                parent_text = s.find_element(By.XPATH, "..").text
                if "Summary:" in parent_text:
                    txt = s.text.lower()
                    if phrase in txt:
                        idx = txt.find(phrase)
                        start = max(0, idx - 60)
                        end = min(len(txt), idx + len(phrase) + 60)
                        excerpt = s.text[start:end]
                        return True, excerpt
        except Exception:
            pass

        # Fallback: check all strong.strval with length > 20
        try:
            summaries = self.driver.find_elements(By.CSS_SELECTOR, "strong.strval")
            for s in summaries:
                txt = s.text.lower()
                if phrase in txt and len(txt) > 20:
                    idx = txt.find(phrase)
                    start = max(0, idx - 60)
                    end = min(len(txt), idx + len(phrase) + 60)
                    excerpt = s.text[start:end]
                    return True, excerpt
        except Exception:
            pass

        return False, ""

    def _get_posting_date(self) -> str:
        """Get posting date from detail page"""
        try:
            dates = self.driver.find_elements(By.CSS_SELECTOR, "strong.strval")
            for d in dates:
                parent = d.find_element(By.XPATH, "..")
                if "Posting Date:" in parent.text:
                    return d.text.strip()
        except:
            pass
        return ""

    def _next_page(self) -> bool:
        """Go to next page"""
        try:
            next_btn = self.driver.find_element(By.CSS_SELECTOR, "li.nextclass a")
            if next_btn.is_displayed():
                self.js_click(next_btn)
                time.sleep(3)
                return True
        except:
            pass

        try:
            next_btns = self.driver.find_elements(By.XPATH, "//a[contains(text(), 'Next')]")
            for btn in next_btns:
                if btn.is_displayed():
                    self.js_click(btn)
                    time.sleep(3)
                    return True
        except:
            pass

        return False
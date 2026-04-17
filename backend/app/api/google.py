"""
Google Search Scraper - COMPLETE MDM KEYWORD SEARCH
- Searches ALL MDM keywords with exact phrase quotes
- Handles pagination correctly (up to 7 pages per keyword)
- No date picker errors (uses URL parameters)
- Extracts all results and filters by page content
"""

import re
import time
import random
from typing import List, Dict, Optional, Tuple
from urllib.parse import quote, urlparse, parse_qs

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import pandas as pd
import json

import sys
import os
# Add the backend directory to sys.path so we can import 'app' modules when running directly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.database import SessionLocal
from app.models import GoogleResult
from app.utils.human_behavior import (
    build_stealth_options, inject_stealth_scripts, warmup_session,
    slow_scroll, human_delay, random_between_keyword_delay,
    random_between_page_delay, random_mouse_move, micro_delay, get_random_proxy
)


class GoogleSearchScraper:
    """
    Google search scraper with exact phrase search and proper pagination
    """
    
    def __init__(self, headless: bool = False, date_from: str = None, date_to: str = None):
        self.headless = headless
        self.driver = None
        self.wait = None
        self.keyword_to_find = "material codification"
        self.results_all = []
        self.results_filtered = []
        self.captcha_callback = None
        
        # ALL MDM KEYWORDS (from your boss's document)
        self.mdm_keywords = [
            # Core MDM Keywords
            "material codification",
            "Data Cataloguing",
            "Master data management",
            "Data Enrichment",
            "codification of material",
            "Asset Verification",
            "bill of material",
            "sap master data"
        ]
        
        # Suffixes to append to each keyword
        self.suffixes = [
            "tenders"
        ]
        
        # Parse dates
        self.date_from = date_from if date_from else None
        self.date_to = date_to if date_to else None
        
        if self.date_from and self.date_to:
            print(f"📅 Date Range: {self.date_from} to {self.date_to}")
        else:
            print("📅 No date filter")
        
        print(f"🔍 Total Keywords: {len(self.mdm_keywords)}")
        print(f"📋 Total Suffixes per Keyword: {len(self.suffixes)}")
        print(f"📊 Total Searches: {len(self.mdm_keywords) * len(self.suffixes)}")
        
        self._setup_driver()
    
    def _setup_driver(self):
        """Setup Chrome driver with full anti-detection stealth."""
        proxy = get_random_proxy()
        opts = build_stealth_options(headless=self.headless, proxy=proxy)

        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=opts)
        self.wait = WebDriverWait(self.driver, 20)

        # Inject JS stealth patches immediately
        inject_stealth_scripts(self.driver)

        print(f"\u2705 Browser opened with stealth mode (proxy={'yes' if proxy else 'no'})!")

        # Warm up session: visit a neutral page first
        print("🌐 Warming up browser session...")
        warmup_session(self.driver)
        print("✅ Session warmed up!")
    
    def _build_search_url(self, base_phrase: str, suffix: str, page: int = 0) -> str:
        """Build Google search URL with exact phrase quotes"""
        phrase_with_quotes = f'"{base_phrase}"'
        query = f"{phrase_with_quotes} {suffix}"
        encoded_query = quote(query)
        
        url = f"https://www.google.com/search?q={encoded_query}"
        
        if self.date_from and self.date_to:
            url += f"&tbs=cdr:1,cd_min:{self.date_from},cd_max:{self.date_to}"
        
        if page > 0:
            url += f"&start={page * 10}"
        
        return url
    
    def _extract_description(self, block) -> str:
        """Extract description from result block"""
        try:
            desc_elem = block.find_element(By.CSS_SELECTOR, "div.VwiC3b, div[data-snf], div[class*='IsZvec']")
            if desc_elem:
                text = desc_elem.text
                if text and len(text) > 20:
                    return text[:500]
        except:
            pass
        return ""
    
    def _extract_keywords(self, text: str, original_query: str) -> List[str]:
        """Extract relevant keywords"""
        keywords = []
        text_lower = text.lower()
        query_lower = original_query.lower()
        
        mdm_keywords_list = [
            "material codification", "material code", "codification",
            "data cataloguing", "master data management", "data governance",
            "vendor data governance", "material master", "data enrichment",
            "data validation", "deduplication", "data cleansing",
            "data standardization", "cataloguing", "service master",
            "vendor master", "asset verification", "bill of material",
            "tender", "bid", "procurement", "rfp",
            "codification of material"
        ]
        
        for kw in mdm_keywords_list:
            if kw.lower() in text_lower:
                keywords.append(kw)
        
        if query_lower in text_lower:
            keywords.append(original_query)
        
        return list(set(keywords))[:10]
    
    def _extract_result_block(self, block, original_query: str, base_phrase: str) -> Optional[Dict]:
        """Extract a single result block"""
        try:
            title_elem = block.find_element(By.CSS_SELECTOR, "h3")
            title = title_elem.text.strip()
            if not title or len(title) < 3:
                return None
            
            link_elem = block.find_element(By.CSS_SELECTOR, "a[href]")
            raw_link = link_elem.get_attribute('href')
            
            # Parse Google redirect URL
            if "/url?" in raw_link:
                parsed = urlparse(raw_link)
                params = parse_qs(parsed.query)
                link = params['q'][0] if 'q' in params else raw_link
            else:
                link = raw_link
            
            if not link or link.startswith('/search'):
                return None
            
            description = self._extract_description(block)
            keywords = self._extract_keywords(f"{title} {description}", original_query)
            
            return {
                'title': title,
                'description': description,
                'link': link,
                'keywords': keywords,
                'search_query': original_query,
                'base_phrase': base_phrase,
                'keyword_found_on_page': False,
                'page_excerpt': '',
                'is_pdf': link.lower().endswith('.pdf') or '.pdf?' in link.lower()
            }
            
        except Exception:
            return None
    
    def _extract_page_results(self, original_query: str, base_phrase: str) -> List[Dict]:
        """Extract ALL results from current page"""
        results = []
        seen_links = set()
        
        try:
            result_blocks = self.driver.find_elements(By.CSS_SELECTOR, "div.g, div[class*='tF2Cxc']")
            
            for block in result_blocks:
                try:
                    result = self._extract_result_block(block, original_query, base_phrase)
                    if result and result['link'] and result['link'] not in seen_links:
                        seen_links.add(result['link'])
                        results.append(result)
                except:
                    continue
                    
        except Exception as e:
            print(f"      Error extracting: {e}")
        
        return results
    
    def _go_to_next_page(self) -> bool:
        """
        Click the next page button - FIXED VERSION
        Handles Google's pagination correctly
        """
        try:
            # METHOD 1: Look for Next button by ID
            try:
                next_button = self.driver.find_element(By.ID, "pnnext")
                if next_button and next_button.is_displayed() and next_button.is_enabled():
                    self.driver.execute_script("arguments[0].scrollIntoView(true);", next_button)
                    time.sleep(0.5)
                    self.driver.execute_script("arguments[0].click();", next_button)
                    print(f"      ✅ Clicked Next button")
                    time.sleep(3)
                    return True
            except:
                pass
            
            # METHOD 2: Look for Next button by aria-label
            try:
                next_button = self.driver.find_element(By.CSS_SELECTOR, "a[aria-label='Next page']")
                if next_button and next_button.is_displayed():
                    self.driver.execute_script("arguments[0].scrollIntoView(true);", next_button)
                    time.sleep(0.5)
                    self.driver.execute_script("arguments[0].click();", next_button)
                    print(f"      ✅ Clicked Next button")
                    time.sleep(3)
                    return True
            except:
                pass
            
            # METHOD 3: Find next page number link
            try:
                current_url = self.driver.current_url
                current_start = 0
                match = re.search(r'start=(\d+)', current_url)
                if match:
                    current_start = int(match.group(1))
                current_page = (current_start // 10) + 1
                next_page_num = current_page + 1
                
                next_page_links = self.driver.find_elements(By.XPATH, f"//a[contains(@href, 'start={next_page_num * 10}')]")
                for link in next_page_links:
                    if link.is_displayed():
                        self.driver.execute_script("arguments[0].scrollIntoView(true);", link)
                        time.sleep(0.5)
                        self.driver.execute_script("arguments[0].click();", link)
                        print(f"      ✅ Clicked page {next_page_num}")
                        time.sleep(3)
                        return True
            except:
                pass
            
            # METHOD 4: Look for any link with "Next" text
            try:
                next_links = self.driver.find_elements(By.XPATH, "//a[contains(text(), 'Next')]")
                for link in next_links:
                    if link.is_displayed() and link.is_enabled():
                        self.driver.execute_script("arguments[0].scrollIntoView(true);", link)
                        time.sleep(0.5)
                        self.driver.execute_script("arguments[0].click();", link)
                        print(f"      ✅ Clicked Next link")
                        time.sleep(3)
                        return True
            except:
                pass
            
            print(f"      🏁 No more pages")
            return False
            
        except Exception as e:
            print(f"      ❌ Error clicking next: {e}")
            return False
    
    def _check_page_for_keyword(self, url: str, keyword: str) -> Tuple[bool, str]:
        """Open URL and check if keyword exists on the page. Handles captchas via callback."""
        print(f"         🔍 Checking: {url[:80]}...")

        try:
            self.driver.get(url)
            human_delay(2.0, 4.5)  # natural load wait

            # ── Captcha check during filtering phase ──────────────────────
            # We strictly check for Cloudflare blocks or specific Captcha forms
            title = self.driver.title.lower()
            is_captcha = False
            
            if "just a moment" in title or "attention required" in title or "security check" in title:
                is_captcha = True
            elif self.driver.find_elements(By.ID, "captcha-form"):
                is_captcha = True
                
            if is_captcha:
                print("            ⚠️ Challenge block detected on result page!")
                if self.captcha_callback:
                    self.captcha_callback()
                else:
                    input("            Press Enter after solving challenge...")
                # After resuming, wait for page to re-load
                time.sleep(2)

            page_text = self.driver.find_element(By.TAG_NAME, "body").text
            page_text_lower = page_text.lower()
            keyword_lower = keyword.lower()

            if keyword_lower in page_text_lower:
                idx = page_text_lower.find(keyword_lower)
                start = max(0, idx - 100)
                end = min(len(page_text), idx + len(keyword) + 100)
                excerpt = page_text[start:end].strip()
                excerpt = ' '.join(excerpt.split())
                print(f"            ✅ Keyword FOUND!")
                return True, excerpt[:500]
            else:
                print(f"            ❌ Keyword NOT found")
                return False, ""

        except Exception as e:
            print(f"            ⚠️ Error: {str(e)[:100]}")
            return False, ""
    
    def search_with_suffix(self, base_phrase: str, suffix: str, max_pages: int = 7) -> List[Dict]:
        """Search with exact phrase + suffix"""
        query_display = f'"{base_phrase}" {suffix}'
        all_results = []
        
        print(f"\n{'='*70}")
        print(f"🔍 SEARCHING: {query_display}")
        if self.date_from and self.date_to:
            print(f"📅 Date Range: {self.date_from} to {self.date_to}")
        print(f"{'='*70}")
        
        for page in range(max_pages):
            print(f"\n   📄 Page {page + 1}/{max_pages}...")
            
            search_url = self._build_search_url(base_phrase, suffix, page)
            
            try:
                self.driver.get(search_url)
                human_delay(2.5, 5.0)  # realistic load wait — not constant
                inject_stealth_scripts(self.driver)

                # Reliable Captcha Check for Google
                is_captcha = False
                if self.driver.find_elements(By.ID, "captcha-form") or "sorry" in self.driver.title.lower():
                    is_captcha = True
                
                if is_captcha:
                    print("   ⚠️ Google Captcha detected! Please solve manually...")
                    if self.captcha_callback:
                        self.captcha_callback()
                    else:
                        input("   Press Enter after solving...")
                
                try:
                    self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div#search")))
                    human_delay(1.5, 3.0)
                except Exception:
                    pass

                # Slow human-like scroll before extracting (also loads lazy elements)
                slow_scroll(self.driver, total_height=1200, step=200, delay_range=(0.3, 0.7))
                random_mouse_move(self.driver)

                page_results = self._extract_page_results(query_display, base_phrase)
                print(f"      ✅ Found {len(page_results)} results")
                all_results.extend(page_results)
                
                # Human-like delay between pages
                if page < max_pages - 1:
                    if not self._go_to_next_page():
                        print(f"      🏁 No more pages available")
                        break

                random_between_page_delay()

            except Exception as e:
                print(f"      ❌ Error: {e}")
                break
        
        print(f"\n   ✅ Total results: {len(all_results)}")
        return all_results
    
    def filter_results_by_page_content(self, results: List[Dict]) -> List[Dict]:
        """Filter results by actual page content"""
        print("\n" + "="*70)
        print("🔍 FILTERING RESULTS BY EXACT PAGE CONTENT")
        print("="*70)
        
        filtered_results = []
        total = len(results)
        
        for idx, result in enumerate(results, 1):
            target_keyword = result.get('base_phrase', self.keyword_to_find)
            print(f"\n   [{idx}/{total}] Processing: {result['title'][:60]}...")
            print(f"      🎯 Target Keyword: '{target_keyword}'")
            
            found, excerpt = self._check_page_for_keyword(result['link'], target_keyword)
            
            result['keyword_found_on_page'] = found
            result['page_excerpt'] = excerpt
            
            if found:
                filtered_results.append(result)
                print(f"            ✅ KEEPING")
            else:
                print(f"            ❌ FILTERING OUT")
            
            time.sleep(random.uniform(1, 2))
        
        print(f"\n   📊 Final: {len(filtered_results)}/{total} kept")
        return filtered_results
    
    def run_full_search(self, max_pages: int = 7) -> Tuple[List[Dict], List[Dict]]:
        """Run full search with all keywords and all suffixes"""
        all_results = []
        seen_links = set()
        
        print("="*70)
        print("🚀 GOOGLE SEARCH SCRAPER - ALL MDM KEYWORDS")
        print("="*70)
        print(f"📋 Keywords: {len(self.mdm_keywords)}")
        print(f"📋 Suffixes per Keyword: {len(self.suffixes)}")
        print(f"📊 Total Searches: {len(self.mdm_keywords) * len(self.suffixes)}")
        print(f"📄 Max Pages per Search: {max_pages}")
        if self.date_from and self.date_to:
            print(f"📅 Date Range: {self.date_from} to {self.date_to}")
        print("="*70)
        
        try:
            total_searches = len(self.mdm_keywords) * len(self.suffixes)
            search_count = 0
            
            for keyword in self.mdm_keywords:
                for suffix in self.suffixes:
                    search_count += 1
                    print(f"\n{'='*60}")
                    print(f"📌 Search {search_count}/{total_searches}")
                    print(f"🔑 Keyword: \"{keyword}\"")
                    print(f"🏷️ Suffix: {suffix}")
                    print(f"{'='*60}")

                    # Random mouse movement before each keyword (human-like)
                    random_mouse_move(self.driver)

                    results = self.search_with_suffix(keyword, suffix, max_pages)

                    new_count = 0
                    for result in results:
                        if result['link'] not in seen_links:
                            seen_links.add(result['link'])
                            all_results.append(result)
                            new_count += 1

                    print(f"\n   📊 New unique results: {new_count}")
                    print(f"   📈 Total unique so far: {len(all_results)}")

                    # Human-like delay between keyword searches (8–18s Gaussian)
                    if search_count < total_searches:
                        print(f"\n⏸️  Human-like pause between keywords...")
                        random_between_keyword_delay()


        except KeyboardInterrupt:
            print("\n⚠️ Interrupted by user")
        
        self.results_all = all_results
        self.results_filtered = self.filter_results_by_page_content(all_results)
        
        return self.results_all, self.results_filtered
    
    def close(self):
        """Close the browser"""
        if self.driver:
            print("\n📊 Closing browser in 5 seconds...")
            time.sleep(5)
            self.driver.quit()
            print("Browser closed.")
    
    def export_to_excel(self, results_all: List[Dict], results_filtered: List[Dict],
                        filename_all: str = "mdm_all_results.xlsx",
                        filename_filtered: str = "mdm_filtered_results.xlsx"):
        """Export results to Excel"""
        try:
            df_all = pd.DataFrame(results_all)
            df_all.to_excel(filename_all, index=False)
            print(f"\n📁 All results: {filename_all} ({len(df_all)} rows)")
            
            if results_filtered:
                df_filtered = pd.DataFrame(results_filtered)
                df_filtered.to_excel(filename_filtered, index=False)
                print(f"📁 Filtered results: {filename_filtered} ({len(df_filtered)} rows)")
            
        except Exception as e:
            print(f"\n❌ Export error: {e}")
    
    def print_summary(self, results_all: List[Dict], results_filtered: List[Dict]):
        """Print summary"""
        print("\n" + "="*70)
        print("📊 SEARCH SUMMARY")
        print("="*70)
        print(f"Total Unique Results: {len(results_all)}")
        print(f"Results with keyword on page: {len(results_filtered)}")
        if results_all:
            print(f"Keep Rate: {(len(results_filtered)/len(results_all)*100):.1f}%")

    def save_to_database(self, results_all: List[Dict], results_filtered: List[Dict]):
        """Save results to the database"""
        print("\n" + "="*70)
        print("💾 SAVING TO DATABASE")
        print("="*70)
        
        db = SessionLocal()
        try:
            saved_all = self._save_results_type(db, results_all, "all")
            saved_filtered = self._save_results_type(db, results_filtered, "filtered")
            db.commit()
            print(f"✅ Successfully saved {saved_all} ALL results to database.")
            print(f"✅ Successfully saved {saved_filtered} FILTERED results to database.")
        except Exception as e:
            print(f"❌ Database save error: {e}")
            db.rollback()
        finally:
            db.close()

    def _save_results_type(self, db, results: List[Dict], result_type: str) -> int:
        """Helper to save a specific type of results to DB, avoiding duplicates by link"""
        existing_links = {
            r.link
            for r in db.query(GoogleResult.link)
                       .filter(GoogleResult.result_type == result_type)
                       .all()
        }
        
        count = 0
        for r in results:
            link = r.get("link", "")
            if not link or link in existing_links:
                continue
                
            existing_links.add(link)
            kws = r.get("keywords", [])
            db.add(GoogleResult(
                result_type  = result_type,
                title        = (r.get("title") or "")[:800],
                description  = r.get("description") or "",
                link         = link[:1000],
                search_query = (r.get("search_query") or "")[:500],
                keywords     = json.dumps(kws),
                page_excerpt = r.get("page_excerpt") or "",
                is_pdf       = "true" if r.get("is_pdf") else "false",
            ))
            count += 1
            
        return count


def main():
    """Main function"""
    import time
    start_time = time.time()
    
    # Configure date range (set to None for no filter)
    date_from = None    # March 1, 2026
    date_to = None      # March 31, 2026
    
    # Set to None for no date filter
    # date_from = None
    # date_to = None
    
    scraper = GoogleSearchScraper(headless=False, date_from=date_from, date_to=date_to)
    
    try:
        results_all, results_filtered = scraper.run_full_search(max_pages=7)
        
        scraper.print_summary(results_all, results_filtered)
        
        if results_all:
            scraper.export_to_excel(results_all, results_filtered)
            scraper.save_to_database(results_all, results_filtered)
        else:
            print("\n❌ No results found.")
    
    except Exception as e:
        print(f"\n❌ Error: {e}")
    
    finally:
        scraper.close()
    
    elapsed_time = time.time() - start_time
    print(f"\n⏱️ Total Time: {elapsed_time:.2f} seconds")


if __name__ == "__main__":
    main()
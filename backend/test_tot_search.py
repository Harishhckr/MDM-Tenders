from app.scrapers.tenderontime_scraper import TenderOnTimeScraper

print("Starting scraper test for TenderOnTime...")
scraper = TenderOnTimeScraper()
try:
    scraper.setup_driver()
    results = scraper.scrape("solar")
    print(f"Finished scrape. Found {len(results)} tenders.")
    if results:
        for i, r in enumerate(results[:3]):
            print(f"[{i}] ID: {r.get('tender_id')} | Title: {r.get('title')[:100]}")
finally:
    if scraper.driver:
        scraper.driver.quit()

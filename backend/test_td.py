import requests
from bs4 import BeautifulSoup

urls = [
    "https://www.tenderdetail.com/",
    "https://www.tenderdetail.com/Indian-tenders",
    "https://www.tenderdetail.com/indian-tenders"
]

for url in urls:
    print(f"Testing {url}...")
    try:
        r = requests.get(url, timeout=10)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, 'html.parser')
            # Look for the search inputs
            inputs = soup.find_all('input')
            print("Inputs found:")
            for inp in inputs[:15]:
                print(f"ID={inp.get('id')} NAME={inp.get('name')} TYPE={inp.get('type')} CLASS={inp.get('class')}")
            break
    except Exception as e:
        print(f"Error: {e}")

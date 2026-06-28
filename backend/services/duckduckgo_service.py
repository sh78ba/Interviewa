import httpx
from html.parser import HTMLParser
import urllib.parse

class DDGHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.results = []
        self.current_result = None
        self.in_title = False
        self.in_snippet = False
        self.div_depth = 0

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        classes = attrs_dict.get("class", "").split()
        
        # Result container is usually <div class="result__body">
        if tag == "div" and "result__body" in classes:
            self.current_result = {"title": "", "snippet": "", "url": ""}
            self.div_depth = 1
        
        elif self.current_result is not None:
            if tag == "div":
                self.div_depth += 1
            # Title link is <a class="result__a" href="...">
            elif tag == "a" and "result__a" in classes:
                self.in_title = True
                self.current_result["url"] = attrs_dict.get("href", "")
            # Snippet link is <a class="result__snippet" href="...">
            elif tag == "a" and "result__snippet" in classes:
                self.in_snippet = True

    def handle_endtag(self, tag):
        if self.in_title and tag == "a":
            self.in_title = False
        elif self.in_snippet and tag == "a":
            self.in_snippet = False
        elif tag == "div" and self.current_result is not None:
            self.div_depth -= 1
            if self.div_depth == 0:
                # We reached the end of a result block
                # Save it if we collected at least a title or snippet
                if self.current_result.get("title") or self.current_result.get("snippet"):
                    self.current_result["title"] = self.current_result["title"].strip()
                    self.current_result["snippet"] = self.current_result["snippet"].strip()
                    self.results.append(self.current_result)
                self.current_result = None

    def handle_data(self, data):
        if self.current_result is not None:
            if self.in_title:
                self.current_result["title"] += data
            elif self.in_snippet:
                self.current_result["snippet"] += data

async def search_duckduckgo(query: str) -> list[dict]:
    """
    Search DuckDuckGo HTML version for the query, parsing results with standard HTMLParser.
    Returns a list of dicts with: 'title', 'snippet', 'url'.
    """
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                print(f"DuckDuckGo returned status code {resp.status_code}")
                return []
            
            parser = DDGHTMLParser()
            parser.feed(resp.text)
            return parser.results
    except Exception as e:
        print(f"Error performing DuckDuckGo search: {e}")
        return []

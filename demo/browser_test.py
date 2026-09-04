from playwright.sync_api import sync_playwright

def run_browser_ui_test():
    print("Launching headless browser against live Streamlit UI at http://localhost:8501...")
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 960})
        page.goto("http://localhost:8501", timeout=30000)
        page.wait_for_selector("text=Factory Floor Troubleshooting Assistant", timeout=15000)
        print("Page loaded. Submitting test query into chat input...")

        # Find chat input textarea
        chat_input = page.locator("textarea[data-testid='stChatInputTextArea']")
        chat_input.fill("What does error E101 mean on ApexCNC UltraMill 500?")
        chat_input.press("Enter")

        # Wait for assistant response to render
        page.wait_for_selector("text=VERIFIED GROUNDED CITATION", timeout=20000)
        page.wait_for_timeout(2000)

        screenshot_path = "demo/ui_response_screenshot.png"
        page.screenshot(path=screenshot_path)
        print(f"Captured live UI response screenshot at: {screenshot_path}")
        browser.close()
    print("Browser UI verification completed successfully!")

if __name__ == "__main__":
    run_browser_ui_test()
